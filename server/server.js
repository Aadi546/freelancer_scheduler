const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db'); 
const authRoutes = require('./routes/auth'); // <-- Import auth routes
const http = require('http');
const { Server } = require('socket.io');
const { registerChatSocket } = require('./realtime/chatSocket');

const app = express();
const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));
const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests and same-origin calls
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};
app.use(cors(corsOptions)); 
app.use(express.json()); 
app.use('/api/auth', authRoutes);
const server = http.createServer(app);
const io = new Server(server, {
    cors: corsOptions
});
registerChatSocket(io);

const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');

app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/test', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json({ message: "It works!", data: rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});