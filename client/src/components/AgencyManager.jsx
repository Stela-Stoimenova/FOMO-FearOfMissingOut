import { useState, useEffect, useCallback } from "react";
import {
  getAgencyCollaborations, acceptCollaboration, declineCollaboration,
  getAgencyRoster, addToRoster, removeFromRoster,
  getTaggedCvEntries,
} from "../api/agency.js";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rosterForm, setRosterForm] = useState({ dancerId: null, notes: "" });
  const [activeTab, setActiveTab] = useState("collabs");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r, cv] = await Promise.all([
        getAgencyCollaborations(),
        getAgencyRoster(),
        getTaggedCvEntries(),
      ]);
      setCollabs(c);
      setRoster(r);
      setCvTags(cv);
    } catch (err) {
      console.error("Agency load failed:", err);
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
    if (!window.confirm("Decline this collaboration request?")) return;
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
    if (!window.confirm("Remove this dancer from your roster?")) return;
    setError(null);
    try {
      await removeFromRoster(dancerId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  const pendingCollabs = collabs.filter(c => c.status === "PENDING");
  const activeCollabs = collabs.filter(c => c.status === "ACTIVE");

  const tabs = [
    { id: "collabs", label: `Collaborations`, badge: pendingCollabs.length > 0 ? pendingCollabs.length : null },
    { id: "roster", label: `Talent Roster`, badge: roster.length || null },
    { id: "tags", label: `CV Mentions`, badge: cvTags.length || null },
  ];

  if (loading && !collabs.length && !roster.length) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading Agency Data...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {error && (
        <div style={{ padding: "1rem 1.25rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--warning)", borderRadius: "16px", color: "var(--warning)", fontSize: "0.95rem" }}>
          {error}
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

      {/* ── Collaborations Tab ── */}
      {activeTab === "collabs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Pending requests */}
          {pendingCollabs.length > 0 && (
            <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", color: "var(--warning)" }}>
                Pending Requests ({pendingCollabs.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {pendingCollabs.map(c => (
                  <div key={c.studioId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "rgba(245,158,11,0.05)", borderRadius: "16px", border: "1px solid rgba(245,158,11,0.2)" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                      <img src={c.studio.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>{c.studio.name || "Unnamed Studio"}</div>
                      {c.studio.city && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{c.studio.city}</div>}
                      {c.description && <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "0.25rem" }}>{c.description}</div>}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                      <button onClick={() => handleAccept(c.studioId)} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", borderRadius: "10px" }}>Accept</button>
                      <button onClick={() => handleDecline(c.studioId)} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", color: "var(--warning)" }}>Decline</button>
                    </div>
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
                    <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "8px", background: "rgba(16,185,129,0.1)", color: "var(--success)", fontWeight: 600 }}>Active</span>
                    <button onClick={() => handleDecline(c.studioId)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>&times;</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
                <p style={{ color: "var(--text-muted)", margin: 0 }}>No active collaborations yet. Studios will send requests that appear above.</p>
              </div>
            )}
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
                      <span style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", borderRadius: "8px", background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600 }}>{entry.dancer.experienceLevel}</span>
                    )}
                    {entry.dancer.danceStyles?.length > 0 && (
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
                        {entry.dancer.danceStyles.slice(0, 3).map(s => (
                          <span key={s} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "6px", background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>{s}</span>
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
                      <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "8px", background: `${CV_TYPE_COLORS[entry.type]}20`, color: CV_TYPE_COLORS[entry.type], fontWeight: 700 }}>{entry.type}</span>
                      {entry.user.city && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.user.city}</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "0.3rem" }}>{entry.title}</div>
                    {entry.startDate && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(entry.startDate).getFullYear()}{entry.endDate ? ` – ${new Date(entry.endDate).getFullYear()}` : ""}</div>}
                    {entry.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.4rem 0 0 0" }}>{entry.description}</p>}
                    {entry.user.danceStyles?.length > 0 && (
                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                        {entry.user.danceStyles.slice(0, 4).map(s => (
                          <span key={s} style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", borderRadius: "6px", background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-light)" }}>{s}</span>
                        ))}
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
