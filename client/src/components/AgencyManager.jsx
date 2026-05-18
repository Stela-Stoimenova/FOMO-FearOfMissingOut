import { useState, useEffect, useCallback } from "react";
import {
  getAgencyCollaborations, acceptCollaboration, declineCollaboration,
  sendCollabInviteToStudio,
  getAgencyRoster, addToRoster, removeFromRoster,
  getTaggedCvEntries, acceptCvTag, declineCvTag,
} from "../api/agency.js";
import { getRecommendedDancers } from "../api/users.js";
import UserSelect from "./UserSelect.jsx";

const STATUS_COLORS = {
  PENDING: { color: "var(--warning)", bg: "rgba(245,158,11,0.1)", label: "Pending" },
  ACTIVE: { color: "var(--success)", bg: "rgba(16,185,129,0.1)", label: "Active" },
  ENDED: { color: "var(--text-muted)", bg: "var(--bg-hover)", label: "Ended" },
};

const CV_TYPE_COLORS = {
  TRAINING: "#6366f1",
  PROJECT: "#10b981",
  WORKSHOP: "#f59e0b",
  COMPETITION: "#ef4444",
};

export default function AgencyManager() {
  const [collabs, setCollabs] = useState([]);
  const [roster, setRoster] = useState([]);
  const [cvTags, setCvTags] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rosterForm, setRosterForm] = useState({ dancerId: null, notes: "" });
  const [inviteForm, setInviteForm] = useState({ studioId: null, description: "" });
  const [activeTab, setActiveTab] = useState("collabs");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, r, cv, recs] = await Promise.all([
        getAgencyCollaborations(),
        getAgencyRoster(),
        getTaggedCvEntries(),
        getRecommendedDancers().catch(e => { console.error("Recommendations error:", e); return []; }),
      ]);
      setCollabs(c);
      setRoster(r);
      setCvTags(cv);
      setRecommendations(recs);
    } catch (err) {
      console.error("Agency load failed:", err);
      setError(err.message || "Failed to load agency data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleAccept(studioId) {
    setError(null);
    try {
      await acceptCollaboration(studioId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDecline(studioId) {
    setError(null);
    try {
      await declineCollaboration(studioId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleAddRoster(e) {
    e.preventDefault();
    setError(null);
    if (!rosterForm.dancerId) { setError("Please select a dancer first."); return; }
    try {
      await addToRoster(rosterForm);
      setRosterForm({ dancerId: null, notes: "" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleRemoveRoster(dancerId) {
    setError(null);
    try {
      await removeFromRoster(dancerId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleAcceptCv(cvId) {
    try {
      await acceptCvTag(cvId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeclineCv(cvId) {
    try {
      await declineCvTag(cvId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    setError(null);
    if (!inviteForm.studioId) { setError("Please select a studio first."); return; }
    try {
      await sendCollabInviteToStudio(inviteForm);
      setInviteForm({ studioId: null, description: "" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  // Split pending by who initiated
  const pendingFromStudios = collabs.filter(c => c.status === "PENDING" && c.initiatedBy !== "AGENCY");
  const pendingFromAgency = collabs.filter(c => c.status === "PENDING" && c.initiatedBy === "AGENCY");
  const pendingCollabs = collabs.filter(c => c.status === "PENDING");
  const activeCollabs = collabs.filter(c => c.status === "ACTIVE");

  const pendingCvTags = cvTags.filter(cv => cv.verificationStatus === "PENDING");

  const tabs = [
    { id: "collabs", label: `Collaborations`, badge: pendingFromStudios.length > 0 ? pendingFromStudios.length : null },
    { id: "roster", label: `Talent Roster`, badge: roster.length || null },
    { id: "tags", label: `CV Mentions`, badge: pendingCvTags.length > 0 ? pendingCvTags.length : null },
  ];

  if (loading && !collabs.length && !roster.length) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-light)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem auto" }} />
        <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading Agency Data…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {error && (
        <div style={{ padding: "1rem 1.25rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--warning)", borderRadius: "16px", color: "var(--warning)", fontSize: "0.95rem" }}>
          {error}
        </div>
      )}

      {/* Global pending requests banner — visible regardless of active tab */}
      {!loading && pendingFromStudios.length > 0 && activeTab !== "collabs" && (
        <div
          onClick={() => setActiveTab("collabs")}
          style={{ padding: "0.875rem 1.25rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: "16px", display: "flex", alignItems: "center", gap: "0.875rem", cursor: "pointer", transition: "background 0.2s" }}
        >
          <span style={{ fontSize: "1.1rem" }}>🔔</span>
          <div style={{ flex: 1 }}>
            <strong style={{ color: "var(--warning)", fontSize: "0.95rem" }}>
              {pendingFromStudios.length} incoming {pendingFromStudios.some(c => c.description?.startsWith('Invited to co-organize "')) ? "event invitation" : "collaboration request"}{pendingFromStudios.length > 1 ? "s" : ""}
            </strong>
            <p style={{ margin: "0.1rem 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Studio{pendingFromStudios.length > 1 ? "s" : ""} waiting for your response — click to review
            </p>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--warning)", fontWeight: 600 }}>View →</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1.25rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
              fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: "pointer",
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "color 0.2s",
              marginBottom: "-1px",
            }}
          >
            {tab.label}
            {tab.badge && (
              <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "20px", background: tab.id === "collabs" && pendingCollabs.length > 0 ? "var(--warning)" : "var(--accent-soft)", color: tab.id === "collabs" && pendingCollabs.length > 0 ? "#fff" : "var(--accent)", fontWeight: 700 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Dancer Recommendations ── */}
      <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", border: "2px solid var(--accent)", background: "linear-gradient(145deg, var(--bg-card), var(--bg-hover))", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              Dancer Recommendations
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>Talent matching your agency's location and styles.</p>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{recommendations.length} Matches</span>
        </div>

        {recommendations.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {recommendations.map(dancer => (
              <div key={dancer.id} style={{ display: "flex", flexDirection: "column", padding: "1.25rem", background: "var(--bg-card)", borderRadius: "20px", border: "1px solid var(--border-light)", transition: "transform 0.2s, border-color 0.2s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-hover)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                    <img src={dancer.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dancer.name || "Unnamed"}</div>
                    {dancer.city && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{dancer.city}</div>}
                  </div>
                  <div style={{ background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 800, fontSize: "0.85rem", padding: "0.3rem 0.6rem", borderRadius: "10px" }}>
                    {dancer.matchScore}%
                  </div>
                </div>

                {dancer.matchReasons?.length > 0 && (
                  <div style={{ marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    {dancer.matchReasons.map((reason, i) => (
                      <div key={i} style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span style={{ color: "var(--accent)", fontSize: "0.65rem" }}>✓</span> {reason}
                      </div>
                    ))}
                  </div>
                )}

                {dancer.danceStyles?.length > 0 && (
                  <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {dancer.danceStyles.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: "var(--bg-hover)", color: "var(--text-main)", border: "1px solid var(--border-light)" }}>{s}</span>
                    ))}
                    {dancer.danceStyles.length > 3 && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", padding: "0.2rem" }}>+{dancer.danceStyles.length - 3}</span>}
                  </div>
                )}

                <div style={{ marginTop: "auto", display: "flex", gap: "0.5rem" }}>
                  <a href={`/users/${dancer.id}`} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ flex: 1, textAlign: "center", padding: "0.5rem", fontSize: "0.8rem", borderRadius: "999px", textDecoration: "none" }}>View Profile</a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "3rem", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
             <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
               {loading ? "Searching for the perfect matches..." : "No recommended dancers found yet. Try adding more styles to your profile to improve matching!"}
             </p>
          </div>
        )}
      </section>

      {/* ── Collaborations Tab ── */}
      {activeTab === "collabs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Pending requests FROM studios (need agency action) */}
          {pendingFromStudios.length > 0 && (
            <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", color: "var(--warning)" }}>
                Incoming Requests ({pendingFromStudios.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {pendingFromStudios.map(c => {
                  const isEventInvite = c.description && c.description.startsWith('Invited to co-organize "');
                  const eventTitle = isEventInvite
                    ? c.description.replace(/^Invited to co-organize "/, "").replace(/"$/, "")
                    : null;
                  return (
                  <div key={c.studioId} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem 1.25rem", background: isEventInvite ? "rgba(99,102,241,0.07)" : "rgba(245,158,11,0.05)", borderRadius: "16px", border: `1px solid ${isEventInvite ? "rgba(99,102,241,0.3)" : "rgba(245,158,11,0.2)"}` }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                      <img src={c.studio.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: 700 }}>{c.studio.name || "Unnamed Studio"}</span>
                        {isEventInvite && (
                          <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: "rgba(99,102,241,0.15)", color: "var(--accent)", fontWeight: 700, letterSpacing: "0.03em" }}>EVENT INVITATION</span>
                        )}
                      </div>
                      {c.studio.city && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.studio.city}</div>}
                      {isEventInvite ? (
                        <div style={{ marginTop: "0.35rem", fontSize: "0.88rem", color: "var(--text-main)" }}>
                          Inviting you to co-organize: <strong>"{eventTitle}"</strong>
                        </div>
                      ) : c.description ? (
                        <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "0.25rem" }}>{c.description}</div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, marginTop: "0.1rem" }}>
                      <button onClick={() => handleAccept(c.studioId)} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", borderRadius: "10px" }}>Accept</button>
                      <button onClick={() => handleDecline(c.studioId)} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", color: "var(--warning)" }}>Decline</button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Sent invites awaiting studio response */}
          {pendingFromAgency.length > 0 && (
            <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
              <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", color: "var(--text-muted)" }}>
                Sent Invites ({pendingFromAgency.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {pendingFromAgency.map(c => (
                  <div key={c.studioId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "var(--bg-hover)", borderRadius: "16px", border: "1px solid var(--border-light)" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                      <img src={c.studio.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{c.studio.name || "Unnamed Studio"}</div>
                      {c.studio.city && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.studio.city}</div>}
                      {c.description && <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "0.25rem" }}>{c.description}</div>}
                    </div>
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: "rgba(245,158,11,0.1)", color: "var(--warning)", fontWeight: 600, flexShrink: 0 }}>Awaiting</span>
                    <button onClick={() => handleDecline(c.studioId)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>&times;</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active collaborations */}
          <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Active Collaborations</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{activeCollabs.length} Studios</span>
            </div>
            {activeCollabs.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {activeCollabs.map(c => (
                  <div key={c.studioId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", overflow: "hidden", background: "var(--bg-input)" }}>
                      <img src={c.studio.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.studio.name || "Unnamed"}</div>
                      {c.studio.city && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{c.studio.city}</div>}
                    </div>
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: "rgba(16,185,129,0.1)", color: "var(--success)", fontWeight: 600 }}>Active</span>
                    <button onClick={() => handleDecline(c.studioId)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>&times;</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>No active collaborations yet.</p>
              </div>
            )}
          </section>

          {/* Invite a Studio */}
          <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid var(--border-light)" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem" }}>Invite a Studio</h3>
            <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <UserSelect
                role="STUDIO"
                value={inviteForm.studioId}
                onChange={id => setInviteForm(f => ({ ...f, studioId: id }))}
                placeholder="Search studios..."
              />
              <textarea
                value={inviteForm.description}
                onChange={e => setInviteForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Message (optional)"
                rows={2}
                style={{ padding: "0.75rem 1rem", background: "var(--bg-input)", border: "1px solid var(--border-light)", borderRadius: "12px", color: "var(--text-main)", fontFamily: "inherit", resize: "vertical", fontSize: "0.9rem" }}
              />
              <button type="submit" className="btn-primary" style={{ padding: "0.65rem 1.5rem", borderRadius: "12px", alignSelf: "flex-start" }}>
                Send Invite
              </button>
            </form>
          </section>
        </div>
      )}

      {/* ── Talent Roster Tab ── */}
      {activeTab === "roster" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Managed Dancers</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{roster.length} Dancers</span>
            </div>

            {roster.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                {roster.map(entry => (
                  <div key={entry.id} style={{ padding: "1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)", position: "relative" }}>
                    <button onClick={() => handleRemoveRoster(entry.dancerId)} style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "14px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                        <img src={entry.dancer.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{entry.dancer.name || "Unnamed"}</div>
                        {entry.dancer.city && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.dancer.city}</div>}
                      </div>
                    </div>
                    {entry.dancer.experienceLevel && (
                      <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "999px", background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 }}>{entry.dancer.experienceLevel}</span>
                    )}
                    {entry.dancer.danceStyles?.length > 0 && (
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
                        {entry.dancer.danceStyles.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>{s}</span>
                        ))}
                        {entry.dancer.danceStyles.length > 3 && <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>+{entry.dancer.danceStyles.length - 3}</span>}
                      </div>
                    )}
                    {entry.notes && <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.75rem 0 0 0", fontStyle: "italic" }}>{entry.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", marginBottom: "2rem" }}>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>No dancers on your roster yet.</p>
              </div>
            )}

            {/* Add to Roster Form */}
            <div style={{ background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
              <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Add Dancer to Roster</h4>
              <form onSubmit={handleAddRoster} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Search Dancer *</label>
                  <UserSelect role="DANCER" value={rosterForm.dancerId} onChange={id => setRosterForm({ ...rosterForm, dancerId: id })} placeholder="Type dancer name..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Internal Notes (Optional)</label>
                  <input type="text" className="form-input" placeholder="e.g. Hip Hop specialist, available for tours" value={rosterForm.notes} onChange={e => setRosterForm({ ...rosterForm, notes: e.target.value })} />
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Add to Roster</button>
              </form>
            </div>
          </section>
        </div>
      )}

      {/* ── CV Mentions Tab ── */}
      {activeTab === "tags" && (
        <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Dancers Who Mentioned Your Agency</h3>
            <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{cvTags.length} Mentions</span>
          </div>
          {cvTags.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {cvTags.map(entry => (
                <div key={entry.id} style={{ display: "flex", gap: "1rem", padding: "1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)", alignItems: "flex-start" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "14px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                    <img src={entry.user.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.95rem" }}>{entry.user.name || "Unnamed Dancer"}</strong>
                      <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: `${CV_TYPE_COLORS[entry.type]}20`, color: CV_TYPE_COLORS[entry.type], fontWeight: 700 }}>{entry.type}</span>
                      {entry.user.city && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.user.city}</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "0.3rem" }}>{entry.title}</div>
                    {entry.startDate && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(entry.startDate).getFullYear()}{entry.endDate ? ` – ${new Date(entry.endDate).getFullYear()}` : ""}</div>}
                    {entry.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.4rem 0 0 0" }}>{entry.description}</p>}
                    {entry.user.danceStyles?.length > 0 && (
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {entry.user.danceStyles.slice(0, 4).map(s => (
                          <span key={s} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "999px", background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{ 
                        fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 700,
                        background: entry.verificationStatus === 'VERIFIED' ? 'rgba(16,185,129,0.1)' : entry.verificationStatus === 'REJECTED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: entry.verificationStatus === 'VERIFIED' ? 'var(--success)' : entry.verificationStatus === 'REJECTED' ? 'var(--danger)' : 'var(--warning)'
                    }}>
                        {entry.verificationStatus}
                    </span>
                    {entry.verificationStatus === "PENDING" && (
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                            <button onClick={() => handleDeclineCv(entry.id)} className="btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>Reject</button>
                            <button onClick={() => handleAcceptCv(entry.id)} className="btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.75rem' }}>Verify</button>
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No dancers have mentioned your agency in their CV yet.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
