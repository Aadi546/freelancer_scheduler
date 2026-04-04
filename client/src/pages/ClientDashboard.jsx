import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    fetchClientBookings, cancelBooking, fetchMyFreelancers, 
    fetchAvailability, requestMeeting, fetchDirectory, chatWithAI 
} from '../api';

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

    // AI Assistant State
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { role: 'ai', text: `Hello ${user.name.split(' ')[0]}! I've analyzed your schedule. You have ${bookings.filter(b => b.status === 'confirmed').length} confirmed sessions. How can I help you today?` }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [aiTyping, setAiTyping] = useState(false);

    const loadData = async () => {
        try {
            const [bRes, fRes, dRes] = await Promise.all([
                fetchClientBookings(),
                fetchMyFreelancers(),
                fetchDirectory().catch(() => ({ data: [] }))
            ]);
            setBookings(bRes.data || []);
            setFreelancers(fRes.data || []);
            setDirectory((dRes.data || []).filter(f => f.email !== user.email));
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

    const handleConfirmRequest = async () => {
        if (!bookingSlot) return;
        try {
            await requestMeeting({ 
                freelancer_id: selectedFreelancer.id, 
                booking_date: bookingSlot.booking_date,
                start_time: bookingSlot.start_time,
                end_time: bookingSlot.end_time
            });
            alert('Meeting request sent! Wait for freelancer approval.');
            setSelectedFreelancer(null);
            await loadData();
        } catch (err) {
            setBookingError(err.response?.data?.error || 'Request failed.');
        }
    };

    const handleSendChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || aiTyping) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setChatInput('');
        setAiTyping(true);

        try {
            const { data } = await chatWithAI({ message: userMsg });
            setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setAiTyping(false);
        }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '';
    const fmtTime = (t) => t ? t.substring(0, 5) : '';
    const getInitials = (name) => name?.substring(0, 2).toUpperCase() || '??';

    const upcoming = bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending') && new Date(b.booking_date) >= new Date(new Date().setHours(0,0,0,0)));
    const history = bookings.filter(b => !upcoming.includes(b));

    const activeList = tab === 'upcoming' ? upcoming : tab === 'history' ? history : [];

    return (
        <div className="min-h-screen bg-dark-950 text-slate-200 font-syne">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white"/></svg>
                    </div>
                    <span className="font-bold text-white tracking-tight hidden md:block text-sm uppercase tracking-widest">Client Portal</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <Link to="/settings" className="text-xs text-slate-400 hover:text-white transition-standard uppercase tracking-widest font-bold">Settings</Link>
                    <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-white">{user.name}</div>
                            <div className="text-[10px] text-accent-500 uppercase font-bold tracking-tighter">Premium Client</div>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden border border-white/10">
                            {getInitials(user.name)}
                        </div>
                        <button 
                            onClick={() => { localStorage.clear(); window.location.href = '/auth'; }}
                            className="p-2 text-slate-500 hover:text-red-400 transition-standard"
                            title="Logout"
                        >
                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-3">Hello, {user.name.split(' ')[0]}</h1>
                    <p className="text-slate-400 max-w-xl">Manage your active sessions, discover top talent, and keep your projects moving forward.</p>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="glass-card p-6 flex items-center justify-between group hover:border-accent-500/30 transition-standard">
                        <div>
                            <div className="text-3xl font-bold text-white font-mono mb-1">{upcoming.length}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Active Sessions</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500 group-hover:scale-110 transition-standard">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center justify-between group hover:border-emerald-500/30 transition-standard">
                        <div>
                            <div className="text-3xl font-bold text-white font-mono mb-1">{bookings.length}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Completed Jobs</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-standard">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                    </div>
                    <div className="glass-card p-6 flex items-center justify-between group hover:border-violet-500/30 transition-standard">
                        <div>
                            <div className="text-3xl font-bold text-white font-mono mb-1">{freelancers.length}</div>
                            <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Professionals</div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-standard">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex gap-8 border-b border-white/5 mb-10 overflow-x-auto">
                    {['upcoming', 'history', 'professionals', 'directory'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setTab(t)}
                            className={`pb-4 px-1 text-sm font-bold uppercase tracking-[0.2em] transition-standard whitespace-nowrap relative ${tab === t ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {t}
                            {tab === t && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-accent-500 shadow-[0_0_8px_#6c8fff]" />}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-20 text-center animate-pulse text-slate-500 italic">Synchronizing workspace...</div>
                ) : tab === 'directory' || tab === 'professionals' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {(tab === 'directory' ? directory : freelancers).map(f => (
                            <div key={f.id} className="glass-card p-6 flex flex-col group hover:border-white/10 transition-standard">
                                <div className="flex items-start gap-4 mb-5">
                                    <div className="w-14 h-14 rounded-2xl bg-dark-700 flex items-center justify-center text-lg font-bold text-white border border-white/5 overflow-hidden shadow-inner">
                                        {f.avatar_url ? (
                                            <img src={f.avatar_url} alt={f.name} className="w-full h-full object-cover" />
                                        ) : getInitials(f.name)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-lg mb-0.5">{f.name}</div>
                                        <div className="text-accent-500 text-xs font-bold uppercase tracking-tighter">{f.title || 'Expert Professional'}</div>
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed italic">
                                    "{f.bio || 'Available for strategic consulting and custom development projects.'}"
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-8">
                                    {(f.skills || ['Node.js', 'React', 'Consulting']).slice(0, 3).map(s => (
                                        <span key={s} className="px-2 py-1 bg-dark-800 text-[10px] font-bold text-slate-500 rounded border border-white/5">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div className="text-white font-mono font-bold">${f.hourly_rate || '80'}<span className="text-[10px] text-slate-600 ml-1">/hr</span></div>
                                    <button 
                                        onClick={() => handleOpenBooking(f)}
                                        className="px-5 py-2.5 bg-white text-dark-950 font-bold text-xs rounded-lg hover:bg-slate-200 transition-standard shadow-lg"
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeList.length === 0 ? (
                            <div className="py-24 text-center glass-card border-dashed">
                                <div className="text-4xl mb-4 opacity-20">📭</div>
                                <div className="text-slate-500 font-medium">No session records found items here.</div>
                            </div>
                        ) : (
                            activeList.map(b => (
                                <div key={b.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-standard">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-dark-800 rounded-xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                                            <div className="text-[9px] uppercase font-black text-slate-600 tracking-tighter">
                                                {new Date(b.booking_date).toLocaleString('en-US', { month: 'short' })}
                                            </div>
                                            <div className="text-lg font-bold text-white leading-none">
                                                {new Date(b.booking_date).getDate()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-white font-bold text-lg mb-1">Session with {b.freelancer_name}</div>
                                            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                <span className="font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
                                                    {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                                                </span>
                                                <span className="w-1 h-1 bg-slate-800 rounded-full" />
                                                <span>{fmtDate(b.booking_date)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {b.status === 'pending' ? (
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.1)]">Pending Approval</span>
                                        ) : (
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.1)]">Confirmed</span>
                                        )}
                                        {tab === 'upcoming' && (
                                            <button 
                                                onClick={() => handleCancel(b.id)}
                                                className="p-2.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-standard border border-transparent hover:border-red-500/20"
                                            >
                                                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </main>

            {/* Booking Request Modal */}
            {selectedFreelancer && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm shadow-2xl" onClick={() => setSelectedFreelancer(null)} />
                    <div className="w-full max-w-lg glass-card relative z-10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 pb-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500 border border-accent-500/20">
                                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Request Session</h3>
                                    <p className="text-xs text-slate-500">Proposed meeting with {selectedFreelancer.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFreelancer(null)} className="text-slate-500 hover:text-white transition-standard text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-8">
                            {bookingError && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{bookingError}</div>}
                            
                            <div className="mb-8">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Available Slots</label>
                                {loadingSlots ? (
                                    <div className="py-12 text-center text-slate-500 animate-pulse italic">Scanning availability...</div>
                                ) : freelancerSlots.length === 0 ? (
                                    <div className="py-12 text-center glass bg-dark-800/40 rounded-2xl border-dashed">
                                        <div className="text-2xl mb-2 opacity-50">📵</div>
                                        <div className="text-xs text-slate-500 px-10">This professional has no public availability listed. Please try again later.</div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {freelancerSlots.map(s => (
                                            <button 
                                                key={s.id} 
                                                onClick={() => setBookingSlot(s)}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-standard group ${bookingSlot?.id === s.id ? 'bg-accent-500/10 border-accent-500 shadow-[0_0_15px_rgba(108,143,255,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                                            >
                                                <div className="text-left">
                                                    <div className={`text-sm font-bold transition-standard ${bookingSlot?.id === s.id ? 'text-white' : 'text-slate-300'}`}>{fmtDate(s.booking_date)}</div>
                                                    <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-standard ${bookingSlot?.id === s.id ? 'border-accent-500 bg-accent-500' : 'border-white/10'}`}>
                                                    {bookingSlot?.id === s.id && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setSelectedFreelancer(null)} className="flex-1 py-4 text-slate-400 font-bold text-sm bg-white/5 hover:bg-white/10 rounded-2xl transition-standard border border-transparent">Cancel</button>
                                <button 
                                    disabled={!bookingSlot}
                                    onClick={handleConfirmRequest}
                                    className="flex-[2] py-4 bg-accent-500 hover:bg-accent-600 text-white font-bold text-sm rounded-2xl transition-standard shadow-xl shadow-accent-500/20 disabled:opacity-30 disabled:shadow-none active:scale-[0.98]"
                                >
                                    Confirm Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Assistant Floating UI */}
            <div className="fixed bottom-6 right-6 z-50">
                {chatOpen && (
                    <div className="absolute bottom-full right-0 mb-4 w-80 glass-card p-0 shadow-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                </div>
                                <div className="font-bold text-white text-sm">FreelanceOS AI</div>
                            </div>
                            <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white">&times;</button>
                        </div>
                        
                        <div className="h-80 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-dark-900/50">
                            {chatMessages.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-sm ${m.role === 'user' ? 'bg-accent-500 text-white rounded-tr-none' : 'bg-dark-800 text-slate-300 border border-white/5 rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                            {aiTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-dark-800 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-dark-900">
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={chatInput}
                                    onChange={e => setChatInput(e.target.value)}
                                    placeholder="Ask anything..."
                                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-500 transition-standard pr-10"
                                />
                                <button type="submit" className="absolute right-2 top-1.5 p-1 text-accent-500 hover:text-white transition-standard">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                <button 
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 relative border border-white/20 active:scale-95 ${chatOpen ? 'bg-dark-800 rotate-90 border-white/10' : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/40 hover:scale-110'}`}
                >
                    {chatOpen ? (
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    ) : (
                        <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 0-9-9c0 1.48.35 2.89 1 4.13L3 21l4.87-1c1.24.65 2.65 1 4.13 1z"/><path d="M9 10h.01M15 10h.01M9 14.5c1.5 1 4.5 1 6 0"/></svg>
                    )}
                    {!chatOpen && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-dark-950 animate-pulse shadow-sm" />}
                </button>
            </div>
        </div>
    );
};

export default ClientDashboard;
