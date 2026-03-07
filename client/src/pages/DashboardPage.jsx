// Dashboard — shown after login, displays user info and quick links
// Will read real user data from context/auth state when backend is connected
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";

function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [studioEvents, setStudioEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    useEffect(() => {
        if (user && (user.role === "STUDIO" || user.role === "AGENCY")) {
            setLoadingEvents(true);
            // Fetch events created by this user
            // We use the public list endpoint and filter, or just fetch all and filter client-side for presentation
            apiRequest("/events")
                .then(data => {
                    const myEvents = data.items.filter(e => e.creatorId === user.id);
                    setStudioEvents(myEvents);
                })
                .catch(err => console.error("Failed to load studio events", err))
                .finally(() => setLoadingEvents(false));
        }
    }, [user]);

    if (!user) return null; // handled by ProtectedRoute, but safety first

    return (
        <main className="page page-narrow">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }} />
                ) : (
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', border: '2px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                        {(user.name || user.email).charAt(0).toUpperCase()}
                    </div>
                )}
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
                    <p className="subtitle" style={{ margin: 0, fontSize: '1.1rem' }}>Welcome back, <strong>{user.name || user.email.split('@')[0]}</strong>!</p>
                </div>
            </div>

            <div className="dashboard-info">
                <p>Email: {user.email}</p>
                <p>Role: <span className="role-badge">{user.role}</span></p>

                {user.role === "DANCER" && user.loyaltyAccount && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Loyalty Points Balance</span>
                            <strong style={{ fontSize: '1.5rem', color: 'var(--primary)' }}>
                                🌟 {user.loyaltyAccount.points}
                            </strong>
                        </p>
                        <p className="hint" style={{ textAlign: 'left', marginTop: '0.25rem' }}>
                            Earn 5% points on every ticket purchase!
                        </p>
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

            {/* STUDIO Analytics Section */}
            {(user.role === "STUDIO" || user.role === "AGENCY") && (
                <div style={{ marginTop: '4rem' }}>
                    <h2>Studio Analytics</h2>
                    <p className="subtitle" style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>
                        Overview of your created events and transaction summaries.
                    </p>

                    {loadingEvents ? (
                        <p className="hint">Loading business data...</p>
                    ) : studioEvents.length === 0 ? (
                        <div className="state-msg" style={{ padding: '2rem', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <p>No events found. Create an event to see your transaction summary.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {studioEvents.map(event => {
                                const ticketsSold = event._count?.tickets || 0;
                                const baseRevenue = ticketsSold * event.priceCents;
                                const commission = Math.round(baseRevenue * 0.1);
                                const netRevenue = baseRevenue - commission;

                                return (
                                    <div key={event.id} className="detail-item" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{event.title}</h3>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {new Date(event.startAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <strong style={{ display: 'block' }}>{ticketsSold} / {event.capacity || '∞'}</strong>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tickets Sold</span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.9rem' }}>
                                            <div>
                                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Gross Revenue</span>
                                                <strong>{formatPrice(baseRevenue)}</strong>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Platform Fee (10%)</span>
                                                <strong style={{ color: 'var(--danger)' }}>-{formatPrice(commission)}</strong>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Net Earnings</span>
                                                <strong style={{ color: 'var(--success)' }}>{formatPrice(netRevenue)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* DANCER Memberships Mockup */}
            {user?.role === "DANCER" && (
                <section style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Active Memberships</h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary)', padding: '0.2rem 0.6rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}>Pro Feature</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {/* Mock Sub Card */}
                        <div style={{ flex: '0 0 280px', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, transparent 100%)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}>S</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Studio X</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unlimited Classes</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Renews Aug 1</span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>Active</span>
                            </div>
                        </div>
                        {/* Upsell Mock */}
                        <div style={{ flex: '0 0 280px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>+</span>
                            <span style={{ fontSize: '0.9rem' }}>Browse Studio Plans</span>
                        </div>
                    </div>
                </section>
            )}

        </main>
    );
}
