const nodemailer = require('nodemailer');
const ics = require('ics');

let cachedTransporter = null;
let cachedEmailUser = null;

async function getTransporter() {
    if (cachedTransporter) return { transporter: cachedTransporter, user: cachedEmailUser };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_HOST) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: false,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        cachedEmailUser = process.env.EMAIL_USER;
    } else {
        console.log('✉️  No SMTP set up in .env. Creating an Ethereal Testing Account...');
        const testAccount = await nodemailer.createTestAccount();
        cachedTransporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        cachedEmailUser = testAccount.user;
    }
    return { transporter: cachedTransporter, user: cachedEmailUser };
}

/**
 * Send a booking confirmation to the client
 * and a notification to the freelancer.
 */
async function sendBookingEmails({ freelancerEmail, freelancerName, clientName, clientEmail, bookingDate, startTime, endTime }) {
    const { transporter, user } = await getTransporter();

    const slotLabel = `${bookingDate} from ${startTime} to ${endTime}`;

    // Generate .ics calendar invite
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const event = {
        start: [year, month, day, startHour, startMin],
        end: [year, month, day, endHour, endMin],
        title: `Session with ${freelancerName}`,
        description: `Booking confirmed via FreelanceOS`,
        status: 'CONFIRMED',
        organizer: { name: freelancerName, email: freelancerEmail || process.env.EMAIL_USER },
        attendees: [
            { name: clientName, email: clientEmail, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
        ]
    };

    let icsContent = null;
    ics.createEvent(event, (error, value) => {
        if (!error) {
            icsContent = value;
        } else {
            console.warn('⚠️  Failed to generate ICS file:', error);
        }
    });

    const attachments = icsContent ? [{
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST'
    }] : [];

    // 1. Confirmation to the client
    const info1 = await transporter.sendMail({
        from: process.env.EMAIL_FROM || user,
        to: clientEmail,
        subject: '✅ Booking Confirmed — FreelanceOS',
        html: `
            <div style="font-family:'Helvetica Neue',sans-serif;background:#0d0e11;color:#e8eaf0;padding:32px;border-radius:12px;max-width:480px;margin:auto">
                <h2 style="color:#6c8fff;margin-bottom:4px">Booking Confirmed!</h2>
                <p style="color:#8b90a0;margin-bottom:24px">Hi <strong style="color:#e8eaf0">${clientName}</strong>,</p>
                <div style="background:#13151a;border:1px solid #2a2e38;border-radius:10px;padding:16px;margin-bottom:20px">
                    <div style="font-size:12px;color:#555b6e;margin-bottom:4px">SLOT</div>
                    <div style="font-size:16px;font-weight:600;color:#e8eaf0">${slotLabel}</div>
                    <div style="font-size:13px;color:#8b90a0;margin-top:4px">with ${freelancerName}</div>
                </div>
                <p style="color:#8b90a0;font-size:13px">You'll receive a reminder before your session. Reply to this email if you need to make changes.</p>
                <hr style="border-color:#2a2e38;margin:24px 0"/>
                <p style="color:#3a3f4d;font-size:11px">FreelanceOS — Scheduling made simple</p>
            </div>
        `,
        attachments
    });
    console.log('Client Email Preview: %s', nodemailer.getTestMessageUrl(info1));

    // 2. Notification to the freelancer
    if (freelancerEmail) {
        const info2 = await transporter.sendMail({
            from: process.env.EMAIL_FROM || user,
            to: freelancerEmail,
            subject: `📅 New booking from ${clientName} — FreelanceOS`,
            html: `
                <div style="font-family:'Helvetica Neue',sans-serif;background:#0d0e11;color:#e8eaf0;padding:32px;border-radius:12px;max-width:480px;margin:auto">
                    <h2 style="color:#3ecf8e;margin-bottom:4px">New Booking!</h2>
                    <p style="color:#8b90a0;margin-bottom:24px">Hi <strong style="color:#e8eaf0">${freelancerName}</strong>,</p>
                    <div style="background:#13151a;border:1px solid #2a2e38;border-radius:10px;padding:16px;margin-bottom:20px">
                        <div style="font-size:12px;color:#555b6e;margin-bottom:4px">CLIENT</div>
                        <div style="font-size:15px;font-weight:600;color:#e8eaf0">${clientName}</div>
                        <div style="font-size:13px;color:#8b90a0">${clientEmail}</div>
                        <div style="font-size:12px;color:#555b6e;margin-top:12px;margin-bottom:4px">SLOT</div>
                        <div style="font-size:15px;font-weight:600;color:#e8eaf0">${slotLabel}</div>
                    </div>
                    <p style="color:#8b90a0;font-size:13px">Head to your FreelanceOS dashboard to manage this booking.</p>
                    <hr style="border-color:#2a2e38;margin:24px 0"/>
                    <p style="color:#3a3f4d;font-size:11px">FreelanceOS — Scheduling made simple</p>
                </div>
            `,
            attachments
        });
        console.log('Freelancer Email Preview: %s', nodemailer.getTestMessageUrl(info2));
    }
}

/**
 * Send an email to the client when the freelancer rejects a booking with a reason.
 */
async function sendRejectionEmail({ clientEmail, clientName, freelancerName, bookingDate, startTime, endTime, reason }) {
    const { transporter, user } = await getTransporter();

    const slotLabel = `${bookingDate} from ${startTime} to ${endTime}`;

    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || user,
        to: clientEmail,
        subject: `⚠️ Booking Cancelled — FreelanceOS`,
        html: `
            <div style="font-family:'Helvetica Neue',sans-serif;background:#0d0e11;color:#e8eaf0;padding:32px;border-radius:12px;max-width:480px;margin:auto">
                <h2 style="color:#f06060;margin-bottom:4px">Booking Cancelled</h2>
                <p style="color:#8b90a0;margin-bottom:24px">Hi <strong style="color:#e8eaf0">${clientName}</strong>,</p>
                <div style="background:#13151a;border:1px solid #2a2e38;border-radius:10px;padding:16px;margin-bottom:20px">
                    <p style="font-size:14px;color:#e8eaf0;margin-top:0">Your session with <strong>${freelancerName}</strong> for <br/><span style="color:#f06060;font-family:'DM Mono',monospace">${slotLabel}</span> has been cancelled.</p>
                    <div style="background:#1a1c23;border-left:4px solid #f06060;padding:12px;margin-top:16px;font-size:13px;color:#a0a5b5;font-style:italic;">
                        "${reason}"
                    </div>
                </div>
                <p style="color:#8b90a0;font-size:13px">Please reach out to the freelancer directly if you need to reschedule.</p>
                <hr style="border-color:#2a2e38;margin:24px 0"/>
                <p style="color:#3a3f4d;font-size:11px">FreelanceOS — Scheduling made simple</p>
            </div>
        `,
    });
    console.log('Rejection Email Preview: %s', nodemailer.getTestMessageUrl(info));
}

