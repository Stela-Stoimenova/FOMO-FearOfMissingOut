import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getEventById, saveEvent, unsaveEvent, isEventSaved, createPaymentIntent, buyTicketWithPayment } from "../api/events.js";
import { getMe } from "../api/users.js";
import { useAuth } from "../context/AuthContext.jsx";
import Toast, { showToast, friendlyError } from "../components/Toast.jsx";

function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(isoString) {
    return new Date(isoString).toLocaleString(navigator.language, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// ── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ amount, simulatedMode, onConfirm, onCancel, loading }) {
    const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
    const [err, setErr] = useState(null);

    function handleChange(e) {
        let { name, value } = e.target;
        if (name === "number") value = value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
        if (name === "expiry") value = value.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");
        if (name === "cvv") value = value.replace(/\D/g, "").slice(0, 4);
        setCard(prev => ({ ...prev, [name]: value }));
    }

    function handleSubmit(e) {
        e.preventDefault();
        setErr(null);
        if (!simulatedMode) {
            // Real Stripe: basic front-end checks only — Stripe handles real validation
            if (card.number.replace(/\s/g, "").length < 16) return setErr("Enter a valid 16-digit card number.");
            if (!card.expiry.includes("/")) return setErr("Enter expiry as MM/YY.");
            if (card.cvv.length < 3) return setErr("CVV must be 3-4 digits.");
        }
        onConfirm(card);
    }

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
            <div style={{
                background: "var(--bg-card)", border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)", padding: "2rem", width: "100%", maxWidth: "440px",
                boxShadow: "var(--shadow-lg)",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ margin: 0 }}>Secure Payment</h2>
                    <button onClick={onCancel} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.5rem", lineHeight: 1 }}>×</button>
                </div>

                <div style={{ background: "var(--bg-hover)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Total charge</span>
                    <strong style={{ fontSize: "1.2rem" }}>{formatPrice(amount)}</strong>
                </div>

                {simulatedMode && (
                    <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid var(--accent-border)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                        <strong style={{ color: "var(--accent)" }}>Demo Mode</strong>
                        <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
                            Use test card: <strong style={{ color: "var(--text-main)" }}>4242 4242 4242 4242</strong> · Any future expiry · Any 3-digit CVV
                        </p>
                    </div>
                )}

                {err && <div className="form-error" style={{ marginBottom: "1rem" }}>{err}</div>}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 500 }}>
                        Cardholder Name
                        <input
                            name="name"
                            value={card.name}
                            onChange={handleChange}
                            placeholder="Jane Smith"
                            required
                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.65rem 0.9rem", color: "var(--text-main)", fontSize: "0.95rem" }}
                        />
                    </label>

                    <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 500 }}>
                        Card Number
                        <input
                            name="number"
                            value={card.number}
                            onChange={handleChange}
                            placeholder="4242 4242 4242 4242"
                            inputMode="numeric"
                            required
                            style={{ background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.65rem 0.9rem", color: "var(--text-main)", fontSize: "0.95rem", letterSpacing: "0.1em" }}
                        />
                    </label>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 500 }}>
                            Expiry (MM/YY)
                            <input
                                name="expiry"
                                value={card.expiry}
                                onChange={handleChange}
                                placeholder="12/27"
                                inputMode="numeric"
                                required
                                style={{ background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.65rem 0.9rem", color: "var(--text-main)", fontSize: "0.95rem" }}
                            />
                        </label>
                        <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.9rem", fontWeight: 500 }}>
                            CVV
                            <input
                                name="cvv"
                                value={card.cvv}
                                onChange={handleChange}
                                placeholder="123"
                                inputMode="numeric"
                                required
                                style={{ background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.65rem 0.9rem", color: "var(--text-main)", fontSize: "0.95rem" }}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ marginTop: "0.5rem", padding: "0.85rem", fontSize: "1rem" }}
                    >
                        {loading ? "Processing payment…" : `Pay ${formatPrice(amount)}`}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    🔒 Secured by Stripe · 256-bit SSL encryption
                </p>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function EventDetailPage() {
    const { id } = useParams();
    const { user, isLoggedIn, setUser } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [buying, setBuying] = useState(false);
    const [buyError, setBuyError] = useState(null);
    const [purchaseResult, setPurchaseResult] = useState(null);
    const [usePoints, setUsePoints] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [toast, setToast] = useState(null);

    // Payment modal state
    const [showPayment, setShowPayment] = useState(false);
    const [paymentIntent, setPaymentIntent] = useState(null); // { clientSecret, simulatedMode, amount, paymentIntentId }

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
    }, [id]);

    useEffect(() => {
        if (isLoggedIn && user?.role === "DANCER" && event) {
            isEventSaved(event.id)
                .then(({ saved }) => setIsSaved(saved))
                .catch(() => {});
        }
    }, [isLoggedIn, user, event]);

    async function handleToggleSave() {
        if (!isLoggedIn) { navigate("/login"); return; }
        try {
            if (isSaved) {
                await unsaveEvent(id);
                setIsSaved(false);
                showToast(setToast, "Removed from wish list", "success", 2000);
            } else {
                await saveEvent(id);
                setIsSaved(true);
                showToast(setToast, "Saved to wish list ❤️", "success", 2000);
            }
        } catch (err) {
            showToast(setToast, friendlyError(err));
        }
    }

    async function handleInitiatePurchase() {
        setBuying(true);
        setBuyError(null);
        try {
            const intent = await createPaymentIntent(event.id, usePoints);
            setPaymentIntent(intent);
            setShowPayment(true);
        } catch (err) {
            setBuyError(err.message || "Could not initiate payment");
        } finally {
            setBuying(false);
        }
    }

    async function handlePaymentConfirm(_cardDetails) {
        setBuying(true);
        try {
            // In real mode: confirm with Stripe.js here first, then send paymentIntentId
            // In simulated mode: send null or a mock id — server skips verification
            const intentId = paymentIntent?.simulatedMode ? "sim_" + Date.now() : paymentIntent?.paymentIntentId;
            const result = await buyTicketWithPayment(event.id, usePoints, intentId);
            setPurchaseResult(result);
            setShowPayment(false);
            setPaymentIntent(null);

            const updatedMe = await getMe();
            setUser(updatedMe);
        } catch (err) {
            setBuyError(err.message || "Payment failed");
            setShowPayment(false);
        } finally {
            setBuying(false);
        }
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return <main className="page page-narrow"><p className="state-msg">Loading event…</p></main>;
    }
    if (error?.status === 404) {
        return (
            <main className="page page-narrow">
                <h1>Event not found</h1>
                <p className="subtitle">This event doesn't exist or has been removed.</p>
                <Link to="/" className="btn-primary">← Back to events</Link>
            </main>
        );
    }
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

    const ticketsSold = event._count?.tickets ?? 0;
    const isSoldOut = event.capacity != null && ticketsSold >= event.capacity;
    const surgeWarning = event.capacity != null && ticketsSold > event.capacity * 0.5;
    const ticketPrice = surgeWarning ? Math.round(event.priceCents * 1.15) : event.priceCents;

    return (
        <main className="page page-narrow">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {showPayment && paymentIntent && (
                <PaymentModal
                    amount={paymentIntent.amount}
                    simulatedMode={paymentIntent.simulatedMode}
                    onConfirm={handlePaymentConfirm}
                    onCancel={() => { setShowPayment(false); setPaymentIntent(null); }}
                    loading={buying}
                />
            )}

            <Link to="/" className="back-link" style={{ marginBottom: "1rem" }}>← All events</Link>

            <div className="detail-card" style={{ padding: 0, overflow: "hidden" }}>
                {event.imageUrl ? (
                    <div style={{
                        width: "100%", height: "350px",
                        backgroundImage: `url(${event.imageUrl})`,
                        backgroundSize: "cover", backgroundPosition: "center", position: "relative",
                    }}>
                        <div style={{
                            position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "linear-gradient(to top, rgba(24,24,27,1), transparent)",
                            padding: "2rem", display: "flex", alignItems: "flex-end",
                        }}>
                            <h1 style={{ margin: 0, fontSize: "2.5rem", textShadow: "0 2px 10px rgba(0,0,0,0.8)", flex: 1 }}>{event.title}</h1>
                            <button onClick={handleToggleSave} style={{ background: "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isSaved ? "#ff4757" : "#fff", fontSize: "1.5rem", transition: "all 0.3s", backdropFilter: "blur(10px)" }}
                                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                                {isSaved ? "❤️" : "🤍"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ width: "100%", height: "200px", background: "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(124,58,237,0.1) 50%, rgba(24,24,27,1) 100%)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2rem" }}>
                        <h1 style={{ margin: 0, fontSize: "2rem" }}>{event.title}</h1>
                        <button onClick={handleToggleSave} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem", transition: "all 0.3s" }}>
                            {isSaved ? "❤️" : "🤍"}
                        </button>
                    </div>
                )}

                <div style={{ padding: "0 2rem 2rem 2rem" }}>
                    {event.description && <p className="detail-description">{event.description}</p>}

                    {/* Dance styles tags */}
                    {event.danceStyles && event.danceStyles.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "1rem 0" }}>
                            {event.danceStyles.map(s => (
                                <span key={s} style={{ background: "rgba(99,102,241,0.15)", color: "var(--accent)", border: "1px solid var(--accent-border)", borderRadius: "var(--radius-full)", padding: "0.25rem 0.75rem", fontSize: "0.8rem", fontWeight: 500 }}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="detail-grid">
                        <div className="detail-item"><strong>Location:</strong> {event.location}</div>
                        <div className="detail-item"><strong>Starts:</strong> {formatDate(event.startAt)}</div>
                        {event.endAt && <div className="detail-item"><strong>Ends:</strong> {formatDate(event.endAt)}</div>}
                        <div className="detail-item">
                            <strong>Price:</strong>{" "}
                            {surgeWarning && !isSoldOut ? (
                                <>
                                    <span style={{ textDecoration: "line-through", color: "var(--text-muted)", marginRight: "0.5rem" }}>{formatPrice(event.priceCents)}</span>
                                    <span className="price-surge">{formatPrice(ticketPrice)}</span>
                                    <span className="surge-badge">Dynamic Pricing (+15%) Active</span>
                                </>
                            ) : (
                                <span>{formatPrice(event.priceCents)}</span>
                            )}
                        </div>

                        {/* Loyalty hint for dancers with 0 points */}
                        {isLoggedIn && user.role === "DANCER" && !purchaseResult && !isSoldOut && !(user.loyaltyAccount?.points > 0) && (
                            <div className="detail-item" style={{ gridColumn: "1 / -1", fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.75rem 1rem", background: "var(--bg-hover)", borderRadius: "var(--radius-sm)" }}>
                                Earn <strong>5%</strong> of this ticket price as loyalty points on your purchase.
                            </div>
                        )}

                        {/* Loyalty discount box */}
                        {isLoggedIn && user.role === "DANCER" && user.loyaltyAccount?.points > 0 && !purchaseResult && !isSoldOut && (
                            <div className="detail-item" style={{ gridColumn: "1 / -1", background: "var(--bg-hover)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--accent-border)" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div>
                                        <strong style={{ color: "var(--accent)" }}>Loyalty Discount Available</strong>
                                        <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                            You have <strong>{user.loyaltyAccount.points}</strong> points.
                                            {(() => {
                                                const maxDiscount = Math.floor(ticketPrice * 0.5);
                                                const pointsDiscount = user.loyaltyAccount.points * 10;
                                                const actual = Math.min(pointsDiscount, maxDiscount);
                                                return ` Apply up to €${(actual / 100).toFixed(2)} (max 50% of ticket price).`;
                                            })()}
                                        </p>
                                    </div>
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                        <input type="checkbox" checked={usePoints} onChange={e => setUsePoints(e.target.checked)} style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--accent)" }} />
                                        <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Use Points</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {event.capacity != null && (
                            <div className="detail-item">
                                <strong>Capacity & Demand:</strong>
                                <span>{ticketsSold} / {event.capacity} tickets sold</span>
                                {surgeWarning && !isSoldOut && (
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--warning)", fontWeight: 500 }}>
                                        High Demand: Over 50% of capacity reached!
                                    </div>
                                )}
                            </div>
                        )}
                        {event.creator && (
                            <div className="detail-item">
                                <strong>Organiser:</strong>{" "}
                                <Link to={`/users/${event.creator.id}`} style={{ color: "var(--accent)", textDecoration: "none" }}>
                                    {event.creator.name ?? event.creator.role}
                                </Link>
                            </div>
                        )}
                    </div>

                    {buyError && <div className="form-error">{buyError}</div>}

                    {/* Role-based action area */}
                    {!isLoggedIn ? (
                        <button className="btn-primary" onClick={() => navigate("/login")}>Login to buy tickets</button>
                    ) : user.role === "DANCER" ? (
                        purchaseResult ? (
                            <div className="detail-item" style={{ marginTop: "1rem", border: "1px solid var(--success)", background: "rgba(16,185,129,0.05)" }}>
                                <h3 style={{ color: "var(--success)", marginBottom: "1rem" }}>Ticket Purchased Successfully!</h3>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                    <div><strong>Base Price</strong><span>{formatPrice(purchaseResult.pricing.basePriceCents)}</span></div>
                                    <div><strong>Discount Applied</strong><span style={{ color: "var(--accent)" }}>-{formatPrice(purchaseResult.pricing.discountCents || 0)}</span></div>
                                    <div>
                                        <strong>Final Paid</strong>
                                        <span>{formatPrice(purchaseResult.pricing.finalPriceCents)}{purchaseResult.pricing.surgeApplied && <span style={{ fontSize: "0.8em", color: "var(--warning)", marginLeft: "0.5rem" }}>(Surge)</span>}</span>
                                    </div>
                                    <div><strong>Platform Commission</strong><span style={{ color: "var(--text-muted)" }}>{formatPrice(purchaseResult.transaction.commissionCents)}</span></div>
                                </div>
                                <div style={{ padding: "0.75rem", background: "var(--bg-card)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border-light)" }}>
                                    <strong style={{ color: "var(--primary)" }}>Loyalty Activity</strong>
                                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                                        {purchaseResult.loyalty.pointsDeducted > 0 && <span style={{ color: "var(--accent)" }}>Used {purchaseResult.loyalty.pointsDeducted} points. </span>}
                                        Earned <strong>{purchaseResult.loyalty.pointsEarned}</strong> points!
                                        <br /><span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>New Balance: {purchaseResult.loyalty.totalPoints}</span>
                                    </p>
                                </div>
                            </div>
                        ) : isSoldOut ? (
                            <button className="btn-primary btn-disabled" disabled>Sold Out</button>
                        ) : (
                            <button className="btn-primary" onClick={handleInitiatePurchase} disabled={buying}>
                                {buying ? "Preparing payment…" : `Buy Ticket — ${formatPrice(ticketPrice)}`}
                            </button>
                        )
                    ) : isLoggedIn && (user.role === "STUDIO" || user.role === "AGENCY") && user.id === event.creatorId ? (
                        <button className="btn-primary" style={{ background: "#475569" }} onClick={() => navigate(`/events/${event.id}/edit`)}>
                            Edit Event
                        </button>
                    ) : isLoggedIn && (user.role === "STUDIO" || user.role === "AGENCY") ? (
                        <p className="hint">Studios and agencies cannot purchase tickets. Sign up as a dancer to attend events.</p>
                    ) : null}

                    {!isLoggedIn && <p className="hint">You need to be logged in as a DANCER to purchase tickets.</p>}
                    {purchaseResult && (
                        <p className="hint" style={{ marginTop: "1rem" }}>
                            <Link to="/my-tickets" style={{ color: "var(--primary)", fontWeight: 600 }}>View your tickets →</Link>
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
