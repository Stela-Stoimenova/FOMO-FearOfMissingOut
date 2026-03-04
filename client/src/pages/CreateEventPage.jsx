// Create Event page — form for STUDIO / AGENCY to post a new event
// Will call POST /api/events when backend is connected
import { useState } from "react";
import { Link } from "react-router-dom";

export default function CreateEventPage() {
    const [form, setForm] = useState({
        title: "",
        description: "",
        location: "",
        startAt: "",
        endAt: "",
        priceCents: "",
        capacity: "",
    });

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleSubmit(e) {
        e.preventDefault();
        // TODO: call POST /api/events with form data (convert priceCents to number)
        alert(`Event "${form.title}" created! (backend not connected yet)`);
    }

    return (
        <main className="page page-narrow">
            <h1>Create Event</h1>
            <p className="subtitle">Only Studios and Agencies can create events.</p>

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
                    Price (in stotinki, e.g. 1500 = 15.00 лв) *
                    <input type="number" name="priceCents" value={form.priceCents} onChange={handleChange} min={0} placeholder="1500" required />
                </label>

                <label>
                    Capacity (leave blank for unlimited)
                    <input type="number" name="capacity" value={form.capacity} onChange={handleChange} min={1} placeholder="50" />
                </label>

                <button type="submit" className="btn-primary">Create Event</button>
            </form>

            <p className="hint">
                <Link to="/dashboard">← Back to Dashboard</Link>
            </p>
        </main>
    );
}
