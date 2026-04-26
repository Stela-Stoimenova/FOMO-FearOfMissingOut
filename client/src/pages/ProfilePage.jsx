import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { updateMe, getMe, addPortfolioItem, deletePortfolioItem, tagEvent } from "../api/users.js";
import { getMyTickets } from "../api/events.js";
import FollowListModal from "../components/FollowListModal.jsx";
import CvManager from "../components/CvManager.jsx";
import StudioManager from "../components/StudioManager.jsx";

const ALL_STYLES = ["Hip Hop", "Contemporary", "Heels", "Ballet", "Breaking", "House", "Popping", "Commercial", "Jazz", "Afro"];
const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [showList, setShowList] = useState(null); // 'followers' | 'following' | null

    // Form state
    const [form, setForm] = useState({
        name: "", avatarUrl: "", bio: "", city: "",
        danceStyles: [], experienceLevel: "", portfolioLinks: [], payoutDetails: "",
    });
    const [newLink, setNewLink] = useState("");

    // Portfolio MVP state
    const [newPortfolio, setNewPortfolio] = useState({ url: "", title: "", description: "", type: "VIDEO" });
    const [myTickets, setMyTickets] = useState([]);
    const [selectedEventToTag, setSelectedEventToTag] = useState("");

    // Reset and Load fresh profile data
    const resetAndLoad = useCallback(async () => {
        try {
            const freshUser = await getMe();
            setUser(freshUser);
            setForm({
                name: freshUser.name || "",
                avatarUrl: freshUser.avatarUrl || "",
                bio: freshUser.bio || "",
                city: freshUser.city || "",
                danceStyles: freshUser.danceStyles || [],
                experienceLevel: freshUser.experienceLevel || "",
                portfolioLinks: freshUser.portfolioLinks || [],
                payoutDetails: freshUser.payoutDetails || "",
            });
        } catch (err) {
            console.error("Failed to load fresh profile:", err);
        }
    }, [setUser]);

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
    }, [user?.id, user?.role]); // Re-sync if user ID or role changes

    // Fetch tickets for MVP event tagging
    useEffect(() => {
        if (user?.role === "DANCER" && editing) {
            getMyTickets().then(setMyTickets).catch(console.error);
        }
    }, [user?.role, editing]);

    if (!user) {
        return (
            <main className="page page-narrow">
                <div className="state-error">You must be logged in to view your profile.</div>
            </main>
        );
    }

    const Initials = (user.name || user.email).charAt(0).toUpperCase();
    const isDancer = user.role === "DANCER";
    const isStudio = user.role === "STUDIO";

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
            await resetAndLoad();
            setEditing(false);
            setSuccessMsg("Profile saved successfully!");
            setTimeout(() => setSuccessMsg(""), 3000);
        } catch (err) {
            alert(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    }

    async function handleAddPortfolio() {
        if (!newPortfolio.url) return;
        try {
            await addPortfolioItem(newPortfolio);
            setNewPortfolio({ url: "", title: "", description: "", type: "VIDEO" });
            await resetAndLoad();
        } catch (err) {
            alert(err.message || "Failed to add item");
        }
    }

    async function handleDeletePortfolio(itemId) {
        try {
            await deletePortfolioItem(itemId);
            await resetAndLoad();
        } catch (err) {
            alert(err.message || "Failed to delete item");
        }
    }

    async function handleTagEvent() {
        if (!selectedEventToTag) return;
        try {
            await tagEvent(selectedEventToTag);
            await resetAndLoad();
            setSelectedEventToTag("");
        } catch (err) {
            alert(err.message || "Failed to tag event");
        }
    }

    // ─── VIEW MODE ─────────────────────────────────────────────────
    if (!editing) {
        return (
            <main className="page" style={{ maxWidth: '800px' }}>
                <Link to="/dashboard" className="back-link">← Dashboard</Link>

                {successMsg && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '16px', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        {successMsg}
                    </div>
                )}

                {/* Profile Header */}
                <div className="detail-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem', padding: '2.5rem', borderRadius: '24px' }}>
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
                            <span className="role-badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '10px' }}>{user.role}</span>
                            {user.experienceLevel && (
                                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem', borderRadius: '10px', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{user.experienceLevel}</span>
                            )}
                        </div>
                        {user.city && <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{user.city}</p>}
                        {user.bio && <p style={{ color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{user.bio}</p>}

                        {/* Stats row */}
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {user._count && (
                                <>
                                    <span onClick={() => setShowList('followers')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}><strong style={{ color: 'var(--text-main)' }}>{user._count.followers}</strong> followers</span>
                                    <span onClick={() => setShowList('following')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}><strong style={{ color: 'var(--text-main)' }}>{user._count.following}</strong> following</span>
                                </>
                            )}
                            {isDancer && user.loyaltyAccount && (
                                <span style={{ color: 'var(--accent)', fontSize: '0.9rem' }}><strong style={{ color: 'var(--accent)' }}>{user.loyaltyAccount.points}</strong> points</span>
                            )}
                        </div>
                    </div>
                    <button className="btn-primary" style={{ flexShrink: 0, borderRadius: '12px' }} onClick={() => setEditing(true)}>
                        Edit Profile
                    </button>
                </div>

                <FollowListModal
                    isOpen={!!showList}
                    onClose={() => setShowList(null)}
                    type={showList}
                    userId={user.id}
                />

                {/* Manager Sections (Visible in View Mode for Clarity) */}
                {isStudio && (
                    <div style={{ marginBottom: "2rem" }}>
                        <StudioManager studioId={user.id} />
                    </div>
                )}

                {isDancer && (
                    <div style={{ marginBottom: "2rem" }}>
                        <CvManager userId={user.id} />
                    </div>
                )}

                {/* Dance Styles */}
                {isDancer && user.danceStyles?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Dance Styles</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {user.danceStyles.map(s => (
                                <span key={s} className="style-chip">{s}</span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Portfolio Links */}
                {isDancer && user.portfolioLinks?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Portfolio</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {user.portfolioLinks.map((link, i) => (
                                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                    {link}
                                </a>
                            ))}
                        </div>
                    </section>
                )}

                {/* Rich Portfolio Items */}
                {isDancer && user.portfolioItems?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Media Portfolio</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {user.portfolioItems.map(item => (
                                <div key={item.id} style={{ border: '1px solid var(--border-light)', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                    {item.type === "PHOTO" ? (
                                        <div style={{ height: '140px', backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    ) : (
                                        <div style={{ height: '140px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Play Video &rarr;</a>
                                        </div>
                                    )}
                                    <div style={{ padding: '1rem' }}>
                                        {item.title && <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: 700 }}>{item.title}</h4>}
                                        {item.description && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Tagged Events */}
                {isDancer && user.taggedEvents?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Events I've Attended / Performed</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {user.taggedEvents.map(evt => (
                                <Link to={`/events/${evt.id}`} key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: '16px', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border-light)' }}>
                                    {evt.imageUrl && <img src={evt.imageUrl} alt={evt.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />}
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{evt.title}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Payout Details (Private) */}
                {isDancer && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(239,68,68,0.2)', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>Payout Details <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>(Private)</span></h3>
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

            <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '24px', padding: '2rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   {/* Name */}
                   <div className="form-group">
                       <label className="form-label">Display Name</label>
                       <input type="text" className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                   </div>
                   {/* Avatar */}
                   <div className="form-group">
                       <label className="form-label">Avatar URL</label>
                       <input type="url" className="form-input" placeholder="Paste an image URL…" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} />
                   </div>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            {form.portfolioLinks.map((link, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{link}</span>
                                    <button type="button" onClick={() => removePortfolioLink(link)} style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>&times;</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="url" className="form-input" placeholder="https://youtube.com/..." value={newLink} onChange={e => setNewLink(e.target.value)} style={{ flex: 1 }}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPortfolioLink(); } }}
                            />
                            <button type="button" onClick={addPortfolioLink} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', borderRadius: '10px' }}>Add</button>
                        </div>
                    </div>
                )}

                {/* Media Portfolio Manager */}
                {isDancer && (
                    <div className="form-group" style={{ padding: '1.5rem', background: 'var(--bg-hover)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>Portfolio Media Manager</label>

                        {/* Current Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            {user.portfolioItems?.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                                    <div>
                                        <strong style={{ fontSize: '0.9rem' }}>{item.title || "Untitled"}</strong> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.type})</span>
                                    </div>
                                    <button type="button" onClick={() => handleDeletePortfolio(item.id)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--warning)', borderRadius: '8px' }}>Remove</button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Item */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Add New Media</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select className="filter-select" value={newPortfolio.type} onChange={e => setNewPortfolio({ ...newPortfolio, type: e.target.value })} style={{ flex: '0 0 110px' }}>
                                    <option value="VIDEO">Video</option>
                                    <option value="PHOTO">Photo</option>
                                </select>
                                <input type="url" className="form-input" placeholder="Media URL…" value={newPortfolio.url} onChange={e => setNewPortfolio({ ...newPortfolio, url: e.target.value })} style={{ flex: 1 }} />
                            </div>
                            <input type="text" className="form-input" placeholder="Title (e.g. Dance Reel)" value={newPortfolio.title} onChange={e => setNewPortfolio({ ...newPortfolio, title: e.target.value })} />
                            <input type="text" className="form-input" placeholder="Short description…" value={newPortfolio.description} onChange={e => setNewPortfolio({ ...newPortfolio, description: e.target.value })} />
                            <button type="button" onClick={handleAddPortfolio} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 2rem', borderRadius: '10px' }}>Add Media Item</button>
                        </div>
                    </div>
                )}

                {/* Event Tagging Manager */}
                {isDancer && (
                    <div className="form-group" style={{ padding: '1.5rem', background: 'var(--bg-hover)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Tag Events</label>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Showcase events from your ticket history on your profile.</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select className="filter-select" value={selectedEventToTag} onChange={e => setSelectedEventToTag(e.target.value)} style={{ flex: 1 }}>
                                <option value="">Select an event…</option>
                                {myTickets.map(t => {
                                    const isAlreadyTagged = user.taggedEvents?.some(te => te.id === t.event.id);
                                    return (
                                        <option key={t.event.id} value={t.event.id}>
                                            {isAlreadyTagged ? "✓ " : ""}{t.event.title}
                                        </option>
                                    );
                                })}
                            </select>
                            <button type="button" onClick={handleTagEvent} className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '10px' }}>
                                Toggle Tag
                            </button>
                        </div>
                    </div>
                )}

                {/* Payout Details */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label">Payout / Bank Details <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>(Private)</span></label>
                        <input type="text" className="form-input" placeholder="IBAN or PayPal email…" value={form.payoutDetails} onChange={e => setForm({ ...form, payoutDetails: e.target.value })} />
                    </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }}>
                        {saving ? "Saving…" : "Save Basic Details"}
                    </button>
                    <button className="btn-primary" onClick={() => { setEditing(false); }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '14px', padding: '0.8rem' }}>
                        Cancel & View
                    </button>
                </div>
            </div>
        </main>
    );
}
