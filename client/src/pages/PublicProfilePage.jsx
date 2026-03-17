import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserProfile, followUser, unfollowUser, getMe } from "../api/users.js";
import { sendMessage } from "../api/messages.js";
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

    // Followers/Following list state
    const [showList, setShowList] = useState(null); // 'followers' | 'following' | null

    useEffect(() => {
        async function load() {
            setLoading(true);
            setError(null);
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
            } catch (err) {
                setError(err.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, me]);

    async function handleFollow() {
        if (!me) return alert("Please log in to follow users.");
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
            alert(err.message || "Failed to update follow status");
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
            alert(err.message || "Failed to send message");
        } finally {
            setMessageLoading(false);
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

            {/* Profile Header */}
            <div className="detail-card" style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', marginBottom: '2rem', padding: '2.5rem' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <h1 style={{ margin: 0, fontSize: '2rem' }}>{profile.name || "Unnamed"}</h1>
                        <span className="role-badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.7rem' }}>{profile.role}</span>
                        {profile.experienceLevel && (
                            <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{profile.experienceLevel}</span>
                        )}
                    </div>
                    {profile.city && <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{profile.city}</p>}
                    {profile.bio && <p style={{ color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '1rem' }}>{profile.bio}</p>}

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1rem' }}>
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
                                padding: '0.5rem 1.5rem', fontSize: '0.9rem',
                                background: isFollowing ? 'transparent' : undefined,
                                border: isFollowing ? '1px solid var(--border-light)' : undefined,
                                color: isFollowing ? 'var(--text-main)' : undefined,
                            }}>
                                {followLoading ? "…" : isFollowing ? "Unfollow" : "Follow"}
                            </button>
                            <button className="btn-primary" onClick={() => setIsWritingMessage(!isWritingMessage)} style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', background: 'var(--bg-hover)', border: '1px solid var(--border-light)', color: 'var(--text-main)' }}>
                                {msgSent ? "Message Sent!" : isWritingMessage ? "Cancel" : "Message"}
                            </button>
                        </div>
                    )}

                    {/* Message Composer Box */}
                    {isWritingMessage && !isOwnProfile && (
                        <div style={{ marginTop: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                            <textarea
                                value={messageContent}
                                onChange={e => setMessageContent(e.target.value)}
                                placeholder="Write a message..."
                                style={{
                                    width: '100%', minHeight: '80px', padding: '0.75rem',
                                    background: 'var(--bg-input)', border: '1px solid var(--border-light)',
                                    borderRadius: 'var(--radius-sm)', color: 'var(--text-main)',
                                    fontFamily: 'inherit', resize: 'vertical', marginBottom: '0.75rem'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button className="btn-primary" onClick={handleSendMessage} disabled={messageLoading || !messageContent.trim()} style={{ padding: '0.4rem 1.25rem', fontSize: '0.9rem' }}>
                                    {messageLoading ? "Sending…" : "Send Message"}
                                </button>
                            </div>
                        </div>
                    )}

                    {isOwnProfile && (
                        <Link to="/profile" className="btn-primary" style={{ display: 'inline-block', padding: '0.5rem 1.5rem', fontSize: '0.9rem', textDecoration: 'none' }}>Edit Profile</Link>
                    )}
                </div>
            </div>

            {/* Dance Styles */}
            {
                profile.danceStyles?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Dance Styles</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {profile.danceStyles.map(s => (
                                <span key={s} className="style-chip">{s}</span>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Portfolio Links (Classic) */}
            {
                profile.portfolioLinks?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Links</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {profile.portfolioLinks.map((link, i) => (
                                <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
                                    {link}
                                </a>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Rich Portfolio Media */}
            {
                profile.portfolioItems?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Media Portfolio</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {profile.portfolioItems.map(item => (
                                <div key={item.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-card)' }}>
                                    {item.type === "PHOTO" ? (
                                        <div style={{ height: '140px', backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                                    ) : (
                                        <div style={{ height: '140px', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>Play Video &rarr;</a>
                                        </div>
                                    )}
                                    <div style={{ padding: '0.75rem' }}>
                                        {item.title && <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>{item.title}</h4>}
                                        {item.description && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Tagged Events */}
            {
                profile.taggedEvents?.length > 0 && (
                    <section className="detail-card" style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Events Attended / Performed</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {profile.taggedEvents.map(evt => (
                                <Link to={`/events/${evt.id}`} key={evt.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', textDecoration: 'none', color: 'inherit', border: '1px solid var(--border-light)' }}>
                                    {evt.imageUrl && <img src={evt.imageUrl} alt={evt.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />}
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{evt.title}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.location}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )
            }

            {/* Member Since */}
            <section className="detail-card">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long' })}
                </p>
            </section>
        </main >
    );
}
