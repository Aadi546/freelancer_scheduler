import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    fetchBookings, fetchAllBookings, fetchStats, fetchFinancials,
    addAvailability, deleteAvailability, createBulkAvailability, 
    toggleAvailability, approveMeeting, declineMeeting, manualBooking 
} from '../api';

const FreelancerDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Freelancer' };
    const [bookings, setBookings] = useState([]);
    const [allHistory, setAllHistory] = useState([]);
    const [availability, setAvailability] = useState([]);
    const [stats, setStats] = useState({ total_hours: 0, pending_requests: 0 });
    const [financials, setFinancials] = useState({ total_confirmed_hours: 0, total_earnings: 0 });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview'); // overview | availability | bookings | requests

    // Form states
    const [newSlot, setNewSlot] = useState({ date: '', start: '', end: '' });
    const [bulk, setBulk] = useState({ startDate: '', endDate: '', startTime: '', endTime: '', days: [] });
    const [manual, setManual] = useState({ client_name: '', client_email: '', date: '', start: '', end: '' });

    const loadData = async () => {
        try {
            const [bRes, hRes, sRes, fRes] = await Promise.all([
                fetchBookings(),
                fetchAllBookings(),
                fetchStats(),
                fetchFinancials().catch(() => ({ data: { total_earnings: 0, total_confirmed_hours: 0 } }))
            ]);
            
            setBookings(bRes.data || []);
            setAllHistory(hRes.data || []);
            setAvailability(hRes.data?.availability || []);
            setStats(sRes.data || { total_hours: 0, pending_requests: 0 });
            setFinancials(fRes.data || { total_earnings: 0, total_confirmed_hours: 0 });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddSlot = async (e) => {
        e.preventDefault();
        try {
            await addAvailability({ booking_date: newSlot.date, start_time: newSlot.start, end_time: newSlot.end });
            setNewSlot({ date: '', start: '', end: '' });
            loadData();
        } catch (err) { alert(err.response?.data?.error || 'Failed to add slot'); }
    };

    const handleBulkAdd = async (e) => {
        e.preventDefault();
        try {
            await createBulkAvailability(bulk);
            setBulk({ startDate: '', endDate: '', startTime: '', endTime: '', days: [] });
            loadData();
        } catch (err) { alert(err.response?.data?.error || 'Bulk add failed'); }
    };

    const handleDeleteSlot = async (id) => {
        if (!window.confirm('Delete this slot?')) return;
        try { await deleteAvailability(id); loadData(); } catch (err) { alert('Delete failed'); }
    };

    const handleManualBooking = async (e) => {
        e.preventDefault();
        try {
            await manualBooking(manual);
            setManual({ client_name: '', client_email: '', date: '', start: '', end: '' });
            loadData();
        } catch (err) { alert(err.response?.data?.error || 'Manual booking failed'); }
    };

    const handleApprove = async (id) => {
        try {
            await approveMeeting(id);
            loadData();
        } catch (err) { alert('Approval failed'); }
    };

    const handleDecline = async (id) => {
        const reason = window.prompt('Reason for declining (optional):');
        try {
            await declineMeeting(id, { reason });
            loadData();
        } catch (err) { alert('Decline failed'); }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
    const fmtTime = (t) => t ? t.substring(0, 5) : '';

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-dark-950">
            <div className="text-accent-500 animate-pulse font-bold tracking-widest uppercase">Initializing Dashboard...</div>
        </div>
    );

    const pendingRequests = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

    return (
        <div className="min-h-screen bg-dark-950 flex flex-col md:flex-row font-syne text-slate-200">
            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-dark-900 border-r border-white/5 flex flex-col h-screen sticky top-0 p-8 z-50">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/20">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white"/></svg>
                    </div>
                    <span className="font-bold text-white tracking-tight text-lg uppercase tracking-widest">FreelanceOS</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {[
                        { id: 'overview', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Overview' },
                        { id: 'availability', icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', label: 'Availability' },
                        { id: 'bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z', label: 'Bookings' },
                        { id: 'requests', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9', label: 'Requests', count: pendingRequests.length },
                    ].map(item => (
                        <button 
                            key={item.id}
                            onClick={() => setTab(item.id)}
                            className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-standard group ${tab === item.id ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d={item.icon}/></svg>
                                <span className="text-sm font-bold tracking-wide">{item.label}</span>
                            </div>
                            {item.count > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${tab === item.id ? 'bg-white text-accent-500' : 'bg-red-500 text-white animate-pulse'}`}>{item.count}</span>}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-white/5 space-y-4">
                    <Link to="/settings" className="flex items-center gap-3 p-3.5 text-slate-500 hover:text-white transition-standard group">
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                        <span className="text-sm font-bold tracking-wide">Settings</span>
                    </Link>
                    <button 
                        onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}
                        className="w-full flex items-center gap-3 p-3.5 text-slate-500 hover:text-red-400 transition-standard group"
                    >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        <span className="text-sm font-bold tracking-wide">Logout</span>
                    </button>
                    <div className="pt-4 flex items-center gap-3 text-xs">
                        <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center font-black text-slate-400">{user.name.substring(0,2).toUpperCase()}</div>
                        <div className="flex-1 overflow-hidden">
                            <div className="text-white font-bold truncate">{user.name}</div>
                            <div className="text-slate-600 truncate">{user.email}</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 md:p-12 overflow-y-auto max-h-screen custom-scrollbar">
                {tab === 'overview' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <section>
                            <h2 className="text-3xl font-bold text-white mb-2">Workspace Overview</h2>
                            <p className="text-slate-500 mb-8 font-medium">Tracking your performance and core platform metrics.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="glass-card p-6 border-l-4 border-l-accent-500">
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Confirmed</div>
                                    <div className="text-3xl font-bold text-white font-mono">{financials.total_confirmed_hours || 0} hrs</div>
                                </div>
                                <div className="glass-card p-6 border-l-4 border-l-emerald-500">
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Earnings</div>
                                    <div className="text-3xl font-bold text-white font-mono">${financials.total_earnings || 0}</div>
                                </div>
                                <div className="glass-card p-6 border-l-4 border-l-amber-500">
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Total Availability</div>
                                    <div className="text-3xl font-bold text-white font-mono">{stats.total_hours || 0} hrs</div>
                                </div>
                                <div className="glass-card p-6 border-l-4 border-l-violet-500">
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Hourly Rate</div>
                                    <div className="text-3xl font-bold text-white font-mono">${user.hourly_rate || 0}</div>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white tracking-tight">Recent Sessions</h3>
                                    <button onClick={() => setTab('bookings')} className="text-xs font-bold text-accent-500 hover:text-white transition-standard uppercase tracking-widest">View All</button>
                                </div>
                                <div className="space-y-4">
                                    {confirmedBookings.length === 0 ? (
                                        <div className="p-12 text-center glass border-dashed text-slate-600 text-sm italic">No confirmed sessions yet.</div>
                                    ) : (
                                        confirmedBookings.slice(0, 4).map(b => (
                                            <div key={b.id} className="p-4 glass rounded-2xl flex items-center justify-between group hover:bg-white/[0.02] transition-standard">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-white font-bold text-sm shadow-inner uppercase">
                                                        {b.client_name?.substring(0,2)}
                                                    </div>
                                                    <div>
                                                        <div className="text-white font-bold text-sm">{b.client_name}</div>
                                                        <div className="text-[10px] font-mono text-slate-600">{fmtDate(b.booking_date)} • {fmtTime(b.start_time)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-white tracking-tight">Public Presence</h3>
                                    <button onClick={() => toggleAvailability().then(loadData)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-slate-400 transition-standard uppercase tracking-widest border border-white/5">Toggle Visibility</button>
                                </div>
                                <div className="glass-card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-accent-500/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 bg-accent-500 rounded-bl-3xl">
                                        <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 0-9-9c0 1.48.35 2.89 1 4.13L3 21l4.87-1c1.24.65 2.65 1 4.13 1z"/></svg>
                                    </div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 rounded-2xl bg-dark-700 p-0.5 overflow-hidden shadow-2xl border border-white/10">
                                            <div className="w-full h-full bg-gradient-to-tr from-accent-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white">
                                                {user.name.substring(0,2).toUpperCase()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-xl">{user.name}</div>
                                            <div className="text-accent-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                                                Public & Active
                                            </div>
                                        </div>
                                    </div>
                                    <Link to={`/book/${user.id}`} target="_blank" className="block w-full py-3 bg-white text-dark-950 text-center rounded-xl font-bold text-sm hover:bg-slate-200 transition-standard shadow-xl shadow-white/5">
                                        Open Booking Page
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {tab === 'availability' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header>
                            <h2 className="text-3xl font-bold text-white mb-2">Schedule Management</h2>
                            <p className="text-slate-500 font-medium">Add, manage, and batch-create your public availability slots.</p>
                        </header>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* Single Slot Add */}
                            <div className="glass-card p-8">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] mb-8">Add Quick Slot</h3>
                                <form onSubmit={handleAddSlot} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase">Select Date</label>
                                        <input type="date" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-standard" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase">StartTime</label>
                                            <input type="time" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-standard" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase">EndTime</label>
                                            <input type="time" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-500/50 transition-standard" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-accent-500/20 active:scale-[0.98] transition-standard">Add to Schedule</button>
                                </form>
                            </div>

                            {/* Bulk Creation */}
                            <div className="glass-card p-8">
                                <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] mb-8">Bulk Generator</h3>
                                <form onSubmit={handleBulkAdd} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="date" placeholder="Start Date" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 transition-standard" value={bulk.startDate} onChange={e => setBulk({...bulk, startDate: e.target.value})} title="Start Date" />
                                        <input type="date" placeholder="End Date" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 transition-standard" value={bulk.endDate} onChange={e => setBulk({...bulk, endDate: e.target.value})} title="End Date" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="time" title="StartTime" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 transition-standard" value={bulk.startTime} onChange={e => setBulk({...bulk, startTime: e.target.value})} />
                                        <input type="time" title="EndTime" required className="w-full bg-dark-800/50 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 transition-standard" value={bulk.endTime} onChange={e => setBulk({...bulk, endTime: e.target.value})} />
                                    </div>
                                    <div className="flex flex-wrap gap-2 py-4">
                                        {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                                            <button 
                                                key={d} type="button" 
                                                onClick={() => setBulk({...bulk, days: bulk.days.includes(d) ? bulk.days.filter(x => x !== d) : [...bulk.days, d]})}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-standard border ${bulk.days.includes(d) ? 'bg-accent-500 border-accent-500 text-white shadow-lg' : 'bg-dark-800 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {d.substring(0,3)}
                                            </button>
                                        ))}
                                    </div>
                                    <button type="submit" className="w-full py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold text-xs border border-white/5 transition-standard">Generate Batch Slots</button>
                                </form>
                            </div>
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-white mb-6">Open Slots</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {availability.length === 0 ? (
                                    <div className="md:col-span-4 p-20 text-center glass border-dashed text-slate-500 italic">No open slots available. Start by adding one above.</div>
                                ) : (
                                    availability.map(s => (
                                        <div key={s.id} className="p-4 glass rounded-2xl group hover:border-red-500/20 transition-standard relative overflow-hidden">
                                            <div className="text-[10px] font-black text-slate-600 uppercase mb-2">{fmtDate(s.booking_date)}</div>
                                            <div className="text-white font-bold font-mono">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</div>
                                            <button 
                                                onClick={() => handleDeleteSlot(s.id)}
                                                className="absolute top-2 right-2 p-1.5 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-standard"
                                            >
                                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {tab === 'bookings' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">Confirmed Engagements</h2>
                                <p className="text-slate-500 font-medium tracking-tight">Accessing full history and upcoming confirmed client sessions.</p>
                            </div>
                            <div className="glass-card px-4 py-2 flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-tighter">Capacity</div>
                                    <div className="text-sm font-bold text-white">{confirmedBookings.length} Active</div>
                                </div>
                                <div className="h-8 w-px bg-white/5" />
                                <div className="text-center font-bold text-emerald-500 font-mono text-sm">${financials.total_earnings} Ready</div>
                            </div>
                        </header>

                        <div className="space-y-4">
                            {confirmedBookings.length === 0 ? (
                                <div className="py-32 text-center glass border-dashed">
                                    <div className="text-5xl mb-6 opacity-10">🗓️</div>
                                    <div className="text-slate-500 font-medium">No confirmed bookings on record.</div>
                                </div>
                            ) : (
                                confirmedBookings.map(b => (
                                    <div key={b.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-standard group">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-dark-700 flex items-center justify-center border border-white/5 shadow-inner">
                                                <div className="text-lg font-bold text-white uppercase">{b.client_name?.substring(0,2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-lg leading-tight mb-1">{b.client_name}</div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span className="font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</span>
                                                    <span>{fmtDate(b.booking_date)}</span>
                                                    <span className="text-slate-700">{b.client_email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right mr-4 hidden sm:block">
                                                <div className="text-xs font-bold text-white">Confirmed</div>
                                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mt-1">SaaS Contracted</div>
                                            </div>
                                            <button onClick={() => handleDecline(b.id)} className="p-3 text-slate-700 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-standard border border-transparent hover:border-red-500/10 opacity-0 group-hover:opacity-100">
                                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {tab === 'requests' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header>
                            <h2 className="text-3xl font-bold text-white mb-2">Pending Proposals</h2>
                            <p className="text-slate-500 font-medium tracking-tight">Review and manage client-initiated session requests.</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {pendingRequests.length === 0 ? (
                                <div className="md:col-span-2 py-32 text-center glass border-dashed">
                                    <div className="text-5xl mb-6 opacity-10">🔔</div>
                                    <div className="text-slate-500 font-medium">All clear! No pending requests at the moment.</div>
                                </div>
                            ) : (
                                pendingRequests.map(b => (
                                    <div key={b.id} className="glass-card p-8 flex flex-col border-amber-500/10 hover:border-amber-500/30 transition-standard relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 bg-amber-500/10 rounded-bl-2xl">
                                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">New</div>
                                        </div>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-14 h-14 rounded-2xl bg-dark-700 flex items-center justify-center text-xl font-bold text-white shadow-2xl border border-white/5">
                                                {b.client_name?.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-lg mb-0.5">{b.client_name}</div>
                                                <div className="text-slate-500 text-xs truncate max-w-[200px]">{b.client_email}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-2xl mb-8 flex justify-between items-center">
                                            <div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1 font-mono">Proposed Slot</div>
                                                <div className="text-white font-bold text-sm tracking-tight">{fmtDate(b.booking_date)}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1 font-mono">Proposed Time</div>
                                                <div className="text-accent-500 font-bold text-sm font-mono">{fmtTime(b.start_time)} – {fmtTime(b.end_time)}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-auto">
                                            <button 
                                                onClick={() => handleDecline(b.id)}
                                                className="flex-1 py-3.5 bg-dark-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl font-bold text-xs border border-white/5 transition-standard"
                                            >
                                                Decline
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(b.id)}
                                                className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition-standard active:scale-[0.98]"
                                            >
                                                Approve Session
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FreelancerDashboard;
