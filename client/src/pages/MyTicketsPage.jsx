// My Tickets page — shows all tickets the logged-in dancer has purchased
// Will call GET /api/events/me/tickets when backend is connected
import { Link } from "react-router-dom";

export default function MyTicketsPage() {
    // Placeholder tickets — will come from the API later
    const tickets = [
        { id: 1, eventTitle: "Urban Salsa Night", location: "Sofia", startAt: "2026-04-10 19:00", priceCents: 1500 },
        { id: 2, eventTitle: "Bachata Social", location: "Plovdiv", startAt: "2026-04-20 20:00", priceCents: 800 },
    ];

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
                            <h3>{ticket.eventTitle}</h3>
                            <p>📍 {ticket.location}</p>
                            <p>📅 {ticket.startAt}</p>
                        </div>
                        <div className="ticket-card-price">
                            {(ticket.priceCents / 100).toFixed(2)} лв
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
