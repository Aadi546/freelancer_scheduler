const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const pool = require('../config/db');
const { sendRequestNotification } = require('../utils/emailService');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const pendingCancellationByUser = new Map();

const toDbTime = (time) => {
    if (!time) return null;
    const trimmed = String(time).trim();
    return trimmed.split(':').length === 2 ? `${trimmed}:00` : trimmed;
};

const toHHMM = (time) => (time || '').substring(0, 5);

const dayNameFromDate = (bookingDate) => {
    const dateObj = new Date(bookingDate);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dateObj.getDay()];
};

const scheduleMeetingTool = {
    type: 'function',
    function: {
        name: 'schedule_meeting',
        description: 'Requests a new meeting slot with a specific professional freelancer. Use this when the user asks to schedule a meeting. You must extract the freelancers exact name, the date, and times from their message.',
        parameters: {
            type: 'object',
            properties: {
                freelancer_name: {
                    type: 'string',
                    description: 'The name of the professional the user wants to book. For example: "Alex", "Sarah".'
                },
                booking_date: {
                    type: 'string',
                    description: 'The date for the meeting in YYYY-MM-DD format.'
                },
                start_time: {
                    type: 'string',
                    description: 'The start time in HH:mm 24-hour format. E.g. "14:00" for 2pm.'
                },
                end_time: {
                    type: 'string',
                    description: 'The end time in HH:mm 24-hour format.'
                }
            },
            required: ['freelancer_name', 'booking_date', 'start_time', 'end_time']
        }
    }
};

const createAvailabilityBatchTool = {
    type: 'function',
    function: {
        name: 'create_availability_batch',
        description: 'Create multiple availability slots for the logged-in freelancer over a chosen time window on a selected date.',
        parameters: {
            type: 'object',
            properties: {
                booking_date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format.'
                },
                start_time: {
                    type: 'string',
                    description: 'Window start time in HH:mm 24-hour format.'
                },
                end_time: {
                    type: 'string',
                    description: 'Window end time in HH:mm 24-hour format.'
                },
                session_duration: {
                    type: 'integer',
                    description: 'Each slot duration in minutes. Example: 30, 45, 60.'
                }
            },
            required: ['booking_date', 'start_time', 'end_time', 'session_duration']
        }
    }
};

const cancelAvailabilityBatchTool = {
    type: 'function',
    function: {
        name: 'cancel_availability_batch',
        description: 'Cancel/remove multiple availability slots for the logged-in freelancer. Remove only empty slots and warn for booked/pending/confirmed slots.',
        parameters: {
            type: 'object',
            properties: {
                booking_date: {
                    type: 'string',
                    description: 'Date in YYYY-MM-DD format.'
                },
                start_time: {
                    type: 'string',
                    description: 'Optional window start in HH:mm format. If omitted, starts at 00:00.'
                },
                end_time: {
                    type: 'string',
                    description: 'Optional window end in HH:mm format. If omitted, ends at 23:59.'
                },
                confirm: {
                    type: 'boolean',
                    description: 'Set to true only after the user explicitly confirms deletion.'
                }
            },
            required: ['booking_date']
        }
    }
};

async function getNextAvailableSlots(freelancerId, bookingDate, requestedEndTime, limit = 5) {
    const [rows] = await pool.query(
        `SELECT booking_date, start_time, end_time
         FROM availability
         WHERE freelancer_id = ?
           AND is_booked = FALSE
           AND (status = 'available' OR status IS NULL)
           AND booking_date >= CURDATE()
         ORDER BY
           CASE
             WHEN booking_date = ? AND start_time >= ? THEN 0
             WHEN booking_date = ? THEN 1
             ELSE 2
           END,
           booking_date,
           start_time
         LIMIT ?`,
        [freelancerId, bookingDate, requestedEndTime, bookingDate, limit]
    );
    return rows;
}

