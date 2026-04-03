import React, { useEffect, useState } from 'react';
import { fetchClientBookings, cancelBooking, fetchMyFreelancers, fetchAvailability, createBooking, fetchDirectory } from '../api';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.cd-root {
  min-height: 100vh;
  background: #0d0e11;
  color: #e8eaf0;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
}

/* Header */
.cd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  border-bottom: 1px solid rgba(42, 46, 56, 0.5);
  position: sticky;
  top: 0;
  background: rgba(13, 14, 17, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 10;
}

.cd-logo {
  display: flex;
  align-items: center;
  gap: 9px;
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

.cd-logo-text {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaf0;
}

.cd-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cd-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c8fff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.cd-logout-btn {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #2a2e38;
  border-radius: 8px;
  color: #8b90a0;
  font-size: 12px;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  transition: all 0.12s;
}
.cd-logout-btn:hover { border-color: #f06060; color: #f06060; }

/* Main Content */
.cd-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
}

.cd-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 6px;
}

.cd-sub {
  font-size: 13px;
  color: #8b90a0;
  margin-bottom: 32px;
}

/* Stats */
.cd-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.cd-stat-card {
  background: rgba(19, 21, 26, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(42, 46, 56, 0.6);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 24px rgba(0,0,0,0.2);
}

.cd-stat-val {
  font-size: 28px;
  font-weight: 600;
  font-family: 'DM Mono', monospace;
  background: linear-gradient(to right, #ffffff, #a0a5b5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cd-stat-lbl {
  font-size: 12px;
  color: #8b90a0;
  font-weight: 500;
  margin-top: 4px;
}

/* Bookings List */
.cd-section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #e8eaf0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cd-empty {
  text-align: center;
  padding: 48px 0;
  background: rgba(19, 21, 26, 0.4);
  backdrop-filter: blur(8px);
  border: 1px dashed rgba(42, 46, 56, 0.8);
  border-radius: 12px;
  color: #555b6e;
  font-size: 13px;
}

.cd-booking-card {
  background: rgba(19, 21, 26, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(42, 46, 56, 0.7);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.cd-booking-card:hover {
  border-color: rgba(108, 143, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(108, 143, 255, 0.15);
}

.cd-b-date {
  font-size: 13px;
  color: #6c8fff;
  font-family: 'DM Mono', monospace;
  font-weight: 500;
  margin-bottom: 8px;
}

.cd-b-freelancer {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.cd-b-time {
  font-size: 12px;
  color: #8b90a0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.cd-cancel-btn {
  background: rgba(240,96,96,0.1);
  color: #f06060;
  border: 1px solid rgba(240,96,96,0.25);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  transition: all 0.15s;
}

.cd-cancel-btn:hover {
  background: rgba(240,96,96,0.15);
  border-color: rgba(240,96,96,0.4);
}

.cd-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  font-family: 'DM Mono', monospace;
  background: rgba(62,207,142,0.15);
  color: #3ecf8e;
  border: 1px solid rgba(62,207,142,0.3);
}

.cd-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid #2a2e38;
  margin-bottom: 24px;
}

.cd-tab {
  padding: 12px 0;
  background: transparent;
  border: none;
  color: #8b90a0;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  position: relative;
  transition: color 0.15s;
}

.cd-tab:hover { color: #e8eaf0; }

.cd-tab.active {
  color: #e8eaf0;
  font-weight: 600;
}

.cd-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: #6c8fff;
  border-radius: 2px 2px 0 0;
}

.cd-modal-container {
  background: rgba(19, 21, 26, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(108, 143, 255, 0.2);
  box-shadow: 0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
}

@media (max-width: 600px) {
  .cd-stats { grid-template-columns: 1fr; }
  .cd-booking-card { flex-direction: column; align-items: flex-start; gap: 16px; }
  .cd-cancel-btn { width: 100%; }
}
`;

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
const fmtTime = (t) => t ? t.substring(0, 5) : '';

const ClientDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Client' };
    const [bookings, setBookings] = useState([]);
    const [freelancers, setFreelancers] = useState([]);
    const [directory, setDirectory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('upcoming'); // upcoming | history | professionals | directory

    // Modal state
    const [selectedFreelancer, setSelectedFreelancer] = useState(null);
    const [freelancerSlots, setFreelancerSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingSlot, setBookingSlot] = useState(null);
    const [bookingError, setBookingError] = useState('');

    const loadData = async () => {
        try {
            const [bRes, fRes, dRes] = await Promise.all([
                fetchClientBookings(),
                fetchMyFreelancers(),
                fetchDirectory().catch(() => ({ data: [] }))
            ]);
            setBookings(bRes.data || []);
            setFreelancers(fRes.data || []);
            setDirectory((dRes.data || []).filter(f => f.name !== 'Client'));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCancel = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await cancelBooking(id);
            await loadData();
        } catch (err) {
            alert('Failed to cancel booking.');
        }
    };

    const handleOpenBooking = async (f) => {
        setSelectedFreelancer(f);
        setLoadingSlots(true);
        setFreelancerSlots([]);
        setBookingSlot(null);
        setBookingError('');
        try {
            const { data } = await fetchAvailability(f.id);
            setFreelancerSlots((data || []).filter(s => !s.is_booked));
        } catch {
            setBookingError('Failed to load slots.');
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!bookingSlot) return;
        try {
            await createBooking({ slot_id: bookingSlot.id, client_name: user.name, client_email: user.email });
            alert('Booking confirmed!');
            setSelectedFreelancer(null);
            await loadData();
        } catch (err) {
            setBookingError(err.response?.data?.error || 'Booking failed.');
        }
    };

    const initials = user.name.substring(0, 2).toUpperCase();
    const upcoming = bookings.filter(b => new Date(b.booking_date) >= new Date(new Date().setHours(0,0,0,0)));

    return (
        <>
            <style>{CSS}</style>
            <div className="cd-root">
                <header className="cd-header">
                    <div className="cd-logo">
                        <div className="cd-logo-icon">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white"/></svg>
                        </div>
                        <span className="cd-logo-text">FreelanceOS Client</span>
                    </div>
                    <div className="cd-user">
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</span>
                        <div className="cd-avatar">{initials}</div>
                        <button className="cd-logout-btn" onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}>Logout</button>
                    </div>
                </header>

                <main className="cd-main">
                    <h1 className="cd-title">Welcome back, {user.name.split(' ')[0]}</h1>
                    <p className="cd-sub">Here is an overview of your scheduled engagements.</p>

                    <div className="cd-stats">
                        <div className="cd-stat-card">
                            <div>
                                <div className="cd-stat-val" style={{ color: '#6c8fff' }}>{upcoming.length}</div>
                                <div className="cd-stat-lbl">Upcoming bookings</div>
                            </div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c8fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                        <div className="cd-stat-card">
                            <div>
                                <div className="cd-stat-val" style={{ color: '#3ecf8e' }}>{bookings.length}</div>
                                <div className="cd-stat-lbl">Total bookings all-time</div>
                            </div>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                    </div>

                    <div className="cd-tabs">
                        <button className={`cd-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>
                            Upcoming ({upcoming.length})
                        </button>
                        <button className={`cd-tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
                            History ({bookings.length - upcoming.length})
                        </button>
                        <button className={`cd-tab ${tab === 'professionals' ? 'active' : ''}`} onClick={() => setTab('professionals')}>
                            My Professionals ({freelancers.length})
                        </button>
                        <button className={`cd-tab ${tab === 'directory' ? 'active' : ''}`} onClick={() => setTab('directory')}>
                            Discover Professionals ✨
                        </button>
                    </div>

                    {loading ? (
                        <div className="cd-empty">Loading...</div>
                    ) : tab === 'directory' ? (
                        directory.length === 0 ? (
                            <div className="cd-empty">No professionals found.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {directory.map(f => (
                                    <div className="cd-booking-card" key={f.id} style={{ display: 'block' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                            <div className="cd-avatar" style={{ margin: 0, width: 48, height: 48, fontSize: 18 }}>
                                                {f.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 16, color: '#e8eaf0' }}>{f.name}</div>
                                                {f.title && <div style={{ fontSize: 13, color: '#6c8fff' }}>{f.title}</div>}
                                            </div>
                                        </div>
                                        {f.bio && <div style={{ fontSize: 13, color: '#8b90a0', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{f.bio}"</div>}
                                        <button onClick={() => handleOpenBooking(f)} style={{ width: '100%', display: 'block', textAlign: 'center', background: 'linear-gradient(135deg, #6c8fff, #8ba4ff)', color: '#fff', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Syne', sans-serif", transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(108,143,255,0.2)' }}>
                                            Select & Schedule
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : tab === 'professionals' ? (
                        freelancers.length === 0 ? (
                            <div className="cd-empty">You haven't booked with any professionals yet.</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                                {freelancers.map(f => (
                                    <div className="cd-booking-card" key={f.id} style={{ display: 'block' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                            <div className="cd-avatar" style={{ margin: 0, width: 48, height: 48, fontSize: 18 }}>
                                                {f.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: 16, color: '#e8eaf0' }}>{f.name}</div>
                                                {f.title && <div style={{ fontSize: 13, color: '#6c8fff' }}>{f.title}</div>}
                                            </div>
                                        </div>
                                        <button onClick={() => handleOpenBooking(f)} style={{ width: '100%', display: 'block', textAlign: 'center', background: '#2a2e38', color: '#e8eaf0', padding: '10px', borderRadius: 8, textDecoration: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: "'Syne', sans-serif" }}>
                                            Schedule Next Meeting
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (tab === 'upcoming' ? upcoming : bookings.filter(b => !upcoming.includes(b))).length === 0 ? (
                        <div className="cd-empty">
                            <div style={{ fontSize: 24, marginBottom: 8 }}>🗓️</div>
                            <div>No {tab} bookings found.</div>
                        </div>
                    ) : (
                        <div>
                            {(tab === 'upcoming' ? upcoming : bookings.filter(b => !upcoming.includes(b))).map(b => (
                                <div className="cd-booking-card" key={b.id} style={{ opacity: tab === 'history' ? 0.7 : 1 }}>
                                    <div>
                                        <div className="cd-b-date" style={{ color: tab === 'history' ? '#8b90a0' : '#6c8fff' }}>{fmtDate(b.booking_date)}</div>
                                        <div className="cd-b-freelancer">Session with {b.freelancer_name}</div>
                                        <div className="cd-b-time">
                                            {tab === 'history' ? (
                                                <span className="cd-badge" style={{ background: '#2a2e38', color: '#8b90a0', borderColor: '#353a47' }}>PAST</span>
                                            ) : (
                                                <span className="cd-badge">CONFIRMED</span>
                                            )}
                                            {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                                        </div>
                                    </div>
                                    {tab === 'upcoming' && (
                                        <button className="cd-cancel-btn" onClick={() => handleCancel(b.id)}>Cancel Booking</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Booking Modal */}
            {selectedFreelancer && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="cd-booking-card cd-modal-container" style={{ width: '100%', maxWidth: 450, margin: 20, display: 'block' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div className="cd-avatar" style={{ margin: 0, width: 40, height: 40, fontSize: 15 }}>
                                {selectedFreelancer.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 18, margin: 0 }}>Schedule Session</h3>
                                <div style={{ fontSize: 13, color: '#8b90a0' }}>with {selectedFreelancer.name}</div>
                            </div>
                        </div>
                        
                        {bookingError && <div style={{ color: '#f06060', marginBottom: 16, background: 'rgba(240,96,96,0.1)', padding: 10, border: '1px solid rgba(240,96,96,0.2)', borderRadius: 8 }}>{bookingError}</div>}
                        
                        {loadingSlots ? (
                            <div style={{ padding: 32, textAlign: 'center', color: '#8b90a0' }}>Loading available slots...</div>
                        ) : freelancerSlots.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: '#8b90a0', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>No open slots right now.</div>
                        ) : (
                            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                                {freelancerSlots.map(s => (
                                    <div key={s.id} onClick={() => setBookingSlot(s)} style={{ border: `1px solid ${bookingSlot?.id === s.id ? '#6c8fff' : 'rgba(255,255,255,0.08)'}`, background: bookingSlot?.id === s.id ? 'rgba(108,143,255,0.15)' : 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: bookingSlot?.id === s.id ? '#fff' : '#e8eaf0', fontFamily: "'DM Mono', monospace" }}>{fmtDate(s.booking_date)}</div>
                                            <div style={{ color: bookingSlot?.id === s.id ? '#c0cdff' : '#8b90a0', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>
                                                {fmtTime(s.start_time)} - {fmtTime(s.end_time)}
                                            </div>
                                        </div>
                                        {bookingSlot?.id === s.id && <div style={{width: 8, height: 8, borderRadius: '50%', background: '#6c8fff', boxShadow: '0 0 8px #6c8fff'}}></div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button type="button" className="cd-cancel-btn" style={{ flex: 1, margin: 0, background: 'rgba(255,255,255,0.05)', color: '#e8eaf0', borderColor: 'transparent' }} onClick={() => setSelectedFreelancer(null)}>Cancel</button>
                            <button type="button" style={{ background: 'linear-gradient(135deg, #6c8fff, #8ba4ff)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 13, fontWeight: 600, cursor: bookingSlot ? 'pointer' : 'not-allowed', opacity: bookingSlot ? 1 : 0.5, flex: 2, fontFamily: "'Syne', sans-serif", boxShadow: bookingSlot ? '0 4px 16px rgba(108,143,255,0.3)' : 'none', transition: 'all 0.2s' }} disabled={!bookingSlot} onClick={handleConfirmBooking}>
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ClientDashboard;
