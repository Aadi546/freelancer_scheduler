const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');

// Mock AI Logic
router.post('/chat', auth, async (req, res) => {
    try {
        const { message, context } = req.body;
        const userName = req.user.name || 'User';
        
        let reply = "";
        const m = message.toLowerCase();

        if (m.includes('schedule') || m.includes('availability')) {
            reply = `Hi ${userName}, looking at your dashboard, you have several open slots this week. Would you like me to highlight the most popular ones for your clients?`;
        } else if (m.includes('earnings') || m.includes('money') || m.includes('financial')) {
            reply = `Your financial trajectory is looking positive! You've cleared your target for the week. I can help you draft an invoice for your latest confirmed session if you'd like.`;
        } else if (m.includes('summary') || m.includes('summarize')) {
            reply = `I've analyzed your recent meetings. It seems you've focused heavily on 'System Architecture' discussions. I can draft a professional summary of these sessions for your portfolio.`;
        } else {
            reply = `Hello ${userName}! I'm your FreelanceOS Assistant. I can help you manage your schedule, track your earnings, or draft session summaries. How can I assist you today?`;
        }

        // Add a slight delay to simulate "thinking"
        setTimeout(() => {
            res.json({ reply });
        }, 800);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
