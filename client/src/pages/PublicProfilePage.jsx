import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserProfile, followUser, unfollowUser, getMe, getFollowers } from "../api/users.js";
import { sendMessage } from "../api/messages.js";
import { getEvents } from "../api/events.js";
import { getStudioClasses, getStudioMemberships, getStudioTeam, getStudioCollaborations, purchaseMembership } from "../api/studios.js";

import { getUserCv } from "../api/cv.js";
import { useAuth } from "../context/AuthContext.jsx";
import FollowListModal from "../components/FollowListModal.jsx";

export default function PublicProfilePage() {
    const { id } = useParams();
    const { user: me, setUser } = useAuth();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [msgSent, setMsgSent] = useState(false);
    const [isWritingMessage, setIsWritingMessage] = useState(false);
    const [messageContent, setMessageContent] = useState("");
    const [messageLoading, setMessageLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [createdEvents, setCreatedEvents] = useState([]);

    // New Data States
    const [classes, setClasses] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [team, setTeam] = useState([]);
    const [collabs, setCollabs] = useState([]);
    const [cvEntries, setCvEntries] = useState([]);

    // Followers/Following list state
    const [showList, setShowList] = useState(null); // 'followers' | 'following' | null

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
            setCreatedEvents([]);
            try {
                const data = await getUserProfile(id);
                setProfile(data);

                // Check if current user follows this profile
                if (me && me.id !== data.id) {
                    try {
                        const followers = await getFollowers(id);
                        setIsFollowing(followers.some(f => f.id === me.id));
                    } catch { /* ignore */ }
                }

                // Fetch events created by this user if they are a Studio or Agency
                if (data.role === "STUDIO" || data.role === "AGENCY") {
                    try {
                        const evtData = await getEvents({ creatorId: id, limit: 100 });
                        setCreatedEvents(evtData.items ?? []);
                    } catch { /* ignore */ }
                }

                if (data.role === "STUDIO") {
                    try {
                        const [cls, mem, tm, col] = await Promise.all([
                            getStudioClasses(id), getStudioMemberships(id),
                            getStudioTeam(id), getStudioCollaborations(id)
                        ]);
                        setClasses(cls); setMemberships(mem); setTeam(tm); setCollabs(col);
                    } catch { /* ignore */ }
                }

                if (data.role === "DANCER") {
                    try {
                        const cv = await getUserCv(id);
                        setCvEntries(cv);
                    } catch { /* ignore */ }
                }
            } catch (err) {
                setError(err.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, me]);

    async function handleFollow() {
        if (!me) {
            setErrorMsg("Please log in to follow users.");
            setTimeout(() => setErrorMsg(""), 4000);
            return;
        }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(profile.id);
                setIsFollowing(false);
                setProfile(prev => ({ ...prev, _count: { ...prev._count, followers: prev._count.followers - 1 } }));
            } else {
                await followUser(profile.id);
                setIsFollowing(true);
                setProfile(prev => ({ ...prev, _count: { ...prev._count, followers: prev._count.followers + 1 } }));
            }
            // Force refresh the global user state so dashboard and nav immediately reflect the new following count
            const updatedMe = await getMe();
            setUser(updatedMe);
        } catch (err) {
            setErrorMsg(err.message || "Failed to update follow status");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setFollowLoading(false);
        }
    }

    async function handleSendMessage() {
        if (!messageContent.trim()) return;
        setMessageLoading(true);
        try {
            await sendMessage(profile.id, messageContent);
            setMsgSent(true);
            setIsWritingMessage(false);
            setMessageContent("");
            setTimeout(() => setMsgSent(false), 3000);
        } catch (err) {
            setErrorMsg(err.message || "Failed to send message");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setMessageLoading(false);
        }
    }

    async function handlePurchaseMembership(tierId) {
        if (!me) {
            setErrorMsg("Please log in to purchase a membership.");
            setTimeout(() => setErrorMsg(""), 4000);
            return;
        }
        if (me.role !== "DANCER") {
            setErrorMsg("Only Dancers can purchase studio memberships.");
            setTimeout(() => setErrorMsg(""), 4000);
            return;
        }

        if (!window.confirm("Do you want to purchase this membership?")) return;

        try {
            await purchaseMembership(tierId);
            setMsgSent(true);
            setTimeout(() => setMsgSent(false), 3000);
        } catch (err) {
            setErrorMsg(err.message || "Failed to purchase membership");
            setTimeout(() => setErrorMsg(""), 4000);
        }
    }

    function handleShowList(type) {

        setShowList(type);
    }

    if (loading) return <main className="page page-narrow"><p className="state-msg">Loading profile…</p></main>;
    if (error) return <main className="page page-narrow"><div className="state-error"><p>{error}</p></div></main>;
    if (!profile) return null;

    const Initials = (profile.name || "?").charAt(0).toUpperCase();
    const isOwnProfile = me && me.id === profile.id;

    return (
        <main className="page" style={{ maxWidth: '800px' }}>
            <Link to="/" className="back-link">← Back to events</Link>

            {errorMsg && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid var(--warning)', borderRadius: '16px', color: 'var(--warning)', marginBottom: '1.5rem', fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
                    {errorMsg}
                </div>
            )}

            {msgSent && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '16px', color: 'var(--success)', marginBottom: '1.5rem', fontSize: '0.9rem', animation: 'fadeIn 0.3s ease' }}>
                    Message sent successfully!
                </div>
            )}

            {/* Profile Header */}
            <div className="detail-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem', padding: '2.5rem', borderRadius: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--bg-hover), var(--bg-card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', border: '3px solid var(--border-light)', overflow: 'hidden' }}>
                        {profile.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span>{Initials}</span>
                        )}
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>{profile.name || "Unnamed"}</h1>
                        <span className="role-badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '10px' }}>{profile.role}</span>
                        {profile.experienceLevel && (
                            <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem', borderRadius: '10px', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{profile.experienceLevel}</span>
                        )}
                    </div>
                    {profile.city && <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{profile.city}</p>}
                    {profile.bio && <p style={{ color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{profile.bio}</p>}

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <span onClick={() => handleShowList('followers')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}><strong style={{ color: 'var(--text-main)' }}>{profile._count?.followers || 0}</strong> followers</span>
                        <span onClick={() => handleShowList('following')} style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}><strong style={{ color: 'var(--text-main)' }}>{profile._count?.following || 0}</strong> following</span>
                    </div>

                    <FollowListModal
                        isOpen={!!showList}
                        onClose={() => setShowList(null)}
                        type={showList}
                        userId={profile.id}
                    />

                    {/* Action Buttons */}
                    {!isOwnProfile && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn-primary" onClick={handleFollow} disabled={followLoading} style={{
                                padding: '0.6rem 1.75rem', fontSize: '0.9rem', borderRadius: '12px',
                                background: isFollowing ? 'transparent' : undefined,
                                border: isFollowing ? '1px solid var(--border-light)' : undefined,
                                color: isFollowing ? 'var(--text-main)' : undefined,
                            }}>
                                {followLoading ? "…" : isFollowing ? "Unfollow" : "Follow"}
                            </button>
                            <button className="btn-primary" onClick={() => setIsWritingMessage(!isWritingMessage)} style={{ padding: '0.6rem 1.75rem', fontSize: '0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-light)', color: 'var(--text-main)', borderRadius: '12px' }}>
                                {msgSent ? "Message Sent!" : isWritingMessage ? "Cancel" : "Message"}
                            </button>
                        </div>
                    )}

                    {/* Message Composer Box */}
                    {isWritingMessage && !isOwnProfile && (
                        <div style={{ marginTop: '1.25rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--border-light)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                            <textarea
                                value={messageContent}
                                onChange={e => setMessageContent(e.target.value)}
                                placeholder="Write a message..."
                                style={{
                                    width: '100%', minHeight: '100px', padding: '1rem',
                                    background: 'var(--bg-input)', border: '1px solid var(--border-light)',
                                    borderRadius: '16px', color: 'var(--text-main)',
                                    fontFamily: 'inherit', resize: 'vertical', marginBottom: '1rem',
                                    fontSize: '0.95rem'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-primary" onClick={handleSendMessage} disabled={messageLoading || !messageContent.trim()} style={{ padding: '0.6rem 1.5rem', borderRadius: '12px' }}>
                                    {messageLoading ? "Sending…" : "Send Message"}
                                </button>
                            </div>
                        </div>
                    )}

                    {isOwnProfile && (
                        <Link to="/profile" className="btn-primary" style={{ display: 'inline-block', padding: '0.6rem 1.75rem', fontSize: '0.9rem', textDecoration: 'none', borderRadius: '12px' }}>Edit Profile</Link>
                    )}
                </div>
            </div>

            {/* Studio: Weekly Schedule */}
            {profile.role === "STUDIO" && classes.length > 0 && (
                <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Weekly Schedule</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {classes.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--bg-hover)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
                                <div>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{c.title}</strong>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{c.dayOfWeek}</span> • {c.startTime} - {c.endTime}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {c.style} • {c.level}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {c.teacherName && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>w/ <strong style={{ color: 'var(--text-main)' }}>{c.teacherName}</strong></span>}
                                    {c.teacher && !c.teacherName && (
                                        c.teacher.id ? (
                                            <Link to={`/users/${c.teacher.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', textDecoration: 'none' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>w/ <strong style={{ color: 'var(--text-main)' }}>{c.teacher.name}</strong></span>
                                                {c.teacher.avatarUrl && <img src={c.teacher.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />}
                                            </Link>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>w/ <strong style={{ color: 'var(--text-main)' }}>{c.teacher.name}</strong></span>
                                                {c.teacher.avatarUrl && <img src={c.teacher.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />}
                                                {(() => { console.warn("Missing linked teacher id", c.teacher); return null; })()}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Studio: Memberships */}
            {profile.role === "STUDIO" && memberships.length > 0 && (
                <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Membership Plans</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        {memberships.map(m => (
                            <div key={m.id} style={{ padding: '1.5rem', background: 'var(--bg-hover)', borderRadius: '24px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{m.name}</h4>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.75rem' }}>
                                        €{(m.priceCents / 100).toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                                        <span style={{ display: 'block' }}>{m.durationDays} Days Validity</span>
                                        <span>{m.classLimit ? `${m.classLimit} Classes` : 'Unlimited Classes'}</span>
                                    </div>
                                </div>
                                {me?.role === "DANCER" && !isOwnProfile && (
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => handlePurchaseMembership(m.id)}
                                        style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', borderRadius: '12px' }}
                                    >
                                        Purchase
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Studio: Team */}
            {profile.role === "STUDIO" && team.length > 0 && (
                <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Our Team</h3>
                    <div style={{ display: 'flex', gap: '1.25rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {team.map(t => {
                            const content = (
                                <>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--border-light)', background: 'var(--bg-input)' }}>
                                        <img src={t.user?.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{t.user?.name || "Unnamed"}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>{t.role}</div>
                                    </div>
                                </>
                            );

                            if (t.user?.id) {
                                return (
                                    <Link to={`/users/${t.user.id}`} key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', minWidth: '100px' }}>
                                        {content}
                                    </Link>
                                );
                            } else {
                                console.warn("Missing linked team member user id", t);
                                return (
                                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'inherit', minWidth: '100px' }}>
                                        {content}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </section>
            )}

            {/* Studio: Collaborations */}
            {profile.role === "STUDIO" && collabs.length > 0 && (
                <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Partner Agencies</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {collabs.map(c => {
                            const content = (
                                <>
                                    {c.agency.avatarUrl && <img src={c.agency.avatarUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' }} />}
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{c.agency.name || "Unnamed Agency"}</span>
                                </>
                            );

                            if (c.agency.id) {
                                return (
                                    <Link to={`/users/${c.agency.id}`} key={c.agencyId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', background: 'var(--bg-hover)', borderRadius: '20px', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border-light)' }}>
                                        {content}
                                    </Link>
                                );
                            } else {
                                console.warn("Missing linked agency id", c);
                                return (
                                    <div key={c.agencyId} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.25rem', background: 'var(--bg-hover)', borderRadius: '20px', color: 'inherit', border: '1px solid var(--border-light)' }}>
                                        {content}
                                    </div>
                                );
                            }
                        })}
                    </div>
                </section>
            )}

            {/* Dancer: Professional CV */}
            {profile.role === "DANCER" && cvEntries.length > 0 && (
                <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Professional Experience</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', paddingLeft: '1.5rem' }}>
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '7px', width: '2px', background: 'var(--border-light)' }} />
                        {cvEntries.map(e => (
                            <div key={e.id} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                                <div style={{ position: 'absolute', left: '-22px', top: '8px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)', border: '3px solid var(--bg-card)' }} />
                                <div style={{ flex: 1, padding: '1.25rem', background: 'var(--bg-hover)', borderRadius: '24px', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <strong style={{ fontSize: '1.1rem', fontWeight: 700 }}>{e.title}</strong>
                                        <span className="role-badge" style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '8px' }}>{e.type}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                        {e.startDate ? new Date(e.startDate).getFullYear() : ""}
                                        {e.choreographer ? ` • Choreo: ${e.choreographer}` : ""}
                                    </div>
                                    {e.description && <p style={{ fontSize: '0.95rem', margin: '0 0 1rem 0', color: 'var(--text-main)', lineHeight: 1.5 }}>{e.description}</p>}
                                    {(e.taggedStudio || e.taggedAgency) && (
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {e.taggedStudio && (
                                                e.taggedStudio.id ? (
                                                    <Link to={`/users/${e.taggedStudio.id}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.3rem 0.75rem', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--accent-border)' }}>
                                                        @ {e.taggedStudio.name}
                                                    </Link>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.3rem 0.75rem', borderRadius: '10px', border: '1px solid var(--accent-border)' }}>
                                                        @ {e.taggedStudio.name}
                                                        {(() => { console.warn("Missing tagged studio id", e.taggedStudio); return null; })()}
                                                    </span>
                                                )
                                            )}
                                            {e.taggedAgency && (
                                                e.taggedAgency.id ? (
                                                    <Link to={`/users/${e.taggedAgency.id}`} style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.3rem 0.75rem', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--accent-border)' }}>
                                                        @ {e.taggedAgency.name}
                                                    </Link>
                                                ) : (
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.3rem 0.75rem', borderRadius: '10px', border: '1px solid var(--accent-border)' }}>
                                                        @ {e.taggedAgency.name}
                                                        {(() => { console.warn("Missing tagged agency id", e.taggedAgency); return null; })()}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Dance Styles */}
            {
                profile.danceStyles?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Dance Styles</h3>
                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            {profile.danceStyles.map(s => (
                                <span key={s} className="style-chip">{s}</span>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Rich Portfolio Media */}
            {
                profile.portfolioItems?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1.25rem', fontSize: '1.1rem' }}>Media Portfolio</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                            {profile.portfolioItems.map(item => (
                                <div key={item.id} style={{ border: '1px solid var(--border-light)', borderRadius: '20px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                    {item.type === "PHOTO" ? (
                                        <div style={{ height: '150px', backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    ) : (
                                        <div style={{ height: '150px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Play Video &rarr;</a>
                                        </div>
                                    )}
                                    <div style={{ padding: '1rem' }}>
                                        {item.title && <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: 700 }}>{item.title}</h4>}
                                        {item.description && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Created Events — only shown for STUDIO / AGENCY profiles */}
            {
                createdEvents.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem', padding: '2rem', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Events by this Organiser</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {createdEvents.map(evt => (
                                <Link
                                    to={`/events/${evt.id}`}
                                    key={evt.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '64px 1fr auto',
                                        gap: '1rem',
                                        alignItems: 'center',
                                        padding: '1rem',
                                        background: 'var(--bg-hover)',
                                        borderRadius: '20px',
                                        border: '1px solid var(--border-light)',
                                        textDecoration: 'none',
                                        color: 'inherit',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {/* Thumbnail */}
                                    <div style={{
                                        width: '64px', height: '64px', borderRadius: '12px',
                                        backgroundImage: evt.imageUrl ? `url(${evt.imageUrl})` : 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(124,58,237,0.2))',
                                        backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0,
                                    }} />

                                    {/* Info */}
                                    <div style={{ minWidth: 0 }}>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}>
                                            {evt.title}
                                        </h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {evt.location} &bull; {new Date(evt.startAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>

                                    {/* Price + CTA */}
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent)', fontSize: '1rem' }}>
                                            €{(evt.priceCents / 100).toFixed(2)}
                                        </p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View →</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Member Since */}
            <section className="detail-card" style={{ padding: '1.5rem', borderRadius: '20px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long' })}
                </p>
            </section>
        </main >
    );
}
