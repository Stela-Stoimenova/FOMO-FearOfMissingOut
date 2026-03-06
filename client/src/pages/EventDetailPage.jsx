// Event detail page — fetches a single event from GET /api/events/:id
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getEventById } from "../api/events.js";

function formatPrice(cents) {
    return `${(cents / 100).toFixed(2)} лв`;
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

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    <p>⚠️ {error.message}</p>
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

            <h1>{event.title}</h1>

            {event.description && (
                <p className="subtitle">{event.description}</p>
            )}

            {/* Details grid */}
            <div className="detail-grid">
                <div className="detail-item">📍 <strong>Location:</strong> {event.location}</div>
                <div className="detail-item">📅 <strong>Starts:</strong> {formatDate(event.startAt)}</div>
                {event.endAt && (
                    <div className="detail-item">🏁 <strong>Ends:</strong> {formatDate(event.endAt)}</div>
                )}
                <div className="detail-item">
                    🎟 <strong>Price:</strong>{" "}
                    <span className={surgeWarning && !isSoldOut ? "price-surge" : ""}>
                        {formatPrice(event.priceCents)}
                    </span>
                    {surgeWarning && !isSoldOut && (
                        <span className="surge-badge">+15% surge</span>
                    )}
                </div>
                {event.capacity != null && (
                    <div className="detail-item">
                        👥 <strong>Capacity:</strong> {ticketsSold} / {event.capacity} sold
                    </div>
                )}
                {event.creator && (
                    <div className="detail-item">
                        🎭 <strong>Organiser:</strong> {event.creator.name ?? event.creator.role}
                    </div>
                )}
            </div>

            {/* Buy button */}
            {isSoldOut ? (
                <button className="btn-primary btn-disabled" disabled>Sold Out</button>
            ) : (
                <button
                    className="btn-primary"
                    onClick={() => alert("Login required — auth coming soon!")}
                >
                    Buy Ticket — {formatPrice(event.priceCents)}
                </button>
            )}

            <p className="hint">You need to be logged in as a DANCER to purchase tickets.</p>
        </main>
    );
}
