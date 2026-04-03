import React, { useEffect, useState, useCallback } from 'react';
import { fetchAvailability, fetchStats, fetchAllBookings, addAvailability, createBulkAvailability, deleteAvailability, cancelBooking, toggleAvailability, updateProfile, manualBooking, rejectBooking } from '../api';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.fd-root {
  min-height: 100vh;
  background: #0d0e11;
  color: #e8eaf0;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  display: grid;
  grid-template-columns: 220px 1fr;
}

/* Sidebar */
.fd-sidebar {
  background: rgba(19, 21, 26, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(42, 46, 56, 0.5);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.fd-logo {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 20px 28px;
}

.fd-logo-icon {
  width: 28px;
  height: 28px;
  background: #6c8fff;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fd-logo-text {
  font-size: 15px;
  font-weight: 600;
  color: #e8eaf0;
}

.fd-nav { flex: 1; padding: 0 10px; }

.fd-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: #8b90a0;
  margin-bottom: 2px;
  transition: all 0.12s;
  user-select: none;
  border: none;
  background: transparent;
  width: 100%;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  text-align: left;
}

.fd-nav-item:hover { color: #e8eaf0; background: #1a1d24; }
.fd-nav-item.active { background: #21252e; color: #6c8fff; }

.fd-user {
  padding: 14px;
  margin: 10px;
  border-top: 1px solid #2a2e38;
}

.fd-user-inner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fd-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c8fff, #a78bfa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.fd-user-name { font-size: 13px; font-weight: 500; color: #e8eaf0; }
.fd-user-status { font-size: 11px; color: #3ecf8e; display: flex; align-items: center; gap: 4px; }
.fd-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #3ecf8e; }

/* Main */
.fd-main { overflow-y: auto; }

.fd-header {
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

.fd-header-left {}
.fd-header-title { font-size: 17px; font-weight: 600; color: #e8eaf0; }
.fd-header-date { font-size: 11px; color: #555b6e; margin-top: 2px; font-family: 'DM Mono', monospace; }

.fd-header-right { display: flex; align-items: center; gap: 10px; }

.fd-icon-btn {
  width: 34px;
  height: 34px;
  background: rgba(19, 21, 26, 0.6);
  border: 1px solid rgba(42, 46, 56, 0.6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}
.fd-icon-btn:hover { border-color: rgba(108, 143, 255, 0.5); background: rgba(108, 143, 255, 0.1); }

.fd-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  background: #f06060;
  border-radius: 50%;
  font-size: 9px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'DM Mono', monospace;
  font-weight: 600;
}

.fd-avail-toggle {
  display: flex;
  align-items: center;
  gap: 7px;
  background: #13151a;
  border: 1px solid #2a2e38;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  transition: border-color 0.12s;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  color: #8b90a0;
}
.fd-avail-toggle:hover { border-color: #353a47; }

.fd-logout-btn {
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
.fd-logout-btn:hover { border-color: #f06060; color: #f06060; }

/* Notification panel */
.fd-notif-panel {
  position: fixed;
  right: 24px;
  top: 68px;
  width: 300px;
  background: #1a1d24;
  border: 1px solid #2a2e38;
  border-radius: 12px;
  z-index: 100;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.fd-notif-header {
  padding: 12px 16px;
  border-bottom: 1px solid #2a2e38;
  font-size: 13px;
  font-weight: 500;
  color: #e8eaf0;
}

.fd-notif-item {
  padding: 12px 16px;
  border-bottom: 1px solid #2a2e38;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}
.fd-notif-item:last-child { border-bottom: none; }

.fd-notif-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}

.fd-notif-text { font-size: 12px; color: #e8eaf0; }
.fd-notif-time { font-size: 11px; color: #555b6e; margin-top: 2px; font-family: 'DM Mono', monospace; }

/* Page padding */
.fd-page { padding: 24px 28px; }

/* Stat cards */
.fd-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}

.fd-stat-card {
  background: rgba(19, 21, 26, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(42, 46, 56, 0.6);
  border-radius: 10px;
  padding: 16px 18px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
}

.fd-stat-label {
  font-size: 10px;
  color: #555b6e;
  letter-spacing: 0.7px;
  margin-bottom: 8px;
  font-family: 'DM Mono', monospace;
}

.fd-stat-value {
  font-size: 22px;
  font-weight: 600;
  font-family: 'DM Mono', monospace;
  background: linear-gradient(to right, #ffffff, #a0a5b5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.fd-stat-sub { font-size: 11px; margin-top: 5px; }

/* Cards */
.fd-card {
  background: rgba(19, 21, 26, 0.5);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(42, 46, 56, 0.7);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  border-radius: 12px;
  padding: 20px;
}

.fd-card-title {
  font-size: 13px;
  font-weight: 500;
  color: #e8eaf0;
  margin-bottom: 14px;
}

/* Status badges */
.fd-badge-status {
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 10px;
  font-family: 'DM Mono', monospace;
  font-weight: 500;
}
.fd-badge-confirmed { background: rgba(62,207,142,0.12); color: #3ecf8e; }
.fd-badge-pending   { background: rgba(245,166,35,0.15);  color: #f5a623; }
.fd-badge-conflict  { background: rgba(240,96,96,0.12);   color: #f06060; }
.fd-badge-available { background: rgba(108,143,255,0.12); color: #6c8fff; }

/* Slot item */
.fd-slot {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.fd-slot-time {
  font-size: 11px;
  color: #555b6e;
  width: 40px;
  padding-top: 8px;
  flex-shrink: 0;
  font-family: 'DM Mono', monospace;
}

.fd-slot-block {
  flex: 1;
  border-radius: 5px;
  padding: 8px 10px;
  border-left: 2px solid;
}

/* Form */
.fd-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 10px;
  align-items: end;
}

.fd-field label {
  display: block;
  font-size: 11px;
  color: #8b90a0;
  margin-bottom: 5px;
  font-weight: 500;
}

.fd-field input {
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
.fd-field input:focus { border-color: #6c8fff; }

.fd-add-btn {
  padding: 9px 18px;
  background: linear-gradient(135deg, #6c8fff, #8ba4ff);
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Syne', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(108,143,255,0.2);
}
.fd-add-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(108,143,255,0.3); }
.fd-add-btn:active { transform: scale(0.97); }
.fd-add-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

/* Table */
.fd-table {
  width: 100%;
  border-collapse: collapse;
}
.fd-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 10px;
  color: #555b6e;
  font-weight: 500;
  letter-spacing: 0.6px;
  font-family: 'DM Mono', monospace;
  border-bottom: 1px solid #2a2e38;
}
.fd-table td {
  padding: 12px 14px;
  font-size: 13px;
  color: #e8eaf0;
  border-bottom: 1px solid #1a1d24;
}
.fd-table tr:last-child td { border-bottom: none; }
.fd-table tr:hover td { background: #1a1d24; }

.fd-del-btn {
  background: transparent;
  color: #555b6e;
  border: 1px solid #2a2e38;
  border-radius: 5px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: 'Syne', sans-serif;
  transition: all 0.12s;
}
.fd-del-btn:hover { border-color: #f06060; color: #f06060; }

/* Filter tabs */
.fd-filters { display: flex; gap: 6px; margin-bottom: 14px; }
.fd-filter-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #2a2e38;
  background: transparent;
  color: #8b90a0;
  font-family: 'Syne', sans-serif;
  transition: all 0.12s;
}
.fd-filter-btn.active { background: #6c8fff; color: #fff; border-color: #6c8fff; }
.fd-filter-btn:hover:not(.active) { border-color: #353a47; color: #e8eaf0; }

/* Conflict alert */
.fd-conflict-alert {
  background: rgba(240,96,96,0.07);
  border: 1px solid rgba(240,96,96,0.2);
  border-radius: 10px;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.fd-resolve-btn {
  background: transparent;
  border: 1px solid #f06060;
  color: #f06060;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
  font-family: 'Syne', sans-serif;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.12s;
}
.fd-resolve-btn:hover { background: rgba(240,96,96,0.1); }

/* Progress bar */
.fd-progress-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.fd-progress-label { font-size: 12px; color: #8b90a0; width: 80px; }
.fd-progress-bar { flex: 1; height: 6px; background: #21252e; border-radius: 3px; overflow: hidden; }
.fd-progress-fill { height: 100%; border-radius: 3px; }
.fd-progress-val { font-size: 12px; color: #e8eaf0; width: 60px; text-align: right; font-family: 'DM Mono', monospace; }

/* Week calendar */
.fd-week-grid {
  display: grid;
  grid-template-columns: 44px repeat(7, 1fr);
  gap: 0;
}

.fd-week-header { text-align: center; font-size: 10px; color: #555b6e; padding-bottom: 10px; font-family: 'DM Mono', monospace; }
.fd-week-header.today { color: #6c8fff; border-bottom: 2px solid #6c8fff; }
.fd-week-time { font-size: 10px; color: #555b6e; padding-top: 5px; font-family: 'DM Mono', monospace; }

.fd-week-slot {
  border-radius: 4px;
  margin: 2px;
  padding: 5px 6px;
  font-size: 10px;
  border-left: 2px solid;
  cursor: default;
}

.fd-empty { color: #2a2e38; font-size: 11px; padding: 24px 0; text-align: center; }

/* Error / success inline */
.fd-inline-err {
  background: rgba(240,96,96,0.1);
  border: 1px solid rgba(240,96,96,0.25);
  border-radius: 7px;
  padding: 9px 12px;
  font-size: 12px;
  color: #f06060;
  margin-bottom: 12px;
}
.fd-inline-ok {
  background: rgba(62,207,142,0.1);
  border: 1px solid rgba(62,207,142,0.25);
  border-radius: 7px;
  padding: 9px 12px;
  font-size: 12px;
  color: #3ecf8e;
  margin-bottom: 12px;
}

/* ── Mobile responsive ─────────────────────────────────────── */
@media (max-width: 768px) {
  .fd-root {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .fd-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    height: auto;
    flex-direction: row;
    align-items: center;
    padding: 0;
    border-right: none;
    border-top: 1px solid #2a2e38;
    z-index: 200;
    background: #13151a;
  }

  .fd-logo { display: none; }
  .fd-user { display: none; }

  .fd-nav {
    flex: 1;
    display: flex;
    flex-direction: row;
    padding: 0;
    gap: 0;
  }

  .fd-nav-item {
    flex: 1;
    flex-direction: column;
    gap: 4px;
    padding: 10px 6px;
    font-size: 10px;
    border-radius: 0;
    margin-bottom: 0;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .fd-main {
    padding-bottom: 60px;
  }

  .fd-header {
    padding: 14px 16px;
  }

  .fd-header-date { display: none; }

  .fd-logout-btn { display: none; }

  .fd-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .fd-form-grid {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
  }

  .fd-form-grid .fd-add-btn {
    grid-column: 1 / -1;
  }

  .fd-page { padding: 16px; }

  /* Overview two-column becomes one-column */
  div[style*="grid-template-columns: 1fr 1fr"] {
    grid-template-columns: 1fr !important;
  }
  div[style*="grid-template-columns: 1fr 2fr"] {
    grid-template-columns: 1fr !important;
  }

  /* Week view scrolls horizontally */
  .fd-week-grid {
    overflow-x: auto;
    min-width: 600px;
  }
  .fd-card:has(.fd-week-grid) {
    overflow-x: auto;
  }
}

@media (max-width: 480px) {
  .fd-stats {
    grid-template-columns: 1fr 1fr;
  }
  .fd-stat-value { font-size: 18px; }
  .fd-header-right { gap: 6px; }
  .fd-avail-toggle { padding: 5px 8px; font-size: 11px; }
}
`;

// ─── helpers ───────────────────────────────────────────────
const mono = (s) => <span style={{ fontFamily: "'DM Mono', monospace" }}>{s}</span>;
const today = new Date();
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';
const fmtTime = (t) => t ? t.substring(0, 5) : '';
const initials = (name) => name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'U';
const todayStr = today.toISOString().split('T')[0];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getConflicts(slots) {
    const conflicts = [];
    for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
            const a = slots[i], b = slots[j];
            const aDate = a.booking_date?.toString().split('T')[0];
            const bDate = b.booking_date?.toString().split('T')[0];
            if (aDate !== bDate) continue;
            if (a.start_time < b.end_time && a.end_time > b.start_time) {
                conflicts.push(a.id, b.id);
            }
        }
    }
    return new Set(conflicts);
}

// ─── Component ─────────────────────────────────────────────
const FreelancerDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user')) || { id: 1, name: 'Freelancer' };
    const [tab, setTab] = useState('overview');
    const [slots, setSlots] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formMsg, setFormMsg] = useState({ type: '', text: '' });
    const [adding, setAdding] = useState(false);
    const [available, setAvailable] = useState(true);
    const [togglingAvail, setTogglingAvail] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [bookingFilter, setBookingFilter] = useState('all');
    const [formData, setFormData] = useState({
        booking_date: todayStr,
        start_time: '',
        end_time: '',
        session_duration: '30',
        client_name: '',
        client_email: ''
    });
    
    // New Features state
    const [copied, setCopied] = useState(false);
    const [slotMode, setSlotMode] = useState('single');
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileForm, setProfileForm] = useState({ title: '', bio: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [avRes, stRes] = await Promise.all([
                fetchAvailability(user.id),
                fetchStats(user.id).catch(() => ({ data: null }))
            ]);
            setSlots(avRes.data || []);
            setStats(stRes.data || null);
            // Sync the toggle state from DB stats
            if (stRes.data?.is_taking_bookings !== undefined) {
                setAvailable(stRes.data.is_taking_bookings);
            }
        } catch (err) {
            console.error('Load error', err);
        } finally {
            setLoading(false);
        }
    }, [user.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const conflictIds = getConflicts(slots);

    const handleAddSlot = async (e) => {
        e.preventDefault();
        if (!formData.start_time || !formData.end_time) {
            setFormMsg({ type: 'err', text: 'Please fill in all time fields.' });
            return;
        }
        if (formData.start_time >= formData.end_time) {
            setFormMsg({ type: 'err', text: 'End time must be after start time.' });
            return;
        }
        setAdding(true);
        setFormMsg({ type: '', text: '' });
        try {
            const dateObj = new Date(formData.booking_date);
            const dayName = DAYS[dateObj.getDay()];
            
            if (slotMode === 'bulk') {
                const res = await createBulkAvailability({ ...formData, day_of_week: dayName, freelancer_id: user.id });
                setFormMsg({ type: 'ok', text: res.data.message });
            } else if (slotMode === 'manual') {
                if (!formData.client_name || !formData.client_email) {
                    setFormMsg({ type: 'err', text: 'Client Name and Email are required for manual booking.' });
                    setAdding(false);
                    return;
                }
                const res = await manualBooking({ ...formData, day_of_week: dayName, freelancer_id: user.id });
                setFormMsg({ type: 'ok', text: res.data.message });
            } else {
                await addAvailability({ ...formData, day_of_week: dayName, freelancer_id: user.id });
                setFormMsg({ type: 'ok', text: `Slot added for ${dayName}, ${fmtDate(formData.booking_date)} and synced to Google Calendar!` });
            }
            await loadData();
        } catch (err) {
            setFormMsg({ type: 'err', text: err.response?.data?.error || 'Failed to add slot(s).' });
        } finally {
            setAdding(false);
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/book/${user.id}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            await updateProfile(profileForm);
            alert('Profile updated securely.');
            setShowProfileModal(false);
        } catch (err) {
            alert('Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this slot?')) return;
        try {
            await deleteAvailability(id);
            await loadData();
        } catch {
            alert('Failed to delete slot.');
        }
    };

    const handleReject = async (id, clientName) => {
        const reason = window.prompt(`Why are you rejecting the booking with ${clientName || 'this client'}? (This will be emailed to them)`);
        if (reason === null) return; // User cancelled prompt
        if (!reason.trim()) { alert('A reason is required to reject a booking.'); return; }
        
        try {
            await rejectBooking(id, { reason });
            alert('Booking rejected successfully. Email sent.');
            await loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to reject booking.');
        }
    };

    const handleToggleAvailable = async () => {
        if (togglingAvail) return;
        setTogglingAvail(true);
        try {
            const { data } = await toggleAvailability();
            setAvailable(!!data.is_taking_bookings);
        } catch {
            alert('Failed to update availability. Please try again.');
        } finally {
            setTogglingAvail(false);
        }
    };

    // Derived data
    const bookedSlots = slots.filter(s => s.is_booked);
    const pendingSlots = slots.filter(s => !s.is_booked);
    const conflictSlots = slots.filter(s => conflictIds.has(s.id));
    const todaySlots = slots.filter(s => s.booking_date?.toString().split('T')[0] === todayStr);

    const filteredSlots = bookingFilter === 'all' ? slots
        : bookingFilter === 'booked' ? bookedSlots
        : bookingFilter === 'available' ? pendingSlots
        : conflictSlots;

    const notifCount = conflictSlots.length + (bookedSlots.length > 0 ? 1 : 0);

    // Week view: current week Mon–Sun
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        const diff = i - today.getDay() + 1;
        d.setDate(today.getDate() + diff);
        return d.toISOString().split('T')[0];
    });

    const weekSlots = (dateStr) => slots.filter(s => s.booking_date?.toString().split('T')[0] === dateStr);

    const slotColor = (s) => {
        if (conflictIds.has(s.id)) return { bg: 'rgba(240,96,96,0.1)', border: '#f06060', text: '#f06060' };
        if (s.is_booked) return { bg: 'rgba(62,207,142,0.1)', border: '#3ecf8e', text: '#3ecf8e' };
        return { bg: 'rgba(108,143,255,0.12)', border: '#6c8fff', text: '#6c8fff' };
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg> },
        { id: 'schedule', label: 'Schedule', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="2" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><line x1="1" y1="6" x2="14" y2="6" stroke="currentColor" strokeWidth="1.2"/><line x1="5" y1="1" x2="5" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="10" y1="1" x2="10" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
        { id: 'bookings', label: 'Bookings', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L9.5 5.5L14.5 6L11 9L12 14L7.5 11.5L3 14L4 9L0.5 6L5.5 5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> },
        { id: 'add', label: 'Add Slot', icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="2" x2="7.5" y2="13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="2" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    ];

    const utilizationPct = slots.length > 0 ? Math.round((bookedSlots.length / slots.length) * 100) : 0;

    return (
        <>
            <style>{CSS}</style>
            <div className="fd-root">
                {/* Sidebar */}
                <div className="fd-sidebar">
                    <div className="fd-logo">
                        <div className="fd-logo-icon">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white"/></svg>
                        </div>
                        <span className="fd-logo-text">FreelanceOS</span>
                    </div>

                    <nav className="fd-nav">
                        {tabs.map(t => (
                            <button key={t.id} className={`fd-nav-item ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                                {t.icon}
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="fd-user">
                        <div className="fd-user-inner">
                            <div className="fd-avatar">{initials(user.name)}</div>
                            <div>
                                <div className="fd-user-name">{user.name}</div>
                                <div className="fd-user-status" style={{ marginBottom: 8 }}>
                                    <span className="fd-status-dot" style={{ background: available ? '#3ecf8e' : '#555b6e' }} />
                                    {available ? 'Available' : 'Busy'}
                                </div>
                                <button className="fd-del-btn" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setShowProfileModal(true)}>
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main */}
                <div className="fd-main">
                    {/* Header */}
                    <div className="fd-header">
                        <div className="fd-header-left">
                            <div className="fd-header-title">{tabs.find(t => t.id === tab)?.label}</div>
                            <div className="fd-header-date">{today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                        <div className="fd-header-right">
                            <button className="fd-avail-toggle" style={{ background: copied ? 'rgba(62,207,142,0.1)' : 'transparent', color: copied ? '#3ecf8e' : '#e8eaf0' }} onClick={handleCopyLink}>
                                {copied ? '✓ Copied' : '📋 Copy my link'}
                            </button>
                            <div className="fd-icon-btn" onClick={() => setShowNotif(!showNotif)}>
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5C5 1.5 3 3.5 3 6v3L1.5 11h12L12 9V6C12 3.5 10 1.5 7.5 1.5z" stroke="#8b90a0" strokeWidth="1.2"/><line x1="7.5" y1="13.5" x2="7.5" y2="11" stroke="#8b90a0" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                {notifCount > 0 && <div className="fd-badge">{notifCount}</div>}
                            </div>
                            <div className="fd-avail-toggle" onClick={handleToggleAvailable} style={{ opacity: togglingAvail ? 0.6 : 1 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: available ? '#3ecf8e' : '#555b6e', display: 'inline-block' }} />
                                {togglingAvail ? 'Saving...' : available ? 'Available' : 'Busy'}
                            </div>
                            <button className="fd-logout-btn" onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}>
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Notification Panel */}
                    {showNotif && (
                        <div className="fd-notif-panel">
                            <div className="fd-notif-header">Notifications</div>
                            {conflictSlots.length > 0 && (
                                <div className="fd-notif-item">
                                    <div className="fd-notif-dot" style={{ background: '#f5a623' }} />
                                    <div>
                                        <div className="fd-notif-text">{conflictSlots.length} schedule conflict{conflictSlots.length > 1 ? 's' : ''} detected</div>
                                        <div className="fd-notif-time">Check Schedule tab</div>
                                    </div>
                                </div>
                            )}
                            {bookedSlots.length > 0 && (
                                <div className="fd-notif-item">
                                    <div className="fd-notif-dot" style={{ background: '#3ecf8e' }} />
                                    <div>
                                        <div className="fd-notif-text">{bookedSlots.length} confirmed booking{bookedSlots.length > 1 ? 's' : ''}</div>
                                        <div className="fd-notif-time">View in Bookings</div>
                                    </div>
                                </div>
                            )}
                            {notifCount === 0 && (
                                <div className="fd-notif-item"><div className="fd-notif-text" style={{ color: '#555b6e' }}>No new notifications</div></div>
                            )}
                        </div>
                    )}

                    {/* ── OVERVIEW TAB ─────────────────────────── */}
                    {tab === 'overview' && (
                        <div className="fd-page">
                            {loading ? <div className="fd-empty">Loading...</div> : (
                                <>
                                    <div className="fd-stats">
                                        <div className="fd-stat-card">
                                            <div className="fd-stat-label">TOTAL SLOTS</div>
                                            <div className="fd-stat-value">{slots.length}</div>
                                            <div className="fd-stat-sub" style={{ color: '#8b90a0' }}>{pendingSlots.length} open</div>
                                        </div>
                                        <div className="fd-stat-card">
                                            <div className="fd-stat-label">CONFIRMED</div>
                                            <div className="fd-stat-value" style={{ color: '#3ecf8e' }}>{bookedSlots.length}</div>
                                            <div className="fd-stat-sub" style={{ color: '#3ecf8e' }}>{utilizationPct}% utilization</div>
                                        </div>
                                        <div className="fd-stat-card">
                                            <div className="fd-stat-label">TODAY</div>
                                            <div className="fd-stat-value">{todaySlots.length}</div>
                                            <div className="fd-stat-sub" style={{ color: '#8b90a0' }}>{todaySlots.filter(s => s.is_booked).length} booked</div>
                                        </div>
                                        <div className="fd-stat-card">
                                            <div className="fd-stat-label">CONFLICTS</div>
                                            <div className="fd-stat-value" style={{ color: conflictSlots.length > 0 ? '#f06060' : '#e8eaf0' }}>{conflictSlots.length}</div>
                                            <div className="fd-stat-sub" style={{ color: conflictSlots.length > 0 ? '#f06060' : '#555b6e' }}>
                                                {conflictSlots.length > 0 ? 'Needs attention' : 'All clear'}
                                            </div>
                                        </div>
                                    </div>

                                    {conflictSlots.length > 0 && (
                                        <div className="fd-conflict-alert">
                                            <div>
                                                <div style={{ fontSize: 13, color: '#f06060', fontWeight: 500, marginBottom: 4 }}>
                                                    {conflictSlots.length} slot{conflictSlots.length > 1 ? 's' : ''} have overlapping times
                                                </div>
                                                <div style={{ fontSize: 12, color: '#8b90a0' }}>
                                                    Review in the Schedule or Bookings tab and remove conflicting slots.
                                                </div>
                                            </div>
                                            <button className="fd-resolve-btn" onClick={() => setTab('schedule')}>View Schedule →</button>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        {/* Today's schedule */}
                                        <div className="fd-card">
                                            <div className="fd-card-title">Today — {fmtDate(todayStr)}</div>
                                            {todaySlots.length === 0 ? (
                                                <div className="fd-empty">No slots scheduled today</div>
                                            ) : todaySlots.map(s => {
                                                const c = slotColor(s);
                                                return (
                                                    <div className="fd-slot" key={s.id}>
                                                        <div className="fd-slot-time">{fmtTime(s.start_time)}</div>
                                                        <div className="fd-slot-block" style={{ background: c.bg, borderLeftColor: c.border }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div>
                                                                    <div style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 500 }}>
                                                                        {s.is_booked ? (s.client_name || 'Booked') : 'Open slot'}
                                                                    </div>
                                                                    <div style={{ fontSize: 11, color: '#8b90a0', marginTop: 2 }}>
                                                                        {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                                                                    </div>
                                                                </div>
                                                                {conflictIds.has(s.id) && (
                                                                    <span className="fd-badge-status fd-badge-conflict">CONFLICT</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Booking summary */}
                                        <div className="fd-card">
                                            <div className="fd-card-title">Booking breakdown</div>
                                            <div style={{ marginBottom: 20 }}>
                                                <div className="fd-progress-row">
                                                    <div className="fd-progress-label" style={{ fontSize: 12, color: '#8b90a0' }}>Confirmed</div>
                                                    <div className="fd-progress-bar"><div className="fd-progress-fill" style={{ width: `${utilizationPct}%`, background: '#3ecf8e' }} /></div>
                                                    <div className="fd-progress-val">{bookedSlots.length}</div>
                                                </div>
                                                <div className="fd-progress-row">
                                                    <div className="fd-progress-label" style={{ fontSize: 12, color: '#8b90a0' }}>Open</div>
                                                    <div className="fd-progress-bar"><div className="fd-progress-fill" style={{ width: slots.length > 0 ? `${Math.round((pendingSlots.length / slots.length) * 100)}%` : '0%', background: '#6c8fff' }} /></div>
                                                    <div className="fd-progress-val">{pendingSlots.length}</div>
                                                </div>
                                                <div className="fd-progress-row">
                                                    <div className="fd-progress-label" style={{ fontSize: 12, color: '#8b90a0' }}>Conflicts</div>
                                                    <div className="fd-progress-bar"><div className="fd-progress-fill" style={{ width: slots.length > 0 ? `${Math.round((conflictSlots.length / slots.length) * 100)}%` : '0%', background: '#f06060' }} /></div>
                                                    <div className="fd-progress-val">{conflictSlots.length}</div>
                                                </div>
                                            </div>
                                            <div style={{ borderTop: '1px solid #2a2e38', paddingTop: 14 }}>
                                                <div style={{ fontSize: 12, color: '#8b90a0', marginBottom: 8 }}>Recent bookings</div>
                                                {bookedSlots.length === 0 ? (
                                                    <div style={{ fontSize: 12, color: '#555b6e' }}>No bookings yet</div>
                                                ) : bookedSlots.slice(0, 3).map(s => (
                                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                        <div style={{ fontSize: 12, color: '#e8eaf0' }}>{s.client_name || 'Client'}</div>
                                                        <div style={{ fontSize: 11, color: '#555b6e', fontFamily: "'DM Mono', monospace" }}>
                                                            {fmtDate(s.booking_date)} · {fmtTime(s.start_time)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Server stats: Week hours + Monthly bookings ── */}
                                    {stats && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginTop: 2 }}>
                                            {/* Week hours card */}
                                            <div className="fd-card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div className="fd-card-title">This week</div>
                                                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 32, fontWeight: 700, color: '#6c8fff' }}>
                                                    {stats.weekHours || 0}
                                                    <span style={{ fontSize: 14, color: '#555b6e', marginLeft: 6 }}>hrs</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#8b90a0' }}>scheduled this week</div>
                                                <div style={{ marginTop: 8, fontSize: 12, color: '#555b6e' }}>
                                                    <span style={{ color: '#e8eaf0', fontWeight: 500 }}>
                                                        {stats.monthStats?.this_month_booked || 0}
                                                    </span> booked this month
                                                </div>
                                            </div>

                                            {/* Monthly bookings bar chart */}
                                            <div className="fd-card">
                                                <div className="fd-card-title">Monthly bookings — {new Date().getFullYear()}</div>
                                                {(!stats.monthlyBookings || stats.monthlyBookings.length === 0) ? (
                                                    <div className="fd-empty">No booking history yet</div>
                                                ) : (() => {
                                                    const maxCount = Math.max(...stats.monthlyBookings.map(m => m.booking_count));
                                                    return stats.monthlyBookings.map(m => (
                                                        <div key={m.month} className="fd-progress-row">
                                                            <div className="fd-progress-label">{m.month_name?.substring(0,3)}</div>
                                                            <div className="fd-progress-bar">
                                                                <div className="fd-progress-fill" style={{
                                                                    width: `${Math.round((m.booking_count / maxCount) * 100)}%`,
                                                                    background: 'linear-gradient(90deg, #6c8fff, #a78bfa)'
                                                                }} />
                                                            </div>
                                                            <div className="fd-progress-val">{m.booking_count}</div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── SCHEDULE TAB ─────────────────────────── */}
                    {tab === 'schedule' && (
                        <div className="fd-page">
                            {conflictSlots.length > 0 && (
                                <div className="fd-conflict-alert">
                                    <div>
                                        <div style={{ fontSize: 13, color: '#f06060', fontWeight: 500, marginBottom: 3 }}>
                                            {conflictSlots.length} conflict{conflictSlots.length !== 1 ? 's' : ''} detected
                                        </div>
                                        <div style={{ fontSize: 12, color: '#8b90a0' }}>Overlapping time slots — remove one to resolve.</div>
                                    </div>
                                </div>
                            )}
                            <div className="fd-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                                    <div className="fd-card-title" style={{ marginBottom: 0 }}>This week</div>
                                </div>
                                <div className="fd-week-grid">
                                    <div />
                                    {weekDates.map((d, i) => {
                                        const isToday = d === todayStr;
                                        const dayLabels = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
                                        return (
                                            <div key={d} className={`fd-week-header ${isToday ? 'today' : ''}`}>
                                                {dayLabels[i]}<br />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: isToday ? '#6c8fff' : '#e8eaf0' }}>
                                                    {new Date(d + 'T12:00:00').getDate()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {['9am','11am','1pm','3pm','5pm'].map(timeLabel => (
                                        <React.Fragment key={timeLabel}>
                                            <div className="fd-week-time">{timeLabel}</div>
                                            {weekDates.map(d => {
                                                const daySlots = weekSlots(d);
                                                const hour = parseInt(timeLabel);
                                                const relevant = daySlots.filter(s => {
                                                    const h = parseInt(s.start_time?.split(':')[0] || '0');
                                                    return h >= hour && h < hour + 2;
                                                });
                                                return (
                                                    <div key={d}>
                                                        {relevant.map(s => {
                                                            const c = slotColor(s);
                                                            return (
                                                                <div key={s.id} className="fd-week-slot" style={{ background: c.bg, borderLeftColor: c.border, color: c.text }}>
                                                                    {conflictIds.has(s.id) ? '⚠ ' : ''}{fmtTime(s.start_time)} {s.is_booked ? `· ${s.client_name?.split(' ')[0] || 'Booked'}` : '· Open'}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── BOOKINGS TAB ─────────────────────────── */}
                    {tab === 'bookings' && (
                        <div className="fd-page">
                            <div className="fd-filters">
                                {[
                                    { id: 'all', label: `All (${slots.length})` },
                                    { id: 'booked', label: `Confirmed (${bookedSlots.length})` },
                                    { id: 'available', label: `Open (${pendingSlots.length})` },
                                    { id: 'conflict', label: `Conflicts (${conflictSlots.length})` },
                                ].map(f => (
                                    <button key={f.id} className={`fd-filter-btn ${bookingFilter === f.id ? 'active' : ''}`} onClick={() => setBookingFilter(f.id)}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <div className="fd-card" style={{ padding: 0 }}>
                                {filteredSlots.length === 0 ? (
                                    <div className="fd-empty">No slots in this category</div>
                                ) : (
                                    <table className="fd-table">
                                        <thead>
                                            <tr>
                                                <th>DATE</th>
                                                <th>TIME</th>
                                                <th>CLIENT</th>
                                                <th>STATUS</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSlots.map(s => {
                                                const isConflict = conflictIds.has(s.id);
                                                return (
                                                    <tr key={s.id}>
                                                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{fmtDate(s.booking_date)}</td>
                                                        <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</td>
                                                        <td style={{ color: s.client_name ? '#e8eaf0' : '#555b6e' }}>{s.client_name || '—'}</td>
                                                        <td>
                                                            <span className={`fd-badge-status ${isConflict ? 'fd-badge-conflict' : s.is_booked ? 'fd-badge-confirmed' : 'fd-badge-available'}`}>
                                                                {isConflict ? 'CONFLICT' : s.is_booked ? 'CONFIRMED' : 'OPEN'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {s.is_booked ? (
                                                                <button className="fd-del-btn" style={{color: '#f06060', borderColor: 'rgba(240, 96, 96, 0.2)', background: 'rgba(240, 96, 96, 0.05)'}} onClick={() => handleReject(s.id, s.client_name)}>Reject</button>
                                                            ) : (
                                                                <button className="fd-del-btn" onClick={() => handleDelete(s.id)}>Remove</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── ADD SLOT TAB ─────────────────────────── */}
                    {tab === 'add' && (
                        <div className="fd-page">
                            <div className="fd-card" style={{ marginBottom: 20 }}>
                                <div className="fd-card-title">Add availability slot</div>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                    <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input type="radio" checked={slotMode === 'single'} onChange={() => setSlotMode('single')} /> Single Slot
                                    </label>
                                    <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input type="radio" checked={slotMode === 'bulk'} onChange={() => setSlotMode('bulk')} /> Bulk Generate
                                    </label>
                                    <label style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input type="radio" checked={slotMode === 'manual'} onChange={() => setSlotMode('manual')} /> Manual Book
                                    </label>
                                </div>
                                {formMsg.text && (
                                    <div className={formMsg.type === 'err' ? 'fd-inline-err' : 'fd-inline-ok'}>
                                        {formMsg.text}
                                    </div>
                                )}
                                <form onSubmit={handleAddSlot}>
                                    <div className="fd-form-grid" style={{ gridTemplateColumns: slotMode === 'manual' ? '1fr 1fr' : (slotMode === 'bulk' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr') }}>
                                        <div className="fd-field">
                                            <label>Date</label>
                                            <input type="date" required value={formData.booking_date}
                                                onChange={e => setFormData({ ...formData, booking_date: e.target.value })} />
                                        </div>
                                        <div className="fd-field">
                                            <label>{slotMode === 'bulk' ? 'Start Range' : 'Start time'}</label>
                                            <input type="time" required value={formData.start_time}
                                                onChange={e => setFormData({ ...formData, start_time: e.target.value })} />
                                        </div>
                                        <div className="fd-field">
                                            <label>{slotMode === 'bulk' ? 'End Range' : 'End time'}</label>
                                            <input type="time" required value={formData.end_time}
                                                onChange={e => setFormData({ ...formData, end_time: e.target.value })} />
                                        </div>
                                        {slotMode === 'bulk' && (
                                            <div className="fd-field">
                                                <label>Duration (mins)</label>
                                                <select value={formData.session_duration} onChange={e => setFormData({ ...formData, session_duration: e.target.value })}>
                                                    <option value="15">15 min</option>
                                                    <option value="30">30 min</option>
                                                    <option value="45">45 min</option>
                                                    <option value="60">60 min</option>
                                                    <option value="90">90 min</option>
                                                    <option value="120">120 min</option>
                                                </select>
                                            </div>
                                        )}
                                        {slotMode === 'manual' && (
                                            <>
                                                <div className="fd-field">
                                                    <label>Client Name</label>
                                                    <input type="text" required value={formData.client_name} onChange={e => setFormData({...formData, client_name: e.target.value})} placeholder="John Doe" />
                                                </div>
                                                <div className="fd-field">
                                                    <label>Client Email</label>
                                                    <input type="email" required value={formData.client_email} onChange={e => setFormData({...formData, client_email: e.target.value})} placeholder="john@example.com" />
                                                </div>
                                            </>
                                        )}
                                        <button className="fd-add-btn" type="submit" disabled={adding} style={{ gridColumn: '1 / -1' }}>
                                            {adding ? 'Saving...' : (slotMode === 'bulk' ? '⚡ Generate Slots' : slotMode === 'manual' ? '📅 Book Client Now' : '+ Add & Sync')}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="fd-card">
                                <div className="fd-card-title">All scheduled slots</div>
                                {loading ? <div className="fd-empty">Loading...</div> : slots.length === 0 ? (
                                    <div className="fd-empty">No slots yet — add one above</div>
                                ) : (
                                    <table className="fd-table">
                                        <thead>
                                            <tr><th>DATE</th><th>DAY</th><th>TIME</th><th>STATUS</th><th /></tr>
                                        </thead>
                                        <tbody>
                                            {slots.map(s => (
                                                <tr key={s.id}>
                                                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{fmtDate(s.booking_date)}</td>
                                                    <td style={{ color: '#8b90a0' }}>{s.day_of_week}</td>
                                                    <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</td>
                                                    <td>
                                                        <span className={`fd-badge-status ${conflictIds.has(s.id) ? 'fd-badge-conflict' : s.is_booked ? 'fd-badge-confirmed' : 'fd-badge-available'}`}>
                                                            {conflictIds.has(s.id) ? 'CONFLICT' : s.is_booked ? 'BOOKED' : 'OPEN'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {s.is_booked ? (
                                                            <button className="fd-del-btn" style={{color: '#f06060', borderColor: 'rgba(240, 96, 96, 0.2)', background: 'rgba(240, 96, 96, 0.05)'}} onClick={() => handleReject(s.id, s.client_name)}>Reject</button>
                                                        ) : (
                                                            <button className="fd-del-btn" onClick={() => handleDelete(s.id)}>Remove</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="fd-card" style={{ width: '100%', maxWidth: 400, margin: 20 }}>
                        <div className="fd-card-title">Edit Public Profile</div>
                        <div style={{ fontSize: 13, color: '#8b90a0', marginBottom: 20 }}>
                            These details will appear on your public booking page.
                        </div>
                        <form onSubmit={handleSaveProfile}>
                            <div className="fd-field">
                                <label>Job Title / Headline</label>
                                <input type="text" placeholder="e.g. Senior UX Designer" value={profileForm.title} onChange={e => setProfileForm({...profileForm, title: e.target.value})} />
                            </div>
                            <div className="fd-field">
                                <label>Bio</label>
                                <textarea rows="4" placeholder="Tell clients a bit about yourself..." style={{ width: '100%', padding: '10px 12px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 8, color: 'var(--c-text)', fontSize: 13, fontFamily: "'Syne', sans-serif" }} value={profileForm.bio} onChange={e => setProfileForm({...profileForm, bio: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button type="button" className="fd-del-btn" style={{ flex: 1 }} onClick={() => setShowProfileModal(false)}>Cancel</button>
                                <button type="submit" className="fd-add-btn" style={{ flex: 1, margin: 0 }} disabled={savingProfile}>
                                    {savingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default FreelancerDashboard;
