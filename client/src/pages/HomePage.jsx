// Home page — fetches real events from GET /api/events
// Supports search (q param), loading state, and error state
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api/events.js";

// Format a price in cents to a readable string (e.g. 1500 → "15.00 лв")
function formatPrice(cents) {
    return `${(cents / 100).toFixed(2)} лв`;
}

// Format an ISO date string to a short readable form (e.g. "10 Apr 2026, 19:00")
function formatDate(isoString) {
    return new Date(isoString).toLocaleString("bg-BG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function HomePage() {
    // The text the user is typing in the search box
    const [searchInput, setSearchInput] = useState("");

    // The query we actually send to the API (updated 400ms after the user stops typing)
    const [query, setQuery] = useState("");

    // API response state
    const [events, setEvents] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Debounce: wait 400ms after the user stops typing before sending the request
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(searchInput.trim());
        }, 400);
        return () => clearTimeout(timer); // cancel the timer if user keeps typing
    }, [searchInput]);

    // Fetch events whenever the search query changes
    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            setError(null);
            try {
                const data = await getEvents({ q: query, limit: 12 });
                setEvents(data.items);
                setTotal(data.total);
            } catch (err) {
                setError(err.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [query]); // re-runs every time `query` changes

    return (
        <main className="page">
            <h1>Welcome to FOMO 🎵</h1>
            <p className="subtitle">Discover dance events, buy tickets, and never miss out.</p>

            {/* Search input */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search events by name, location…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
            </div>

            {/* Loading state */}
            {loading && <p className="state-msg">Loading events…</p>}

            {/* Error state */}
            {!loading && error && (
                <div className="state-error">
                    <p>⚠️ {error}</p>
                    <p className="hint">Make sure the backend is running on <code>http://localhost:5000</code></p>
                </div>
            )}

            {/* Results count */}
            {!loading && !error && (
                <p className="results-count">
                    {total === 0
                        ? "No events found"
                        : `Showing ${events.length} of ${total} event${total !== 1 ? "s" : ""}`}
                    {query && <span> for "<strong>{query}</strong>"</span>}
                </p>
            )}

            {/* Event cards grid */}
            {!loading && !error && events.length > 0 && (
                <section className="event-grid">
                    {events.map((event) => (
                        <Link key={event.id} to={`/events/${event.id}`} className="event-card">
                            <div className="event-card-img">🎶</div>
                            <div className="event-card-body">
                                <h3>{event.title}</h3>
                                <p>📍 {event.location}</p>
                                <p>📅 {formatDate(event.startAt)}</p>
                                <p className="event-price">{formatPrice(event.priceCents)}</p>
                            </div>
                        </Link>
                    ))}
                </section>
            )}
        </main>
    );
}
