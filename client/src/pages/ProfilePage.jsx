import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function ProfilePage() {
    const { user } = useAuth();

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

    return (
        <main className="page" style={{ maxWidth: '800px' }}>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>

            {/* Profile Header */}
            <div className="profile-header detail-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', padding: '2.5rem' }}>
                <div className="profile-avatar">
                    {/* Placeholder for actual image */}
                    <span>{Initials}</span>
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
