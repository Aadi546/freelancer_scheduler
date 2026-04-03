const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

// PATCH: Toggle freelancer availability (is_taking_bookings)
router.patch('/availability-toggle', auth, async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ error: 'Only freelancers can toggle availability.' });
        }
        // Flip the current value
        const [result] = await pool.query(
            'UPDATE users SET is_taking_bookings = NOT is_taking_bookings WHERE id = ?',
            [req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found.' });

        // Return the new value
        const [rows] = await pool.query('SELECT is_taking_bookings FROM users WHERE id = ?', [req.user.id]);
        res.json({ is_taking_bookings: rows[0].is_taking_bookings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Get freelancer's public profile (Public - for booking page)
router.get('/:id/profile', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT name, title, bio, is_taking_bookings FROM users WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH: Update freelancer profile (title, bio)
router.patch('/profile', auth, async (req, res) => {
    try {
        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ error: 'Only freelancers can update profiles.' });
        }
        const { title, bio } = req.body;
        await pool.query(
            'UPDATE users SET title = ?, bio = ? WHERE id = ?',
            [title || null, bio || null, req.user.id]
        );
        res.json({ message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Fetch freelancers the client has booked with (Isolated Directory)
router.get('/client/my-freelancers', auth, async (req, res) => {
    if (req.user.role !== 'client') return res.status(403).json({ error: 'Only clients can access this.' });
    try {
        const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
        const clientEmail = users[0].email;

        // Find distinct freelancers this client has booked with
        const [rows] = await pool.query(`
            SELECT DISTINCT u.id, u.name, u.title, u.bio
            FROM availability a
            JOIN users u ON a.freelancer_id = u.id
            WHERE a.client_email = ? 
              AND a.is_booked = TRUE
        `, [clientEmail]);

        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: Fetch all active freelancers (Global Directory)
router.get('/directory', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, name, title, bio 
            FROM users 
            WHERE role = 'freelancer'
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
