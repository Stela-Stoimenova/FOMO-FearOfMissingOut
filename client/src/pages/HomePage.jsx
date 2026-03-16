// Home page — fetches real events from GET /api/events
// Supports search (q param), loading state, and error state
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, getNearbyEvents, getPopularEvents } from "../api/events.js";
import EventMap from "../components/EventMap.jsx";

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
    // Search & Filter state
    const [searchInput, setSearchInput] = useState("");
    const [query, setQuery] = useState("");
    const [filterCity, setFilterCity] = useState("");
    const [filterStyle, setFilterStyle] = useState("");
    const [filterMaxPrice, setFilterMaxPrice] = useState("");

    // Toggle advanced filters
    const [showFilters, setShowFilters] = useState(false);

    // Main events state
    const [events, setEvents] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Map specific state
    const [mapEvents, setMapEvents] = useState([]);
    const [userLocation, setUserLocation] = useState(null);

    // Nearby events state
    const [nearbyEvents, setNearbyEvents] = useState([]);
    const [nearbyError, setNearbyError] = useState(null);
    const [nearbyLoading, setNearbyLoading] = useState(false);
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

    // Fetch all events on query or filter change
    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            setError(null);
            try {
                // If a dance style is selected, smartly append it to the search query
                const finalQuery = filterStyle ? `${query} ${filterStyle}`.trim() : query;

                const params = { q: finalQuery, limit: 12 };
                if (filterCity) params.city = filterCity;
                if (filterMaxPrice) params.maxPrice = Number(filterMaxPrice) * 100; // convert to cents

                const data = await getEvents(params);
                setEvents(data.items);
                setTotal(data.total);

                // Parallel fetch strictly for the Map (uncapped or huge limit) so all pins show
                const mapParams = { ...params, limit: 500 };
                const mapData = await getEvents(mapParams);
                setMapEvents(mapData.items);

            } catch (err) {
                setError(err.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [query, filterCity, filterStyle, filterMaxPrice]);

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
                const coords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                setLocationPermission("granted");
                setUserLocation(coords);

                try {
                    const data = await getNearbyEvents(coords.latitude, coords.longitude, 10);
                    setNearbyEvents(data);
                } catch (err) {
                    setNearbyError(err.message || "Failed to fetch nearby events");
                } finally {
                    setNearbyLoading(false);
                }
            },
            async (geoError) => {
                setLocationPermission("denied");
                setNearbyError("Location restricted. Showing popular events in Sofia instead.");
                try {
                    // Fallback to searching for the current default city if geolocation fails
                    const fbData = await getEvents({ city: filterCity || "Sofia", limit: 4 });
                    setNearbyEvents(fbData.items);
                } catch (e) {
                    setNearbyError("Location restricted and fallback failed.");
                } finally {
                    setNearbyLoading(false);
                }
            }
        );
    }


    // A reusable card component
    const EventCard = ({ event }) => (
        <Link key={event.id} to={`/events/${event.id}`} className="event-card">
            <div
                className="event-card-img"
                style={{
                    backgroundImage: event.imageUrl
                        ? `url(${event.imageUrl})`
                        : 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(124,58,237,0.15) 50%, rgba(30,30,40,0.8) 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {!event.imageUrl && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.8rem', opacity: 0.35, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>No Image</div>
                )}
            </div>
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
            {/* Hero Section */}
            {!query && (
                <section className="hero">
                    <h1>The Premier Platform for Dance Professionals</h1>
                    <p>Discover exclusive events, manage your tickets, and never miss out on the industry's best opportunities.</p>
                </section>
            )}

            {/* Search & Filter Bar */}
            <div style={{ marginBottom: '2rem' }}>
                <div className="search-bar" style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search events by name, location…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        className="btn-primary"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Hide Filters' : 'Filters'}
                    </button>
                </div>

                {/* Advanced Filter UI */}
                {showFilters && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', padding: '1.5rem', background: 'rgba(24, 24, 27, 0.7)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-md)' }}>
                        <div className="form-group">
                            <label className="form-label">City</label>
                            <select className="filter-select" value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                                <option value="">Anywhere</option>
                                <option value="Sofia">Sofia</option>
                                <option value="Plovdiv">Plovdiv</option>
                                <option value="Varna">Varna</option>
                                <option value="Bucharest">Bucharest</option>
                                <option value="Cluj-Napoca">Cluj-Napoca</option>
                                <option value="Belgrade">Belgrade</option>
                                <option value="Vienna">Vienna</option>
                                <option value="Budapest">Budapest</option>
                                <option value="Berlin">Berlin</option>
                                <option value="Paris">Paris</option>
                                <option value="Milan">Milan</option>
                                <option value="Amsterdam">Amsterdam</option>
                                <option value="Madrid">Madrid</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Dance Style</label>
                            <select className="filter-select" value={filterStyle} onChange={e => setFilterStyle(e.target.value)}>
                                <option value="">All Styles</option>
                                <option value="Hip Hop">Hip Hop</option>
                                <option value="Contemporary">Contemporary</option>
                                <option value="Heels">Heels</option>
                                <option value="Ballet">Ballet</option>
                                <option value="Breaking">Breaking</option>
                                <option value="House">House</option>
                                <option value="Popping">Popping</option>
                                <option value="Commercial">Commercial</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Max Price (€)</label>
                            <input
                                type="number"
                                className="filter-input"
                                placeholder="Any price"
                                value={filterMaxPrice}
                                onChange={e => setFilterMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Nearby Events Section */}
            <section className="nearby-section" style={{ marginBottom: "3rem", padding: "1.5rem", background: "#161b27", borderRadius: "10px", border: "1px solid #1e2536" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text-main)" }}>Nearby Events (10km)</h2>
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

            {/* Premium Interactive Map */}
            {!query && (
                <section style={{ marginBottom: "3rem", height: "450px", borderRadius: "10px", border: "1px solid var(--border-light)", overflow: "hidden", background: "var(--bg-card)", position: "relative" }}>
                    {/* Render Event Map, pass all unpaginated map events, user coord intent, and nearby highlight array */}
                    <EventMap
                        events={mapEvents}
                        userLocation={userLocation}
                        nearbyEventIds={nearbyEvents.map(e => e.id)}
                    />
                </section>
            )}

            {/* Popular Events Section (hide when searching) */}
            {!query && (
                <section className="popular-section" style={{ marginBottom: "3rem" }}>
                    <h2 style={{ fontSize: "1.5rem", margin: "0 0 1rem 0", color: "var(--text-main)" }}>Popular Events</h2>

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
                    <p>{error}</p>
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
