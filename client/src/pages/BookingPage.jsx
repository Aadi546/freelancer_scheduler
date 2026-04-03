import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAvailability, fetchProfile, createBooking } from '../api';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

.cd-root {
  min-height: 100vh;
  background: #0d0e11;
  font-family: 'Syne', sans-serif;
  padding: 40px 20px;
  color: #e8eaf0;
}

.cd-inner { max-width: 560px; margin: 0 auto; }

.cd-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 36px;
}

.cd-logo-icon {
  width: 28px;
  height: 28px;
  background: #6c8fff;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cd-logo-text { font-size: 15px; font-weight: 600; }

.cd-logo-text { font-size: 15px; font-weight: 600; }

.cd-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px dashed #2a2e38;
}

.cd-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c8fff, #a78bfa);
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 600;
  color: #fff;
}

.cd-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
.cd-subtitle { font-size: 15px; color: #6c8fff; font-weight: 500; margin-bottom: 12px; }
.cd-bio { font-size: 14px; color: #8b90a0; max-width: 500px; margin: 0 auto; line-height: 1.5; }

.cd-heading { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
.cd-sub { font-size: 13px; color: #555b6e; margin-bottom: 28px; }

.cd-slot-list { display: flex; flex-direction: column; gap: 10px; }

.cd-slot {
  background: #13151a;
  border: 1px solid #2a2e38;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: border-color 0.12s;
}

.cd-slot:hover { border-color: #353a47; }

.cd-slot-date { font-size: 12px; color: #555b6e; font-family: 'DM Mono', monospace; margin-bottom: 4px; }
.cd-slot-time { font-size: 14px; font-weight: 500; color: #e8eaf0; font-family: 'DM Mono', monospace; }
.cd-slot-day { font-size: 12px; color: #8b90a0; margin-top: 2px; }

.cd-book-btn {
  background: #6c8fff;
  color: #fff;
  border: none;
  border-radius: 7px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  transition: background 0.12s, transform 0.1s;
  white-space: nowrap;
}
.cd-book-btn:hover { background: #5a7aef; }
.cd-book-btn:active { transform: scale(0.97); }
.cd-book-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.cd-empty {
  text-align: center;
  padding: 48px 0;
  color: #555b6e;
  font-size: 13px;
}

.cd-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.cd-modal {
  background: #13151a;
  border: 1px solid #2a2e38;
  border-radius: 14px;
  padding: 28px;
  width: 100%;
  max-width: 380px;
}

.cd-modal-title { font-size: 17px; font-weight: 600; margin-bottom: 6px; }
.cd-modal-sub { font-size: 13px; color: #8b90a0; margin-bottom: 22px; }

.cd-modal-slot {
  background: rgba(108,143,255,0.1);
  border: 1px solid rgba(108,143,255,0.2);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 20px;
  font-size: 13px;
  color: #6c8fff;
  font-family: 'DM Mono', monospace;
}

.cd-field { margin-bottom: 14px; }
.cd-field label { display: block; font-size: 12px; color: #8b90a0; margin-bottom: 5px; font-weight: 500; }
.cd-field input {
  width: 100%;
  padding: 9px 11px;
  background: #1a1d24;
  border: 1px solid #2a2e38;
  border-radius: 7px;
  color: #e8eaf0;
  font-size: 13px;
  font-family: 'Syne', sans-serif;
  outline: none;
  transition: border-color 0.12s;
}
.cd-field input:focus { border-color: #6c8fff; }
.cd-field input::placeholder { color: #3a3f4d; }

.cd-modal-btns { display: flex; gap: 10px; margin-top: 6px; }

.cd-confirm-btn {
  flex: 1;
  padding: 10px;
  background: #6c8fff;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  transition: background 0.12s;
}
.cd-confirm-btn:hover { background: #5a7aef; }
.cd-confirm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.cd-cancel-btn {
  padding: 10px 18px;
  background: transparent;
  color: #8b90a0;
  border: 1px solid #2a2e38;
  border-radius: 7px;
  font-size: 13px;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
}
.cd-cancel-btn:hover { border-color: #353a47; color: #e8eaf0; }

.cd-success {
  background: rgba(62,207,142,0.1);
  border: 1px solid rgba(62,207,142,0.25);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  color: #3ecf8e;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.cd-error {
  background: rgba(240,96,96,0.1);
  border: 1px solid rgba(240,96,96,0.25);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
  color: #f06060;
  margin-bottom: 12px;
}
`;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtTime = (t) => t ? t.substring(0, 5) : '';

const BookingPage = () => {
    const { freelancerId } = useParams();
    const [availability, setAvailability] = useState([]);
    const [freelancer, setFreelancer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTakingBookings, setIsTakingBookings] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingForm, setBookingForm] = useState({ client_name: '', client_email: '' });
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [avRes, profRes] = await Promise.all([
                    fetchAvailability(freelancerId),
                    fetchProfile(freelancerId).catch(() => ({ data: { is_taking_bookings: true, name: 'Freelancer' } }))
                ]);
                setFreelancer(profRes.data);
                setIsTakingBookings(!!profRes.data.is_taking_bookings);
                setAvailability((avRes.data || []).filter(s => !s.is_booked));
            } catch {
                setError('Failed to load availability.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [freelancerId]);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!bookingForm.client_name || !bookingForm.client_email) {
            setError('Please fill in your name and email.');
            return;
        }
        setConfirming(true);
        setError('');
        try {
            await createBooking({
                slot_id: selectedSlot.id,
                client_name: bookingForm.client_name,
                client_email: bookingForm.client_email,
            });
            setSuccessMsg(`Booking confirmed for ${fmtDate(selectedSlot.booking_date)} at ${fmtTime(selectedSlot.start_time)}!`);
            setSelectedSlot(null);
            setAvailability(prev => prev.filter(s => s.id !== selectedSlot.id));
        } catch (err) {
            setError(err.response?.data?.error || 'Booking failed. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    return (
        <>
            <style>{CSS}</style>
            <div className="cd-root">
                <div className="cd-inner">
                    <div className="cd-logo">
                        <div className="cd-logo-icon">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white"/></svg>
                        </div>
                        <span className="cd-logo-text">FreelanceOS</span>
                    </div>

                    <div className="cd-header">
                        {freelancer && (
                            <>
                                <div className="cd-avatar">{freelancer.name ? freelancer.name.substring(0,2).toUpperCase() : 'F'}</div>
                                <h1 className="cd-title">{freelancer.name}</h1>
                                {freelancer.title && <div className="cd-subtitle">{freelancer.title}</div>}
                                {freelancer.bio && <div className="cd-bio">{freelancer.bio}</div>}
                            </>
                        )}
                        {!freelancer && <h1 className="cd-title">Book a session</h1>}
                    </div>

                    {successMsg && <div className="cd-success">{successMsg}</div>}

                    {loading ? (
                        <div className="cd-empty">Loading available slots...</div>
                    ) : !isTakingBookings ? (
                        <div className="cd-empty">
                            <div style={{ fontSize: 32, marginBottom: 12 }}>🔴</div>
                            <div style={{ fontWeight: 600, color: '#e8eaf0', marginBottom: 6 }}>Not accepting bookings</div>
                            <div>This freelancer is currently unavailable. Please check back later.</div>
                        </div>
                    ) : availability.length === 0 && !successMsg ? (
                        <div className="cd-empty">No available slots at the moment. Check back soon!</div>
                    ) : (
                        <div className="cd-slot-list">
                            {availability.map(slot => (
                                <div className="cd-slot" key={slot.id}>
                                    <div>
                                        <div className="cd-slot-date">{fmtDate(slot.booking_date)}</div>
                                        <div className="cd-slot-time">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</div>
                                        <div className="cd-slot-day">{slot.day_of_week}</div>
                                    </div>
                                    <button className="cd-book-btn" onClick={() => { setSelectedSlot(slot); setError(''); }}>
                                        Book slot
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Booking modal */}
            {selectedSlot && (
                <div className="cd-modal-overlay" onClick={() => setSelectedSlot(null)}>
                    <div className="cd-modal" onClick={e => e.stopPropagation()}>
                        <div className="cd-modal-title">Confirm booking</div>
                        <div className="cd-modal-sub">Fill in your details to reserve this slot</div>
                        <div className="cd-modal-slot">
                            {fmtDate(selectedSlot.booking_date)} · {fmtTime(selectedSlot.start_time)} – {fmtTime(selectedSlot.end_time)}
                        </div>
                        {error && <div className="cd-error">{error}</div>}
                        <form onSubmit={handleBook}>
                            <div className="cd-field">
                                <label>Your name</label>
                                <input type="text" placeholder="Full name" required
                                    onChange={e => setBookingForm({ ...bookingForm, client_name: e.target.value })} />
                            </div>
                            <div className="cd-field">
                                <label>Email address</label>
                                <input type="email" placeholder="you@example.com" required
                                    onChange={e => setBookingForm({ ...bookingForm, client_email: e.target.value })} />
                            </div>
                            <div className="cd-modal-btns">
                                <button type="button" className="cd-cancel-btn" onClick={() => setSelectedSlot(null)}>Cancel</button>
                                <button type="submit" className="cd-confirm-btn" disabled={confirming}>
                                    {confirming ? 'Confirming...' : 'Confirm booking'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default BookingPage;
