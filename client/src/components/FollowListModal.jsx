import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFollowers, getFollowing } from "../api/users.js";

export default function FollowListModal({ isOpen, onClose, type, userId }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !userId) return;

        setLoading(true);
        const fetchFn = type === "followers" ? getFollowers : getFollowing;

        fetchFn(userId)
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    }, [isOpen, type, userId]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
        }}>
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)",
                width: "100%",
                maxWidth: "400px",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "var(--shadow-lg)",
                animation: "fadeIn 0.2s ease-out"
            }}>
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid var(--border-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>
                        {type === "followers" ? "Followers" : "Following"}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent", border: "none",
                            color: "var(--text-muted)", fontSize: "1.5rem",
                            cursor: "pointer", lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                    {loading ? (
                        <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "2rem 0" }}>Loading...</p>
                    ) : users.length === 0 ? (
                        <p style={{ textAlign: "center", color: "var(--text-muted)", margin: "2rem 0" }}>
                            {type === "followers" ? "No followers yet." : "Not following anyone yet."}
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {users.map(u => (
                                <Link
                                    key={u.id}
                                    to={`/profile/${u.id}`}
                                    onClick={onClose}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "1rem",
                                        padding: "0.75rem",
                                        borderRadius: "var(--radius-md)",
                                        textDecoration: "none", color: "inherit",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <div style={{
                                        width: "40px", height: "40px", borderRadius: "50%",
                                        background: "var(--bg-input)", display: "flex",
                                        alignItems: "center", justifyContent: "center",
                                        fontSize: "0.9rem", fontWeight: "bold", overflow: "hidden",
                                        flexShrink: 0
                                    }}>
                                        {u.avatarUrl ? (
                                            <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            (u.name || "?").charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <span style={{ fontWeight: 600, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {u.name || "Unknown"}
                                            </span>
                                            <span className="role-badge" style={{ fontSize: "0.6rem", padding: "0.15rem 0.4rem" }}>
                                                {u.role}
                                            </span>
                                        </div>
                                        {u.city && (
                                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginTop: "0.15rem" }}>
                                                {u.city}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
