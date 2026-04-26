import { useState, useEffect, useCallback } from "react";
import { 
  getStudioClasses, createStudioClass, deleteStudioClass,
  getStudioMemberships, createMembershipTier, deleteMembershipTier,
  getStudioTeam, addStudioTeamMember, deleteStudioTeamMember,
  getStudioCollaborations, createCollaboration, deleteCollaboration
} from "../api/studios.js";
import UserSelect from "./UserSelect.jsx";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL_LEVELS"];
const TEAM_ROLES = ["INSTRUCTOR", "CHOREOGRAPHER", "DANCER"];

export default function StudioManager({ studioId }) {
  const [classes, setClasses] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [team, setTeam] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Error/Success state
  const [error, setError] = useState(null);

  // Forms
  const [classForm, setClassForm] = useState({ title: "", dayOfWeek: "MONDAY", startTime: "18:00", endTime: "19:00", style: "", level: "ALL_LEVELS", teacherName: "", teacherId: null });
  const [memForm, setMemForm] = useState({ name: "", description: "", priceCents: "", durationDays: 30, classLimit: "" });
  const [teamForm, setTeamForm] = useState({ userId: null, role: "INSTRUCTOR" });
  const [collabForm, setCollabForm] = useState({ agencyId: null, description: "" });

  const loadAll = useCallback(async () => {
    if (!studioId) return;
    setLoading(true);
    try {
      const [cls, mem, tm, col] = await Promise.all([
        getStudioClasses(studioId), getStudioMemberships(studioId),
        getStudioTeam(studioId), getStudioCollaborations(studioId)
      ]);
      setClasses(cls); setMemberships(mem); setTeam(tm); setCollabs(col);
    } catch (err) { 
      console.error("Load failed:", err); 
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const clearError = () => setError(null);

  // --- Handlers ---
  async function handleAddClass(e) {
    e.preventDefault();
    clearError();
    try {
      const payload = { ...classForm };
      if (!payload.teacherId) delete payload.teacherId;
      await createStudioClass(payload);
      setClassForm({ title: "", dayOfWeek: "MONDAY", startTime: "18:00", endTime: "19:00", style: "", level: "ALL_LEVELS", teacherName: "", teacherId: null });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleAddMem(e) {
    e.preventDefault();
    clearError();
    try {
      const payload = { 
        ...memForm, 
        priceCents: Math.round(Number(memForm.priceCents) * 100), 
        classLimit: memForm.classLimit ? Number(memForm.classLimit) : null,
        durationDays: Number(memForm.durationDays)
      };
      await createMembershipTier(payload);
      setMemForm({ name: "", description: "", priceCents: "", durationDays: 30, classLimit: "" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleAddTeam(e) {
    e.preventDefault();
    clearError();
    if (!teamForm.userId) { setError("Please search and select a dancer first."); return; }
    try {
      await addStudioTeamMember(teamForm);
      setTeamForm({ userId: null, role: "INSTRUCTOR" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleAddCollab(e) {
    e.preventDefault();
    clearError();
    if (!collabForm.agencyId) { setError("Please search and select an agency first."); return; }
    try {
      await createCollaboration(collabForm);
      setCollabForm({ agencyId: null, description: "" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteClass(id) {
    try {
      await deleteStudioClass(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteMembership(id) {
    try {
      await deleteMembershipTier(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteTeam(id) {
    try {
      await deleteStudioTeamMember(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteCollab(id) {
    try {
      await deleteCollaboration(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  if (loading && !classes.length && !memberships.length) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading Studio Data...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      
      {error && (
        <div style={{ padding: "1rem 1.25rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--warning)", borderRadius: "16px", color: "var(--warning)", fontSize: "0.95rem", animation: "fadeIn 0.3s ease" }}>
          {error}
        </div>
      )}

      {/* Classes */}
      <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Weekly Schedule</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{classes.length} Classes</span>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {classes.length > 0 ? classes.map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)", transition: "transform 0.2s ease" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-main)" }}>{c.title}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <span><strong style={{ color: "var(--accent)" }}>{c.dayOfWeek}</strong></span>
                  <span>•</span>
                  <span>{c.startTime} - {c.endTime}</span>
                  <span>•</span>
                  <span>{c.style}</span>
                  <span>•</span>
                  <span>{c.level}</span>
                </div>
                {(c.teacherName || c.teacher) && (
                   <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                     with {c.teacherName || c.teacher?.name}
                   </div>
                )}
              </div>
              <button onClick={() => handleDeleteClass(c.id)} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--warning)" }}>Delete</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No classes scheduled yet.</p>
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Add a New Class</h4>
          <form onSubmit={handleAddClass} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Class Title *</label>
                <input type="text" className="form-input" placeholder="e.g. Intermediate Hip Hop" value={classForm.title} onChange={e => setClassForm({...classForm, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Day of Week *</label>
                <select className="filter-select" value={classForm.dayOfWeek} onChange={e => setClassForm({...classForm, dayOfWeek: e.target.value})} required>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-input" value={classForm.startTime} onChange={e => setClassForm({...classForm, startTime: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input type="time" className="form-input" value={classForm.endTime} onChange={e => setClassForm({...classForm, endTime: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Dance Style *</label>
                <input type="text" className="form-input" placeholder="e.g. House" value={classForm.style} onChange={e => setClassForm({...classForm, style: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Level *</label>
                <select className="filter-select" value={classForm.level} onChange={e => setClassForm({...classForm, level: e.target.value})} required>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Teacher Name (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. Sarah J." value={classForm.teacherName} onChange={e => setClassForm({...classForm, teacherName: e.target.value})} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Or Link to Teacher Profile</label>
              <UserSelect role="" value={classForm.teacherId} onChange={id => setClassForm({...classForm, teacherId: id})} placeholder="Search for a teacher profile..." />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Add to Schedule</button>
          </form>
        </div>
      </section>

      {/* Memberships */}
      <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>Membership Plans</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {memberships.length > 0 ? memberships.map(m => (
            <div key={m.id} style={{ padding: "1.5rem", background: "var(--bg-hover)", borderRadius: "24px", border: "1px solid var(--border-light)", position: "relative", transition: "all 0.2s ease" }}>
              <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.5rem" }}>{m.name}</div>
              <div style={{ fontSize: "1.75rem", color: "var(--accent)", fontWeight: 800, margin: "0.5rem 0" }}>€{(m.priceCents / 100).toFixed(2)}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                <span style={{ display: "block" }}>{m.classLimit ? `${m.classLimit} Classes` : "Unlimited Classes"}</span>
                <span>Valid for {m.durationDays} Days</span>
              </div>
              <button onClick={() => handleDeleteMembership(m.id)} style={{ position: "absolute", top: "1rem", right: "1rem", width: "28px", height: "28px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--warning)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>&times;</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", gridColumn: "1/-1" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No membership plans yet.</p>
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Create a New Plan</h4>
          <form onSubmit={handleAddMem} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Plan Name *</label>
                <input type="text" className="form-input" placeholder="e.g. Unlimited Month" value={memForm.name} onChange={e => setMemForm({...memForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price (EUR) *</label>
                <input type="number" className="form-input" placeholder="0.00" step="0.01" value={memForm.priceCents} onChange={e => setMemForm({...memForm, priceCents: e.target.value})} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Class Limit (Empty = Unlimited)</label>
                <input type="number" className="form-input" placeholder="e.g. 8" value={memForm.classLimit} onChange={e => setMemForm({...memForm, classLimit: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Days) *</label>
                <input type="number" className="form-input" value={memForm.durationDays} onChange={e => setMemForm({...memForm, durationDays: e.target.value})} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input type="text" className="form-input" placeholder="e.g. Best for serious dancers" value={memForm.description} onChange={e => setMemForm({...memForm, description: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Create Plan</button>
          </form>
        </div>
      </section>

      {/* Team */}
      <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>Our Team</h3>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          {team.length > 0 ? team.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)", transition: "all 0.2s ease" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border-light)", background: "var(--bg-input)" }}>
                <img src={t.user.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ minWidth: "100px" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{t.user.name || "Unnamed"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--accent)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>{t.role}</div>
              </div>
              <button onClick={() => handleDeleteTeam(t.id)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", fontSize: "1rem", marginLeft: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", width: "100%" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No team members added yet.</p>
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Add Team Member</h4>
          <form onSubmit={handleAddTeam} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", alignItems: "flex-end" }}>
              <div className="form-group">
                <label className="form-label">Search User *</label>
                <UserSelect role="" value={teamForm.userId} onChange={id => setTeamForm({...teamForm, userId: id})} placeholder="Type name..." />
              </div>
              <div className="form-group">
                <label className="form-label">Role *</label>
                <select className="filter-select" value={teamForm.role} onChange={e => setTeamForm({...teamForm, role: e.target.value})} required>
                  {TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Add to Team</button>
          </form>
        </div>
      </section>

      {/* Collaborations */}
      <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>Agency Collaborations</h3>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          {collabs.length > 0 ? collabs.map(c => (
            <div key={c.agencyId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-light)", background: "var(--bg-input)" }}>
                <img src={c.agency.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.agency.name || "Unnamed Agency"}</div>
              <button onClick={() => handleDeleteCollab(c.agencyId)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", width: "100%" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No active collaborations.</p>
            </div>
          )}
        </div>

        <div style={{ background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Link an Agency</h4>
          <form onSubmit={handleAddCollab} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label">Search Agency *</label>
              <UserSelect role="AGENCY" value={collabForm.agencyId} onChange={id => setCollabForm({...collabForm, agencyId: id})} placeholder="Type agency name..." />
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input type="text" className="form-input" placeholder="e.g. Global representation partner" value={collabForm.description} onChange={e => setCollabForm({...collabForm, description: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Link Agency</button>
          </form>
        </div>
      </section>

    </div>
  );
}
