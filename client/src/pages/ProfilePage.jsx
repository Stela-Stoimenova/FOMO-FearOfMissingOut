import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import ImageUploadInput from "../components/ImageUploadInput.jsx";
import { updateMe, getMe, addPortfolioItem, deletePortfolioItem, tagEvent, deleteMe, getMyInvites, acceptRosterInvite, declineRosterInvite, acceptTeamInvite, declineTeamInvite } from "../api/users.js";
import { getStripeOnboardingLink, checkStripeStatus, getWallet, deleteCard } from "../api/payments.js";
import AddCardModal from "../components/AddCardModal.jsx";

import { getMyTickets } from "../api/events.js";
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
    const [invites, setInvites] = useState({ rosterInvites: [], teamInvites: [] });
    const [wallet, setWallet] = useState([]);
    const [stripeStatus, setStripeStatus] = useState(null);

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
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-hover)', borderRadius: '16px' }}>
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
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-hover)', borderRadius: '16px' }}>
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

                {/* Payout / Stripe Section */}
                {isMyProfile && (user?.role === "STUDIO" || user?.role === "AGENCY") && (
                    <section className="detail-card" style={{ marginBottom: "2rem", padding: "2rem", borderRadius: "24px", border: `1px solid ${stripeStatus?.complete ? "rgba(16,185,129,0.3)" : "var(--border-light)"}`, background: stripeStatus?.complete ? "linear-gradient(145deg, rgba(16,185,129,0.05), var(--bg-card))" : "linear-gradient(145deg, var(--bg-card), var(--bg-hover))" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
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
                    <section className="detail-card" style={{ marginBottom: "2rem", padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem" }}>
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
                            <div style={{ textAlign: "center", padding: "3rem 2rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
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

                {/* Dance Styles */}
                {user.danceStyles?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', borderRadius: '24px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Dance Styles & Focus</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {user.danceStyles.map(s => (
                                <span key={s} className="style-chip">{s}</span>
                            ))}
                        </div>
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
                                    {evt.imageUrl && <img src={evt.imageUrl} alt={evt.title} style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />}
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

            <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderRadius: '24px', padding: '2rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                   {/* Name */}
                   <div className="form-group">
                       <label className="form-label">Display Name</label>
                       <input type="text" className="form-input" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
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
                    <label className="form-label">Bio / About</label>
                    <textarea className="form-input" placeholder="Tell the dance world about yourself…" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} />
                </div>

                {/* City */}
                <div className="form-group">
                    <label className="form-label">City / Location</label>
                    <input type="text" className="form-input" placeholder="e.g. Sofia, Bulgaria" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
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


                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                    <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1, borderRadius: '14px', padding: '0.8rem' }}>
                        {saving ? "Saving…" : "Save Basic Details"}
                    </button>
                    <button className="btn-primary" onClick={() => { setEditing(false); }} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '14px', padding: '0.8rem' }}>
                        Cancel & View
                    </button>
                </div>

                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid rgba(239, 68, 68, 0.1)' }}>
                    <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Danger Zone</h4>
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
