import { useState, useEffect, useRef } from "react";
import { searchUsers } from "../api/users.js";

export default function UserSelect({ role, value, onChange, placeholder = "Search users..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!value) {
      setQuery("");
      setSelectedUser(null);
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || (selectedUser && selectedUser.name === query)) {
      if (!query.trim()) setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchUsers({ query, role });
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, role, selectedUser]);

  function handleSelect(user) {
    setSelectedUser(user);
    setQuery(user.name || user.email);
    setIsOpen(false);
    onChange(user.id);
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative", flex: 1 }}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selectedUser && e.target.value !== selectedUser.name) {
              setSelectedUser(null);
              onChange(null);
            }
          }}
          style={{ paddingRight: "2.5rem" }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
        />
        {loading && (
          <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
            <div className="spinner-small" style={{ width: "16px", height: "16px", border: "2px solid var(--border-light)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 100,
            background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "20px",
            listStyle: "none", margin: 0, padding: "8px", maxHeight: "280px", overflowY: "auto", 
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)", backdropFilter: "blur(10px)"
          }}
        >
          {results.map((u) => (
            <li
              key={u.id}
              onClick={() => handleSelect(u)}
              style={{
                display: "flex", alignItems: "center", gap: "1rem", padding: "10px 12px",
                cursor: "pointer", borderRadius: "12px", transition: "all 0.2s ease"
              }}
              className="search-result-item"
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px", background: "var(--bg-hover)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
                border: "1px solid var(--border-light)"
              }}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 600 }}>{(u.name || u.email).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.95rem", color: "var(--text-main)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || u.email.split('@')[0]}</span>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <span className="role-badge" style={{ fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>{u.role}</span>
                  {u.city && <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.city}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
