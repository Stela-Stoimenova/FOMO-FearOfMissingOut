import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { useState } from "react";
import { updateMe } from "../api/users.js";

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [avatarInput, setAvatarInput] = useState("");
    const [updating, setUpdating] = useState(false);

    if (!user) {
        return (
            <main className="page page-narrow">
                <div className="state-error">You must be logged in to view your profile.</div>
            </main>
        );
    }

    // Mock data based on role for demonstration until backend profile endpoints are ready
    const isDancer = user.role === "DANCER";

    // We can use the first letter of the name or email for a simple avatar fallback
    const Initials = (user.name || user.email).charAt(0).toUpperCase();

    async function handleSaveAvatar() {
        setUpdating(true);
        try {
            const updated = await updateMe({ avatarUrl: avatarInput });
            setUser({ ...user, avatarUrl: updated.avatarUrl });
            setIsEditingAvatar(false);
            setAvatarInput("");
        } catch (err) {
            alert(err.message || "Failed to update avatar");
        } finally {
            setUpdating(false);
        }
    }

    return (
        <main className="page" style={{ maxWidth: '800px' }}>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>

            {/* Profile Header */}
            <div className="profile-header detail-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', padding: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div className="profile-avatar" style={{ overflow: 'hidden' }}>
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span>{Initials}</span>
                        )}
                    </div>
                    {isEditingAvatar ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '200px' }}>
                            <input
                                type="url"
                                placeholder="Paste image URL..."
                                value={avatarInput}
                                onChange={(e) => setAvatarInput(e.target.value)}
                                style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', flex: 1 }} onClick={handleSaveAvatar} disabled={updating}>Save</button>
                                <button className="btn-primary" style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem', flex: 1, background: 'transparent', border: '1px solid var(--border-light)' }} onClick={() => setIsEditingAvatar(false)}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setIsEditingAvatar(true); setAvatarInput(user.avatarUrl || ""); }}>
                            Edit Avatar
                        </button>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ margin: 0, fontSize: '2.25rem' }}>{user.name || user.email.split('@')[0]}</h1>
                        <span className="role-badge" style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>{user.role}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        📍 {isDancer ? "Sofia, Bulgaria" : "Plovdiv, Bulgaria"} (Placeholder)
                    </p>
                    {isDancer && user.loyaltyAccount && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <span style={{ color: 'var(--primary)' }}>🌟 {user.loyaltyAccount.points}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loyalty Points</span>
                        </div>
                    )}
                </div>
                <div>
                    <button className="btn-primary" style={{ background: 'var(--bg-input)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }} onClick={() => alert("Edit Profile coming soon.")}>
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Profile Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* About / Bio Section - Common for both */}
                <section className="profile-section detail-item">
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {isDancer ? "About Me" : "Organization Description"}
                    </h3>
                    <p style={{ color: 'var(--text-main)', lineHeight: 1.7 }}>
                        {isDancer
                            ? "Passionate dancer specializing in contemporary and hip-hop. Always looking for new workshops and battles to push my limits and connect with the community."
                            : "A premier dance studio hosting top-tier workshops with international choreographers. We aim to elevate the local dance scene by bringing the best talent."}
                    </p>
                </section>

                {/* DANCER Specific Fields */}
                {isDancer && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <section className="profile-section detail-item">
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Dance Styles</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {["Hip Hop", "Contemporary", "Heels"].map(style => (
                                    <span key={style} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                                        {style}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section className="profile-section detail-item">
                            <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Experience</h3>
                            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Advanced / Pro</p>
                        </section>
                    </div>
                )}

                {/* DANCER Portfolio Visuals Mockup */}
                {isDancer && (
                    <section className="profile-section detail-item" style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Portfolio Gallery</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    aspectRatio: '1',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--text-muted)'
                                }}>
                                    <span>Demo Video {i}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Portfolio / Links Section */}
                <section className="profile-section detail-item">
                    <h3 style={{ textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        {isDancer ? "Portfolio" : "Social Links"}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 500 }}>
                            🔗 Instagram Profile
                        </a>
                        {isDancer && (
                            <a href="https://youtube.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 500 }}>
                                🔗 YouTube Showcase
                            </a>
                        )}
                        {!isDancer && (
                            <a href="https://website.com" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 500 }}>
                                🔗 Official Website
                            </a>
                        )}
                    </div>
                </section>

            </div>
        </main>
    );
}
