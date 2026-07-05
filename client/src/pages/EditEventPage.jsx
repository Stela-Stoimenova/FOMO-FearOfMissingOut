// EditEventPage.jsx — only the event's creator can access this page.
// Loads the current event data, lets the owner edit it, geocodes the location via Mapbox.
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getEventById, updateEvent } from "../api/events.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function toDateInput(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function toTimeInput(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(11, 16);
}

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

export default function EditEventPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [forbidden, setForbidden] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        imageUrl: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        priceCents: "",
        capacity: "",
    });

    // Load the event and enforce ownership immediately
    useEffect(() => {
        async function fetchEvent() {
            try {
                const data = await getEventById(id);

                // Compare numeric IDs — user.id from AuthContext is the real DB id
                if (data.creatorId !== user.id) {
                    setForbidden(true);
                    return;
                }

                setForm({
                    title: data.title ?? "",
                    description: data.description ?? "",
                    location: data.location ?? "",
                    imageUrl: data.imageUrl ?? "",
                    startDate: toDateInput(data.startAt),
                    startTime: toTimeInput(data.startAt),
                    endDate: toDateInput(data.endAt),
                    endTime: toTimeInput(data.endAt),
                    priceCents: data.priceCents ?? "",
                    capacity: data.capacity ?? "",
                });
            } catch (err) {
                setError(err.message || "Failed to load event.");
            } finally {
                setLoading(false);
            }
        }
        fetchEvent();
    }, [id, user.id]);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            // Geocode the location string → coordinates
            let coords = {};
            if (form.location) {
                try {
                    coords = await geocodeLocation(form.location);
                } catch (geoErr) {
                    setError(geoErr.message);
                    setSaving(false);
                    return;
                }
            }

            const startAt = form.startDate
                ? (form.startTime ? `${form.startDate}T${form.startTime}` : form.startDate)
                : "";
            const endAt = form.endDate
                ? (form.endTime ? `${form.endDate}T${form.endTime}` : form.endDate)
                : null;

            if (endAt && startAt && endAt <= startAt) {
                setError("End date/time must be after the start date/time.");
                setSaving(false);
                return;
            }

            const payload = {
                title: form.title,
                description: form.description || null,
                location: form.location,
                imageUrl: form.imageUrl?.trim() || "",
                startAt,
                endAt,
                priceCents: Number(form.priceCents),
                ...coords,
            };
            if (form.capacity) payload.capacity = Number(form.capacity);

            await updateEvent(id, payload);
            navigate(`/events/${id}`);
        } catch (err) {
            setError(err.message || "Failed to save changes.");
        } finally {
            setSaving(false);
        }
    }

    // ── States ──────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <main className="page page-narrow">
                <p className="state-msg">Loading event…</p>
            </main>
        );
    }

    if (forbidden) {
        return (
            <main className="page page-narrow">
                <div className="state-error" style={{ textAlign: "center", padding: "3rem" }}>
                    <h2 style={{ marginBottom: "0.75rem" }}>Access Denied</h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                        You can only edit events that you created.
                    </p>
                    <Link to="/" className="btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>
                        ← Back to events
                    </Link>
                </div>
            </main>
        );
    }

    if (error && !saving) {
        return (
            <main className="page page-narrow">
                <div className="state-error"><p>{error}</p></div>
                <Link to={`/events/${id}`} style={{ color: "var(--accent)" }}>← Cancel</Link>
            </main>
        );
    }

    // ── Form ────────────────────────────────────────────────────────────────────
    return (
        <main className="page">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Link to={`/events/${id}`} className="back-link">← Cancel</Link>
                <h1 style={{ marginTop: "1.5rem", marginBottom: "0.5rem" }}>Edit Event</h1>
                <p className="subtitle">Update the details for your event.</p>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit} className="edit-event-form">
                    {/* Left Column: Form Fields */}
                    <div className="auth-form" style={{ margin: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <label style={{ gridColumn: '1 / -1' }}>
                                Title *
                                <input id="edit-ev-title" name="title" value={form.title} onChange={handleChange} placeholder="Event name" required autoComplete="off" />
                            </label>

                            <label style={{ gridColumn: '1 / -1' }}>
                                Description
                                <textarea id="edit-ev-desc" name="description" value={form.description} onChange={handleChange} rows={4} placeholder="What's this event about?" autoComplete="off" />
                            </label>

                            <label style={{ gridColumn: '1 / -1' }}>
                                Location *
                                <input id="edit-ev-location" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Sofia Dance Studio, Berlin, or Millennium Complex Budapest" required autoComplete="off" />
                                <small style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: '0.25rem' }}>We'll automatically place this on the map.</small>
                            </label>

                            <label>
                                Start Date *
                                <input id="edit-ev-start-date" name="startDate" type="date" value={form.startDate} onChange={handleChange} required autoComplete="off" style={{ colorScheme: 'dark' }} />
                            </label>

                            <label>
                                Start Time *
                                <input id="edit-ev-start-time" name="startTime" type="time" value={form.startTime} onChange={handleChange} required autoComplete="off" style={{ colorScheme: 'dark' }} />
                            </label>

                            <label>
                                End Date
                                <input id="edit-ev-end-date" name="endDate" type="date" value={form.endDate} onChange={handleChange} autoComplete="off" style={{ colorScheme: 'dark' }} />
                            </label>

                            <label>
                                End Time
                                <input id="edit-ev-end-time" name="endTime" type="time" value={form.endTime} onChange={handleChange} autoComplete="off" style={{ colorScheme: 'dark' }} />
                            </label>

                            <label>
                                Price (cents) *
                                <input id="edit-ev-price" type="number" name="priceCents" value={form.priceCents} onChange={handleChange} min={0} placeholder="e.g. 2500 for €25.00" required autoComplete="off" />
                            </label>

                            <label>
                                Capacity
                                <input id="edit-ev-capacity" type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} placeholder="Leave blank for unlimited" autoComplete="off" />
                            </label>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.75rem 2.5rem' }}>
                                {saving ? "Saving…" : "Save Changes"}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Image Preview */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', position: 'sticky', top: '100px', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Cover Photo</h3>

                        <div style={{
                            width: '100%',
                            aspectRatio: '16/9',
                            background: form.imageUrl ? `url(${form.imageUrl}) center/cover no-repeat` : 'var(--bg-input)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-light)',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                        }}>
                            {!form.imageUrl && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Image Preview</span>
                            )}
                        </div>

                        <label>
                            Image URL
                            <input
                                id="edit-ev-image"
                                name="imageUrl"
                                autoComplete="off"
                                value={form.imageUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                                style={{ width: '100%', marginTop: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-light)', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}
                            />
                        </label>
                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Paste a direct link to an image. We recommend a 16:9 ratio for best appearance.
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}
