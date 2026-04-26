import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getConversations, getThread, sendMessage } from "../api/messages.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function MessagesPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Thread state
    const [activeThread, setActiveThread] = useState(null); // { otherUser }
    const [threadMessages, setThreadMessages] = useState([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [replyContent, setReplyContent] = useState("");
    const [sending, setSending] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const threadEndRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        loadConversations();
    }, [user]);

    useEffect(() => {
        // Scroll to bottom of thread when messages change
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [threadMessages]);

    async function loadConversations() {
        setLoading(true);
        setError(null);
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            setError(err.message || "Failed to load conversations");
        } finally {
            setLoading(false);
        }
    }

    async function openThread(otherUser) {
        setActiveThread(otherUser);
        setThreadLoading(true);
        try {
            const messages = await getThread(otherUser.id);
            setThreadMessages(messages);
            // Refresh conversation list to update unread counts
            loadConversations();
        } catch (err) {
            setError(err.message || "Failed to load thread");
        } finally {
            setThreadLoading(false);
        }
    }

    async function handleSendReply() {
        if (!replyContent.trim() || !activeThread) return;
        setSending(true);
        try {
            const newMsg = await sendMessage(activeThread.id, replyContent);
            setThreadMessages(prev => [...prev, newMsg]);
            setReplyContent("");
            // Update conversation list with latest message
            loadConversations();
        } catch (err) {
            setErrorMsg(err.message || "Failed to send message");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setSending(false);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendReply();
        }
    }

    if (!user) {
        return <main className="page page-narrow"><p className="state-msg">Please log in to view messages.</p></main>;
    }

    return (
        <main className="page" style={{ maxWidth: "900px" }}>
            <h1 className="page-title">Messages</h1>

            {errorMsg && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--warning)', borderRadius: '16px', color: 'var(--warning)', marginBottom: '1.5rem', fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
                    {errorMsg}
                </div>
            )}

            <div style={{ display: "flex", gap: "1.5rem", minHeight: "500px" }}>
                {/* ── Conversation Sidebar ── */}
                <div style={{
                    width: "300px", flexShrink: 0,
                    background: "var(--bg-card)", borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)", overflow: "hidden",
                    display: "flex", flexDirection: "column"
                }}>
                    <div style={{ padding: "1rem", borderBottom: "1px solid var(--border-light)", fontWeight: 600, fontSize: "0.95rem" }}>
                        Conversations
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {loading ? (
                            <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading...</p>
                        ) : conversations.length === 0 ? (
                            <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>No conversations yet. Send a message from someone's profile to start.</p>
                        ) : (
                            conversations.map(conv => {
                                const isActive = activeThread?.id === conv.otherUser.id;
                                return (
                                    <div
                                        key={conv.otherUser.id}
                                        onClick={() => openThread(conv.otherUser)}
                                        style={{
                                            padding: "0.85rem 1rem",
                                            cursor: "pointer",
                                            background: isActive ? "var(--bg-hover)" : "transparent",
                                            borderLeft: isActive ? "3px solid var(--accent)" : "3px solid transparent",
                                            transition: "background 0.15s",
                                            display: "flex", alignItems: "center", gap: "0.75rem",
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--bg-hover)"; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <div style={{
                                            width: "36px", height: "36px", borderRadius: "50%",
                                            background: "var(--bg-input)", display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            fontSize: "0.85rem", fontWeight: "bold", flexShrink: 0,
                                            overflow: "hidden"
                                        }}>
                                            {conv.otherUser.avatarUrl ? (
                                                <img src={conv.otherUser.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            ) : (
                                                (conv.otherUser.name || "?").charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{conv.otherUser.name || "Unknown"}</span>
                                                {conv.unreadCount > 0 && (
                                                    <span style={{
                                                        background: "var(--accent)", color: "#fff",
                                                        borderRadius: "10px", padding: "0.1rem 0.5rem",
                                                        fontSize: "0.7rem", fontWeight: 700
                                                    }}>{conv.unreadCount}</span>
                                                )}
                                            </div>
                                            <p style={{
                                                margin: 0, fontSize: "0.8rem", color: "var(--text-muted)",
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                            }}>
                                                {conv.lastMessage.senderId === user.id ? "You: " : ""}
                                                {conv.lastMessage.content}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Thread Panel ── */}
                <div style={{
                    flex: 1,
                    background: "var(--bg-card)", borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    display: "flex", flexDirection: "column"
                }}>
                    {!activeThread ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "0.95rem" }}>
                            Select a conversation to view messages
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div style={{
                                padding: "1rem 1.25rem",
                                borderBottom: "1px solid var(--border-light)",
                                display: "flex", alignItems: "center", gap: "0.75rem"
                            }}>
                                <Link to={`/users/${activeThread.id}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "inherit", textDecoration: "none" }}>
                                    <div style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        background: "var(--bg-input)", display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        fontSize: "0.85rem", fontWeight: "bold", overflow: "hidden"
                                    }}>
                                        {activeThread.avatarUrl ? (
                                            <img src={activeThread.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            (activeThread.name || "?").charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{activeThread.name}</span>
                                        <span className="role-badge" style={{ fontSize: "0.6rem", marginLeft: "0.5rem" }}>{activeThread.role}</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Thread Messages */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {threadLoading ? (
                                    <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading messages...</p>
                                ) : threadMessages.length === 0 ? (
                                    <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No messages yet. Start the conversation!</p>
                                ) : (
                                    threadMessages.map(msg => {
                                        const isMine = msg.senderId === user.id;
                                        return (
                                            <div key={msg.id} style={{
                                                display: "flex",
                                                justifyContent: isMine ? "flex-end" : "flex-start",
                                            }}>
                                                <div style={{
                                                    maxWidth: "75%",
                                                    padding: "0.75rem 1rem",
                                                    borderRadius: isMine ? "var(--radius-md) var(--radius-md) 4px var(--radius-md)" : "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
                                                    background: isMine ? "var(--accent)" : "var(--bg-hover)",
                                                    color: isMine ? "#fff" : "var(--text-main)",
                                                    fontSize: "0.9rem",
                                                    lineHeight: 1.5,
                                                }}>
                                                    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                                                    <span style={{
                                                        display: "block", marginTop: "0.3rem",
                                                        fontSize: "0.7rem",
                                                        opacity: 0.6
                                                    }}>
                                                        {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={threadEndRef} />
                            </div>

                            {/* Reply Composer */}
                            <div style={{
                                padding: "1rem 1.25rem",
                                borderTop: "1px solid var(--border-light)",
                                display: "flex", gap: "0.75rem"
                            }}>
                                <textarea
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    rows={1}
                                    style={{
                                        flex: 1, padding: "0.6rem 0.75rem",
                                        background: "var(--bg-input)", border: "1px solid var(--border-light)",
                                        borderRadius: "var(--radius-sm)", color: "var(--text-main)",
                                        fontFamily: "inherit", fontSize: "0.9rem", resize: "none"
                                    }}
                                />
                                <button
                                    className="btn-primary"
                                    onClick={handleSendReply}
                                    disabled={sending || !replyContent.trim()}
                                    style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem", flexShrink: 0 }}
                                >
                                    {sending ? "..." : "Send"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