/**
 * Send an email to the client when the freelancer manually schedules a slot for them.
 */
async function sendManualBookingEmail({ freelancerEmail, freelancerName, clientName, clientEmail, bookingDate, startTime, endTime }) {
    const { transporter, user } = await getTransporter();

    const slotLabel = `${bookingDate} from ${startTime} to ${endTime}`;

    // Generate .ics invite
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const event = {
        start: [year, month, day, startHour, startMin],
        end: [year, month, day, endHour, endMin],
        title: `Session with ${freelancerName}`,
        description: `Scheduled directly by ${freelancerName}`,
        status: 'CONFIRMED',
        organizer: { name: freelancerName, email: freelancerEmail || user },
        attendees: [
            { name: clientName, email: clientEmail, rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
        ]
    };

    let icsContent = null;
    ics.createEvent(event, (err, val) => { if (!err) icsContent = val; });

    const attachments = icsContent ? [{
        filename: 'invite.ics',
        content: icsContent,
        contentType: 'text/calendar; method=REQUEST'
    }] : [];

    const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || user,
        to: clientEmail,
        subject: `📅 New Meeting Scheduled with ${freelancerName}`,
        html: `
            <div style="font-family:'Helvetica Neue',sans-serif;background:#0d0e11;color:#e8eaf0;padding:32px;border-radius:12px;max-width:480px;margin:auto">
                <h2 style="color:#3ecf8e;margin-bottom:4px">Meeting Scheduled!</h2>
                <p style="color:#8b90a0;margin-bottom:24px">Hi <strong style="color:#e8eaf0">${clientName}</strong>,</p>
                <div style="background:#13151a;border:1px solid #2a2e38;border-radius:10px;padding:16px;margin-bottom:20px">
                    <p style="font-size:14px;color:#e8eaf0;margin-top:0"><strong>${freelancerName}</strong> has manually scheduled a session with you on:</p>
                    <div style="font-size:15px;font-weight:600;color:#6c8fff;margin-top:12px;font-family:'DM Mono',monospace">${slotLabel}</div>
                </div>
                <p style="color:#8b90a0;font-size:13px">You can add the attached calendar invite to your schedule. See you then!</p>
                <hr style="border-color:#2a2e38;margin:24px 0"/>
                <p style="color:#3a3f4d;font-size:11px">FreelanceOS — Scheduling made simple</p>
            </div>
        `,
        attachments
    });
    console.log('Manual Booking Preview: %s', nodemailer.getTestMessageUrl(info));
}

module.exports = { sendBookingEmails, sendRejectionEmail, sendManualBookingEmail };
