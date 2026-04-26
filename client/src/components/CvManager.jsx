import { useState, useEffect, useCallback } from "react";
import { getUserCv, createCvEntry, deleteCvEntry } from "../api/cv.js";
import UserSelect from "./UserSelect.jsx";

const CV_TYPES = ["TRAINING", "PROJECT", "WORKSHOP", "COMPETITION"];

export default function CvManager({ userId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ type: "PROJECT", title: "", description: "", startDate: "", endDate: "", choreographer: "", taggedStudioId: null, taggedAgencyId: null });

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getUserCv(userId);
      setEntries(data);
    } catch (err) {
      console.error("CV load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const clearError = () => setError(null);

  async function handleAdd(e) {
    e.preventDefault();
    clearError();
    try {
      const payload = { ...form };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;
      await createCvEntry(payload);
      setForm({ type: "PROJECT", title: "", description: "", startDate: "", endDate: "", choreographer: "", taggedStudioId: null, taggedAgencyId: null });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    clearError();
    try {
      await deleteCvEntry(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading && !entries.length) return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>Loading Professional Experience...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <section className="detail-card" style={{ padding: "2rem", borderRadius: "24px", background: "var(--bg-card)", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Professional Experience (CV)</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.3rem 0.8rem", borderRadius: "20px" }}>{entries.length} Entries</span>
        </div>

        {error && (
          <div style={{ padding: "1rem 1.25rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--warning)", borderRadius: "16px", color: "var(--warning)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          {entries.length > 0 ? entries.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "1.25rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="role-badge" style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>{e.type}</span>
                  <strong style={{ fontSize: "1.05rem", fontWeight: 700 }}>{e.title}</strong>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {e.startDate && <span>{new Date(e.startDate).getFullYear()}</span>}
                  {e.choreographer && <span>• Choreo: <strong style={{ color: "var(--text-main)" }}>{e.choreographer}</strong></span>}
                </div>
                {e.description && <p style={{ fontSize: "0.95rem", color: "var(--text-main)", lineHeight: 1.5, margin: "0.5rem 0" }}>{e.description}</p>}
                {(e.taggedStudio || e.taggedAgency) && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                    {e.taggedStudio && <span style={{ fontSize: "0.75rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>@ {e.taggedStudio.name}</span>}
                    {e.taggedAgency && <span style={{ fontSize: "0.75rem", color: "var(--accent)", background: "var(--accent-soft)", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>@ {e.taggedAgency.name}</span>}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => handleDelete(e.id)} className="btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)", color: "var(--warning)" }}>Delete</button>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: "3rem", background: "var(--bg-hover)", borderRadius: "20px", border: "1px dashed var(--border-light)" }}>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>No entries added yet.</p>
            </div>
          )}
        </div>

        {/* Add Form */}
        <div style={{ background: "var(--bg-hover)", padding: "1.5rem", borderRadius: "20px", border: "1px solid var(--border-light)" }}>
          <h4 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>Add a New Experience</h4>
          <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Entry Type *</label>
                <select className="filter-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                  {CV_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Project/Training Title *</label>
                <input type="text" className="form-input" placeholder="e.g. World of Dance Finals" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Choreographer (Optional)</label>
                <input type="text" className="form-input" placeholder="e.g. Kyle Hanagami" value={form.choreographer} onChange={e => setForm({ ...form, choreographer: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Year/Date (Optional)</label>
                <input type="date" className="form-input" value={form.startDate ? form.startDate.split('T')[0] : ""} onChange={e => setForm({ ...form, startDate: e.target.value ? new Date(e.target.value).toISOString() : "" })} />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Tag Studio (Optional)</label>
                <UserSelect role="STUDIO" value={form.taggedStudioId} onChange={id => setForm({ ...form, taggedStudioId: id })} placeholder="Search Studio..." />
              </div>
              <div className="form-group">
                <label className="form-label">Tag Agency (Optional)</label>
                <UserSelect role="AGENCY" value={form.taggedAgencyId} onChange={id => setForm({ ...form, taggedAgencyId: id })} placeholder="Search Agency..." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Description (Optional)</label>
              <textarea className="form-input" placeholder="What did you do/learn?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ resize: "vertical" }} />
            </div>
            
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start", padding: "0.75rem 2.5rem", borderRadius: "14px" }}>Add Entry</button>
          </form>
        </div>
      </section>
    </div>
  );
}
