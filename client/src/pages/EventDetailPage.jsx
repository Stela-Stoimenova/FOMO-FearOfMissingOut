// Event detail page — fetches a single event from GET /api/events/:id
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getEventById, buyTicket } from "../api/events.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleString("bg-BG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function EventDetailPage() {
    const { id } = useParams(); // reads :id from /events/:id
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ticket purchase state
    const [buying, setBuying] = useState(false);
    const [buyError, setBuyError] = useState(null);
    const [purchaseResult, setPurchaseResult] = useState(null);

    useEffect(() => {
        async function fetchEvent() {
            setLoading(true);
            setError(null);
            try {
                const data = await getEventById(id);
                setEvent(data);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchEvent();
    }, [id]); // re-runs if the id in the URL changes

    async function handleBuyTicket() {
        setBuying(true);
        setBuyError(null);
        try {
            const result = await buyTicket(id);
            setPurchaseResult(result);
        } catch (err) {
            setBuyError(err.message || "Failed to purchase ticket");
        } finally {
            setBuying(false);
        }
    }

    // ── Loading ──────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="page page-narrow">
                <p className="state-msg">Loading event…</p>
            </main>
        );
    }

    // ── 404 ───────────────────────────────────────────────────────────────────────
    if (error?.status === 404) {
        return (
            <main className="page page-narrow">
                <h1>Event not found</h1>
                <p className="subtitle">This event doesn't exist or has been removed.</p>
                <Link to="/" className="btn-primary">← Back to events</Link>
            </main>
        );
    }

    // ── Generic error ────────────────────────────────────────────────────────────
    if (error) {
        return (
            <main className="page page-narrow">
                <div className="state-error">
                    <p>{error.message}</p>
                    <p className="hint">Make sure the backend is running on <code>http://localhost:5000</code></p>
                </div>
                <Link to="/">← Back to events</Link>
            </main>
        );
    }

    // ── Success ──────────────────────────────────────────────────────────────────
    const ticketsSold = event._count?.tickets ?? 0;
    const isSoldOut = event.capacity != null && ticketsSold >= event.capacity;
    const surgeWarning = event.capacity != null && ticketsSold > event.capacity * 0.5;

    return (
        <main className="page page-narrow">
            {/* Back link */}
            <Link to="/" className="back-link" style={{ marginBottom: "1rem" }}>← All events</Link>

            <div className="detail-card" style={{ padding: 0, overflow: 'hidden' }}>
                {event.imageUrl ? (
                    <div style={{
                        width: '100%',
                        height: '350px',
                        backgroundImage: `url(${event.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                    }}>
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(24, 24, 27, 1), transparent)',
                            padding: '2rem',
                            display: 'flex',
                            alignItems: 'flex-end'
                        }}>
                            <h1 style={{ margin: 0, fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{event.title}</h1>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        width: '100%', height: '200px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(124,58,237,0.1) 50%, rgba(24,24,27,1) 100%)',
                        display: 'flex', alignItems: 'flex-end', padding: '2rem',
                    }}>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>{event.title}</h1>
                    </div>
                )}

                <div style={{ padding: '0 2rem 2rem 2rem' }}>
                    {event.description && (
                        <p className="detail-description">{event.description}</p>
                    )}

                    {/* Details grid */}
                    <div className="detail-grid">
                        <div className="detail-item"><strong>Location:</strong> {event.location}</div>
                        <div className="detail-item"><strong>Starts:</strong> {formatDate(event.startAt)}</div>
                        {event.endAt && (
                            <div className="detail-item"><strong>Ends:</strong> {formatDate(event.endAt)}</div>
                        )}
                        <div className="detail-item">
                            <strong>Price:</strong>{" "}
                            {surgeWarning && !isSoldOut ? (
                                <>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                                        {formatPrice(event.priceCents)}
                                    </span>
                                    <span className="price-surge">
                                        {formatPrice(Math.round(event.priceCents * 1.15))}
                                    </span>
                                    <span className="surge-badge">Dynamic Pricing (+15%) Active</span>
                                </>
                            ) : (
                                <span>{formatPrice(event.priceCents)}</span>
                            )}
                        </div>
                        {event.capacity != null && (
                            <div className="detail-item">
                                <strong>Capacity & Demand:</strong>
                                <span>{ticketsSold} / {event.capacity} tickets sold</span>
                                {surgeWarning && !isSoldOut && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 500 }}>
                                        High Demand: Over 50% of capacity reached!
                                    </div>
                                )}
                            </div>
                        )}
                        {event.creator && (
                            <div className="detail-item">
                                <strong>Organiser:</strong> {event.creator.name ?? event.creator.role}
                            </div>
                        )}
                    </div>

                    {buyError && <div className="form-error">{buyError}</div>}

                    {/* Role-based actions */}
                    {!isLoggedIn ? (
                        <button className="btn-primary" onClick={() => navigate("/login")}>
                            Login to buy tickets
                        </button>
                    ) : user.role === "DANCER" ? (
                        purchaseResult ? (
                            <div className="detail-item" style={{ marginTop: '1rem', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                                <h3 style={{ color: 'var(--success)', marginBottom: '1rem' }}>Ticket Purchased Successfully!</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <strong>Base Price</strong>
                                        <span>{formatPrice(purchaseResult.pricing.basePriceCents)}</span>
                                    </div>
                                    <div>
                                        <strong>Final Paid</strong>
                                        <span>{formatPrice(purchaseResult.pricing.finalPriceCents)} {purchaseResult.pricing.surgeApplied && <span style={{ fontSize: '0.8em', color: 'var(--warning)' }}>(Surge)</span>}</span>
                                    </div>
                                    <div>
                                        <strong>Platform Commission (10%)</strong>
                                        <span style={{ color: 'var(--text-muted)' }}>{formatPrice(purchaseResult.transaction.commissionCents)}</span>
                                    </div>
                                    <div>
                                        <strong>Net Organizer Revenue</strong>
                                        <span>{formatPrice(purchaseResult.transaction.netCents)}</span>
                                    </div>
                                </div>
                                <div style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>
                                    <strong style={{ color: 'var(--primary)' }}>Loyalty Rewards</strong>
                                    <span>You earned <strong>{purchaseResult.loyalty.pointsEarned}</strong> points! (New Balance: {purchaseResult.loyalty.totalPoints})</span>
                                </div>
                            </div>
                        ) : isSoldOut ? (
                            <button className="btn-primary btn-disabled" disabled>Sold Out</button>
                        ) : (
                            <button className="btn-primary" onClick={handleBuyTicket} disabled={buying}>
                                {buying ? "Processing…" : `Buy Ticket — ${surgeWarning ? formatPrice(Math.round(event.priceCents * 1.15)) : formatPrice(event.priceCents)}`}
                            </button>
                        )
                    ) : (user.role === "STUDIO" || user.role === "AGENCY") ? (
                        <button className="btn-primary" style={{ background: "#475569" }} onClick={() => alert("Edit event coming soon!")}>
                            Edit Event
                        </button>
                    ) : null}

                    {!isLoggedIn && (
                        <p className="hint">You need to be logged in as a DANCER to purchase tickets.</p>
                    )}
                    {purchaseResult && (
                        <p className="hint" style={{ marginTop: "1rem" }}>
                            <Link to="/my-tickets" style={{ color: 'var(--primary)', fontWeight: 600 }}>View your tickets →</Link>
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
