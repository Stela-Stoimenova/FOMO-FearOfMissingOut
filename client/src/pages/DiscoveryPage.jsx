import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { searchUsers } from "../api/users.js";

const ROLES = ["ALL", "DANCER", "STUDIO", "AGENCY"];
const STYLES = ["Hip Hop", "Contemporary", "Heels", "Ballet", "Breaking", "House", "Popping", "Commercial"];

export default function DiscoveryPage() {
    const [query, setQuery] = useState("");
    const [role, setRole] = useState("ALL");
    const [city, setCity] = useState("");
    const [style, setStyle] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        handleSearch();
    }, [role, city, style]); // Auto search when filters change

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
            <header className="page-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
                <h1>Discover the Network</h1>
                <p className="subtitle">Find top dancers, studios, and agencies across Europe.</p>
            </header>

            {/* Search Bar & Filters */}
            <section style={{ maxWidth: '900px', margin: '0 auto 3rem auto' }}>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", background: "var(--bg-card)", padding: "1.5rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)" }}>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label">Search Name</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Maria Ivanova..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                        <label className="form-label">Role</label>
                        <select className="filter-select" value={role} onChange={e => setRole(e.target.value)}>
                            {ROLES.map(r => (
                                <option key={r} value={r}>{r === "ALL" ? "All Roles" : r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                        <label className="form-label">City</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Sofia"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </div>

                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
                        <label className="form-label">Dance Style</label>
                        <select className="filter-select" value={style} onChange={e => setStyle(e.target.value)}>
                            <option value="">Any Style</option>
                            {STYLES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </div>
                </form>
            </section>

            {/* Results Grid */}
            <section style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {loading ? (
                    <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading profiles...</p>
                ) : results.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--text-muted)" }}>No profiles found matching your criteria.</p>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
                        {results.map((user) => (
                            <Link to={`/users/${user.id}`} key={user.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="detail-card" style={{ height: "100%", display: "flex", flexDirection: "column", transition: "transform 0.2s ease, border-color 0.2s ease", cursor: "pointer" }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-hover)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                                        <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "var(--accent-soft)", border: "1px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: 700, color: "var(--accent)" }}>
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                            ) : (
                                                user.name ? user.name.charAt(0).toUpperCase() : "?"
                                            )}
                                        </div>
                                        <div>
                                            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>{user.name}</h3>
                                            <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "var(--radius-sm)", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>
                                                {user.role}
                                            </span>
                                        </div>
                                    </div>

                                    {user.city && (
                                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                                            {user.city}
                                        </p>
                                    )}

                                    {user.danceStyles?.length > 0 && (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "auto" }}>
                                            {user.danceStyles.slice(0, 3).map(s => (
                                                <span key={s} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "100px", background: "var(--bg-hover)", color: "var(--text-main)" }}>
                                                    {s}
                                                </span>
                                            ))}
                                            {user.danceStyles.length > 3 && (
                                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+{user.danceStyles.length - 3}</span>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ borderTop: "1px solid var(--border-light)", marginTop: "1rem", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        <span>{user._count.followers} Followers</span>
                                        <span style={{ color: "var(--accent)" }}>View Profile &rarr;</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
