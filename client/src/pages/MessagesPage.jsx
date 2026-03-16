import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInbox, getSentMessages, markMessageRead } from "../api/messages.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MessagesPage() {
    const { user } = useAuth();
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState("inbox"); // 'inbox' | 'sent'

    useEffect(() => {
        if (!user) return;
        loadMessages();
    }, [user]);

    async function loadMessages() {
        setLoading(true);
        setError(null);
        try {
            const [inboxData, sentData] = await Promise.all([
                getInbox(),
                getSentMessages(),
            ]);
            setInbox(inboxData);
            setSent(sentData);
        } catch (err) {
            setError(err.message || "Failed to load messages");
        } finally {
            setLoading(false);
        }
    }

    async function handleMarkRead(msg) {
        if (view === "sent" || msg.readAt) return;
        try {
            await markMessageRead(msg.id);
            setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, readAt: new Date().toISOString() } : m));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    }

    if (!user) {
        return <main className="page page-narrow"><p className="state-msg">Please log in to view messages.</p></main>;
    }

    const messages = view === "inbox" ? inbox : sent;

    return (
        <main className="page page-narrow">
            <h1 className="page-title">Messages</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                <button
                    onClick={() => setView("inbox")}
                    style={{ background: 'transparent', border: 'none', color: view === "inbox" ? 'var(--accent)' : 'var(--text-muted)', fontWeight: view === "inbox" ? 600 : 400, fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}
                >
                    Inbox ({inbox.filter(m => !m.readAt).length} unread)
                </button>
                <button
                    onClick={() => setView("sent")}
                    style={{ background: 'transparent', border: 'none', color: view === "sent" ? 'var(--accent)' : 'var(--text-muted)', fontWeight: view === "sent" ? 600 : 400, fontSize: '1.1rem', cursor: 'pointer', padding: 0 }}
                >
                    Sent
                </button>
            </div>

            {loading ? (
                <p className="state-msg">Loading messages…</p>
            ) : error ? (
                <div className="state-error"><p>{error}</p></div>
            ) : messages.length === 0 ? (
                <div className="state-msg" style={{ padding: '3rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        {view === "inbox" ? "You have no messages." : "You haven't sent any messages yet."}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map(msg => {
                        const isUnread = view === "inbox" && !msg.readAt;
                        const otherUser = view === "inbox" ? msg.sender : msg.receiver;

                        return (
                            <div
                                key={msg.id}
                                onClick={() => handleMarkRead(msg)}
                                style={{
                                    padding: '1.25rem',
                                    background: isUnread ? 'var(--bg-hover)' : 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: `1px solid ${isUnread ? 'var(--accent-border)' : 'var(--border-light)'}`,
                                    cursor: isUnread ? 'pointer' : 'default',
                                    transition: 'background 0.2s',
                                    position: 'relative'
                                }}
                            >
                                {isUnread && (
                                    <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <Link
                                        to={`/profile/${otherUser.id}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit', textDecoration: 'none' }}
                                    >
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                            {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{otherUser.name || 'Unknown User'}</span>
                                        <span className="role-badge" style={{ fontSize: '0.65rem' }}>{otherUser.role}</span>
                                    </Link>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                    </span>
                                </div>

                                <p style={{ margin: 0, color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                    {msg.content}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
