import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { getConversations, getThread, sendMessage, sendTypingSignal, getTypingStatus } from "../api/messages.js";
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
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [pollFailCount, setPollFailCount] = useState(0);
    const [mobileView, setMobileView] = useState("list"); // "list" | "thread"
    const threadEndRef = useRef(null);
    const activeThreadRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        loadConversations();
    }, [user]);

    // Keep ref in sync so polling closure has current activeThread
    useEffect(() => {
        activeThreadRef.current = activeThread;
    }, [activeThread]);

    // Poll active thread for new messages every 3 seconds
    useEffect(() => {
        if (!activeThread) return;
        setPollFailCount(0);
        const interval = setInterval(async () => {
            try {
                const messages = await getThread(activeThread.id);
                setPollFailCount(0);
                setThreadMessages(prev => {
                    if (messages.length !== prev.length) return messages;
                    return prev;
                });
            } catch {
                setPollFailCount(n => n + 1);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeThread?.id]);

    // Poll whether the active thread user is typing
    useEffect(() => {
        if (!activeThread) return;
        const interval = setInterval(async () => {
            try {
                const data = await getTypingStatus(activeThread.id);
                setOtherUserTyping(data.typing);
            } catch { /* non-critical */ }
        }, 2000);
        return () => clearInterval(interval);
    }, [activeThread?.id]);

    useEffect(() => {
        // Scroll to bottom of thread when messages change or typing indicator appears
        if (threadEndRef.current) {
            threadEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [threadMessages, otherUserTyping]);

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
        setMobileView("thread");
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

    function handleReplyChange(e) {
        setReplyContent(e.target.value);
        if (!activeThread) return;
        // Debounce typing signal — send at most once per 2s
        if (typingTimeoutRef.current) return;
        sendTypingSignal(activeThread.id).catch(() => {});
        typingTimeoutRef.current = setTimeout(() => {
            typingTimeoutRef.current = null;
        }, 2000);
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

            <div className="messages-layout">
                {/* ── Conversation Sidebar ── */}
                <div className={`messages-sidebar ${mobileView === "thread" ? "messages-sidebar--hidden" : ""}`}>
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
                                                <img src={conv.otherUser.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
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
                <div className={`messages-thread ${mobileView === "list" && !activeThread ? "messages-thread--hidden-mobile" : ""}`}>
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
                                {/* Back button — mobile only */}
                                <button
                                    className="messages-back-btn"
                                    onClick={() => setMobileView("list")}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", padding: "0.25rem", display: "none" }}
                                >
                                    ←
                                </button>
                                <Link to={`/users/${activeThread.id}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "inherit", textDecoration: "none", flex: 1 }}>
                                    <div style={{
                                        width: "36px", height: "36px", borderRadius: "50%",
                                        background: "var(--bg-input)", display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        fontSize: "0.85rem", fontWeight: "bold", overflow: "hidden"
                                    }}>
                                        {activeThread.avatarUrl ? (
                                            <img src={activeThread.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
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

                            {pollFailCount >= 3 && (
                                <div style={{ padding: "0.5rem 1rem", background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.25)", color: "var(--warning)", fontSize: "0.8rem", textAlign: "center" }}>
                                    Connection issue — messages may not update automatically.
                                </div>
                            )}

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
                                {otherUserTyping && (
                                    <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                        <div style={{
                                            padding: "0.6rem 1rem",
                                            borderRadius: "var(--radius-md) var(--radius-md) var(--radius-md) 4px",
                                            background: "var(--bg-hover)",
                                            display: "flex", alignItems: "center", gap: "4px"
                                        }}>
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginRight: "4px" }}>{activeThread.name} is typing</span>
                                            {[0, 1, 2].map(i => (
                                                <span key={i} style={{
                                                    width: "6px", height: "6px", borderRadius: "50%",
                                                    background: "var(--text-muted)",
                                                    display: "inline-block",
                                                    animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out`,
                                                }} />
                                            ))}
                                        </div>
                                    </div>
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
                                    id="reply-content"
                                    name="replyContent"
                                    autoComplete="off"
                                    value={replyContent}
                                    onChange={handleReplyChange}
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
