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
    const [purchased, setPurchased] = useState(false);

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
            await buyTicket(id);
            setPurchased(true);
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
            <Link to="/" className="back-link">← All events</Link>

            <div className="detail-card">
                <h1>{event.title}</h1>

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
                        <span className={surgeWarning && !isSoldOut ? "price-surge" : ""}>
                            {formatPrice(event.priceCents)}
                        </span>
                        {surgeWarning && !isSoldOut && (
                            <span className="surge-badge">+15% surge</span>
                        )}
                    </div>
                    {event.capacity != null && (
                        <div className="detail-item">
                            <strong>Capacity:</strong> {ticketsSold} / {event.capacity} sold
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
                    purchased ? (
                        <div className="btn-primary">
                            Ticket Purchased
                        </div>
                    ) : isSoldOut ? (
                        <button className="btn-primary btn-disabled" disabled>Sold Out</button>
                    ) : (
                        <button className="btn-primary" onClick={handleBuyTicket} disabled={buying}>
                            {buying ? "Processing…" : `Buy Ticket — ${formatPrice(event.priceCents)}`}
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
                {purchased && (
                    <p className="hint" style={{ marginTop: "1rem" }}>
                        <Link to="/my-tickets">View your tickets →</Link>
                    </p>
                )}
            </div>
        </main>
    );
}
