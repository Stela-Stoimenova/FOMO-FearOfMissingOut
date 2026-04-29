// Dashboard — shown after login, displays user info and quick links
// Will read real user data from context/auth state when backend is connected
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import { getMyTickets, deleteEvent } from "../api/events.js";
import { getLoyaltyBalance } from "../api/users.js";
import { getMyPurchasedMemberships } from "../api/studios.js";
import FollowListModal from "../components/FollowListModal.jsx";

function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [studioEvents, setStudioEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [myTickets, setMyTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [loyalty, setLoyalty] = useState(null);
    const [showList, setShowList] = useState(null); // 'followers' | 'following' | null
    const [myMemberships, setMyMemberships] = useState([]);
    const [loadingMemberships, setLoadingMemberships] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (user && (user.role === "STUDIO" || user.role === "AGENCY")) {
            loadStudioEvents();
        }
        if (user && user.role === "DANCER") {
            setLoadingTickets(true);
            getMyTickets()
                .then(data => setMyTickets(Array.isArray(data) ? data : []))
                .catch(() => { })
                .finally(() => setLoadingTickets(false));
            getLoyaltyBalance()
                .then(data => setLoyalty(data))
                .catch(() => { });
            setLoadingMemberships(true);
            getMyPurchasedMemberships()
                .then(data => setMyMemberships(Array.isArray(data) ? data : []))
                .catch(() => { })
                .finally(() => setLoadingMemberships(false));
        }
    }, [user]);

    function loadStudioEvents() {
        setLoadingEvents(true);
        // Pass creatorId so the backend filters — avoids client-side filtering on a paged list
        apiRequest(`/events?creatorId=${user.id}&limit=100`)
            .then(data => setStudioEvents(data.items ?? []))
            .catch(err => console.error("Failed to load studio events", err))
            .finally(() => setLoadingEvents(false));
    }

    async function handleDelete(id) {
        if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
        try {
            await deleteEvent(id);
            loadStudioEvents(); // Refresh list after delete
        } catch (err) {
            setErrorMsg(err.message || "Failed to delete event.");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    }

    if (!user) return null; // handled by ProtectedRoute, but safety first

    return (
        <main className="page">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} />
                ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {errorMsg && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--warning)', borderRadius: '16px', color: 'var(--warning)', marginBottom: '1.5rem', fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
                    {errorMsg}
                </div>
            )}

            <div className="dashboard-info">
                <p>Email: {user.email}</p>
                <p>Role: <span className="role-badge">{user.role}</span></p>

                {user._count && (
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                        <span onClick={() => setShowList('followers')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><strong style={{ color: 'var(--text-main)' }}>{user._count.followers}</strong> followers</span>
                        <span onClick={() => setShowList('following')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}><strong style={{ color: 'var(--text-main)' }}>{user._count.following}</strong> following</span>
                    </div>
                )}

                <FollowListModal
                    isOpen={!!showList}
                    onClose={() => setShowList(null)}
                    type={showList}
                    userId={user.id}
                />

                {user.role === "DANCER" && user.loyaltyAccount && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Loyalty Points Balance</span>
                            <strong style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>
                                {loyalty?.points ?? user.loyaltyAccount.points}
                            </strong>
                        </p>
                        <p className="hint" style={{ textAlign: 'left', marginTop: '0.25rem' }}>
                            Earn 5% points on every ticket purchase!
                        </p>

                        {/* Loyalty Tips */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
                            <h4 style={{ fontSize: '0.9rem', margin: '0 0 0.75rem 0', color: 'var(--accent)' }}>Ways to Use Your Points</h4>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                <li><strong>500 pts</strong> → 10% off your next ticket</li>
                                <li><strong>1000 pts</strong> → Free workshop entry</li>
                                <li><strong>2000 pts</strong> → VIP access at partner festivals</li>
                                <li><strong>5000 pts</strong> → Exclusive 1-on-1 masterclass session</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <div className="dashboard-actions">
                <Link to="/profile" className="action-card">
                    My Profile
                </Link>

                {/* DANCER actions */}
                {user.role === "DANCER" && (
                    <Link to="/my-tickets" className="action-card">
                        My Tickets
                    </Link>
                )}

                {/* STUDIO / AGENCY actions */}
                {(user.role === "STUDIO" || user.role === "AGENCY") && (
                    <Link to="/create-event" className="action-card">
                        Create Event
                    </Link>
                )}

                <Link to="/" className="action-card">
                    Browse Events
                </Link>
            </div>

            {/* DANCER — Recent Tickets */}
            {user.role === "DANCER" && (
                <section style={{ marginTop: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>My Recent Tickets</h2>
                    {loadingTickets ? (
                        <p className="hint">Loading tickets…</p>
                    ) : myTickets.length === 0 ? (
                        <div className="detail-item" style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No tickets yet. <Link to="/" style={{ color: 'var(--primary)' }}>Browse events</Link> to get started!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {myTickets.slice(0, 5).map(ticket => (
                                <Link key={ticket.id} to={`/events/${ticket.eventId}`} className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', transition: 'background 0.2s' }}>
                                    <div>
                                        <strong>{ticket.event?.title || `Event #${ticket.eventId}`}</strong>
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(ticket.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatPrice(ticket.priceCents)}</span>
                                </Link>
                            ))}
                            {myTickets.length > 5 && (
                                <Link to="/my-tickets" style={{ color: 'var(--primary)', fontSize: '0.9rem', textAlign: 'center' }}>View all {myTickets.length} tickets →</Link>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* STUDIO Analytics Section */}
            {(user.role === "STUDIO" || user.role === "AGENCY") && (() => {
                // ── computed analytics ─────────────────────────────────
                const totalTickets = studioEvents.reduce((s, e) => s + (e._count?.tickets ?? 0), 0);
                const grossRevenue = studioEvents.reduce((s, e) => s + (e._count?.tickets ?? 0) * e.priceCents, 0);
                const platformFee  = Math.round(grossRevenue * 0.1);
                const netEarnings  = grossRevenue - platformFee;

                const withFill = studioEvents.map(e => {
                    const sold = e._count?.tickets ?? 0;
                    const cap  = e.capacity ?? null;
                    const fill = cap ? Math.round((sold / cap) * 100) : null;
                    const gross = sold * e.priceCents;
                    const net   = gross - Math.round(gross * 0.1);
                    const upcoming = new Date(e.startAt) > new Date();
                    return { ...e, sold, cap, fill, gross, net, upcoming };
                });

                const ranked = [...withFill].sort((a, b) => b.sold - a.sold);
                const best   = ranked[0] ?? null;
                const worst  = ranked[ranked.length - 1] ?? null;
                const lowDemandUpcoming = withFill.filter(e => e.upcoming && (e.fill === null || e.fill < 30));

                const avgFill = (() => {
                    const capped = withFill.filter(e => e.fill !== null);
                    if (!capped.length) return null;
                    return Math.round(capped.reduce((s, e) => s + e.fill, 0) / capped.length);
                })();

                const kpis = [
                    { label: "Total Events",    value: studioEvents.length,       color: "var(--text-main)" },
                    { label: "Tickets Sold",    value: totalTickets,              color: "var(--accent)" },
                    { label: "Gross Revenue",   value: formatPrice(grossRevenue), color: "var(--text-main)" },
                    { label: "Platform Fee",    value: formatPrice(platformFee),  color: "var(--danger)" },
                    { label: "Net Earnings",    value: formatPrice(netEarnings),  color: "var(--success)" },
                    { label: "Avg Fill Rate",   value: avgFill !== null ? `${avgFill}%` : "N/A", color: "var(--warning)" },
                ];

                function recommendation(e) {
                    if (e.fill === null) return "Set a capacity to unlock fill-rate insights.";
                    if (e.fill >= 80) return "High demand — consider adding a second session or increasing capacity.";
                    if (e.fill >= 50) return "Good traction. A reminder post to your audience could push it higher.";
                    if (e.fill < 30 && e.upcoming) return "Low demand — consider a promotion, price adjustment, or targeted outreach.";
                    return "Monitor ticket sales as the date approaches.";
                }

                return (
                    <div style={{ marginTop: '4rem' }}>
                        <h2 style={{ marginBottom: '0.4rem' }}>Studio Analytics</h2>
                        <p className="subtitle" style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
                            Performance overview for your created events.
                        </p>

                        {loadingEvents ? (
                            <p className="hint">Loading data...</p>
                        ) : studioEvents.length === 0 ? (
                            <div style={{ padding: '2rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No events found. Create your first event to see analytics here.
                            </div>
                        ) : (<>

                            {/* Top 2-Column Section: My Events & KPIs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem', marginBottom: '3rem', alignItems: 'start' }}>
                                {/* Left: My Created Events */}
                                <div>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        My Created Events
                                        <Link to="/create-event" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>+ New Event</Link>
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {studioEvents.map(event => {
                                            const sold = event._count?.tickets ?? 0;
                                            return (
                                                <div key={event.id} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '0.75rem', alignItems: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }} className="event-list-item" onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                                                    {/* Thumbnail */}
                                                    <div style={{ width: '60px', height: '60px', borderRadius: 'var(--radius-sm)', background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--bg-input)', flexShrink: 0 }} />
                                                    
                                                    {/* Info */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h4>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                                                            {new Date(event.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • {event.location}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
                                                            {sold} ticket{sold !== 1 ? 's' : ''} sold • {formatPrice(event.priceCents)}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                                                        <Link to={`/events/${event.id}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--bg-input)', color: 'var(--text-main)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', textAlign: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}>View</Link>
                                                        <Link to={`/events/${event.id}/edit`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', textAlign: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-soft)'}>Edit</Link>
                                                        <button onClick={() => handleDelete(event.id)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}>Delete</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right: Analytics Summary */}
                                <div>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>Analytics Summary</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        {kpis.map(k => (
                                            <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                                                <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>{k.label}</span>
                                                <strong style={{ fontSize: '1.2rem', color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Best / Lowest Demand */}
                            {studioEvents.length > 1 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', fontWeight: 700 }}>Best Selling</span>
                                        <p style={{ margin: '0.4rem 0 0.2rem', fontWeight: 700, fontSize: '1rem' }}>{best.title}</p>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{best.sold} ticket{best.sold !== 1 ? 's' : ''} sold{best.fill !== null ? ` — ${best.fill}% full` : ''}</span>
                                    </div>
                                    <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--danger)', fontWeight: 700 }}>Lowest Demand</span>
                                        <p style={{ margin: '0.4rem 0 0.2rem', fontWeight: 700, fontSize: '1rem' }}>{worst.title}</p>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{worst.sold} ticket{worst.sold !== 1 ? 's' : ''} sold{worst.fill !== null ? ` — ${worst.fill}% full` : ''}</span>
                                    </div>
                                </div>
                            )}

                            {/* Low-demand upcoming events alert */}
                            {lowDemandUpcoming.length > 0 && (
                                <div style={{ marginBottom: '2rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', padding: '1.1rem 1.25rem' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warning)', fontWeight: 700 }}>Attention Required</span>
                                    <p style={{ marginTop: '0.4rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        {lowDemandUpcoming.length} upcoming event{lowDemandUpcoming.length !== 1 ? 's' : ''} with low ticket demand:{' '}
                                        <strong style={{ color: 'var(--text-main)' }}>{lowDemandUpcoming.map(e => e.title).join(', ')}</strong>.{' '}
                                        Consider running a promotion or adjusting the price.
                                    </p>
                                </div>
                            )}

                            {/* Per-event breakdown */}
                            <h3 style={{ marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Per-Event Breakdown</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {withFill.map(event => (
                                    <div key={event.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.2rem', fontSize: '1rem' }}>{event.title}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {new Date(event.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {event.upcoming
                                                        ? <span style={{ marginLeft: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>Upcoming</span>
                                                        : <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>Past</span>}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--success)' }}>{formatPrice(event.net)}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>net earnings</span>
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                                            {[
                                                { label: 'Tickets', value: `${event.sold}${event.cap ? ` / ${event.cap}` : ''}` },
                                                { label: 'Fill Rate', value: event.fill !== null ? `${event.fill}%` : 'No cap' },
                                                { label: 'Gross', value: formatPrice(event.gross) },
                                                { label: 'Platform Fee', value: `-${formatPrice(event.gross - event.net)}` },
                                            ].map(stat => (
                                                <div key={stat.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem' }}>
                                                    <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>{stat.label}</span>
                                                    <strong style={{ fontSize: '0.95rem' }}>{stat.value}</strong>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Fill bar */}
                                        {event.fill !== null && (
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <div style={{ height: '4px', background: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${Math.min(event.fill, 100)}%`, background: event.fill >= 80 ? 'var(--success)' : event.fill >= 50 ? 'var(--accent)' : 'var(--warning)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Recommendation */}
                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Insight: </span>
                                            {recommendation(event)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>)}
                    </div>
                );
            })()}


            {/* DANCER Memberships & Subscriptions */}
            {user?.role === "DANCER" && (
                <section style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Memberships & Passes</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', padding: '0.2rem 0.6rem', background: 'var(--accent-soft)', borderRadius: '1rem', border: '1px solid var(--accent-border)' }}>
                            {myMemberships.length} Active
                        </span>
                    </div>

                    {loadingMemberships ? (
                        <p className="hint">Loading memberships...</p>
                    ) : (
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {myMemberships.map(m => {
                                const isExpired = new Date(m.expiresAt) < new Date();
                                const creditsLeft = m.creditsTotal != null ? m.creditsTotal - m.creditsUsed : null;
                                const studioInitials = (m.tier.studio?.name || "?").slice(0, 2).toUpperCase();
                                const accentColor = isExpired ? 'var(--text-muted)' : (m.active ? 'var(--accent)' : 'var(--warning)');

                                return (
                                    <div key={m.id} style={{ flex: '0 0 280px', padding: '1.5rem', background: 'var(--bg-card)', border: `1px solid ${isExpired ? 'rgba(239,68,68,0.2)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-md)', position: 'relative', overflow: 'hidden', opacity: isExpired ? 0.7 : 1 }}>
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: accentColor }} />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accentColor}40`, fontSize: '0.75rem', fontWeight: 700, color: accentColor }}>
                                                {studioInitials}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{m.tier.name}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.tier.studio?.name || "Unknown Studio"}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                            <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>€{(m.tier.priceCents / 100).toFixed(2)}</span>
                                            {m.tier.classLimit ? ` / ${m.tier.classLimit} classes` : ' / unlimited'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {creditsLeft != null ? `${creditsLeft} classes remaining • ` : "Unlimited • "}
                                            Expires {new Date(m.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {isExpired ? (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>● Expired</span>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>● Active</span>
                                            )}
                                            {m.tier.studio && (
                                                <Link to={`/users/${m.tier.studio.id}`} style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '100px', background: 'var(--bg-hover)', border: '1px solid var(--border-light)', color: 'var(--text-main)', textDecoration: 'none' }}>
                                                    Studio Profile
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Browse studios CTA */}
                            <Link to="/discover?role=STUDIO" style={{ flex: '0 0 240px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.2s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>+</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Browse Studio Plans</span>
                                <span style={{ fontSize: '0.75rem', textDecoration: 'underline', marginTop: '0.25rem' }}>Find local studios</span>
                            </Link>
                        </div>
                    )}
                </section>
            )}

        </main>
    );
}

