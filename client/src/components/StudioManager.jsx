import { useState, useEffect, useCallback } from "react";
import {
  getStudioClasses, createStudioClass, updateStudioClass, deleteStudioClass,
  getOwnMembershipsManage, createMembershipTier, updateMembershipTier, deleteMembershipTier,
  getStudioTeam, addStudioTeamMember, deleteStudioTeamMember,
  getStudioCollaborations, createCollaboration, deleteCollaboration, acceptAgencyCollaboration,
  getTaggedCvEntries, acceptCvTag, declineCvTag,
} from "../api/studios.js";
import UserSelect from "./UserSelect.jsx";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL", "ALL_LEVELS"];
const TEAM_ROLES = ["INSTRUCTOR", "CHOREOGRAPHER", "DANCER"];

const EMPTY_CLASS_FORM = { title: "", dayOfWeek: "MONDAY", startTime: "18:00", endTime: "19:00", style: "", level: "ALL_LEVELS", teacherName: "", teacherId: null };
const EMPTY_MEM_FORM = { name: "", description: "", priceCents: "", durationDays: 30, classLimit: "" };

const STATUS_STYLE = {
  PENDING: { color: "var(--warning)", label: "Pending agency response" },
  ACTIVE: { color: "var(--success)", label: "Active" },
  ENDED: { color: "var(--text-muted)", label: "Ended" },
};