router.post('/chat', auth, async (req, res) => {
    try {
        const { message, history } = req.body;
        console.log("DEBUG - Incoming Chat:", { message, historyLength: history?.length });
        
        // Fetch full user details (id, name, email) since JWT only has id/role
        const [userData] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
        if (userData.length === 0) return res.status(404).json({ error: "User not found" });

        const userName = userData[0].name || 'User';
        const userEmail = userData[0].email;

        if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
            return res.status(400).json({ reply: `Hi ${userName}, please add a valid GROQ_API_KEY to your server/.env file to activate true intelligence and scheduling capabilities.` });
        }

        const isClient = req.user.role === 'client';
        const isFreelancer = req.user.role === 'freelancer';

        // Fetch context info for the AI
        const [bookings] = isClient
            ? await pool.query('SELECT * FROM availability WHERE client_email = ?', [userEmail])
            : await pool.query('SELECT * FROM availability WHERE freelancer_id = ?', [req.user.id]);
        const [professionals] = await pool.query('SELECT name, title, hourly_rate FROM users WHERE role = "freelancer"');

        const systemInstruction = isClient ? `
            You are the "FreelanceOS Assistant", a helpful, polite, and professional AI embedded inside a freelance scheduling platform.
            Current logged in user: ${userName} (${userEmail}).
            Today's Date: ${new Date().toLocaleDateString('en-CA')}
            
            They have ${bookings.length} current interactions.
            Available professionals on the platform: ${professionals.map(p => `${p.name} (${p.title || 'Expert'}, $${p.hourly_rate}/hr)`).join(', ')}.
            
            Your goal is to answer platform related questions concisely and elegantly.
            If the user asks to schedule a meeting, use the schedule_meeting tool. You MUST look back at the conversation history to find the date, professional name, or time if they mentioned it in an earlier message.
            Only ask for a parameter if it has NOT been mentioned anywhere in the conversation history yet.
            Keep responses brief and formatted using simple markdown. Don't use overly robotic language.
        ` : `
            You are the "FreelanceOS Assistant", helping freelancers manage their calendar quickly.
            Current logged in user: ${userName} (${userEmail}), role: freelancer.
            Today's Date: ${new Date().toLocaleDateString('en-CA')}

            The user has ${bookings.length} total slots/bookings in their account.
            Your goal is to help the freelancer manage availability in bulk using natural language.
            If the freelancer asks to add/generate/create multiple slots in a window, use the create_availability_batch tool.
            If the freelancer asks to remove/cancel/delete empty slots, use the cancel_availability_batch tool.
            Never remove booked, pending, or confirmed slots. Warn about them explicitly.
            Safety rule: never execute deletion unless the user clearly confirms. First show a preview, then wait for confirmation.
            Use concise, clear markdown and confirm exactly what was created.
        `;

        // Prepare messages for Groq
        const messages = [
            { role: 'system', content: systemInstruction },
            ...(history || []).map(msg => ({
                role: msg.role === 'ai' ? 'assistant' : 'user',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        const tools = isClient ? [scheduleMeetingTool] : [createAvailabilityBatchTool, cancelAvailabilityBatchTool];
        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            tools,
            tool_choice: 'auto',
            temperature: 0.1,
            max_tokens: 1024,
        });

        const aiResponse = completion.choices[0].message;
        
        // Handle tool calls
        if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
            const toolCall = aiResponse.tool_calls[0];
            if (toolCall.function.name === 'schedule_meeting') {
                if (!isClient) {
                    return res.json({ reply: 'This booking action is available only for client accounts.' });
                }
                const args = JSON.parse(toolCall.function.arguments);
                const { freelancer_name, booking_date, start_time, end_time } = args;
                const dbStartTime = toDbTime(start_time);
                const dbEndTime = toDbTime(end_time);
                
                const [targetUsers] = await pool.query('SELECT id, name, email FROM users WHERE role = "freelancer" AND name LIKE ? LIMIT 1', [`%${freelancer_name}%`]);
                
                if (targetUsers.length === 0) {
                    return res.json({ reply: `I couldn't find a professional named ${freelancer_name} in the system. Could you check the name?` });
                }

                const targetFreelancer = targetUsers[0];
                const dateObj = new Date(booking_date);
                const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                
                try {
                    // Conflict Detection: Ensure no overlapping confirmed/pending bookings
                    const [conflicts] = await pool.query(
                        `SELECT id FROM availability 
                         WHERE freelancer_id = ? 
                         AND booking_date = ? 
                         AND status IN ('confirmed', 'pending')
                         AND (
                            (start_time <= ? AND end_time > ?) OR
                            (start_time < ? AND end_time >= ?) OR
                            (? <= start_time AND ? > start_time)
                         )`,
                        [targetFreelancer.id, booking_date, dbStartTime, dbStartTime, dbEndTime, dbEndTime, dbStartTime, dbEndTime]
                    );

                    if (conflicts.length > 0) {
                        const suggestions = await getNextAvailableSlots(targetFreelancer.id, booking_date, dbEndTime, 5);
                        if (suggestions.length > 0) {
                            const suggestionText = suggestions
                                .map((s) => `- ${s.booking_date?.toISOString?.().split('T')[0] || booking_date} ${toHHMM(s.start_time)}-${toHHMM(s.end_time)}`)
                                .join('\n');
                            return res.json({
                                reply: `I checked the schedule, but **${targetFreelancer.name}** is already booked in that window.\n\nHere are the next available options:\n${suggestionText}\n\nTell me one option and I can request it for you.`,
                                suggestions: suggestions.map((s) => ({
                                    freelancer_id: targetFreelancer.id,
                                    freelancer_name: targetFreelancer.name,
                                    booking_date: s.booking_date?.toISOString?.().split('T')[0] || booking_date,
                                    start_time: toHHMM(s.start_time),
                                    end_time: toHHMM(s.end_time)
                                }))
                            });
                        }
                        return res.json({ 
                            reply: `I checked the schedule, but **${targetFreelancer.name}** is already booked or has a pending request during that time. Could you try a different time?` 
                        });
                    }

                    await pool.query(
                        `INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time, is_booked, client_name, client_email, status) 
                         VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, 'pending')`,
                        [targetFreelancer.id, booking_date, days[dateObj.getDay()], dbStartTime, dbEndTime, userName, userEmail]
                    );

                    try {
                        await sendRequestNotification({
                            freelancerEmail: targetFreelancer.email,
                            freelancerName: targetFreelancer.name,
                            clientName: userName,
                            clientEmail: userEmail,
                            bookingDate: booking_date,
                            startTime: start_time,
                            endTime: end_time
                        });
                    } catch(e) { console.warn('AI booking notification failed:', e.message); }

                    return res.json({ 
                        reply: `✅ Successfully requested a meeting with **${targetFreelancer.name}** for ${booking_date} from ${start_time} to ${end_time}. They will review the request shortly.` 
                    });
                } catch (dbErr) {
                    return res.json({ reply: `I tried to schedule it, but there was an error: ${dbErr.message}` });
                }
            }

            if (toolCall.function.name === 'create_availability_batch') {
                if (!isFreelancer) {
                    return res.json({ reply: 'This scheduling action is available only for freelancer accounts.' });
                }

                const args = JSON.parse(toolCall.function.arguments);
                const bookingDate = args.booking_date;
                const startTime = toDbTime(args.start_time);
                const endTime = toDbTime(args.end_time);
                const sessionDuration = Number(args.session_duration);

                if (!bookingDate || !startTime || !endTime || !sessionDuration || sessionDuration <= 0) {
                    return res.json({ reply: 'I need valid date, start time, end time, and session duration (minutes) to create your batch slots.' });
                }

                const toMinutes = (t) => {
                    const [h, m] = String(t).split(':').map(Number);
                    return h * 60 + m;
                };

                const fromMinutes = (mins) => {
                    const h = String(Math.floor(mins / 60)).padStart(2, '0');
                    const m = String(mins % 60).padStart(2, '0');
                    return `${h}:${m}:00`;
                };

                const startMins = toMinutes(startTime);
                const endMins = toMinutes(endTime);
                if (startMins >= endMins) {
                    return res.json({ reply: 'The end time must be later than the start time.' });
                }

                const dayName = dayNameFromDate(bookingDate);
                const created = [];
                const skipped = [];

                for (let cursor = startMins; cursor + sessionDuration <= endMins; cursor += sessionDuration) {
                    const slotStart = fromMinutes(cursor);
                    const slotEnd = fromMinutes(cursor + sessionDuration);

                    const [conflicts] = await pool.query(
                        `SELECT id
                         FROM availability
                         WHERE freelancer_id = ?
                           AND booking_date = ?
                           AND start_time < ?
                           AND end_time > ?
                         LIMIT 1`,
                        [req.user.id, bookingDate, slotEnd, slotStart]
                    );

                    if (conflicts.length > 0) {
                        skipped.push(`${toHHMM(slotStart)}-${toHHMM(slotEnd)}`);
                        continue;
                    }

                    await pool.query(
                        `INSERT INTO availability (freelancer_id, booking_date, day_of_week, start_time, end_time, is_booked, status)
                         VALUES (?, ?, ?, ?, ?, FALSE, 'available')`,
                        [req.user.id, bookingDate, dayName, slotStart, slotEnd]
                    );
                    created.push(`${toHHMM(slotStart)}-${toHHMM(slotEnd)}`);
                }

                if (created.length === 0) {
                    return res.json({
                        reply: `I couldn't create new slots in that window because they overlap with existing records.\n\nSkipped:\n${skipped.map((s) => `- ${s}`).join('\n') || '- none'}`
                    });
                }

                return res.json({
                    reply: `✅ Created **${created.length}** slot(s) on **${bookingDate}**:\n${created.map((s) => `- ${s}`).join('\n')}${skipped.length ? `\n\nSkipped (conflicts):\n${skipped.map((s) => `- ${s}`).join('\n')}` : ''}`
                });
            }

            if (toolCall.function.name === 'cancel_availability_batch') {
                if (!isFreelancer) {
                    return res.json({ reply: 'This action is available only for freelancer accounts.' });
                }

                const args = JSON.parse(toolCall.function.arguments || '{}');
                const bookingDate = args.booking_date;
                const startTime = toDbTime(args.start_time || '00:00');
                const endTime = toDbTime(args.end_time || '23:59');
                const confirmDelete = args.confirm === true;

                if (!bookingDate) {
                    return res.json({ reply: 'Please provide a date in YYYY-MM-DD format.' });
                }

                const [rows] = await pool.query(
                    `SELECT id, start_time, end_time, is_booked, status, client_name
                     FROM availability
                     WHERE freelancer_id = ?
                       AND booking_date = ?
                       AND start_time < ?
                       AND end_time > ?
                     ORDER BY start_time`,
                    [req.user.id, bookingDate, endTime, startTime]
                );

                if (rows.length === 0) {
                    return res.json({ reply: `No slots found on ${bookingDate} in that time range.` });
                }

                const removable = rows.filter((r) => !r.is_booked && (r.status === 'available' || r.status == null));
                const protectedSlots = rows.filter((r) => !(!r.is_booked && (r.status === 'available' || r.status == null)));

                const removedList = removable.length
                    ? removable.map((s) => `- ${toHHMM(s.start_time)}-${toHHMM(s.end_time)}`).join('\n')
                    : '- none';
                const warningList = protectedSlots.length
                    ? protectedSlots.map((s) => `- ${toHHMM(s.start_time)}-${toHHMM(s.end_time)} (${s.status || 'booked'}${s.client_name ? `, ${s.client_name}` : ''})`).join('\n')
                    : '- none';

                if (!confirmDelete) {
                    pendingCancellationByUser.set(req.user.id, {
                        bookingDate,
                        startTime,
                        endTime,
                        removableIds: removable.map((r) => r.id)
                    });
                    return res.json({
                        reply: `⚠️ Deletion preview for **${bookingDate}**:\n\nEmpty slots that will be removed (**${removable.length}**):\n${removedList}\n\nProtected slots that will NOT be removed:\n${warningList}\n\nReply with **\"confirm delete\"** and I will execute this removal.`
                    });
                }

                const pending = pendingCancellationByUser.get(req.user.id);
                if (!pending) {
                    return res.json({ reply: 'No pending deletion preview found. Please ask me to cancel slots first so I can show a preview.' });
                }
                if (pending.bookingDate !== bookingDate || pending.startTime !== startTime || pending.endTime !== endTime) {
                    return res.json({ reply: 'Your confirmation does not match the latest preview window. Please request cancellation again and confirm that exact preview.' });
                }

                if (pending.removableIds.length > 0) {
                    await pool.query(
                        `DELETE FROM availability WHERE id IN (${pending.removableIds.map(() => '?').join(',')})`,
                        pending.removableIds
                    );
                }
                pendingCancellationByUser.delete(req.user.id);

                return res.json({
                    reply: `✅ Removed **${pending.removableIds.length}** empty slot(s) on **${bookingDate}**:\n${removedList}\n\n⚠️ Not removed because they are active/booked:\n${warningList}`
                });
            }
        }

        res.json({ reply: aiResponse.content || "I processed that request but have no text reply." });

    } catch (error) {
        console.error("DEBUG - AI Route ERROR:", error.message, error.stack);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
