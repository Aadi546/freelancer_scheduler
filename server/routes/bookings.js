const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// 1. GET: Fetch all booked appointments for a freelancer
router.get('/:freelancerId', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const [rows] = await pool.query(
            `SELECT a.*, 
                CASE 
                    WHEN a.is_booked = TRUE THEN 'confirmed'
                    ELSE 'available'
                END as status
             FROM availability a
             WHERE a.freelancer_id = ?
             ORDER BY a.booking_date, a.start_time`,
            [freelancerId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. GET: All bookings with conflict detection
router.get('/all/:freelancerId', auth, async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const [rows] = await pool.query(
            `SELECT a.*,
                CASE WHEN a.is_booked = TRUE THEN 'confirmed' ELSE 'available' END as status
             FROM availability a
             WHERE a.freelancer_id = ?
             ORDER BY a.booking_date, a.start_time`,
            [freelancerId]
        );

        // Detect conflicts: overlapping slots on same date
        const withConflicts = rows.map((slot, i) => {
            const isConflict = rows.some((other, j) => {
                if (i === j) return false;
                if (slot.booking_date?.toString().split('T')[0] !== other.booking_date?.toString().split('T')[0]) return false;
                const sStart = slot.start_time, sEnd = slot.end_time;
                const oStart = other.start_time, oEnd = other.end_time;
                return sStart < oEnd && sEnd > oStart;
            });
            return { ...slot, status: isConflict ? 'conflict' : slot.is_booked ? 'confirmed' : 'available' };
        });

        res.json(withConflicts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. POST: Book a slot — with conflict check
router.post('/', async (req, res) => {
    const { slot_id, client_name, client_email } = req.body;

    try {
        // Get the slot we want to book
        const [slots] = await pool.query('SELECT * FROM availability WHERE id = ?', [slot_id]);
        if (slots.length === 0) return res.status(404).json({ error: "Slot not found." });

        const slot = slots[0];

        // Check for conflicts on same date/time
        const [conflicts] = await pool.query(
            `SELECT * FROM availability 
             WHERE freelancer_id = ? 
               AND id != ? 
               AND booking_date = ? 
               AND is_booked = TRUE
               AND start_time < ? 
               AND end_time > ?`,
            [slot.freelancer_id, slot_id, slot.booking_date, slot.end_time, slot.start_time]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ 
                error: "Conflict detected: this time overlaps with an existing booking.",
                conflict: conflicts[0]
            });
        }

        const [result] = await pool.query(
            'UPDATE availability SET is_booked = TRUE, client_name = ?, client_email = ? WHERE id = ? AND is_booked = FALSE',
            [client_name, client_email, slot_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "Sorry, this slot is already taken." });
        }

        res.status(201).json({ message: "Booking confirmed! 🎉" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. DELETE: Cancel a booking
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query(
            'UPDATE availability SET is_booked = FALSE, client_name = NULL, client_email = NULL WHERE id = ?',
            [id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Booking not found" });
        res.json({ message: "Booking cancelled. Slot is open again!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
