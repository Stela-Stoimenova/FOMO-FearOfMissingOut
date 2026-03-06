// Create Event page — form for STUDIO / AGENCY to post a new event
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent } from "../api/events.js";

export default function CreateEventPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        startAt: "",
        endAt: "",
        priceCents: "",
        capacity: "",
        latitude: "",
        longitude: "",
    });

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Convert string inputs to proper types for the API
        const payload = {
            ...form,
            priceCents: Number(form.priceCents),
        };

        // Optional numbers
        if (form.capacity) payload.capacity = Number(form.capacity);
        else delete payload.capacity;

        if (form.latitude) payload.latitude = Number(form.latitude);
        else delete payload.latitude;

        if (form.longitude) payload.longitude = Number(form.longitude);
        else delete payload.longitude;

        if (!form.description) delete payload.description;
        if (!form.endAt) delete payload.endAt;

        try {
            const data = await createEvent(payload);
            // Redirect to the newly created event's detail page
            navigate(`/events/${data.id}`);
        } catch (err) {
            setError(err.message || "Failed to create event");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="page page-narrow">
            <h1>Create Event</h1>
            <p className="subtitle">Only Studios and Agencies can create events.</p>

            {error && <div className="form-error">{error}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Title *
                    <input name="title" value={form.title} onChange={handleChange} placeholder="Event name" required />
                </label>

                <label>
                    Description
                    <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="What's this event about?" />
                </label>

                <label>
                    Location *
                    <input name="location" value={form.location} onChange={handleChange} placeholder="City, Venue" required />
                </label>

                <label>
                    Start date & time *
                    <input type="datetime-local" name="startAt" value={form.startAt} onChange={handleChange} required />
                </label>

                <label>
                    End date & time
                    <input type="datetime-local" name="endAt" value={form.endAt} onChange={handleChange} />
                </label>

                <label>
                    Price (in cents, e.g. 2500 = €25.00) *
                    <input type="number" name="priceCents" value={form.priceCents} onChange={handleChange} min={0} placeholder="2500" required />
                </label>

                <label>
                    Capacity (leave blank for unlimited)
                    <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} placeholder="50" />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <label>
                        Latitude
                        <input type="number" step="any" name="latitude" value={form.latitude} onChange={handleChange} placeholder="42.6977" />
                    </label>
                    <label>
                        Longitude
                        <input type="number" step="any" name="longitude" value={form.longitude} onChange={handleChange} placeholder="23.3219" />
                    </label>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? "Creating…" : "Create Event"}
                </button>
            </form>

            <p className="hint">
                <Link to="/dashboard">← Back to Dashboard</Link>
            </p>
        </main>
    );
}
