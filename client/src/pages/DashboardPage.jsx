// Dashboard — shown after login, displays user info and quick links
// Will read real user data from context/auth state when backend is connected
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";
import { getMyTickets } from "../api/events.js";
import { getLoyaltyBalance } from "../api/users.js";
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

    useEffect(() => {
        if (user && (user.role === "STUDIO" || user.role === "AGENCY")) {
            setLoadingEvents(true);
            apiRequest("/events")
                .then(data => {
                    const myEvents = data.items.filter(e => e.creatorId === user.id);
                    setStudioEvents(myEvents);
                })
                .catch(err => console.error("Failed to load studio events", err))
                .finally(() => setLoadingEvents(false));
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

            {/* DANCER Memberships & Subscriptions */}
            {user?.role === "DANCER" && (
                <section style={{ marginTop: '3rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Memberships & Passes</h2>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', padding: '0.2rem 0.6rem', background: 'rgba(99,102,241,0.1)', borderRadius: '1rem', border: '1px solid rgba(99,102,241,0.2)' }}>Pro Feature</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {/* Monthly Class Pass */}
                        <div style={{ flex: '0 0 280px', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 100%)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>CP</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>10-Class Pass</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Flow Academy Sofia</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>€89</span> / 10 classes
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>7 classes remaining • Expires Apr 15</div>
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>● Active</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hip Hop, Heels</span>
                            </div>
                        </div>

                        {/* Monthly Unlimited */}
                        <div style={{ flex: '0 0 280px', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, transparent 100%)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.3)', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(124,58,237,1)' }}>UM</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Unlimited Monthly</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Urban Dance Camp</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>€149</span> / month
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All styles • Unlimited drop-ins</div>
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>● Active</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renews Apr 1</span>
                            </div>
                        </div>

                        {/* Festival Season Pass */}
                        <div style={{ flex: '0 0 280px', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, transparent 100%)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(16,185,129,1)' }}>FP</div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Festival Season Pass</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>FOMO Dance Network</span>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1.1rem' }}>€299</span> / season
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Access to 5 partner festivals across Europe</div>
                            <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>● 3 events left</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid until Sep</span>
                            </div>
                        </div>

                        {/* Browse more */}
                        <div style={{ flex: '0 0 280px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <span style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>+</span>
                            <span style={{ fontSize: '0.9rem' }}>Browse Studio Plans</span>
                            <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Save up to 40% with memberships</span>
                        </div>
                    </div>
                </section>
            )}

        </main>
    );
}

