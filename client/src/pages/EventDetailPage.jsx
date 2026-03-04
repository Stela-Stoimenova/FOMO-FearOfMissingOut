// Event detail page — shows info about one event
// The :id from the URL is read with useParams()
import { useParams } from "react-router-dom";

export default function EventDetailPage() {
    const { id } = useParams(); // reads the :id from /events/:id

    // Placeholder data — will come from the API later
    const event = {
        id,
        title: "Urban Salsa Night",
        description: "A vibrant salsa social with live DJ and open floor dancing.",
        location: "Sofia, Bulgaria",
        startAt: "2026-04-10 19:00",
        priceCents: 1500,
        capacity: 80,
        ticketsSold: 45,
    };

    return (
        <main className="page page-narrow">
            <h1>{event.title}</h1>
            <p className="subtitle">{event.description}</p>

            <div className="detail-grid">
                <div className="detail-item">📍 <strong>Location:</strong> {event.location}</div>
                <div className="detail-item">📅 <strong>Date:</strong> {event.startAt}</div>
                <div className="detail-item">🎟 <strong>Price:</strong> {(event.priceCents / 100).toFixed(2)} лв</div>
                <div className="detail-item">👥 <strong>Capacity:</strong> {event.ticketsSold} / {event.capacity}</div>
            </div>

            <button className="btn-primary">Buy Ticket</button>
            <p className="hint">You need to be logged in as a DANCER to buy tickets.</p>
        </main>
    );
}
