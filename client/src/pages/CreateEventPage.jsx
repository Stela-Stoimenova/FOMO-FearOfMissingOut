// CreateEventPage.jsx — form for STUDIO / AGENCY to post a new event.
// Location is geocoded to lat/lng via Mapbox on submit — no manual coordinate entry.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent } from "../api/events.js";

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

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Geocode the location string to lat/lng before sending the event
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
                ...coords,
            };
            if (form.capacity) payload.capacity = Number(form.capacity);

            const data = await createEvent(payload);
            navigate(`/events/${data.id}`);
        } catch (err) {
            setError(err.message || "Failed to create event");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page">
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: "0.5rem" }}>Create Event</h1>
                <p className="subtitle">Publish a new event, workshop, or course to the platform.</p>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2.5rem', alignItems: 'start' }}>
                    {/* Left Column: Form Fields */}
                    <div className="auth-form" style={{ margin: 0 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <label style={{ gridColumn: '1 / -1' }}>
                                Title *
                                <input
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    placeholder="Event name"
                                    required
                                />
                            </label>

                            <label style={{ gridColumn: '1 / -1' }}>
                                Description
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="What's this event about?"
                                />
                            </label>

                            <label style={{ gridColumn: '1 / -1' }}>
                                Location *
                                <input
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Sofia Dance Studio, Berlin, or Vienna"
                                    required
                                />
                                <small style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: '0.25rem' }}>
                                    We'll automatically place this on the map.
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
                                Price (cents) *
                                <input
                                    type="number"
                                    name="priceCents"
                                    value={form.priceCents}
                                    onChange={handleChange}
                                    min={0}
                                    placeholder="e.g. 2500 for €25.00"
                                    required
                                />
                            </label>

                            <label>
                                Capacity
                                <input
                                    type="number"
                                    name="capacity"
                                    value={form.capacity}
                                    onChange={handleChange}
                                    min={1}
                                    placeholder="Leave blank for unlimited"
                                />
                            </label>
                        </div>
                        
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.75rem 2.5rem' }}>
                                {loading ? "Creating…" : "Create Event"}
                            </button>
                            <Link to="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>Cancel</Link>
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
                                name="imageUrl"
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
