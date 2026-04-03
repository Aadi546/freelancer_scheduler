const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db'); 
const authRoutes = require('./routes/auth'); // <-- Import auth routes

const app = express();
app.use(cors()); 
app.use(express.json()); 
app.use('/api/auth', authRoutes);

const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/bookings');

app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json({ message: "It works!", data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});