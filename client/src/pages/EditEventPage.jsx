// EditEventPage.jsx — only the event's creator can access this page.
// Loads the current event data, lets the owner edit it, geocodes the location via Mapbox.
import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getEventById, updateEvent } from "../api/events.js";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Convert an ISO date string to the format required by <input type="datetime-local">
function toDatetimeLocal(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
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
        startAt: "",
        endAt: "",
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
                    startAt: toDatetimeLocal(data.startAt),
                    endAt: toDatetimeLocal(data.endAt),
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

            const payload = {
                title: form.title,
                description: form.description || null,
                location: form.location,
                imageUrl: form.imageUrl || null,
                startAt: form.startAt,
                endAt: form.endAt || null,
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
        <main className="page page-narrow">
            <Link to={`/events/${id}`} className="back-link">← Cancel</Link>
            <h1 style={{ marginTop: "1.5rem" }}>Edit Event</h1>
            <p className="subtitle">Update the details for your event.</p>

            {error && <div className="form-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Title *
                    <input
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Event name"
                        required
                    />
                </label>

                <label>
                    Description
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="What's this event about?"
                    />
                </label>

                <label>
                    Cover Photo URL
                    <input
                        name="imageUrl"
                        value={form.imageUrl}
                        onChange={handleChange}
                        placeholder="https://images.unsplash.com/..."
                    />
                    <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        Paste a direct image URL. The photo will appear on the event card and detail page.
                    </small>
                </label>

                <label>
                    Location *
                    <input
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        placeholder="e.g. Sofia Dance Studio, Berlin, or Millennium Complex Budapest"
                        required
                    />
                    <small style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        We'll automatically place this on the map using Mapbox.
                    </small>
                </label>

                <label>
                    Start date &amp; time *
                    <input
                        type="datetime-local"
                        name="startAt"
                        value={form.startAt}
                        onChange={handleChange}
                        required
                    />
                </label>

                <label>
                    End date &amp; time
                    <input
                        type="datetime-local"
                        name="endAt"
                        value={form.endAt}
                        onChange={handleChange}
                    />
                </label>

                <label>
                    Price (in cents — e.g. 2500 = €25.00) *
                    <input
                        type="number"
                        name="priceCents"
                        value={form.priceCents}
                        onChange={handleChange}
                        min={0}
                        placeholder="2500"
                        required
                    />
                </label>

                <label>
                    Capacity (leave blank for unlimited)
                    <input
                        type="number"
                        name="capacity"
                        value={form.capacity}
                        onChange={handleChange}
                        min={1}
                        placeholder="50"
                    />
                </label>

                <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? "Saving…" : "Save Changes"}
                </button>
            </form>
        </main>
    );
}
