import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyTickets, cancelTicket } from "../api/events.js";
import Toast, { showToast, friendlyError } from "../components/Toast.jsx";

function formatDate(isoString) {
    return new Date(isoString).toLocaleString(navigator.language, {
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

function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-lg)', padding: '2rem', maxWidth: '400px', width: '90%',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <p style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>{message}</p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        Keep Ticket
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Cancel Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}

function getRefundTier(eventStartAt) {
    const hours = (new Date(eventStartAt) - new Date()) / (1000 * 60 * 60);
    if (hours >= 168) return { rate: 80, label: "80% refund — cancelled 7+ days before the event" };
    if (hours >= 48)  return { rate: 50, label: "50% refund — cancelled 2–7 days before the event" };
    return { rate: 0, label: "No refund — cancelled under 48 hours before the event" };
}

export default function MyTicketsPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmTicket, setConfirmTicket] = useState(null);

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

    function handleCancelClick(e, ticket) {
        e.preventDefault();
        e.stopPropagation();
        setConfirmTicket(ticket);
    }

    async function handleConfirmCancel() {
        const ticket = confirmTicket;
        setConfirmTicket(null);
        try {
            const result = await cancelTicket(ticket.id);
            const refundEuros = (result.refundAmount / 100).toFixed(2);
            const tierMessages = {
                early: `Ticket cancelled. You will receive a €${refundEuros} refund (80% — cancelled 7+ days before the event).`,
                mid:   `Ticket cancelled. You will receive a €${refundEuros} refund (50% — cancelled 2–7 days before the event).`,
                late:  "Ticket cancelled. No refund applies — cancellation was under 48 hours before the event.",
            };
            showToast(setToast, tierMessages[result.refundTier] ?? "Ticket cancelled.", "success");
            setTickets(prev => prev.map(t =>
                t.id === ticket.id
                    ? { ...t, status: "CANCELLED", refundAmount: result.refundAmount }
                    : t
            ));
        } catch (err) {
            showToast(setToast, friendlyError(err));
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

    const now = new Date();
    const upcoming  = tickets.filter(t => t.status !== "CANCELLED" && new Date(t.event.startAt) > now);
    const visited   = tickets.filter(t => t.status !== "CANCELLED" && new Date(t.event.startAt) <= now);
    const cancelled = tickets.filter(t => t.status === "CANCELLED");

    function TicketSection({ title, items, accent }) {
        if (items.length === 0) return null;
        return (
            <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: accent }} />
                    {title} <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>({items.length})</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {items.map(ticket => renderCard(ticket))}
                </div>
            </section>
        );
    }

    function renderCard(ticket) {
        return (
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
                        height: '100%'
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
                                        {new Date(ticket.event.startAt) > new Date() && (
                                            <button
                                                onClick={(e) => handleCancelClick(e, ticket)}
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
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
        );
    }

    return (
        <main className="page">
            <Toast toast={toast} onClose={() => setToast(null)} />
            {confirmTicket && (
                <ConfirmModal
                    message={`Are you sure you want to cancel this ticket? ${getRefundTier(confirmTicket.event.startAt).label}.`}
                    onConfirm={handleConfirmCancel}
                    onCancel={() => setConfirmTicket(null)}
                />
            )}

            <h1 style={{ marginBottom: '0.5rem' }}>My Tickets</h1>
            <p className="subtitle" style={{ marginBottom: '2.5rem' }}>You have {tickets.filter(t => t.status !== 'CANCELLED').length} active ticket(s).</p>

            <TicketSection title="Upcoming Events" items={upcoming} accent="var(--accent)" />
            <TicketSection title="Already Attended" items={visited} accent="var(--success)" />
            <TicketSection title="Cancelled" items={cancelled} accent="var(--danger)" />
        </main>
    );
}
