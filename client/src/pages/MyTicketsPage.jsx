import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyTickets, cancelTicket } from "../api/events.js";

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
    return `€${(cents / 100).toFixed(2)}`;
}

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTickets();
    }, []);

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

    async function handleCancel(e, ticketId) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to cancel this ticket? You will receive a 90% refund.")) return;
        
        try {
            await cancelTicket(ticketId);
            fetchTickets();
        } catch (err) {
            alert(err.message || "Failed to cancel ticket");
        }
    }

    if (loading && tickets.length === 0) {
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
            <h1 style={{ marginBottom: '0.5rem' }}>My Tickets</h1>
            <p className="subtitle" style={{ marginBottom: '2.5rem' }}>You have {tickets.length} ticket(s).</p>

            <div className="ticket-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {tickets.map((ticket) => (
                    <Link to={`/events/${ticket.eventId}`} key={ticket.id} className="ticket-card" style={{ 
                        textDecoration: 'none', 
                        color: 'inherit', 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'var(--bg-card)', 
                        borderRadius: '24px', 
                        border: '1px solid var(--border-light)',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        height: '100%' // Ensure all cards in a row have same height
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            width: '100%',
                            height: '200px',
                            backgroundImage: ticket.event.imageUrl ? `url(${ticket.event.imageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: 'var(--bg-hover)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {!ticket.event.imageUrl && (
                                <span style={{ opacity: 0.3, fontSize: '0.8rem', letterSpacing: '2px' }}>NO IMAGE</span>
                            )}
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 }}>{ticket.event.title}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span>{formatDate(ticket.event.startAt)}</span>
                                    <span>&bull;</span>
                                    <span>{ticket.event.location}</span>
                                </p>
                            </div>
                            
                            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                                {ticket.status === "CANCELLED" ? (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.08)', padding: '0.8rem 1rem', borderRadius: '16px' }}>
                                        <span style={{ color: "#ef4444", fontWeight: 800, fontSize: '0.8rem' }}>CANCELLED</span>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Refund: €{(ticket.refundAmount / 100).toFixed(2)}</span>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' }}>{formatPrice(ticket.priceCents)}</p>
                                            <span style={{ color: "var(--success)", fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirmed</span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleCancel(e, ticket.id)}
                                            style={{ 
                                                background: 'rgba(239, 68, 68, 0.1)', 
                                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                                color: '#ef4444', 
                                                padding: '0.6rem 1.2rem', 
                                                borderRadius: '12px', 
                                                fontSize: '0.85rem', 
                                                fontWeight: 700, 
                                                cursor: 'pointer', 
                                                transition: 'all 0.2s' 
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>

                ))}
            </div>
        </main>
    );
}