export default function StudioManager({ studioId }) {

  const [classes, setClasses] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [team, setTeam] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [cvTags, setCvTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  // Add forms
  const [classForm, setClassForm] = useState(EMPTY_CLASS_FORM);
  const [memForm, setMemForm] = useState(EMPTY_MEM_FORM);
  const [teamForm, setTeamForm] = useState({ userId: null, role: "INSTRUCTOR" });
  const [collabForm, setCollabForm] = useState({ agencyId: null, description: "" });

  // Edit state: null means not editing, otherwise holds the record being edited
  const [editingClass, setEditingClass] = useState(null);
  const [editingMem, setEditingMem] = useState(null);

  const loadAll = useCallback(async () => {
    if (!studioId) return;
    setLoading(true);
    try {
      const [cls, mem, tm, col, cv] = await Promise.all([
        getStudioClasses(studioId),
        getOwnMembershipsManage(),
        getStudioTeam(studioId),
        getStudioCollaborations(studioId),
        getTaggedCvEntries().catch(e => { console.error("CV error:", e); return []; }),
      ]);
      setClasses(cls); setMemberships(mem); setTeam(tm); setCollabs(col); setCvTags(cv);
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [studioId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // --- Class handlers ---
  async function handleAddClass(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...classForm };
      if (!payload.teacherId) delete payload.teacherId;
      await createStudioClass(payload);
      setClassForm(EMPTY_CLASS_FORM);
      await loadAll();
      setSuccess("Class added to schedule successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) { setError(err.message); }
  }


  async function handleUpdateClass(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = { ...editingClass };
      if (!payload.teacherId) delete payload.teacherId;
      await updateStudioClass(editingClass.id, payload);
      setEditingClass(null);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteClass(id) {
    try {
      await deleteStudioClass(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  // --- Membership handlers ---
  async function handleAddMem(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...memForm,
        priceCents: Math.round(Number(memForm.priceCents) * 100),
        classLimit: memForm.classLimit ? Number(memForm.classLimit) : null,
        durationDays: Number(memForm.durationDays),
      };
      await createMembershipTier(payload);
      setMemForm(EMPTY_MEM_FORM);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleUpdateMem(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name: editingMem.name,
        description: editingMem.description,
        priceCents: editingMem.priceCents,
        classLimit: editingMem.classLimit ? Number(editingMem.classLimit) : null,
        durationDays: Number(editingMem.durationDays),
        isActive: editingMem.isActive,
      };
      await updateMembershipTier(editingMem.id, payload);
      setEditingMem(null);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteMembership(id) {
    try {
      await deleteMembershipTier(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  // --- Team handlers ---
  async function handleAddTeam(e) {
    e.preventDefault();
    setError(null);
    if (!teamForm.userId) { setError("Please search and select a dancer first."); return; }
    try {
      await addStudioTeamMember(teamForm);
      setTeamForm({ userId: null, role: "INSTRUCTOR" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteTeam(id) {
    try {
      await deleteStudioTeamMember(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  // --- Collaboration handlers ---
  async function handleAddCollab(e) {
    e.preventDefault();
    setError(null);
    if (!collabForm.agencyId) { setError("Please search and select an agency first."); return; }
    try {
      await createCollaboration(collabForm);
      setCollabForm({ agencyId: null, description: "" });
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleAcceptAgencyInvite(agencyId) {
    setError(null);
    try {
      await acceptAgencyCollaboration(agencyId);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  async function handleDeleteCollab(id) {
    try {
      await deleteCollaboration(id);
      await loadAll();
    } catch (err) { setError(err.message); }
  }

  // --- CV Mentions handlers ---
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

  if (loading && !classes.length && !memberships.length) {
    return <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>Loading Studio Data...</div>;
  }

  const cardStyle = { padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" };
  const formBoxStyle = { background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

      {error && (
        <div style={{ padding: "1rem 1.25rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--warning)", borderRadius: "16px", color: "var(--warning)", fontSize: "0.95rem" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "1rem 1.25rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--success)", borderRadius: "16px", color: "var(--success)", fontSize: "0.95rem" }}>
          {success}
        </div>
      )}



      {/* ── Classes ── */}
      <section className="detail-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Weekly Schedule</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{classes.length} Classes</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {classes.length > 0 ? classes.map(c => (
            <div key={c.id}>
              {editingClass?.id === c.id ? (
                /* ── Edit form for this class ── */
                <form onSubmit={handleUpdateClass} style={{ ...formBoxStyle, display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid var(--accent-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, color: "var(--accent)", fontSize: "0.9rem" }}>Editing class</h4>
                    <button type="button" onClick={() => setEditingClass(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div className="form-group"><label className="form-label" htmlFor="edit-title">Title *</label><input id="edit-title" name="title" type="text" className="form-input" value={editingClass.title} onChange={e => setEditingClass({ ...editingClass, title: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label" htmlFor="edit-day">Day *</label><select id="edit-day" name="dayOfWeek" className="filter-select" value={editingClass.dayOfWeek} onChange={e => setEditingClass({ ...editingClass, dayOfWeek: e.target.value })}>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                    <div className="form-group"><label className="form-label" htmlFor="edit-start">Start *</label><input id="edit-start" name="startTime" type="time" className="form-input" value={editingClass.startTime} onChange={e => setEditingClass({ ...editingClass, startTime: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label" htmlFor="edit-end">End *</label><input id="edit-end" name="endTime" type="time" className="form-input" value={editingClass.endTime} onChange={e => setEditingClass({ ...editingClass, endTime: e.target.value })} required /></div>
                    <div className="form-group"><label className="form-label" htmlFor="edit-style">Style *</label><input id="edit-style" name="style" type="text" className="form-input" value={editingClass.style} onChange={e => setEditingClass({ ...editingClass, style: e.target.value })} required /></div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div className="form-group"><label className="form-label" htmlFor="edit-level">Level *</label><select id="edit-level" name="level" className="filter-select" value={editingClass.level} onChange={e => setEditingClass({ ...editingClass, level: e.target.value })}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                    <div className="form-group"><label className="form-label" htmlFor="edit-teacher">Teacher Name</label><input id="edit-teacher" name="teacherName" type="text" className="form-input" value={editingClass.teacherName || ""} onChange={e => setEditingClass({ ...editingClass, teacherName: e.target.value })} /></div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="submit" className="btn-primary" style={{ padding: "0.65rem 2rem", borderRadius: "12px", fontSize: "0.9rem" }}>Save Changes</button>
                    <button type="button" onClick={() => setEditingClass(null)} className="btn-secondary" style={{ padding: "0.65rem 1.5rem", borderRadius: "12px", fontSize: "0.9rem" }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{c.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.4rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <span><strong style={{ color: "var(--accent)" }}>{c.dayOfWeek}</strong></span>
                      <span>•</span><span>{c.startTime} – {c.endTime}</span>
                      <span>•</span><span>{c.style}</span>
                      <span>•</span><span>{c.level}</span>
                    </div>
                    {(c.teacherName || c.teacher) && <div style={{ fontSize: "0.8rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>with {c.teacherName || c.teacher?.name}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => setEditingClass({ ...c })} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "12px" }}>Edit</button>
                    <button onClick={() => handleDeleteClass(c.id)} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "12px", border: "1px solid rgba(239,68,68,0.3)", color: "var(--warning)" }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No classes scheduled yet.</p>
            </div>
          )}
        </div>

        <div style={formBoxStyle}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Add a New Class</h4>
          <form onSubmit={handleAddClass} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div className="form-group"><label className="form-label" htmlFor="cls-title">Class Title *</label><input id="cls-title" name="title" type="text" className="form-input" placeholder="e.g. Intermediate Hip Hop" value={classForm.title} onChange={e => setClassForm({ ...classForm, title: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="cls-day">Day of Week *</label><select id="cls-day" name="dayOfWeek" className="filter-select" value={classForm.dayOfWeek} onChange={e => setClassForm({ ...classForm, dayOfWeek: e.target.value })} required>{DAYS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
              <div className="form-group"><label className="form-label" htmlFor="cls-start">Start Time *</label><input id="cls-start" name="startTime" type="time" className="form-input" value={classForm.startTime} onChange={e => setClassForm({ ...classForm, startTime: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="cls-end">End Time *</label><input id="cls-end" name="endTime" type="time" className="form-input" value={classForm.endTime} onChange={e => setClassForm({ ...classForm, endTime: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="cls-style">Dance Style *</label><input id="cls-style" name="style" type="text" className="form-input" placeholder="e.g. House" value={classForm.style} onChange={e => setClassForm({ ...classForm, style: e.target.value })} required /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div className="form-group"><label className="form-label" htmlFor="cls-level">Level *</label><select id="cls-level" name="level" className="filter-select" value={classForm.level} onChange={e => setClassForm({ ...classForm, level: e.target.value })} required>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</select></div>
              <div className="form-group"><label className="form-label" htmlFor="cls-teacher">Teacher Name (Optional)</label><input id="cls-teacher" name="teacherName" type="text" className="form-input" placeholder="e.g. Sarah J." value={classForm.teacherName} onChange={e => setClassForm({ ...classForm, teacherName: e.target.value })} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">Or Link to Teacher Profile</label>
              <UserSelect role="" value={classForm.teacherId} onChange={id => setClassForm({ ...classForm, teacherId: id })} placeholder="Search for a teacher profile..." />
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Add to Schedule</button>
          </form>
        </div>
      </section>

      {/* ── Memberships ── */}
      <section className="detail-card" style={cardStyle}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>Membership Plans</h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
          {memberships.length > 0 ? memberships.map(m => (
            <div key={m.id}>
              {editingMem?.id === m.id ? (
                <form onSubmit={handleUpdateMem} style={{ ...formBoxStyle, display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid var(--accent-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h4 style={{ margin: 0, color: "var(--accent)", fontSize: "0.9rem" }}>Editing plan</h4>
                    <button type="button" onClick={() => setEditingMem(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
                  </div>
                  <div className="form-group"><label className="form-label" htmlFor="em-name">Name *</label><input id="em-name" name="name" type="text" className="form-input" value={editingMem.name} onChange={e => setEditingMem({ ...editingMem, name: e.target.value })} required /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
                    <div className="form-group"><label className="form-label" htmlFor="em-price">Price (EUR) *</label><input id="em-price" name="priceCents" type="number" step="0.01" className="form-input" value={(editingMem.priceCents / 100).toFixed(2)} onChange={e => setEditingMem({ ...editingMem, priceCents: Math.round(Number(e.target.value) * 100) })} required /></div>
                    <div className="form-group"><label className="form-label" htmlFor="em-days">Duration (Days) *</label><input id="em-days" name="durationDays" type="number" className="form-input" value={editingMem.durationDays} onChange={e => setEditingMem({ ...editingMem, durationDays: Number(e.target.value) })} required /></div>
                  </div>
                  <div className="form-group"><label className="form-label" htmlFor="em-limit">Class Limit (empty = unlimited)</label><input id="em-limit" name="classLimit" type="number" className="form-input" value={editingMem.classLimit || ""} onChange={e => setEditingMem({ ...editingMem, classLimit: e.target.value ? Number(e.target.value) : null })} /></div>
                  <label htmlFor="em-active" style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
                    <input id="em-active" name="isActive" type="checkbox" checked={editingMem.isActive} onChange={e => setEditingMem({ ...editingMem, isActive: e.target.checked })} />
                    Active (visible to dancers)
                  </label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button type="submit" className="btn-primary" style={{ padding: "0.65rem 2rem", borderRadius: "12px", fontSize: "0.9rem" }}>Save</button>
                    <button type="button" onClick={() => setEditingMem(null)} className="btn-secondary" style={{ padding: "0.65rem 1.5rem", borderRadius: "12px", fontSize: "0.9rem" }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ padding: "1.5rem", background: "var(--bg-hover)", borderRadius: "24px", border: m.isActive ? "1px solid var(--border-light)" : "1px solid rgba(239,68,68,0.2)", position: "relative", opacity: m.isActive ? 1 : 0.65 }}>
                  {!m.isActive && <div style={{ position: "absolute", top: "0.6rem", left: "1rem", fontSize: "0.65rem", color: "var(--warning)", background: "rgba(239,68,68,0.1)", padding: "0.1rem 0.4rem", borderRadius: "999px", fontWeight: 700 }}>INACTIVE</div>}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <button onClick={() => setEditingMem({ ...m })} className="btn-secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.7rem" }}>Edit</button>
                    <button onClick={() => handleDeleteMembership(m.id)} style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>&times;</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.5rem" }}>{m.name}</div>
                  <div style={{ fontSize: "1.75rem", color: "var(--accent)", fontWeight: 800, margin: "0.5rem 0" }}>€{(m.priceCents / 100).toFixed(2)}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    <span style={{ display: "block" }}>{m.classLimit ? `${m.classLimit} Classes` : "Unlimited Classes"}</span>
                    <span>Valid for {m.durationDays} Days</span>
                  </div>
                  {m.description && <div style={{ fontSize: "0.8rem", color: "var(--text-main)", marginTop: "0.5rem", fontStyle: "italic" }}>{m.description}</div>}
                </div>
              )}
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", gridColumn: "1/-1" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No membership plans yet.</p>
            </div>
          )}
        </div>

        <div style={formBoxStyle}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Create a New Plan</h4>
          <form onSubmit={handleAddMem} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              <div className="form-group"><label className="form-label" htmlFor="mem-name">Plan Name *</label><input id="mem-name" name="name" type="text" className="form-input" placeholder="e.g. Unlimited Month" value={memForm.name} onChange={e => setMemForm({ ...memForm, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label" htmlFor="mem-price">Price (EUR) *</label><input id="mem-price" name="priceCents" type="number" className="form-input" placeholder="0.00" step="0.01" value={memForm.priceCents} onChange={e => setMemForm({ ...memForm, priceCents: e.target.value })} required /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              <div className="form-group"><label className="form-label" htmlFor="mem-limit">Class Limit (empty = unlimited)</label><input id="mem-limit" name="classLimit" type="number" className="form-input" placeholder="e.g. 8" value={memForm.classLimit} onChange={e => setMemForm({ ...memForm, classLimit: e.target.value })} /></div>
              <div className="form-group"><label className="form-label" htmlFor="mem-days">Duration (Days) *</label><input id="mem-days" name="durationDays" type="number" className="form-input" value={memForm.durationDays} onChange={e => setMemForm({ ...memForm, durationDays: e.target.value })} required /></div>
            </div>
            <div className="form-group"><label className="form-label" htmlFor="mem-desc">Description (Optional)</label><input id="mem-desc" name="description" type="text" className="form-input" placeholder="e.g. Best for serious dancers" value={memForm.description} onChange={e => setMemForm({ ...memForm, description: e.target.value })} /></div>
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Create Plan</button>
          </form>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="detail-card" style={cardStyle}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>Our Team</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          {team.length > 0 ? team.map(t => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "14px", overflow: "hidden", border: "1px solid var(--border-light)", background: "var(--bg-input)" }}>
                <img src={t.user.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              </div>
              <div style={{ minWidth: "100px" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>{t.user.name || "Unnamed"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--accent)", textTransform: "uppercase", fontWeight: 600 }}>{t.role}</div>
              </div>
              <button onClick={() => handleDeleteTeam(t.id)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", width: "100%" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No team members added yet.</p>
            </div>
          )}
        </div>
        <div style={formBoxStyle}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Add Team Member</h4>
          <form onSubmit={handleAddTeam} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem", alignItems: "flex-end" }}>
              <div className="form-group"><label className="form-label">Search User *</label><UserSelect role="" value={teamForm.userId} onChange={id => setTeamForm({ ...teamForm, userId: id })} placeholder="Type name..." /></div>
              <div className="form-group"><label className="form-label" htmlFor="team-role">Role *</label><select id="team-role" name="role" className="filter-select" value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} required>{TEAM_ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Add to Team</button>
          </form>
        </div>
      </section>

      {/* ── Collaborations ── */}
      <section className="detail-card" style={cardStyle}>
        <h3 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: 700 }}>Agency Collaborations</h3>

        {/* Incoming agency invites — need studio action */}
        {collabs.filter(c => c.initiatedBy === "AGENCY" && c.status === "PENDING").length > 0 && (
          <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "20px" }}>
            <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", color: "var(--warning)" }}>
              Incoming Invites ({collabs.filter(c => c.initiatedBy === "AGENCY" && c.status === "PENDING").length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {collabs.filter(c => c.initiatedBy === "AGENCY" && c.status === "PENDING").map(c => (
                <div key={c.agencyId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "var(--bg-hover)", borderRadius: "16px", border: "1px solid var(--border-light)" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                    <img src={c.agency.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{c.agency.name || "Unnamed Agency"}</div>
                    {c.description && <div style={{ fontSize: "0.85rem", color: "var(--text-main)", marginTop: "0.25rem" }}>{c.description}</div>}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    <button onClick={() => handleAcceptAgencyInvite(c.agencyId)} className="btn-primary" style={{ padding: "0.5rem 1.25rem", fontSize: "0.85rem", borderRadius: "10px" }}>Accept</button>
                    <button onClick={() => handleDeleteCollab(c.agencyId)} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.3)", color: "var(--warning)" }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          {collabs.filter(c => !(c.initiatedBy === "AGENCY" && c.status === "PENDING")).length > 0 ? collabs.filter(c => !(c.initiatedBy === "AGENCY" && c.status === "PENDING")).map(c => (
            <div key={c.agencyId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", overflow: "hidden", background: "var(--bg-input)" }}>
                <img src={c.agency.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{c.agency.name || "Unnamed Agency"}</div>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: STATUS_STYLE[c.status]?.color || "var(--text-muted)" }}>
                  {STATUS_STYLE[c.status]?.label || c.status}
                </span>
              </div>
              <button onClick={() => handleDeleteCollab(c.agencyId)} style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "var(--warning)", cursor: "pointer", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)", width: "100%" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No active collaborations. Send a request below.</p>
            </div>
          )}
        </div>
        <div style={formBoxStyle}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Send Collaboration Request</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1rem 0" }}>The agency will receive a notification and can accept or decline.</p>
          <form onSubmit={handleAddCollab} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group"><label className="form-label">Search Agency *</label><UserSelect role="AGENCY" value={collabForm.agencyId} onChange={id => setCollabForm({ ...collabForm, agencyId: id })} placeholder="Type agency name..." /></div>
            <div className="form-group"><label className="form-label" htmlFor="collab-desc">Message / Description (Optional)</label><input id="collab-desc" name="description" type="text" className="form-input" placeholder={`e.g. "We're hosting a Latin event on June 15 — looking for an agency partner"`} value={collabForm.description} onChange={e => setCollabForm({ ...collabForm, description: e.target.value })} /></div>
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Send Request</button>
          </form>
        </div>
      </section>

      {/* ── CV Mentions ── */}
      <section className="detail-card" style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Dancers Who Mentioned Your Studio</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{cvTags.length} Mentions</span>
        </div>
        {cvTags.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {cvTags.map(entry => (
              <div key={entry.id} style={{ display: "flex", gap: "1rem", padding: "1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)", alignItems: "flex-start" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", overflow: "hidden", background: "var(--bg-input)", flexShrink: 0 }}>
                  <img src={entry.user.avatarUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Ccircle cx='12' cy='12' r='12'/%3E%3C/svg%3E"} alt="" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{entry.user.name || "Unnamed Dancer"}</strong>
                    <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "999px", background: `var(--accent-soft)`, color: 'var(--accent)', fontWeight: 700 }}>{entry.type}</span>
                    {entry.user.city && <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{entry.user.city}</span>}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-main)", marginBottom: "0.3rem" }}>{entry.title}</div>
                  {entry.startDate && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(entry.startDate).getFullYear()}{entry.endDate ? ` – ${new Date(entry.endDate).getFullYear()}` : ""}</div>}
                  {entry.description && <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.4rem 0 0 0" }}>{entry.description}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', flexShrink: 0 }}>
                    <span style={{
                        fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontWeight: 700,
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
            <p style={{ color: "var(--text-muted)", margin: 0 }}>No dancers have mentioned your studio in their CV yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
