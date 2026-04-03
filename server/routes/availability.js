const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');
const { google } = require('googleapis');

// 1. GET: Fetch availability for a specific freelancer (Public)
router.get('/:freelancerId', async (req, res) => {
    try {
        const { freelancerId } = req.params;
        const [rows] = await pool.query(
            'SELECT * FROM availability WHERE freelancer_id = ? ORDER BY booking_date, start_time',
            [freelancerId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Database query failed" });
    }
});

// 2. GET: Stats for earnings dashboard
router.get('/stats/:freelancerId', auth, async (req, res) => {
    try {
        const { freelancerId } = req.params;

        // Total slots and booked this month
        const [monthStats] = await pool.query(
            `SELECT 
                COUNT(*) as total_slots,
                SUM(is_booked) as booked_slots,
                SUM(CASE WHEN MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as this_month_slots,
                SUM(CASE WHEN MONTH(booking_date) = MONTH(CURDATE()) AND YEAR(booking_date) = YEAR(CURDATE()) AND is_booked = TRUE THEN 1 ELSE 0 END) as this_month_booked
             FROM availability 
             WHERE freelancer_id = ?`,
            [freelancerId]
        );

        // Bookings grouped by month
        const [monthlyBookings] = await pool.query(
            `SELECT 
                MONTH(booking_date) as month,
                MONTHNAME(booking_date) as month_name,
                COUNT(*) as booking_count,
                SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as total_hours
             FROM availability
             WHERE freelancer_id = ? AND is_booked = TRUE AND YEAR(booking_date) = YEAR(CURDATE())
             GROUP BY MONTH(booking_date), MONTHNAME(booking_date)
             ORDER BY month`,
            [freelancerId]
        );

        // Conflict detection
        const [allSlots] = await pool.query(
            `SELECT * FROM availability WHERE freelancer_id = ? ORDER BY booking_date, start_time`,
            [freelancerId]
        );

        const conflicts = [];
        for (let i = 0; i < allSlots.length; i++) {
            for (let j = i + 1; j < allSlots.length; j++) {
                const a = allSlots[i], b = allSlots[j];
                const aDate = a.booking_date?.toString().split('T')[0];
                const bDate = b.booking_date?.toString().split('T')[0];
                if (aDate !== bDate) continue;
                if (a.start_time < b.end_time && a.end_time > b.start_time) {
                    conflicts.push({ slot1: a, slot2: b });
                }
            }
        }

        // This week hours
        const [weekStats] = await pool.query(
            `SELECT SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)) as week_hours
             FROM availability
             WHERE freelancer_id = ?
               AND YEARWEEK(booking_date, 1) = YEARWEEK(CURDATE(), 1)`,
            [freelancerId]
        );

        // Fetch freelancer's taking-bookings status
        const [userRow] = await pool.query('SELECT is_taking_bookings FROM users WHERE id = ?', [freelancerId]);

        res.json({
            monthStats: monthStats[0],
            monthlyBookings,
            conflicts,
            weekHours: weekStats[0]?.week_hours || 0,
            is_taking_bookings: userRow[0]?.is_taking_bookings ?? true
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. POST: Add a new availability slot (Protected)
router.post('/', auth, async (req, res) => {
    try {
        const { booking_date, day_of_week, start_time, end_time } = req.body;
        const freelancer_id = req.user.id;

        if (req.user.role !== 'freelancer') {
            return res.status(403).json({ error: "Only freelancers can add availability." });
        }

        // Conflict check before inserting
        const [conflicts] = await pool.query(
            `SELECT * FROM availability 
             WHERE freelancer_id = ? AND booking_date = ? AND start_time < ? AND end_time > ?`,
            [freelancer_id, booking_date, end_time, start_time]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({ 
                error: `Conflict: overlaps with existing slot ${conflicts[0].start_time.substring(0,5)}–${conflicts[0].end_time.substring(0,5)}`,
                conflict: conflicts[0]
            });
        }

        const [result] = await pool.query(
            'INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?, ?)',
            [freelancer_id, booking_date, day_of_week, start_time, end_time]
        );

        // Google Calendar sync
        const [users] = await pool.query('SELECT google_refresh_token FROM users WHERE id = ?', [freelancer_id]);
        const refreshToken = users[0]?.google_refresh_token;

        if (refreshToken) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI
            );
            oauth2Client.setCredentials({ refresh_token: refreshToken });
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

            const fmt = (t) => { const s = t.trim(); return s.split(':').length === 2 ? `${s}:00` : s; };

            const calEvent = await calendar.events.insert({
                calendarId: 'primary',
                resource: {
                    summary: `Available: ${day_of_week}`,
                    description: `Slot managed by FreelanceOS`,
                    start: { dateTime: `${booking_date}T${fmt(start_time)}`, timeZone: 'Asia/Kolkata' },
                    end: { dateTime: `${booking_date}T${fmt(end_time)}`, timeZone: 'Asia/Kolkata' },
                },
            });
            // Store the Google Calendar event ID for later deletion
            const googleEventId = calEvent.data.id;
            await pool.query('UPDATE availability SET google_event_id = ? WHERE id = ?', [googleEventId, result.insertId]);
        }

        res.status(201).json({ message: "Availability saved and synced!", id: result.insertId });
    } catch (error) {
        if (error.response?.data) console.error("Google API Error:", error.response.data.error);
        else console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 4. DELETE: Remove a slot (Protected)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Fetch slot first to get google_event_id and verify ownership
        const [slots] = await pool.query(
            'SELECT a.*, u.google_refresh_token FROM availability a JOIN users u ON u.id = a.freelancer_id WHERE a.id = ? AND a.freelancer_id = ?',
            [req.params.id, req.user.id]
        );
        if (slots.length === 0) return res.status(404).json({ error: 'Slot not found or unauthorized' });

        const slot = slots[0];

        // Delete from Google Calendar if we have the event ID
        if (slot.google_event_id && slot.google_refresh_token) {
            try {
                const oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URI
                );
                oauth2Client.setCredentials({ refresh_token: slot.google_refresh_token });
                const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
                await calendar.events.delete({ calendarId: 'primary', eventId: slot.google_event_id });
            } catch (calErr) {
                console.warn('Google Calendar delete failed (continuing):', calErr.message);
            }
        }

        await pool.query('DELETE FROM availability WHERE id = ? AND freelancer_id = ?', [req.params.id, req.user.id]);
        res.json({ message: 'Slot deleted and removed from Google Calendar' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST: Add multiple availability slots at once
router.post('/bulk', auth, async (req, res) => {
    try {
        const { booking_date, start_time, end_time, session_duration } = req.body;
        if (!booking_date || !start_time || !end_time || !session_duration) {
            return res.status(400).json({ error: "Missing required fields." });
        }

        const parseTime = (t) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const startMins = parseTime(start_time);
        const endMins = parseTime(end_time);

        if (startMins >= endMins) {
            return res.status(400).json({ error: "End time must be after start time." });
        }

        const duration = parseInt(session_duration, 10);
        if (duration <= 0) return res.status(400).json({ error: "Invalid duration." });

        const slots = [];
        let currentStart = startMins;

        const formatTime = (mins) => {
            const h = Math.floor(mins / 60).toString().padStart(2, '0');
            const m = (mins % 60).toString().padStart(2, '0');
            return `${h}:${m}:00`;
        };

        // We will insert basic local slots only (no auto-GCal sync for bulk to avoid rate limits initially).
        // Users can add bulk slots quickly here.
        while (currentStart + duration <= endMins) {
            const currentEnd = currentStart + duration;
            const dt = new Date(booking_date);
            const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const dayName = days[dt.getDay()];
            
            slots.push([
                req.user.id,
                booking_date,
                dayName,
                formatTime(currentStart),
                formatTime(currentEnd)
            ]);
            currentStart = currentEnd;
        }

        if (slots.length === 0) {
            return res.status(400).json({ error: "Time range is too short for a single session." });
        }

        const [result] = await pool.query(
            'INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time) VALUES ?',
            [slots]
        );

        res.status(201).json({ message: `Successfully created ${result.affectedRows} slots.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
