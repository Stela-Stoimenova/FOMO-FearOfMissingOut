import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchUsers } from "../api/users.js";

const ROLES = ["ALL", "DANCER", "STUDIO", "AGENCY"];
const STYLES = ["Hip Hop", "Contemporary", "Heels", "Ballet", "Breaking", "House", "Popping", "Commercial"];

const ROLE_COLORS = {
    DANCER: { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
    STUDIO: { bg: "rgba(16,185,129,0.12)", color: "#34d399" },
    AGENCY: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" },
};

export default function DiscoveryPage() {
    const [query, setQuery] = useState("");
    const [role, setRole] = useState("ALL");
    const [city, setCity] = useState("");
    const [style, setStyle] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, city, style, query]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const params = {};
            if (query.trim()) params.query = query.trim();
            if (role !== "ALL") params.role = role;
            if (city.trim()) params.city = city.trim();
            if (style) params.style = style;
            const data = await searchUsers(params);
            setResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page">
            <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2.25rem", fontWeight: 800, margin: "0 0 0.5rem 0", letterSpacing: "-0.02em" }}>
                    Discover the Network
                </h1>
                <p style={{ color: "var(--text-muted)", fontSize: "1rem", margin: 0 }}>
                    Find top dancers, studios, and agencies across Europe.
                </p>
            </header>

            {/* Search & Filters */}
            <section style={{ maxWidth: "900px", margin: "0 auto 3rem auto" }}>
                <form onSubmit={handleSearch} style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "1rem",
                    background: "var(--bg-card)",
                    padding: "1.5rem",
                    borderRadius: "20px",
                    border: "1px solid var(--border-light)",
                }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="discover-query">Search</label>
                        <input
                            id="discover-query"
                            name="query"
                            type="text"
                            className="form-input"
                            placeholder="Name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="discover-role">Role</label>
                        <select id="discover-role" name="role" className="filter-select" value={role} onChange={e => setRole(e.target.value)}>
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="discover-city">City</label>
                        <input
                            id="discover-city"
                            name="city"
                            type="text"
                            className="form-input"
                            placeholder="e.g. Sofia"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" htmlFor="discover-style">Style</label>
                        <select id="discover-style" name="style" className="filter-select" value={style} onChange={e => setStyle(e.target.value)}>
                            <option value="">Any Style</option>
                            {STYLES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                        <button type="button" onClick={() => { setQuery(""); setRole("ALL"); setCity(""); setStyle(""); }} style={{ padding: "0.6rem 1.25rem", background: "transparent", border: "1px solid var(--border-light)", borderRadius: "999px", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.9rem" }}>
                            Clear
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: "0.6rem 2rem", borderRadius: "999px" }}>
                            {loading ? "Searching…" : "Search"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Results */}
            <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                        <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-light)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem auto" }} />
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>Finding profiles…</p>
                    </div>
                ) : results.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                        <p style={{ margin: 0, fontSize: "1rem" }}>No profiles found matching your criteria.</p>
                        <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem" }}>Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                            {results.length} profile{results.length !== 1 ? "s" : ""} found
                        </p>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                            gap: "1.5rem",
                        }}>
                            {results.map((user) => {
                                const roleStyle = ROLE_COLORS[user.role] || { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
                                const initials = (user.name || "?").charAt(0).toUpperCase();
                                return (
                                    <Link
                                        to={`/users/${user.id}`}
                                        key={user.id}
                                        style={{ textDecoration: "none", color: "inherit", display: "flex" }}
                                    >
                                        <div
                                            className="detail-card"
                                            style={{
                                                width: "100%",
                                                height: "240px",
                                                display: "flex",
                                                flexDirection: "column",
                                                padding: "1.5rem",
                                                transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                                                cursor: "pointer",
                                                overflow: "hidden",
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = "translateY(-4px)";
                                                e.currentTarget.style.borderColor = "var(--accent-hover)";
                                                e.currentTarget.style.boxShadow = "0 16px 40px rgba(99,102,241,0.15)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = "none";
                                                e.currentTarget.style.borderColor = "var(--border-light)";
                                                e.currentTarget.style.boxShadow = "";
                                            }}
                                        >
                                            {/* Top row: avatar + name + role */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "0.875rem", flexShrink: 0 }}>
                                                <div style={{
                                                    width: "52px", height: "52px", borderRadius: "14px",
                                                    background: roleStyle.bg,
                                                    border: `1px solid ${roleStyle.color}30`,
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: "1.25rem", fontWeight: 800, color: roleStyle.color,
                                                    flexShrink: 0, overflow: "hidden",
                                                }}>
                                                    {user.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "13px" }} onError={e => { e.target.style.display = "none"; }} />
                                                    ) : initials}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <h3 style={{
                                                        margin: "0 0 0.2rem 0", fontSize: "1rem", fontWeight: 700,
                                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                    }}>{user.name || "Unnamed"}</h3>
                                                    <span style={{
                                                        fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.04em",
                                                        padding: "0.15rem 0.5rem", borderRadius: "6px",
                                                        background: roleStyle.bg, color: roleStyle.color,
                                                        textTransform: "uppercase",
                                                    }}>{user.role}</span>
                                                </div>
                                            </div>

                                            {/* City */}
                                            <div style={{ flexShrink: 0, marginBottom: "0.625rem", minHeight: "1.2rem" }}>
                                                {user.city && (
                                                    <p style={{
                                                        fontSize: "0.8rem", color: "var(--text-muted)", margin: 0,
                                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                    }}>
                                                        <span style={{ marginRight: "0.25rem", opacity: 0.6 }}>📍</span>{user.city}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Dance styles */}
                                            <div style={{ flex: 1, overflow: "hidden", display: "flex", alignItems: "flex-start" }}>
                                                {user.danceStyles?.length > 0 ? (
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                                                        {user.danceStyles.slice(0, 4).map(s => (
                                                            <span key={s} style={{
                                                                fontSize: "0.7rem", padding: "0.2rem 0.6rem",
                                                                borderRadius: "999px",
                                                                background: "rgba(99,102,241,0.12)",
                                                                color: "var(--accent)",
                                                                border: "1px solid var(--accent-border)",
                                                                whiteSpace: "nowrap",
                                                                fontWeight: 500,
                                                            }}>{s}</span>
                                                        ))}
                                                        {user.danceStyles.length > 4 && (
                                                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "0.2rem", alignSelf: "center" }}>
                                                                +{user.danceStyles.length - 4}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>No styles listed</span>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div style={{
                                                borderTop: "1px solid var(--border-light)",
                                                marginTop: "0.875rem", paddingTop: "0.75rem",
                                                display: "flex", justifyContent: "space-between",
                                                fontSize: "0.78rem", color: "var(--text-muted)",
                                                flexShrink: 0,
                                            }}>
                                                <span>{user._count?.followers ?? 0} followers</span>
                                                <span style={{ color: "var(--accent)", fontWeight: 600 }}>View →</span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </section>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </main>
    );
}
