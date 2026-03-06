// My Tickets page — shows all tickets the logged-in dancer has purchased
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyTickets } from "../api/events.js";

function formatDate(isoString) {
    return new Date(isoString).toLocaleString("bg-BG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatPrice(cents) {
    return `${(cents / 100).toFixed(2)} лв`;
}

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchTickets() {
            setLoading(true);
            setError(null);
            try {
                const data = await getMyTickets();
                setTickets(data);
            } catch (err) {
                setError(err.message || "Failed to load tickets");
            } finally {
                setLoading(false);
            }
        }

        fetchTickets();
    }, []);

    if (loading) {
        return (
            <main className="page page-narrow">
                <p className="state-msg">Loading tickets…</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="page page-narrow">
                <div className="form-error">{error}</div>
                <Link to="/dashboard">← Back to Dashboard</Link>
            </main>
        );
    }

    if (tickets.length === 0) {
        return (
            <main className="page page-narrow">
                <h1>My Tickets</h1>
                <p className="subtitle">You haven't bought any tickets yet.</p>
                <Link to="/" className="btn-primary">Browse Events</Link>
            </main>
        );
    }

    return (
        <main className="page">
            <h1>My Tickets 🎟</h1>
            <p className="subtitle">You have {tickets.length} ticket(s).</p>

            <div className="ticket-list">
                {tickets.map((ticket) => (
                    <div key={ticket.id} className="ticket-card">
                        <div className="ticket-card-left">🎶</div>
                        <div className="ticket-card-body">
                            <h3>{ticket.event.title}</h3>
                            <p>📍 {ticket.event.location}</p>
                            <p>📅 {formatDate(ticket.event.startAt)}</p>
                        </div>
                        <div className="ticket-card-price">
                            {formatPrice(ticket.priceCents)}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
