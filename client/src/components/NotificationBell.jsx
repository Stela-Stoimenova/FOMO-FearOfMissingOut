import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUnreadCount, getNotifications, markAllRead, markOneRead } from "../api/notifications.js";

const TYPE_CONFIG = {
  FOLLOW:           { bg: "rgba(99,102,241,0.15)",  stroke: "#6366f1",  d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  COLLAB_REQUEST:   { bg: "rgba(245,158,11,0.15)",  stroke: "#f59e0b",  d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
  COLLAB_ACCEPTED:  { bg: "rgba(16,185,129,0.15)",  stroke: "#10b981",  d: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" },
  COLLAB_DECLINED:  { bg: "rgba(239,68,68,0.15)",   stroke: "#ef4444",  d: "M18 6 6 18M6 6l12 12" },
  CV_TAG_ACCEPTED:  { bg: "rgba(16,185,129,0.15)",  stroke: "#10b981",  d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15l2 2 4-4" },
  CV_TAG_DECLINED:  { bg: "rgba(239,68,68,0.15)",   stroke: "#ef4444",  d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9.5 12.5l5 5m0-5-5 5" },
  ROSTER_INVITE:    { bg: "rgba(245,158,11,0.15)",  stroke: "#f59e0b",  d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  TICKET_PURCHASE:  { bg: "rgba(99,102,241,0.15)",  stroke: "#6366f1",  d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" },
};
const DEFAULT_ICON = { bg: "rgba(99,102,241,0.15)", stroke: "#6366f1", d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" };

function NotificationTypeIcon({ type, size = 16 }) {
  const cfg = TYPE_CONFIG[type] || DEFAULT_ICON;
  return (
    <div style={{ width: size + 16, height: size + 16, borderRadius: "8px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={cfg.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={cfg.d} />
      </svg>
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function loadCount() {
    try {
      const data = await getUnreadCount();
      setCount(data.count);
    } catch { /* non-critical */ }
  }

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }

  async function handleMarkAll() {
    try {
      await markAllRead();
      setCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  }

  async function handleClickNotification(n) {
    if (!n.isRead) {
      try {
        await markOneRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        setCount(c => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
    setOpen(false);
    if (n.linkPath) navigate(n.linkPath);
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={handleOpen}
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.4rem",
          borderRadius: "10px",
          color: "var(--text-main)",
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
        }}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-4px",
            background: "var(--warning)",
            color: "#fff",
            fontSize: "0.6rem",
            fontWeight: 800,
            borderRadius: "999px",
            padding: "0.1rem 0.3rem",
            minWidth: "16px",
            textAlign: "center",
            lineHeight: 1.4,
          }}>
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 10px)",
          width: "340px",
          maxHeight: "460px",
          overflowY: "auto",
          background: "var(--bg-card)",
          border: "1px solid var(--border-light)",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          zIndex: 1000,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-light)" }}>
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Notifications</span>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              {count > 0 && (
                <button onClick={handleMarkAll} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
                  Mark all read
                </button>
              )}
              <Link to="/notifications" onClick={() => setOpen(false)} style={{ color: "var(--text-muted)", fontSize: "0.8rem", textDecoration: "none" }}>
                See all
              </Link>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>No notifications yet.</div>
          ) : (
            <div>
              {notifications.slice(0, 10).map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "flex-start",
                    padding: "0.875rem 1.25rem",
                    cursor: n.linkPath ? "pointer" : "default",
                    background: n.isRead ? "transparent" : "rgba(99,102,241,0.06)",
                    borderBottom: "1px solid var(--border-light)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (n.linkPath) e.currentTarget.style.background = "var(--bg-hover)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(99,102,241,0.06)"; }}
                >
                  <div style={{ flexShrink: 0, marginTop: "2px" }}>
                    {n.actor?.avatarUrl ? (
                      <img src={n.actor.avatarUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <NotificationTypeIcon type={n.type} size={14} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-main)", lineHeight: 1.4 }}>{n.message}</p>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{timeAgo(n.createdAt)}</span>
                  </div>
                  {!n.isRead && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: "6px" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
