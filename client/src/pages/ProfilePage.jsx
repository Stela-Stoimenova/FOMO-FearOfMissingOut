import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { updateMe, getMe } from "../api/users.js";

const ALL_STYLES = ["Hip Hop", "Contemporary", "Heels", "Ballet", "Breaking", "House", "Popping", "Commercial", "Jazz", "Afro"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // Form state
    const [form, setForm] = useState({
        name: "", avatarUrl: "", bio: "", city: "",
        danceStyles: [], experienceLevel: "", portfolioLinks: [], payoutDetails: "",
    });
    const [newLink, setNewLink] = useState("");

    // Load fresh profile data
    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || "",
                avatarUrl: user.avatarUrl || "",
                bio: user.bio || "",
                city: user.city || "",
                danceStyles: user.danceStyles || [],
                experienceLevel: user.experienceLevel || "",
                portfolioLinks: user.portfolioLinks || [],
                payoutDetails: user.payoutDetails || "",
            });
        }
    }, [user]);

    if (!user) {
        return (
            <main className="page page-narrow">
                <div className="state-error">You must be logged in to view your profile.</div>
            </main>
        );
    }

    const Initials = (user.name || user.email).charAt(0).toUpperCase();
    const isDancer = user.role === "DANCER";

    function toggleStyle(style) {
        setForm(prev => ({
            ...prev,
            danceStyles: prev.danceStyles.includes(style)
                ? prev.danceStyles.filter(s => s !== style)
                : [...prev.danceStyles, style]
        }));
    }

    function addPortfolioLink() {
        if (newLink.trim() && !form.portfolioLinks.includes(newLink.trim())) {
            setForm(prev => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, newLink.trim()] }));
            setNewLink("");
        }
    }

    function removePortfolioLink(link) {
        setForm(prev => ({ ...prev, portfolioLinks: prev.portfolioLinks.filter(l => l !== link) }));
    }

    async function handleSave() {
        setSaving(true);
        setSuccessMsg("");
        try {
            const updated = await updateMe(form);
            // Re-fetch full profile to get loyaltyAccount etc
            const fullProfile = await getMe();
            setUser(fullProfile);
            setEditing(false);
            setSuccessMsg("Profile saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            alert(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    }

    // ─── VIEW MODE ─────────────────────────────────────────────────
    if (!editing) {
        return (
            <main className="page" style={{ maxWidth: '800px' }}>
                <Link to="/dashboard" className="back-link">← Dashboard</Link>

                {successMsg && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        ✓ {successMsg}
                    </div>
                )}

                {/* Profile Header */}
                <div className="detail-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem', padding: '2.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="profile-avatar" style={{ overflow: 'hidden', width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-hover), var(--bg-card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', border: '3px solid var(--border-light)', flexShrink: 0 }}>
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span>{Initials}</span>
                            )}
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>{user.name || user.email.split('@')[0]}</h1>
                            <span className="role-badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem' }}>{user.role}</span>
                            {user.experienceLevel && (
                                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{user.experienceLevel}</span>
                            )}
                        </div>
                        {user.city && <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📍 {user.city}</p>}
                        {user.bio && <p style={{ color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{user.bio}</p>}

                        {/* Stats row */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {user._count && (
                                <>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text-main)' }}>{user._count.followers}</strong> followers</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--text-main)' }}>{user._count.following}</strong> following</span>
                                </>
                            )}
                            {isDancer && user.loyaltyAccount && (
                                <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}>🌟 {user.loyaltyAccount.points} points</span>
                            )}
                        </div>
                    </div>
                    <button className="btn-primary" style={{ flexShrink: 0 }} onClick={() => setEditing(true)}>
                        Edit Profile
                    </button>
                </div>

                {/* Dance Styles */}
                {isDancer && user.danceStyles?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>💃 Dance Styles</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {user.danceStyles.map(s => (
                                <span key={s} className="style-chip">{s}</span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Portfolio Links */}
                {isDancer && user.portfolioLinks?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🎬 Portfolio</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {user.portfolioLinks.map((link, i) => (
                                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                    🔗 {link}
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Payout Details (Private) */}
                {isDancer && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(239,68,68,0.2)' }}>
                        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>🔒 Payout Details <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Private — only visible to you)</span></h3>
                        <p style={{ color: user.payoutDetails ? 'var(--text-main)' : 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {user.payoutDetails || "No payout details configured yet."}
                        </p>
                    </section>
                )}
            </main>
        );
    }

    // ─── EDIT MODE ─────────────────────────────────────────────────
    return (
        <main className="page" style={{ maxWidth: '800px' }}>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
            <h1 style={{ marginBottom: '1.5rem' }}>Edit Profile</h1>

            <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Avatar */}
                <div className="form-group">
                    <label className="form-label">Avatar URL</label>
                    <input type="url" className="form-input" placeholder="Paste an image URL…" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} />
                </div>

                {/* Name */}
                <div className="form-group">
                    <label className="form-label">Display Name</label>
                    <input type="text" className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>

                {/* Bio */}
                <div className="form-group">
                    <label className="form-label">Bio / About</label>
                    <textarea className="form-input" placeholder="Tell the dance world about yourself…" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} />
                </div>

                {/* City */}
                <div className="form-group">
                    <label className="form-label">City / Location</label>
                    <input type="text" className="form-input" placeholder="e.g. Sofia, Bulgaria" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>

                {/* Dance Styles */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label">Dance Styles</label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {ALL_STYLES.map(style => (
                                <button key={style} type="button" onClick={() => toggleStyle(style)}
                                    className={`style-chip style-chip--toggle ${form.danceStyles.includes(style) ? 'style-chip--active' : ''}`}>
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Experience Level */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label">Experience Level</label>
                        <select value={form.experienceLevel} onChange={e => setForm({ ...form, experienceLevel: e.target.value })} className="filter-select">
                            <option value="">Select level…</option>
                            {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                )}

                {/* Portfolio Links */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label">Portfolio Links</label>
                        {form.portfolioLinks.map((link, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{link}</span>
                                <button type="button" onClick={() => removePortfolioLink(link)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="url" className="form-input" placeholder="https://youtube.com/..." value={newLink} onChange={e => setNewLink(e.target.value)} style={{ flex: 1 }}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPortfolioLink(); } }}
                            />
                            <button type="button" onClick={addPortfolioLink} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Add</button>
                        </div>
                    </div>
                )}

                {/* Payout Details */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label">🔒 Payout / Bank Details <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.7rem' }}>(Private — demo only)</span></label>
                        <input type="text" className="form-input" placeholder="IBAN or PayPal email…" value={form.payoutDetails} onChange={e => setForm({ ...form, payoutDetails: e.target.value })} />
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem' }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                        {saving ? "Saving…" : "Save Profile"}
                    </button>
                    <button className="btn-primary" onClick={() => { setEditing(false); setForm({ name: user.name || "", avatarUrl: user.avatarUrl || "", bio: user.bio || "", city: user.city || "", danceStyles: user.danceStyles || [], experienceLevel: user.experienceLevel || "", portfolioLinks: user.portfolioLinks || [], payoutDetails: user.payoutDetails || "" }); }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </main>
    );
}
