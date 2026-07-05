import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import ImageUploadInput from "../components/ImageUploadInput.jsx";
import { updateMe, getMe, addPortfolioItem, deletePortfolioItem, tagEvent, deleteMe, getMyInvites, acceptRosterInvite, declineRosterInvite, acceptTeamInvite, declineTeamInvite } from "../api/users.js";
import { getStripeOnboardingLink, checkStripeStatus, getWallet, deleteCard } from "../api/payments.js";
import AddCardModal from "../components/AddCardModal.jsx";

import { getMyTickets, getPortfolioEvents, getEvents } from "../api/events.js";
import FollowListModal from "../components/FollowListModal.jsx";
import CvManager from "../components/CvManager.jsx";
import StudioManager from "../components/StudioManager.jsx";
import AgencyManager from "../components/AgencyManager.jsx";
import { DANCE_STYLE_OPTIONS } from "../utils/constants.js";

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional"];

export default function ProfilePage() {
    const { user, setUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [stripeConnectMsg, setStripeConnectMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [showList, setShowList] = useState(null); // 'followers' | 'following' | null
    const [showAddCard, setShowAddCard] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: "", avatarUrl: "", bio: "", city: "",
        danceStyles: [], experienceLevel: "", portfolioLinks: [],
    });
    const [newLink, setNewLink] = useState("");
    const [styleInput, setStyleInput] = useState("");

    // Portfolio MVP state
    const [newPortfolio, setNewPortfolio] = useState({ url: "", title: "", description: "", type: "VIDEO" });
    const [portfolioOrder, setPortfolioOrder] = useState([]);
    const dragItemRef = useRef(null);
    const dragOverItemRef = useRef(null);
    const [myTickets, setMyTickets] = useState([]);
    const [selectedEventToTag, setSelectedEventToTag] = useState("");
    const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
    const tagDropdownRef = useRef(null);
    const [invites, setInvites] = useState({ rosterInvites: [], teamInvites: [] });
    const [wallet, setWallet] = useState([]);
    const [stripeStatus, setStripeStatus] = useState(null);
    const [myPortfolioEvents, setMyPortfolioEvents] = useState([]);
    const [myRegularEvents, setMyRegularEvents] = useState([]);

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
            });
        } catch (err) {
            console.error("Failed to load fresh profile:", err);
        }
    }, [setUser]);

    const loadWallet = useCallback(async () => {
        try {
            const data = await getWallet();
            setWallet(data);
        } catch (err) {
            console.error("Failed to load wallet:", err);
        }
    }, []);

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
            });
        }
    }, [user?.id, user?.role]); // Re-sync if user ID or role changes

    // Close tag dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
                setTagDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch tickets and invites
    useEffect(() => {
        if (user?.role === "DANCER") {
            if (editing) {
                getMyTickets().then(setMyTickets).catch(console.error);
            } else {
                getMyInvites().then(setInvites).catch(console.error);
                loadWallet();
            }
        }
        if (user?.role === "STUDIO" || user?.role === "AGENCY") {
            checkStripeStatus().then(setStripeStatus).catch(console.error);
            getPortfolioEvents(user.id).then(setMyPortfolioEvents).catch(console.error);
            getEvents({ creatorId: user.id, limit: 100 }).then(d => setMyRegularEvents(d.items ?? [])).catch(console.error);
        }
    }, [user?.role, editing, loadWallet]);

    async function handleSetupStripe() {
        setStripeConnectMsg("");
        try {
            const { url } = await getStripeOnboardingLink();
            window.location.href = url;
        } catch (err) {
            setStripeConnectMsg("Stripe Connect is not available in demo mode. To enable payouts, sign up for Stripe Connect at dashboard.stripe.com/connect.");
        }
    }

    async function handleDeleteCard(cardId) {
        if (!window.confirm("Remove this card from your wallet?")) return;
        try {
            await deleteCard(cardId);
            loadWallet();
        } catch (err) { alert("Failed to delete card: " + err.message); }
    }

    async function handleAcceptRoster(id) {
        try {
            await acceptRosterInvite(id);
            const fresh = await getMyInvites();
            setInvites(fresh);
        } catch (err) { console.error(err); }
    }
    
    async function handleDeclineRoster(id) {
        try {
            await declineRosterInvite(id);
            const fresh = await getMyInvites();
            setInvites(fresh);
        } catch (err) { console.error(err); }
    }

    async function handleAcceptTeam(id) {
        try {
            await acceptTeamInvite(id);
            const fresh = await getMyInvites();
            setInvites(fresh);
        } catch (err) { console.error(err); }
    }
    
    async function handleDeclineTeam(id) {
        try {
            await declineTeamInvite(id);
            const fresh = await getMyInvites();
            setInvites(fresh);
        } catch (err) { console.error(err); }
    }

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
    const isAgency = user.role === "AGENCY";
    const isMyProfile = true; // Always true in ProfilePage.jsx

    function toggleStyle(style) {
        setForm(prev => ({
            ...prev,
            danceStyles: prev.danceStyles.includes(style)
                ? prev.danceStyles.filter(s => s !== style)
                : [...prev.danceStyles, style]
        }));
    }

    function addCustomStyle() {
        const s = styleInput.trim();
        if (s && !form.danceStyles.includes(s)) {
            setForm(prev => ({ ...prev, danceStyles: [...prev.danceStyles, s] }));
        }
        setStyleInput("");
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
            setErrorMsg(err.message || "Failed to save profile");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        if (user?.portfolioItems) {
            setPortfolioOrder(user.portfolioItems.map(i => i.id));
        }
    }, [user?.portfolioItems]);

    const sortedPortfolioItems = portfolioOrder.length > 0 && user?.portfolioItems
        ? portfolioOrder.map(id => user.portfolioItems.find(i => i.id === id)).filter(Boolean)
        : (user?.portfolioItems || []);

    function handleDragStart(idx) {
        dragItemRef.current = idx;
    }

    function handleDragEnter(idx) {
        dragOverItemRef.current = idx;
    }

    function handleDragEnd() {
        const from = dragItemRef.current;
        const to = dragOverItemRef.current;
        if (from === null || to === null || from === to) return;
        const newOrder = [...portfolioOrder];
        newOrder.splice(to, 0, newOrder.splice(from, 1)[0]);
        setPortfolioOrder(newOrder);
        dragItemRef.current = null;
        dragOverItemRef.current = null;
    }

    async function handleAddPortfolio() {
        if (!newPortfolio.url) return;
        try {
            await addPortfolioItem(newPortfolio);
            setNewPortfolio({ url: "", title: "", description: "", type: "VIDEO" });
            await resetAndLoad();
        } catch (err) {
            setErrorMsg(err.message || "Failed to add item");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    }

    async function handleDeletePortfolio(itemId) {
        try {
            await deletePortfolioItem(itemId);
            await resetAndLoad();
        } catch (err) {
            setErrorMsg(err.message || "Failed to delete item");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    }

    async function handleTagEvent() {
        if (!selectedEventToTag) return;
        try {
            await tagEvent(selectedEventToTag);
            await resetAndLoad();
            setSelectedEventToTag("");
        } catch (err) {
            setErrorMsg(err.message || "Failed to tag event");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    }

    async function handleDeleteAccount() {
        if (!window.confirm("CRITICAL: Are you sure you want to delete your account? This will permanently remove all your data, tickets, and history. This action cannot be undone.")) return;
        
        try {
            await deleteMe();
            // Logout and redirect
            localStorage.removeItem("token");
            window.location.href = "/login";
        } catch (err) {
            setErrorMsg(err.message || "Failed to delete account");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    }


    // ─── VIEW MODE ─────────────────────────────────────────────────
    if (!editing) {
        return (
            <main className="page" style={{ maxWidth: '800px' }}>
                <Link to="/dashboard" className="back-link">← Dashboard</Link>

                {successMsg && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '16px', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
                        {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--warning)', borderRadius: '16px', color: 'var(--warning)', marginBottom: '1.5rem', fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
                        {errorMsg}
                    </div>
                )}

                {/* Profile Header */}
                <div className="detail-card profile-header-card">
                    <div className="profile-header-avatar-col">
                        <div className="profile-header-avatar">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = "none"; }} />
                            ) : (
                                <span>{Initials}</span>
                            )}
                        </div>
                    </div>
                    <div className="profile-header-body">
                        <div className="profile-header-name-row">
                            <h1 className="profile-header-name">{user.name || user.email.split('@')[0]}</h1>
                            <span className="role-badge">{user.role}</span>
                            {user.experienceLevel && (
                                <span className="profile-level-badge">{user.experienceLevel}</span>
                            )}
                        </div>
                        {user.city && <p className="profile-header-city">{user.city}</p>}
                        {user.bio && <p className="profile-header-bio">{user.bio}</p>}

                        {/* Stats row */}
                        <div className="profile-stats-row">
                            {user._count && (
                                <>
                                    <span onClick={() => setShowList('followers')} className="profile-stat-item"><strong>{user._count.followers}</strong> followers</span>
                                    <span onClick={() => setShowList('following')} className="profile-stat-item"><strong>{user._count.following}</strong> following</span>
                                </>
                            )}
                            {isDancer && user.loyaltyAccount && (
                                <span className="profile-stat-item profile-stat-accent"><strong>{user.loyaltyAccount.points}</strong> points</span>
                            )}
                        </div>
                    </div>
                    <button className="btn-primary profile-header-edit-btn" onClick={() => setEditing(true)}>
                        Edit Profile
                    </button>
                </div>

                <FollowListModal
                    isOpen={!!showList}
                    onClose={() => setShowList(null)}
                    type={showList}
                    userId={user.id}
                />

                {/* Dance Styles — shown first so it's immediately visible */}
                {user.danceStyles?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px', padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '0.875rem', fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Dance Styles</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {user.danceStyles.map(s => (
                                <span key={s} className="style-chip">{s}</span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Manager Sections (Visible in View Mode for Clarity) */}
                {isStudio && (
                    <div style={{ marginBottom: "2rem" }}>
                        <StudioManager studioId={user.id} />
                    </div>
                )}

                {isAgency && (
                    <div style={{ marginBottom: "2rem" }}>
                        <AgencyManager />
                    </div>
                )}

                {isDancer && (
                    <div style={{ marginBottom: "2rem" }}>
                        <CvManager userId={user.id} />
                    </div>
                )}

                {/* Invites Section */}
                {isDancer && (invites.rosterInvites.length > 0 || invites.teamInvites.length > 0) && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px', padding: '2rem', border: '1px solid var(--accent-border)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--accent)' }}>Pending Invitations</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {invites.rosterInvites.map(inv => (
                                <div key={inv.id} className="invite-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-hover)', borderRadius: '16px' }}>
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>{inv.agency.name || 'Agency'}</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invited you to their Talent Roster</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleDeclineRoster(inv.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Decline</button>
                                        <button onClick={() => handleAcceptRoster(inv.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Accept</button>
                                    </div>
                                </div>
                            ))}
                            {invites.teamInvites.map(inv => (
                                <div key={inv.id} className="invite-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-hover)', borderRadius: '16px' }}>
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.95rem' }}>{inv.studio.name || 'Studio'}</strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invited you to their Team as <b>{inv.role}</b></span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleDeclineTeam(inv.id)} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Decline</button>
                                        <button onClick={() => handleAcceptTeam(inv.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Accept</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Portfolio / Past Events — own view */}
                {isMyProfile && (user?.role === "STUDIO" || user?.role === "AGENCY") && (() => {
                    const profileNow = new Date();
                    const myUpcoming = myRegularEvents.filter(e => new Date(e.startAt) >= profileNow);
                    const myExpired = myRegularEvents.filter(e => new Date(e.startAt) < profileNow);
                    const allMyPast = [...myExpired, ...myPortfolioEvents].sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
                    return (
                        <>
                            {myUpcoming.length > 0 && (
                                <section className="detail-card" style={{ marginBottom: "2rem" }}>
                                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Events</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {myUpcoming.map(evt => (
                                            <a key={evt.id} href={`/events/${evt.id}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textDecoration: 'none', color: 'inherit' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, backgroundImage: evt.imageUrl ? `url(${evt.imageUrl})` : 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(124,58,237,0.15))', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{evt.location} &bull; {new Date(evt.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', flexShrink: 0 }}>Upcoming</span>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}
                            {allMyPast.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: "2rem" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Past Events</h3>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>Archive</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {allMyPast.map(evt => (
                                <a
                                    key={evt.id}
                                    href={`/events/${evt.id}`}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '0.85rem 1rem',
                                        background: 'var(--bg-hover)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgba(245,158,11,0.2)',
                                        textDecoration: 'none', color: 'inherit', opacity: 0.85,
                                    }}
                                >
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
                                        backgroundImage: evt.imageUrl ? `url(${evt.imageUrl})` : 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.15))',
                                        backgroundSize: 'cover', backgroundPosition: 'center',
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{evt.title}</p>
                                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {evt.location} &bull; {new Date(evt.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', flexShrink: 0 }}>Past</span>
                                </a>
                            ))}
                        </div>
                    </section>
                            )}
                        </>
                    );
                })()}

                {/* Payout / Stripe Section */}
                {isMyProfile && (user?.role === "STUDIO" || user?.role === "AGENCY") && (
                    <section className="detail-card profile-stripe-card" style={{ marginBottom: "2rem", border: `1px solid ${stripeStatus?.complete ? "rgba(16,185,129,0.3)" : "var(--border-light)"}`, background: stripeStatus?.complete ? "linear-gradient(145deg, rgba(16,185,129,0.05), var(--bg-card))" : "linear-gradient(145deg, var(--bg-card), var(--bg-hover))" }}>
                        <div className="profile-stripe-inner">
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem", fontWeight: 700 }}>
                                    Payout Settings
                                </h3>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
                                    {stripeStatus?.complete
                                        ? "Your Stripe account is connected. Ticket revenue is transferred to your bank automatically after each event."
                                        : "Connect your bank account via Stripe to receive ticket payments directly. You'll be redirected to Stripe's secure onboarding."
                                    }
                                </p>
                            </div>
                            {stripeStatus?.complete ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", flexShrink: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success)", fontWeight: 700, fontSize: "0.9rem" }}>
                                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 6px var(--success)" }} />
                                        Connected
                                    </div>
                                    <button
                                        onClick={handleSetupStripe}
                                        style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}
                                    >
                                        Update bank details
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleSetupStripe}
                                    className="btn-primary"
                                    style={{ padding: "0.7rem 1.5rem", borderRadius: "12px", fontSize: "0.9rem", flexShrink: 0 }}
                                >
                                    Connect Stripe →
                                </button>
                            )}
                        </div>
                        {stripeConnectMsg && (
                            <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "14px", fontSize: "0.82rem", color: "var(--warning)", lineHeight: 1.6 }}>
                                {stripeConnectMsg}
                            </div>
                        )}
                        {!stripeStatus?.complete && (
                            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                                {[
                                    { text: "Bank-level security" },
                                    { text: "Fast payouts" },
                                    { text: "Revenue dashboard" },
                                ].map(f => (
                                    <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                        {f.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* Wallet Section */}
                {isMyProfile && isDancer && (
                    <section className="detail-card profile-wallet-card">
                        <div className="profile-wallet-header">
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>My Wallet</h3>
                                <p style={{ margin: "0.3rem 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                    Saved cards for quick checkout at events
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddCard(true)}
                                className="btn-primary"
                                style={{ fontSize: "0.85rem", padding: "0.55rem 1.2rem", borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                                <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span> Add Card
                            </button>
                        </div>

                    {wallet.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "2rem 1rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
                                <h4 style={{ margin: "0 0 0.5rem", fontSize: "1rem", color: "var(--text-main)" }}>No saved cards yet</h4>
                                <p style={{ margin: "0 0 1.5rem", fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "300px", marginLeft: "auto", marginRight: "auto" }}>
                                    Add a card to check out instantly at any event — no need to re-enter your details each time.
                                </p>
                                <button onClick={() => setShowAddCard(true)} className="btn-primary" style={{ padding: "0.7rem 2rem", borderRadius: "14px", fontSize: "0.9rem" }}>
                                    Add your first card
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: "1.25rem", overflowX: "auto", paddingBottom: "0.75rem" }}>
                                {wallet.map(card => {
                                    const CARD_GRADIENTS = {
                                        visa: "linear-gradient(135deg, #1a1f71 0%, #1565c0 100%)",
                                        mastercard: "linear-gradient(135deg, #1a1a1a 0%, #eb001b 60%, #f79e1b 100%)",
                                        amex: "linear-gradient(135deg, #007b5e 0%, #00b388 100%)",
                                        discover: "linear-gradient(135deg, #ff6600 0%, #ff9900 100%)",
                                        default: "linear-gradient(135deg, #2d2d2d 0%, #6366f1 100%)",
                                    };
                                    const gradient = CARD_GRADIENTS[card.brand?.toLowerCase()] || CARD_GRADIENTS.default;

                                    return (
                                        <div key={card.id} style={{
                                            minWidth: "300px", maxWidth: "300px",
                                            height: "180px",
                                            padding: "1.5rem",
                                            borderRadius: "20px",
                                            background: gradient,
                                            color: "#fff",
                                            position: "relative",
                                            boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
                                            flexShrink: 0,
                                            overflow: "hidden",
                                        }}>
                                            {/* Decorative circle */}
                                            <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                                            <div style={{ position: "absolute", bottom: "-40px", right: "30px", width: "140px", height: "140px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

                                            {/* Delete button */}
                                            <button
                                                onClick={() => handleDeleteCard(card.id)}
                                                title="Remove card"
                                                style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "rgba(0,0,0,0.3)", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", backdropFilter: "blur(4px)", transition: "all 0.2s" }}
                                                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,0,0,0.4)"; e.currentTarget.style.color = "#fff"; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.3)"; e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
                                            >×</button>

                                            {/* Chip + Brand */}
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                                                {/* SIM chip */}
                                                <div style={{ width: "36px", height: "28px", borderRadius: "5px", background: "linear-gradient(135deg, #d4af37, #f5e07a)", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
                                                <span style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", opacity: 0.9 }}>
                                                    {card.brand?.toUpperCase() || "CARD"}
                                                </span>
                                            </div>

                                            {/* Card number */}
                                            <div style={{ fontSize: "1.25rem", letterSpacing: "3px", fontFamily: "'Courier New', monospace", marginBottom: "1.25rem", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                                                •••• •••• •••• {card.last4}
                                            </div>

                                            {/* Expiry */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <div>
                                                    <div style={{ fontSize: "0.55rem", textTransform: "uppercase", opacity: 0.7, letterSpacing: "0.05em" }}>Expires</div>
                                                    <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                                                        {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Add another card tile */}
                                <button
                                    onClick={() => setShowAddCard(true)}
                                    style={{
                                        minWidth: "180px", height: "180px",
                                        borderRadius: "20px",
                                        border: "2px dashed var(--border-light)",
                                        background: "transparent",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        display: "flex", flexDirection: "column",
                                        alignItems: "center", justifyContent: "center",
                                        gap: "0.5rem",
                                        fontSize: "0.85rem",
                                        flexShrink: 0,
                                        transition: "all 0.2s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                >
                                    <span style={{ fontSize: "2rem" }}>+</span>
                                    <span>Add Card</span>
                                </button>
                            </div>
                        )}

                        <p style={{ margin: "1rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            Card details are encrypted and stored securely by Stripe. We never see your full card number.
                        </p>
                    </section>
                )}


                {/* Portfolio Links */}
                {isDancer && user.portfolioLinks?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px', padding: '2rem' }}>
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
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px', padding: '2rem' }}>
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
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Events I've Attended / Performed</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {user.taggedEvents.map(evt => (
                                <Link to={`/events/${evt.id}`} key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: '16px', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border-light)' }}>
                                    {evt.imageUrl && <img src={evt.imageUrl} alt={evt.title} referrerPolicy="no-referrer" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} onError={e => { e.target.style.display = "none"; }} />}
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{evt.title}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}


                <AddCardModal 
                    isOpen={showAddCard} 
                    onClose={() => setShowAddCard(false)} 
                    onSuccess={() => {
                        loadWallet();
                        setShowAddCard(false);
                    }} 
                />
            </main>
        );
    }

    // ─── EDIT MODE ─────────────────────────────────────────────────
    return (
        <main className="page" style={{ maxWidth: '800px' }}>
            <Link to="/dashboard" className="back-link">← Dashboard</Link>
            <h1 style={{ marginBottom: '1.5rem' }}>Edit Profile</h1>

            <div className="detail-card profile-edit-card">

                <div className="profile-edit-grid">
                   {/* Name */}
                   <div className="form-group">
                       <label className="form-label" htmlFor="profile-name">Display Name</label>
                       <input id="profile-name" name="name" autoComplete="name" type="text" className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                   </div>
                   {/* Avatar */}
                   <div className="form-group">
                       <label className="form-label">Avatar</label>
                       <ImageUploadInput
                           value={form.avatarUrl}
                           onChange={url => setForm(prev => ({ ...prev, avatarUrl: url }))}
                           placeholder="Paste URL or click Upload"
                       />
                   </div>
                </div>

                {/* Bio */}
                <div className="form-group">
                    <label className="form-label" htmlFor="profile-bio">Bio / About</label>
                    <textarea id="profile-bio" name="bio" className="form-input" placeholder="Tell the dance world about yourself…" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} />
                </div>

                {/* City */}
                <div className="form-group">
                    <label className="form-label" htmlFor="profile-city">City / Location</label>
                    <input id="profile-city" name="city" autoComplete="address-level2" type="text" className="form-input" placeholder="e.g. Sofia, Bulgaria" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>

                {/* Dance Styles */}
                <div className="form-group">
                    <label className="form-label">Dance Styles / Focus <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.8rem" }}>(Select or add your own)</span></label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                        {DANCE_STYLE_OPTIONS.map(style => (
                            <button key={style} type="button" onClick={() => toggleStyle(style)}
                                className={`style-chip style-chip--toggle ${form.danceStyles.includes(style) ? 'style-chip--active' : ''}`}>
                                {style}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                            id="profile-style"
                            name="styleInput"
                            autoComplete="off"
                            value={styleInput}
                            onChange={e => setStyleInput(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomStyle())}
                            placeholder="Add custom style…"
                            className="form-input"
                            style={{ flex: 1, marginBottom: 0 }}
                        />
                        <button type="button" onClick={addCustomStyle} className="btn-secondary" style={{ padding: "0.5rem 1rem", borderRadius: "10px", background: "var(--bg-hover)", border: "1px solid var(--border-light)", color: "var(--text-main)", cursor: "pointer" }}>
                            Add
                        </button>
                    </div>
                    {form.danceStyles.length > 0 && (
                        <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            Selected: {form.danceStyles.join(", ")}
                        </div>
                    )}
                </div>

                {/* Experience Level */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label" htmlFor="profile-level">Experience Level</label>
                        <select id="profile-level" name="experienceLevel" value={form.experienceLevel} onChange={e => setForm({ ...form, experienceLevel: e.target.value })} className="filter-select">
                            <option value="">Select level…</option>
                            {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                )}

                {/* Portfolio Links */}
                {isDancer && (
                    <div className="form-group">
                        <label className="form-label" htmlFor="portfolio-link">Portfolio Links</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            {form.portfolioLinks.map((link, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-hover)', padding: '0.5rem 0.75rem', borderRadius: '10px' }}>
                                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--accent)', wordBreak: 'break-all' }}>{link}</span>
                                    <button type="button" onClick={() => removePortfolioLink(link)} style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px' }}>&times;</button>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input id="portfolio-link" name="portfolioLink" type="url" className="form-input" placeholder="https://youtube.com/..." value={newLink} onChange={e => setNewLink(e.target.value)} style={{ flex: 1 }} autoComplete="off"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPortfolioLink(); } }}
                            />
                            <button type="button" onClick={addPortfolioLink} className="btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem', borderRadius: '10px' }}>Add</button>
                        </div>
                    </div>
                )}

                {/* Media Portfolio Manager */}
                {isDancer && (
                    <div className="form-group" style={{ padding: '1.5rem', background: 'var(--bg-hover)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                        <label className="form-label" htmlFor="portfolio-type" style={{ fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>Portfolio Media Manager</label>

                        {/* Current Items — drag to reorder */}
                        {sortedPortfolioItems.length > 0 && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                Drag items to reorder
                            </p>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                            {sortedPortfolioItems.map((item, idx) => (
                                <div
                                    key={item.id}
                                    draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragEnter={() => handleDragEnter(idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={e => e.preventDefault()}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.75rem 1rem', background: 'var(--bg-card)',
                                        borderRadius: '12px', border: '1px solid var(--border-light)',
                                        cursor: 'grab', userSelect: 'none',
                                        transition: 'box-shadow 0.15s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'grab' }}>⠿</span>
                                        <strong style={{ fontSize: '0.9rem' }}>{item.title || "Untitled"}</strong>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.type})</span>
                                    </div>
                                    <button type="button" onClick={() => handleDeletePortfolio(item.id)} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem', color: 'var(--warning)' }}>Remove</button>
                                </div>
                            ))}
                        </div>

                        {/* Add New Item */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '16px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Add New Media</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select id="portfolio-type" name="portfolioType" className="filter-select" value={newPortfolio.type} onChange={e => setNewPortfolio({ ...newPortfolio, type: e.target.value })} style={{ flex: '0 0 110px' }}>
                                    <option value="VIDEO">Video</option>
                                    <option value="PHOTO">Photo</option>
                                </select>
                                <input id="portfolio-url" name="portfolioUrl" type="url" className="form-input" placeholder="Media URL…" value={newPortfolio.url} onChange={e => setNewPortfolio({ ...newPortfolio, url: e.target.value })} style={{ flex: 1 }} autoComplete="off" />
                            </div>
                            <input id="portfolio-title" name="portfolioTitle" type="text" className="form-input" placeholder="Title (e.g. Dance Reel)" value={newPortfolio.title} onChange={e => setNewPortfolio({ ...newPortfolio, title: e.target.value })} autoComplete="off" />
                            <input id="portfolio-desc" name="portfolioDesc" type="text" className="form-input" placeholder="Short description…" value={newPortfolio.description} onChange={e => setNewPortfolio({ ...newPortfolio, description: e.target.value })} autoComplete="off" />
                            <button type="button" onClick={handleAddPortfolio} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '0.6rem 2rem', borderRadius: '10px' }}>Add Media Item</button>
                        </div>
                    </div>
                )}

                {/* Event Tagging Manager */}
                {isDancer && (
                    <div className="form-group" style={{ padding: '1.5rem', background: 'var(--bg-hover)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                        <p className="form-label" style={{ fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>Tag Events</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Showcase events from your ticket history on your profile.</p>
                        <input type="hidden" id="tag-event" name="tagEvent" value={selectedEventToTag} readOnly />
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            {/* Custom dropdown */}
                            <div ref={tagDropdownRef} style={{ position: 'relative', flex: 1 }}>
                                <button
                                    type="button"
                                    onClick={() => setTagDropdownOpen(o => !o)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        gap: '0.5rem', padding: '0.65rem 1rem', background: 'var(--bg-input)',
                                        border: '1px solid var(--border-light)', borderRadius: '12px',
                                        color: selectedEventToTag ? 'var(--text-main)' : 'var(--text-muted)',
                                        fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left',
                                    }}
                                >
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {selectedEventToTag
                                            ? (() => {
                                                const t = myTickets.find(t => t.event.id === selectedEventToTag);
                                                if (!t) return 'Select an event…';
                                                const tagged = user.taggedEvents?.some(te => te.id === t.event.id);
                                                const past = new Date(t.event.startAt) < new Date();
                                                return `${tagged ? '✓ ' : ''}${t.event.title} — ${past ? 'Attended' : 'Will be there'}`;
                                            })()
                                            : 'Select an event…'}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0 }}>▼</span>
                                </button>
                                {tagDropdownOpen && (
                                    <ul style={{
                                        position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
                                        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                                        borderRadius: '16px', listStyle: 'none', margin: 0, padding: '6px',
                                        maxHeight: '220px', overflowY: 'auto',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)',
                                    }}>
                                        <li
                                            onClick={() => { setSelectedEventToTag(""); setTagDropdownOpen(false); }}
                                            style={{ padding: '0.6rem 0.9rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >Select an event…</li>
                                        {myTickets
                                            .filter(t => t.status !== "CANCELLED")
                                            .map(t => {
                                                const isTagged = user.taggedEvents?.some(te => te.id === t.event.id);
                                                const isPast = new Date(t.event.startAt) < new Date();
                                                const lbl = isPast ? 'Attended' : 'Will be there';
                                                return (
                                                    <li
                                                        key={t.event.id}
                                                        onClick={() => { setSelectedEventToTag(t.event.id); setTagDropdownOpen(false); }}
                                                        style={{
                                                            padding: '0.6rem 0.9rem', borderRadius: '10px', cursor: 'pointer',
                                                            fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                            background: selectedEventToTag === t.event.id ? 'var(--bg-hover)' : 'transparent',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = selectedEventToTag === t.event.id ? 'var(--bg-hover)' : 'transparent'}
                                                    >
                                                        {isTagged && <span style={{ color: 'var(--accent)', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>}
                                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {t.event.title}
                                                        </span>
                                                        <span style={{ fontSize: '0.75rem', color: isPast ? 'var(--text-muted)' : 'var(--accent)', flexShrink: 0, fontWeight: 600 }}>{lbl}</span>
                                                    </li>
                                                );
                                            })}
                                    </ul>
                                )}
                            </div>
                            <button type="button" onClick={handleTagEvent} className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: '12px', flexShrink: 0 }}>
                                Toggle Tag
                            </button>
                        </div>
                    </div>
                )}


                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }}>
                        {saving ? "Saving…" : "Save Basic Details"}
                    </button>
                    <button className="btn-primary" onClick={() => { setEditing(false); }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '14px', padding: '0.8rem' }}>
                        Cancel & View
                    </button>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid rgba(239, 68, 68, 0.1)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Once you delete your account, there is no going back. Please be certain.</p>
                    <button 
                        onClick={handleDeleteAccount}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', padding: '0.75rem 1.5rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                        Delete My Account
                    </button>
                </div>
            </div>

        </main>
    );
}
