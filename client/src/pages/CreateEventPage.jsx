import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent, getSuggestedDancers, searchAllForInvite, inviteEventParticipant } from "../api/events.js";
import { apiRequest } from "../api/client.js";
import { DANCE_STYLE_OPTIONS } from "../utils/constants.js";
import ImageUploadInput from "../components/ImageUploadInput.jsx";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

async function geocodeLocation(locationText) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationText)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding service unavailable.");
    const data = await res.json();
    if (!data.features || data.features.length === 0) {
        throw new Error(`Could not find "${locationText}" on the map. Please try a more specific location.`);
    }
    const [longitude, latitude] = data.features[0].center;
    return { latitude, longitude };
}

export default function CreateEventPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        imageUrl: "",
        startAt: "",
        endAt: "",
        priceCents: "",
        capacity: "",
    });
    const [selectedStyles, setSelectedStyles] = useState([]);
    const [styleInput, setStyleInput] = useState("");

    // Post-creation state
    const [createdEvent, setCreatedEvent] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Unified invite state — shared across both the search section and suggested dancers
    const [invitedIds, setInvitedIds] = useState(new Set());
    const [sendingId, setSendingId] = useState(null);

    // Invite search state
    const [inviteQuery, setInviteQuery] = useState("");
    const [inviteResults, setInviteResults] = useState([]);
    const [inviteLoading, setInviteLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function toggleStyle(style) {
        setSelectedStyles(prev =>
            prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
        );
    }

    function addCustomStyle() {
        const s = styleInput.trim();
        if (s && !selectedStyles.includes(s)) {
            setSelectedStyles(prev => [...prev, s]);
        }
        setStyleInput("");
    }

    async function handleInviteSearch(e) {
        e.preventDefault();
        setInviteLoading(true);
        try {
            const results = await searchAllForInvite(inviteQuery);
            setInviteResults(results);
        } catch {
            setInviteResults([]);
        } finally {
            setInviteLoading(false);
        }
    }

    async function handleInvite(user) {
        setSendingId(user.id);
        try {
            if (user.role === "AGENCY") {
                // Try to create a collaboration record (only works when caller is a STUDIO).
                // On any failure, fall through to the standard event invite.
                try {
                    await apiRequest("/studios/me/collaborations", {
                        method: "POST",
                        body: JSON.stringify({
                            agencyId: user.id,
                            description: `Invited to co-organize "${createdEvent.title}"`,
                            eventId: createdEvent.id,
                        }),
                    });
                } catch {
                    await inviteEventParticipant(createdEvent.id, user.id);
                }
            } else {
                await inviteEventParticipant(createdEvent.id, user.id);
            }
            setInvitedIds(prev => new Set([...prev, user.id]));
        } catch {
            // silent fail
        } finally {
            setSendingId(null);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let coords = {};
            if (form.location) {
                try {
                    coords = await geocodeLocation(form.location);
                } catch (geoErr) {
                    setError(geoErr.message);
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                title: form.title,
                description: form.description || undefined,
                location: form.location,
                imageUrl: form.imageUrl?.trim() || "",
                startAt: form.startAt,
                endAt: form.endAt || undefined,
                priceCents: Number(form.priceCents),
                danceStyles: selectedStyles,
                ...coords,
            };
            if (form.capacity) payload.capacity = Number(form.capacity);

            const data = await createEvent(payload);
            setCreatedEvent(data);

            // Load dancer suggestions if dance styles were set
            if (selectedStyles.length > 0) {
                setLoadingSuggestions(true);
                try {
                    const dancers = await getSuggestedDancers(data.id);
                    setSuggestions(dancers);
                } catch {
                    // suggestions optional — don't block
                } finally {
                    setLoadingSuggestions(false);
                }
            }
        } catch (err) {
            setError(err.message || "Failed to create event");
        } finally {
            setLoading(false);
        }
    }


    // ── Post-creation: show suggestions ──────────────────────────────────────
    if (createdEvent) {
        return (
            <main className="page" style={{ maxWidth: "900px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1 style={{ marginBottom: "0.5rem" }}>Event Created!</h1>
                    <p className="subtitle" style={{ marginBottom: "1.5rem" }}>
                        <strong>{createdEvent.title}</strong> is now live on the platform.
                    </p>
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link to={`/events/${createdEvent.id}`} className="btn-primary">View Event →</Link>
                        <Link to="/dashboard" style={{ padding: "0.65rem 1.5rem", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", color: "var(--text-muted)", textDecoration: "none" }}>Go to Dashboard</Link>
                    </div>
                </div>

                {/* Unified invite section */}
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", padding: "2rem", marginBottom: "2rem" }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>Invite Participants</h2>
                    <p className="subtitle" style={{ marginBottom: "1.25rem" }}>
                        Search for dancers, studios, or agencies to invite. They'll receive a notification with a link to view the event before deciding.
                    </p>
                    <form onSubmit={handleInviteSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
                        <input
                            value={inviteQuery}
                            onChange={e => setInviteQuery(e.target.value)}
                            placeholder="Search dancers, studios, or agencies…"
                            style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.6rem 0.9rem", color: "var(--text-main)", fontSize: "0.9rem" }}
                        />
                        <button type="submit" disabled={inviteLoading} style={{ padding: "0.6rem 1.25rem", background: "var(--accent)", border: "none", borderRadius: "999px", color: "#fff", fontWeight: 600, cursor: inviteLoading ? "not-allowed" : "pointer", fontSize: "0.88rem" }}>
                            {inviteLoading ? "Searching…" : "Search"}
                        </button>
                    </form>

                    {inviteResults.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
                            {inviteResults.map(user => (
                                <div key={user.id} style={{ background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.9rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", color: "var(--text-muted)" }}>
                                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.name || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user.role}{user.city ? ` · ${user.city}` : ""}</div>
                                    </div>
                                    <button
                                        onClick={() => handleInvite(user)}
                                        disabled={invitedIds.has(user.id) || sendingId === user.id}
                                        style={{ padding: "0.4rem 0.8rem", borderRadius: "999px", border: "none", cursor: invitedIds.has(user.id) ? "default" : "pointer", fontWeight: 600, fontSize: "0.78rem", background: invitedIds.has(user.id) ? "var(--bg-input)" : "var(--accent)", color: invitedIds.has(user.id) ? "var(--text-muted)" : "#fff", flexShrink: 0 }}
                                    >
                                        {sendingId === user.id ? "…" : invitedIds.has(user.id) ? "✓ Invited" : "Invite"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {inviteResults.length === 0 && inviteQuery && !inviteLoading && (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No users found for "{inviteQuery}".</p>
                    )}
                </div>

                {selectedStyles.length > 0 && (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
                        <h2 style={{ marginBottom: "0.5rem" }}>Suggested Dancers to Invite</h2>
                        <p className="subtitle" style={{ marginBottom: "1.5rem" }}>
                            These dancers match your event's dance styles. Send them a direct invitation!
                        </p>

                        {loadingSuggestions && <p className="state-msg">Finding matching dancers…</p>}

                        {!loadingSuggestions && suggestions.length === 0 && (
                            <p style={{ color: "var(--text-muted)" }}>No dancers with matching styles found yet. Invite them to join FOMO!</p>
                        )}

                        {!loadingSuggestions && suggestions.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                                {suggestions.map(dancer => (
                                    <div key={dancer.id} style={{ background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                                                {dancer.avatarUrl
                                                    ? <img src={dancer.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", color: "var(--text-muted)" }}>{(dancer.name || "?").charAt(0).toUpperCase()}</div>
                                                }
                                            </div>
                                            <div>
                                                <strong>{dancer.name || "Anonymous Dancer"}</strong>
                                                {dancer.city && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{dancer.city}</div>}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                                            {dancer.danceStyles.slice(0, 4).map(s => (
                                                <span key={s} style={{
                                                    background: selectedStyles.includes(s) ? "rgba(99,102,241,0.2)" : "var(--bg-input)",
                                                    color: selectedStyles.includes(s) ? "var(--accent)" : "var(--text-muted)",
                                                    border: `1px solid ${selectedStyles.includes(s) ? "var(--accent-border)" : "var(--border-light)"}`,
                                                    borderRadius: "var(--radius-full)", padding: "0.15rem 0.5rem", fontSize: "0.75rem",
                                                }}>
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                        {dancer.matchScore > 0 && (
                                            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                                {dancer.matchScore} matching style{dancer.matchScore > 1 ? "s" : ""}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleInvite(dancer)}
                                            disabled={invitedIds.has(dancer.id) || sendingId === dancer.id}
                                            style={{
                                                marginTop: "auto",
                                                padding: "0.55rem 1rem",
                                                borderRadius: "999px",
                                                border: "none",
                                                cursor: invitedIds.has(dancer.id) ? "default" : "pointer",
                                                fontWeight: 600,
                                                fontSize: "0.85rem",
                                                background: invitedIds.has(dancer.id) ? "var(--bg-input)" : "var(--accent)",
                                                color: invitedIds.has(dancer.id) ? "var(--text-muted)" : "#fff",
                                                transition: "opacity 0.2s",
                                            }}
                                        >
                                            {sendingId === dancer.id ? "Sending…" : invitedIds.has(dancer.id) ? "✓ Invited" : "Send Invitation"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        );
    }

    // ── Create Form ───────────────────────────────────────────────────────────
    return (
        <main className="page">
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h1 style={{ marginBottom: "0.5rem" }}>Create Event</h1>
                <p className="subtitle">Publish a new event, workshop, or course to the platform.</p>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) min(300px, 40%)", gap: "2rem", alignItems: "start" }}>
                    <div className="auth-form" style={{ margin: 0 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
                            <label style={{ gridColumn: "1 / -1" }}>
                                Title *
                                <input name="title" value={form.title} onChange={handleChange} placeholder="Event name" required />
                            </label>

                            <label style={{ gridColumn: "1 / -1" }}>
                                Description
                                <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="What's this event about?" />
                            </label>

                            <label style={{ gridColumn: "1 / -1" }}>
                                Location *
                                <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Sofia Dance Studio, Berlin, or Vienna" required />
                                <small style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>We'll automatically place this on the map.</small>
                            </label>

                            <label>
                                Start date &amp; time *
                                <input type="datetime-local" name="startAt" value={form.startAt} onChange={handleChange} required />
                            </label>

                            <label>
                                End date &amp; time
                                <input type="datetime-local" name="endAt" value={form.endAt} onChange={handleChange} />
                            </label>

                            <label>
                                Price (cents) *
                                <input type="number" name="priceCents" value={form.priceCents} onChange={handleChange} min={0} placeholder="e.g. 2500 for €25.00" required />
                            </label>

                            <label>
                                Capacity
                                <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} placeholder="Leave blank for unlimited" />
                            </label>
                        </div>

                        {/* Dance Styles */}
                        <div style={{ marginTop: "1.5rem" }}>
                            <label style={{ marginBottom: "0.5rem", display: "block", fontWeight: 600 }}>
                                Dance Styles
                                <small style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem" }}>Used to suggest matching dancers</small>
                            </label>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
                                {DANCE_STYLE_OPTIONS.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => toggleStyle(s)}
                                        style={{
                                            padding: "0.3rem 0.75rem",
                                            borderRadius: "var(--radius-full)",
                                            border: `1px solid ${selectedStyles.includes(s) ? "var(--accent)" : "var(--border-light)"}`,
                                            background: selectedStyles.includes(s) ? "rgba(99,102,241,0.2)" : "var(--bg-hover)",
                                            color: selectedStyles.includes(s) ? "var(--accent)" : "var(--text-muted)",
                                            cursor: "pointer",
                                            fontSize: "0.82rem",
                                            fontWeight: selectedStyles.includes(s) ? 600 : 400,
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                    value={styleInput}
                                    onChange={e => setStyleInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomStyle())}
                                    placeholder="Add custom style…"
                                    style={{ flex: 1, background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", padding: "0.5rem 0.85rem", color: "var(--text-main)", fontSize: "0.9rem" }}
                                />
                                <button type="button" onClick={addCustomStyle} style={{ padding: "0.5rem 1rem", background: "var(--bg-hover)", border: "1px solid var(--border-light)", borderRadius: "999px", cursor: "pointer", color: "var(--text-main)", fontSize: "0.85rem" }}>
                                    Add
                                </button>
                            </div>
                            {selectedStyles.length > 0 && (
                                <div style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                    Selected: {selectedStyles.join(", ")}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "0.75rem 2.5rem" }}>
                                {loading ? "Creating…" : "Create Event"}
                            </button>
                            <Link to="/dashboard" style={{ color: "var(--text-muted)", fontSize: "0.9rem", textDecoration: "none" }}>Cancel</Link>
                        </div>
                    </div>

                    {/* Right: Image Preview */}
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)", padding: "1.5rem", position: "sticky", top: "100px", boxShadow: "var(--shadow-md)" }}>
                        <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Cover Photo</h3>
                        <div style={{ width: "100%", aspectRatio: "16/9", background: form.imageUrl ? `url(${form.imageUrl}) center/cover no-repeat` : "var(--bg-input)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {!form.imageUrl && <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Image Preview</span>}
                        </div>
                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>Image URL or Upload</label>
                        <ImageUploadInput
                            value={form.imageUrl}
                            onChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
                            placeholder="https://... or click Upload"
                            showPreview={false}
                        />
                        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                            Paste a direct image link. 16:9 ratio recommended.
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}
