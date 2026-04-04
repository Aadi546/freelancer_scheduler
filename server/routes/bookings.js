const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { sendBookingEmails, sendRejectionEmail, sendManualBookingEmail } = require('../utils/emailService');

// 1. GET: Fetch all booked appointments for a freelancer (Secure, no params)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') return res.status(403).json({ error: 'Unauthorized.' });
        const freelancerId = req.user.id;
        const [rows] = await pool.query(
            `SELECT a.*
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

// 2. GET: All bookings with conflict detection (Secure, no params)
router.get('/all', auth, async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') return res.status(403).json({ error: 'Unauthorized.' });
        const freelancerId = req.user.id;
        const [rows] = await pool.query(
            `SELECT a.*
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
            return { ...slot, conflict: isConflict };
        });

        res.json(withConflicts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. POST: Client requests a proposed time (Req 1)
router.post('/request', auth, async (req, res) => {
    try {
        if (req.user.role !== 'client') return res.status(403).json({ error: "Only clients can request meetings." });
        const { freelancer_id, booking_date, start_time, end_time } = req.body;
        
        if (!freelancer_id || !booking_date || !start_time || !end_time) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const [users] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
        const client_name = users[0].name;
        const client_email = users[0].email;

        const dateObj = new Date(booking_date);
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dayName = days[dateObj.getDay()];

        const [result] = await pool.query(
            `INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time, is_booked, client_name, client_email, status) 
             VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, 'pending')`,
            [freelancer_id, booking_date, dayName, start_time, end_time, client_name, client_email]
        );

        res.status(201).json({ message: "Meeting requested successfully.", id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. PATCH: Freelancer approves a proposed time (Req 1)
router.patch('/:id/approve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') return res.status(403).json({ error: "Unauthorized." });
        const [result] = await pool.query(
            "UPDATE availability SET status = 'confirmed', is_booked = TRUE WHERE id = ? AND freelancer_id = ?",
            [req.params.id, req.user.id]
        );
        
        if (result.affectedRows === 0) return res.status(404).json({ error: "Booking not found or not yours." });

        // Fetch to send email
        const [slots] = await pool.query('SELECT * FROM availability WHERE id = ?', [req.params.id]);
        const slot = slots[0];
        
        const [userRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
        
        try {
            await sendBookingEmails({
                freelancerEmail: userRows[0].email,
                freelancerName: userRows[0].name,
                clientName: slot.client_name,
                clientEmail: slot.client_email,
                bookingDate: slot.booking_date?.toString().split('T')[0],
                startTime: slot.start_time?.substring(0, 5),
                endTime: slot.end_time?.substring(0, 5),
            });
        } catch (emailErr) {
            console.warn('Email send failed (booking still confirmed):', emailErr.message);
        }

        res.json({ message: "Meeting confirmed!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. PATCH: Freelancer declines a proposed time (Req 1)
router.patch('/:id/decline', auth, async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') return res.status(403).json({ error: "Unauthorized." });
        const { reason } = req.body;
        
        const [slots] = await pool.query('SELECT * FROM availability WHERE id = ? AND freelancer_id = ?', [req.params.id, req.user.id]);
        if (slots.length === 0) return res.status(404).json({ error: "Booking not found." });

        const slot = slots[0];
        const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user.id]);

        await pool.query(
            "UPDATE availability SET status = 'rejected', is_booked = FALSE WHERE id = ? AND freelancer_id = ?",
            [req.params.id, req.user.id]
        );

        try {
            await sendRejectionEmail({
                clientEmail: slot.client_email,
                clientName: slot.client_name,
                freelancerName: userRows[0].name,
                bookingDate: slot.booking_date?.toString().split('T')[0],
                startTime: slot.start_time?.substring(0, 5),
                endTime: slot.end_time?.substring(0, 5),
                reason: reason || 'Freelancer is unavailable at this time.'
            });
        } catch(err) { console.warn('Rejection email failed', err); }

        res.json({ message: "Meeting declined." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. DELETE: Cancel a booking (Protected — owning freelancer or the client)
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
            "UPDATE availability SET status = 'available', is_booked = FALSE, client_name = NULL, client_email = NULL WHERE id = ?",
            [id]
        );

        res.json({ message: 'Booking cancelled.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 7. POST: Manually book a slot (Freelancer only)
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
            "INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time, is_booked, client_name, client_email, status) VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, 'confirmed')",
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

// 8. GET: Fetch bookings for a specific client
router.get('/client/my-bookings', auth, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: "User not found" });
        const userEmail = users[0].email;

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

// Legacy POST / for existing frontend logic claiming existing slot (Updated status)
router.post('/', async (req, res) => {
    const { slot_id, client_name, client_email } = req.body;

    if (!slot_id || !client_name?.trim() || !client_email?.trim()) {
        return res.status(400).json({ error: 'slot_id, client_name, and client_email are required.' });
    }

    try {
        const [slots] = await pool.query('SELECT * FROM availability WHERE id = ?', [slot_id]);
        if (slots.length === 0) return res.status(404).json({ error: "Slot not found." });
        const slot = slots[0];

        const [result] = await pool.query(
            "UPDATE availability SET is_booked = TRUE, status = 'pending', client_name = ?, client_email = ? WHERE id = ? AND (is_booked = FALSE OR status = 'available')",
            [client_name, client_email, slot_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: "Sorry, this slot is already taken." });
        }

        // Notify freelancer of the request
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
            console.warn('Email send failed:', emailErr.message);
        }

        res.status(201).json({ message: "Request sent to freelancer for approval." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
