// Home page — fetches real events from GET /api/events
// Supports search (q param), loading state, and error state
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, getNearbyEvents, getPopularEvents } from "../api/events.js";

// Format a price in cents to a readable string (e.g. 2500 → "€25.00")
function formatPrice(cents) {
    return `€${(cents / 100).toFixed(2)}`;
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
    // Search state
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");

    // Main events state
    const [events, setEvents] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Nearby events state
    const [nearbyEvents, setNearbyEvents] = useState([]);
    const [nearbyLoading, setNearbyLoading] = useState(false);
    const [nearbyError, setNearbyError] = useState(null);
    const [locationPermission, setLocationPermission] = useState("prompt"); // prompt, denied, granted

    // Popular events state
    const [popularEvents, setPopularEvents] = useState([]);
    const [popularLoading, setPopularLoading] = useState(true);
    const [popularError, setPopularError] = useState(null);

    // Fetch popular events on mount
    useEffect(() => {
        async function fetchPopular() {
            try {
                const data = await getPopularEvents();
                setPopularEvents(data);
            } catch (err) {
                setPopularError(err.message || "Failed to fetch popular events");
            } finally {
                setPopularLoading(false);
            }
        }
        fetchPopular();
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(searchInput.trim());
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch all events on query change
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
    }, [query]);

    // Request location and fetch nearby events
    function handleFindNearby() {
        if (!navigator.geolocation) {
            setNearbyError("Geolocation is not supported by your browser");
            return;
        }

        setNearbyLoading(true);
        setNearbyError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                setLocationPermission("granted");
                try {
                    const { latitude, longitude } = position.coords;
                    const data = await getNearbyEvents(latitude, longitude, 10);
                    setNearbyEvents(data);
                } catch (err) {
                    setNearbyError(err.message || "Failed to fetch nearby events");
                } finally {
                    setNearbyLoading(false);
                }
            },
            (geoError) => {
                setLocationPermission("denied");
                setNearbyError("Location access denied or unavailable.");
                setNearbyLoading(false);
            }
        );
    }

    // A reusable card component
    const EventCard = ({ event }) => (
        <Link key={event.id} to={`/events/${event.id}`} className="event-card">
            <div className="event-card-img"></div>
            <div className="event-card-body">
                <h3>{event.title}</h3>
                <p className="event-card-detail">{formatDate(event.startAt)} • {event.location}</p>
                <div className="event-card-footer">
                    <p className="event-price">{formatPrice(event.priceCents)}</p>
                    <span className="event-card-cta">Get Tickets</span>
                </div>
            </div>
        </Link>
    );

    return (
        <main className="page">
            <h1>Welcome to FOMO</h1>
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

            {/* Nearby Events Section */}
            <section className="nearby-section" style={{ marginBottom: "3rem", padding: "1.5rem", background: "#161b27", borderRadius: "10px", border: "1px solid #1e2536" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text-main)" }}>📍 Nearby Events (10km)</h2>
                    {locationPermission !== "granted" && !nearbyLoading && (
                        <button className="btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }} onClick={handleFindNearby}>
                            Find near me
                        </button>
                    )}
                </div>

                {nearbyLoading && <p className="state-msg" style={{ margin: "1rem 0" }}>Locating & fetching events…</p>}
                {nearbyError && <div className="form-error" style={{ margin: 0 }}>{nearbyError}</div>}

                {locationPermission === "granted" && !nearbyLoading && nearbyEvents.length === 0 && !nearbyError && (
                    <p className="state-msg" style={{ margin: "1rem 0" }}>No upcoming events found within 10km of your location.</p>
                )}

                {nearbyEvents.length > 0 && (
                    <div className="event-grid" style={{ marginTop: "1rem" }}>
                        {nearbyEvents.map(event => <EventCard key={event.id} event={event} />)}
                    </div>
                )}
            </section>

            {/* Popular Events Section (hide when searching) */}
            {!query && (
                <section className="popular-section" style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontSize: "1.5rem", margin: "0 0 1rem 0", color: "var(--text-main)" }}>🔥 Popular Events</h2>

                    {popularLoading && <p className="state-msg">Loading popular events…</p>}
                    {popularError && <div className="form-error">{popularError}</div>}

                    {!popularLoading && !popularError && popularEvents.length === 0 && (
                        <p className="state-msg" style={{ margin: "1rem 0" }}>No popular events available right now.</p>
                    )}

                    {!popularLoading && !popularError && popularEvents.length > 0 && (
                        <div className="event-grid" style={{ marginTop: "1rem" }}>
                            {popularEvents.map(event => <EventCard key={event.id} event={event} />)}
                        </div>
                    )}
                </section>
            )}

            {/* All Events Section */}
            <h2 style={{ fontSize: "1.5rem", margin: "0 0 1rem 0", color: "#f1f5f9" }}>
                {query ? "Search Results" : "All Upcoming Events"}
            </h2>

            {/* Main Events Loading state */}
            {loading && <p className="state-msg">Loading events…</p>}

            {/* Main Events Error state */}
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
                <section className="event-grid" style={{ marginTop: "1rem" }}>
                    {events.map((event) => <EventCard key={event.id} event={event} />)}
                </section>
            )}
        </main>
    );
}
