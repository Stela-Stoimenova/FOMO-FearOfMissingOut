// Dashboard — shown after login, displays user info and quick links
// Will read real user data from context/auth state when backend is connected
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { getMyTickets, deleteEvent, getEventsByCreator } from "../api/events.js";
import { getLoyaltyBalance } from "../api/users.js";
import { getUserCv } from "../api/cv.js";
import { getMyPurchasedMemberships } from "../api/studios.js";
import FollowListModal from "../components/FollowListModal.jsx";
import Toast, { showToast, friendlyError } from "../components/Toast.jsx";

function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [studioEvents, setStudioEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [myTickets, setMyTickets] = useState([]);
    const [loadingTickets, setLoadingTickets] = useState(false);
    const [myCvEntries, setMyCvEntries] = useState([]);
    const [loyalty, setLoyalty] = useState(null);
    const [showList, setShowList] = useState(null); // 'followers' | 'following' | null
    const [myMemberships, setMyMemberships] = useState([]);
    const [loadingMemberships, setLoadingMemberships] = useState(false);
    const [savedEvents, setSavedEvents] = useState([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [toast, setToast] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [wishlistData, setWishlistData] = useState(null);
    const [loadingWishlist, setLoadingWishlist] = useState(false);

    useEffect(() => {
        if (user && (user.role === "STUDIO" || user.role === "AGENCY")) {
            loadStudioEvents();
        }
        if (user && user.role === "DANCER") {
            setLoadingTickets(true);
            Promise.all([
                getMyTickets().catch(() => []),
                getUserCv(user.id).catch(() => []),
            ]).then(([tickets, cv]) => {
                setMyTickets(Array.isArray(tickets) ? tickets : []);
                setMyCvEntries(Array.isArray(cv) ? cv : []);
            }).finally(() => setLoadingTickets(false));

            getLoyaltyBalance()
                .then(data => setLoyalty(data))
                .catch(() => { /* non-critical — already visible from user context */ });

            setLoadingMemberships(true);
            getMyPurchasedMemberships()
                .then(data => setMyMemberships(Array.isArray(data) ? data : []))
                .catch(err => showToast(setToast, friendlyError(err)))
                .finally(() => setLoadingMemberships(false));

            setLoadingSaved(true);
            import("../api/events.js").then(api => {
                api.getSavedEvents()
                    .then(data => setSavedEvents(Array.isArray(data) ? data : []))
                    .catch(err => showToast(setToast, friendlyError(err)))
                    .finally(() => setLoadingSaved(false));
            });
        }
        if (user && (user.role === "AGENCY" || user.role === "STUDIO")) {
            setLoadingRecs(true);
            import("../api/users.js").then(api => {
                api.getRecommendedDancers()
                    .then(data => setRecommendations(Array.isArray(data) ? data : []))
                    .catch(err => console.error("Recommendations failed", err))
                    .finally(() => setLoadingRecs(false));
            });

            setLoadingWishlist(true);
            import("../api/events.js").then(api => {
                api.getWishlistAnalytics()
                    .then(data => setWishlistData(data))
                    .catch(err => console.error("Wishlist analytics failed", err))
                    .finally(() => setLoadingWishlist(false));
            });
        }
    }, [user]);


    function loadStudioEvents() {
        setLoadingEvents(true);
        getEventsByCreator(user.id)
            .then(data => setStudioEvents(data.items ?? []))
            .catch(err => console.error("Failed to load studio events", err))
            .finally(() => setLoadingEvents(false));
    }

    async function handleDelete(id) {
        setConfirmDeleteId(id);
    }

    async function handleConfirmDelete() {
        const id = confirmDeleteId;
        setConfirmDeleteId(null);
        try {
            await deleteEvent(id);
            loadStudioEvents();
            showToast(setToast, "Event deleted.", "success");
        } catch (err) {
            showToast(setToast, friendlyError(err));
        }
    }

    if (!user) return null;

    return (
        <main className="page">
            <Toast toast={toast} onClose={() => setToast(null)} />
            {confirmDeleteId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: 'var(--shadow-lg)' }}>
                        <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>Delete this event? This action cannot be undone and all tickets will be removed.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleConfirmDelete} style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} onError={e => { e.target.style.display = "none"; }} />
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
                            Earn 1% of every ticket price as points. 100 points = €1.00 off your next ticket.
                        </p>

                        {/* Loyalty mechanic explanation */}
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--accent-soft)', borderRadius: 'var(--radius-md)', border: '1px solid var(--accent-border)' }}>
                            <h4 style={{ fontSize: '0.9rem', margin: '0 0 0.75rem 0', color: 'var(--accent)' }}>How Points Work</h4>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                                <li>You earn <strong>1%</strong> of the ticket price as points on every purchase</li>
                                <li><strong>100 points = €1.00</strong> discount (exchange rate: 1 pt → 1 cent)</li>
                                <li>Points are applied automatically — just check <strong>"Use Points"</strong> at checkout</li>
                                <li>You currently have <strong>{loyalty?.points ?? user.loyaltyAccount.points} pts</strong> = up to <strong>€{((loyalty?.points ?? user.loyaltyAccount.points) / 10 / 10).toFixed(2)}</strong> off</li>
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

            {/* DANCER — Recent Activity */}
            {user.role === "DANCER" && (() => {
                const ticketActivities = myTickets.map(t => ({
                    id: `ticket-${t.id}`,
                    type: t.status === 'CANCELLED' ? 'cancel' : 'buy',
                    label: t.status === 'CANCELLED' ? 'Cancelled ticket' : 'Purchased ticket',
                    title: t.event?.title || `Event #${t.eventId}`,
                    detail: formatPrice(t.priceCents),
                    date: t.updatedAt || t.createdAt,
                    linkTo: `/events/${t.eventId}`,
                }));
                const cvActivities = myCvEntries.map(cv => ({
                    id: `cv-${cv.id}`,
                    type: 'cv',
                    label: cv.taggedAgencyId || cv.taggedStudioId ? 'Tagged in CV' : 'Added to CV',
                    title: cv.title,
                    detail: cv.type ? cv.type.charAt(0) + cv.type.slice(1).toLowerCase() : '',
                    date: cv.createdAt,
                    linkTo: null,
                }));
                const activities = [...ticketActivities, ...cvActivities]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 8);

                const iconStyle = (type) => ({
                    buy:    { bg: 'rgba(16,185,129,0.15)', color: 'var(--success)',  symbol: '+' },
                    cancel: { bg: 'rgba(239,68,68,0.12)',  color: 'var(--danger)',   symbol: '−' },
                    cv:     { bg: 'rgba(99,102,241,0.15)', color: 'var(--accent)',   symbol: 'CV' },
                })[type] || { bg: 'var(--bg-hover)', color: 'var(--text-muted)', symbol: '·' };

                return (
                    <section style={{ marginTop: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Activity</h2>
                        {loadingTickets ? (
                            <p className="hint">Loading activity…</p>
                        ) : activities.length === 0 ? (
                            <div className="detail-item" style={{ textAlign: 'center', padding: '2rem' }}>
                                <p style={{ color: 'var(--text-muted)' }}>No activity yet. <Link to="/" style={{ color: 'var(--primary)' }}>Browse events</Link> to get started!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {activities.map(item => {
                                    const ic = iconStyle(item.type);
                                    const inner = (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '14px', transition: 'background 0.2s', textDecoration: 'none', color: 'inherit' }}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: ic.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: ic.color }}>
                                                {ic.symbol}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{item.label}</div>
                                                <strong style={{ fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</strong>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                {item.detail && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: item.type === 'cancel' ? 'var(--danger)' : item.type === 'buy' ? 'var(--success)' : 'var(--accent)', display: 'block' }}>{item.detail}</span>}
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    );
                                    return item.linkTo ? (
                                        <Link key={item.id} to={item.linkTo} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link>
                                    ) : (
                                        <div key={item.id}>{inner}</div>
                                    );
                                })}
                                {myTickets.length > 5 && (
                                    <Link to="/my-tickets" style={{ color: 'var(--primary)', fontSize: '0.9rem', textAlign: 'center', display: 'block', marginTop: '0.25rem' }}>View all {myTickets.length} tickets →</Link>
                                )}
                            </div>
                        )}
                    </section>
                );
            })()}

            {/* DANCER — Wish List */}
            {user.role === "DANCER" && (
                <section style={{ marginTop: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>My Wish List</h2>
                        <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>Browse More</Link>
                    </div>
                    {loadingSaved ? (
                        <p className="hint">Loading saved events…</p>
                    ) : savedEvents.length === 0 ? (
                        <div style={{ padding: '2rem', background: 'var(--bg-card)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Your wish list is empty. Heart an event to save it here!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {savedEvents.map(event => (
                                <Link key={event.id} to={`/events/${event.id}`} style={{ textDecoration: 'none', color: 'inherit' }} title={event.title}>
                                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                        <div style={{ height: '100px', background: event.imageUrl ? `url(${event.imageUrl}) center/cover` : 'var(--bg-input)' }} />
                                        <div style={{ padding: '0.75rem' }}>
                                            <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(event.startAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
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

                // --- Agency specific counts (placeholders or fetched) ---
                // For a more complete experience, we'd fetch these in the useEffect
                // but we can show what we have or generic metrics.
                
                const kpis = user.role === "AGENCY" 
                  ? [
                      { label: "Created Events",  value: studioEvents.length,       color: "var(--text-main)" },
                      { label: "Tickets Sold",    value: totalTickets,              color: "var(--accent)" },
                      { label: "Gross Revenue",   value: formatPrice(grossRevenue), color: "var(--text-main)" },
                      { label: "Net Earnings",    value: formatPrice(netEarnings),  color: "var(--success)" },
                      { label: "Managed Talent",  value: user._count?.managedDancers ?? 0, color: "var(--primary)" },
                      { label: "Collaborations",  value: user._count?.agencyCollaborations ?? 0, color: "var(--warning)" },
                    ]
                  : [
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
                        <h2 style={{ marginBottom: '0.4rem' }}>{user.role === "AGENCY" ? "Agency Insights" : "Studio Analytics"}</h2>

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
                            <div className="dashboard-events-grid">
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

                            {/* Per-event breakdown — split Upcoming / Past */}
                            {[
                                { label: "Upcoming Events", events: withFill.filter(e => e.upcoming), accent: "var(--accent)" },
                                { label: "Past Events", events: withFill.filter(e => !e.upcoming), accent: "var(--text-muted)" },
                            ].filter(g => g.events.length > 0).map(group => (
                                <div key={group.label} style={{ marginBottom: '2.5rem' }}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: group.accent, fontWeight: 700 }}>{group.label}</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {group.events.map(event => (
                                    <div key={event.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                                        {/* Header row */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.2rem', fontSize: '1rem' }}>{event.title}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {new Date(event.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--success)' }}>{formatPrice(event.net)}</strong>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>net earnings</span>
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
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

                                        {/* Recommendation — only for upcoming events */}
                                        {event.upcoming && (
                                            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                                                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Insight: </span>
                                                {recommendation(event)}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                                </div>
                            ))}
                        </>)}

                        {/* ── Wishlist Analytics ── */}
                        <div style={{ marginTop: '3rem' }}>
                            <h2 style={{ marginBottom: '0.4rem', fontSize: '1.3rem' }}>Wishlist Analytics</h2>
                            <p className="subtitle" style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
                                See which events dancers saved to their wish list — and who converted to a purchase.
                            </p>

                            {loadingWishlist ? (
                                <p className="hint">Loading wishlist data…</p>
                            ) : !wishlistData || wishlistData.perEvent.length === 0 ? (
                                <div style={{ padding: '2rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No wishlist data yet. Dancers can save your events by tapping the heart icon on event pages.
                                </div>
                            ) : (() => {
                                const { summary, perEvent: wEvents } = wishlistData;

                                function wishlistInsight(ev) {
                                    if (ev.savedCount === 0) return "No saves yet — increase visibility with promotions or invitations.";
                                    if (ev.conversionRate >= 70) return "Excellent conversion — dancers who save this event almost always buy. Keep the strategy.";
                                    if (ev.conversionRate >= 40) return "Good interest. Consider a reminder or limited-time offer to nudge undecided dancers.";
                                    if (ev.savedNotPurchased > 3 && ev.conversionRate < 20) return "High save rate but low conversion — price or event details may be deterring purchase. Review your offer.";
                                    return "Monitor as the event date approaches; interest may convert closer to the deadline.";
                                }

                                const convColor = (rate) => {
                                    if (rate === null) return 'var(--text-muted)';
                                    if (rate >= 60) return 'var(--success)';
                                    if (rate >= 30) return 'var(--warning)';
                                    return 'var(--danger)';
                                };

                                return (
                                    <>
                                        {/* Summary KPIs */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                                            {[
                                                { label: 'Total Saves', value: summary.totalSaved, color: 'var(--accent)' },
                                                { label: 'Converted to Purchase', value: summary.totalConversions, color: 'var(--success)' },
                                                { label: 'Saved — Not Purchased', value: summary.totalSavedNotPurchased, color: 'var(--warning)' },
                                                { label: 'Overall Conversion', value: summary.overallConversionRate !== null ? `${summary.overallConversionRate}%` : 'N/A', color: convColor(summary.overallConversionRate) },
                                            ].map(k => (
                                                <div key={k.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>{k.label}</span>
                                                    <strong style={{ fontSize: '1.4rem', color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</strong>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Per-event wishlist cards */}
                                        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>Per-Event Wishlist Breakdown</h3>
                                        <div style={{ display: 'grid', gap: '1rem' }}>
                                            {wEvents.map(ev => {
                                                const barSaved = ev.savedCount > 0 ? 100 : 0;
                                                const barConverted = ev.savedCount > 0 ? Math.round((ev.savedAndPurchased / ev.savedCount) * 100) : 0;
                                                return (
                                                    <div key={ev.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem 1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                                {ev.imageUrl && (
                                                                    <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: `url(${ev.imageUrl}) center/cover`, flexShrink: 0 }} />
                                                                )}
                                                                <div>
                                                                    <h4 style={{ margin: '0 0 0.2rem', fontSize: '1rem' }}>{ev.title}</h4>
                                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                                        {new Date(ev.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        {new Date(ev.startAt) > new Date()
                                                                            ? <span style={{ marginLeft: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>Upcoming</span>
                                                                            : <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>Past</span>}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                                <strong style={{ display: 'block', fontSize: '1.3rem', color: convColor(ev.conversionRate) }}>
                                                                    {ev.conversionRate !== null ? `${ev.conversionRate}%` : '—'}
                                                                </strong>
                                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>conversion</span>
                                                            </div>
                                                        </div>

                                                        {/* Funnel stats */}
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                                                            {[
                                                                { label: 'Total Saves', value: ev.savedCount, color: 'var(--accent)' },
                                                                { label: 'Saved & Purchased', value: ev.savedAndPurchased, color: 'var(--success)' },
                                                                { label: 'Saved, Not Purchased', value: ev.savedNotPurchased, color: 'var(--warning)' },
                                                            ].map(stat => (
                                                                <div key={stat.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem' }}>
                                                                    <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>{stat.label}</span>
                                                                    <strong style={{ fontSize: '1.1rem', color: stat.color }}>{stat.value}</strong>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Conversion funnel bar */}
                                                        {ev.savedCount > 0 && (
                                                            <div style={{ marginBottom: '0.75rem' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                                                                    <span>Saves</span>
                                                                    <span>→ Purchases</span>
                                                                </div>
                                                                <div style={{ position: 'relative', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                                                                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barSaved}%`, background: 'rgba(99,102,241,0.3)', borderRadius: '4px' }} />
                                                                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${barConverted}%`, background: convColor(ev.conversionRate), borderRadius: '4px', transition: 'width 0.4s ease' }} />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Insight */}
                                                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                                                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Wishlist Insight: </span>
                                                            {wishlistInsight(ev)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
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

            {/* Recommended Dancers — shown at bottom for AGENCY / STUDIO */}
            {(user.role === "AGENCY" || user.role === "STUDIO") && (
                <section className="detail-card" style={{ marginTop: "3rem", padding: "2rem", borderRadius: "24px", background: "linear-gradient(145deg, var(--bg-card), var(--bg-hover))", border: "1px solid var(--accent-border)", boxShadow: "0 10px 30px rgba(99,102,241,0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                                Top Recommended Dancers
                            </h3>
                            <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>Based on your {user.role === "STUDIO" ? "studio's" : "agency's"} focus and location.</p>
                        </div>
                        <Link to="/profile" className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.4rem 0.8rem", borderRadius: "10px", textDecoration: "none" }}>Manage Recommendations</Link>
                    </div>

                    {loadingRecs ? (
                        <p className="hint">Scanning talent pool...</p>
                    ) : recommendations.length > 0 ? (
                        <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
                            {recommendations.slice(0, 5).map(dancer => (
                                <div key={dancer.id} style={{ flex: "0 0 240px", padding: "1.25rem", background: "var(--bg-card)", borderRadius: "20px", border: "1px solid var(--border-light)", textAlign: "center" }}>
                                    <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: dancer.avatarUrl ? `url(${dancer.avatarUrl}) center/cover` : "var(--bg-input)", margin: "0 auto 0.75rem" }} />
                                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem" }}>{dancer.name}</h4>
                                    <div style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 700, marginBottom: "0.5rem" }}>{dancer.matchScore}% Match</div>
                                    <Link to={`/users/${dancer.id}`} className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.75rem", textDecoration: "none", display: "inline-block" }}>View Profile</Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: "2rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>No matches yet. Add styles to your profile to get suggestions!</p>
                        </div>
                    )}
                </section>
            )}

        </main>
    );
}

