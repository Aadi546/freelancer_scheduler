const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { sendBookingEmails, sendRejectionEmail, sendManualBookingEmail } = require('../utils/emailService');

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

// 3. POST: Book a slot — with conflict check and basic validation
router.post('/', async (req, res) => {
    const { slot_id, client_name, client_email } = req.body;

    // Basic validation
    if (!slot_id || !client_name?.trim() || !client_email?.trim()) {
        return res.status(400).json({ error: 'slot_id, client_name, and client_email are required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

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

        // Send confirmation email to client + notification to freelancer (non-blocking)
        try {
            const [freelancerRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [slot.freelancer_id]);
            const freelancer = freelancerRows[0];
            await sendBookingEmails({
                freelancerEmail: freelancer?.email,
                freelancerName: freelancer?.name || 'Freelancer',
                clientName: client_name,
                clientEmail: client_email,
                bookingDate: slot.booking_date?.toString().split('T')[0],
                startTime: slot.start_time?.substring(0, 5),
                endTime: slot.end_time?.substring(0, 5),
            });
        } catch (emailErr) {
            console.warn('Email send failed (booking still confirmed):', emailErr.message);
        }

        res.status(201).json({ message: "Booking confirmed! 🎉" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. DELETE: Cancel a booking (Protected — owning freelancer or the client)
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.query('SELECT role, email FROM users WHERE id = ?', [req.user.id]);
        const userEmail = users[0].email;
        const userRole = users[0].role;

        const [slots] = await pool.query('SELECT * FROM availability WHERE id = ?', [id]);
        if (slots.length === 0) {
            return res.status(404).json({ error: 'Booking not found.' });
        }
        
        const slot = slots[0];

        if (userRole === 'freelancer' && slot.freelancer_id !== req.user.id) {
            return res.status(403).json({ error: 'Permission denied.' });
        }
        if (userRole === 'client' && slot.client_email !== userEmail) {
            return res.status(403).json({ error: 'Permission denied. Not your booking.' });
        }

        await pool.query(
            'UPDATE availability SET is_booked = FALSE, client_name = NULL, client_email = NULL WHERE id = ?',
            [id]
        );

        res.json({ message: 'Booking cancelled.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. POST: Manually book a slot (Freelancer only)
router.post('/manual', auth, async (req, res) => {
    if (req.user.role !== 'freelancer') return res.status(403).json({ error: 'Only freelancers can manually book slots.' });

    const { booking_date, start_time, end_time, client_name, client_email } = req.body;
    if (!booking_date || !start_time || !end_time || !client_name || !client_email) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const dateObj = new Date(booking_date);
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dayName = days[dateObj.getDay()];

        const [result] = await pool.query(
            'INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time, is_booked, client_name, client_email) VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)',
            [req.user.id, booking_date, dayName, start_time, end_time, client_name, client_email]
        );

        const [userRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
        
        try {
            await sendManualBookingEmail({
                freelancerEmail: userRows[0].email,
                freelancerName: userRows[0].name,
                clientName: client_name,
                clientEmail: client_email,
                bookingDate: booking_date,
                startTime: start_time,
                endTime: end_time
            });
        } catch(err) { console.warn('Manual booking email failed', err); }

        res.status(201).json({ message: 'Manual booking saved and invite sent.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. POST: Reject a booking with a reason
router.post('/:id/reject', auth, async (req, res) => {
    if (req.user.role !== 'freelancer') return res.status(403).json({ error: 'Only freelancers can reject bookings.' });
    
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'A rejection reason is required.' });

    try {
        const [slots] = await pool.query('SELECT * FROM availability WHERE id = ? AND freelancer_id = ? AND is_booked = TRUE', [req.params.id, req.user.id]);
        if (slots.length === 0) return res.status(404).json({ error: 'Booking not found.' });

        const slot = slots[0];
        const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);

        await pool.query('DELETE FROM availability WHERE id = ?', [req.params.id]);

        try {
            await sendRejectionEmail({
                clientEmail: slot.client_email,
                clientName: slot.client_name,
                freelancerName: userRows[0].name,
                bookingDate: slot.booking_date?.toString().split('T')[0],
                startTime: slot.start_time?.substring(0, 5),
                endTime: slot.end_time?.substring(0, 5),
                reason
            });
        } catch(err) { console.warn('Rejection email failed', err); }

        res.json({ message: 'Booking rejected and client notified.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. GET: Fetch bookings for a specific client
router.get('/client/my-bookings', auth, async (req, res) => {
    try {
        // Fetch user email
        const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        const userEmail = users[0].email;

        // Get slots booked by this client
        const [rows] = await pool.query(
            `SELECT a.*, u.name as freelancer_name 
             FROM availability a
             JOIN users u ON a.freelancer_id = u.id
             WHERE a.client_email = ? AND a.is_booked = TRUE
             ORDER BY a.booking_date, a.start_time`,
            [userEmail]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
