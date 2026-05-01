import { useState, useEffect } from "react";

const WORKSTREAMS = ["TA50", "Video RAG"];
const PRIORITIES = ["P1", "P2", "P3"];
const STATUSES = ["Not started", "In progress", "Blocked", "Completed", "Planning"];

const EMPTY = {
  Name: "",
  Workstream: "TA50",
  Priority: "P1",
  Status: "Not started",
  "Target Date": "",
  DRI: "",
  "Days Needed": "",
  "Stretch Goals": "",
  Notes: "",
};

export default function EditModal({ record, onSave, onDelete, onClose, isNew }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({
        Name: record.Name || "",
        Workstream: record.Workstream || "TA50",
        Priority: record.Priority || "P1",
        Status: record.Status || "Not started",
        "Target Date": record["Target Date"] || "",
        DRI: record.DRI || "",
        "Days Needed": record["Days Needed"] ?? "",
        "Stretch Goals": record["Stretch Goals"] || "",
        Notes: record.Notes || "",
      });
    } else {
      setForm(EMPTY);
    }
  }, [record]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.Name.trim()) return;

    setSaving(true);
    try {
      const fields = {
        ...form,
        "Days Needed": form["Days Needed"] !== "" ? Number(form["Days Needed"]) : undefined,
      };
      // Remove undefined
      Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
      await onSave(fields);
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this initiative?")) return;
    setSaving(true);
    try {
      await onDelete(record.id);
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? "Add Initiative" : "Edit Initiative"}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={form.Name}
              onChange={(e) => handleChange("Name", e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Workstream</label>
              <select
                value={form.Workstream}
                onChange={(e) => handleChange("Workstream", e.target.value)}
              >
                {WORKSTREAMS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select
                value={form.Priority}
                onChange={(e) => handleChange("Priority", e.target.value)}
              >
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.Status}
                onChange={(e) => handleChange("Status", e.target.value)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Target Date</label>
              <input
                type="date"
                value={form["Target Date"]}
                onChange={(e) => handleChange("Target Date", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>DRI</label>
              <input
                type="text"
                value={form.DRI}
                onChange={(e) => handleChange("DRI", e.target.value)}
                placeholder="Directly Responsible Individual"
              />
            </div>
            <div className="form-group">
              <label>Days Needed</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={form["Days Needed"]}
                onChange={(e) => handleChange("Days Needed", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Stretch Goals</label>
            <input
              type="text"
              value={form["Stretch Goals"]}
              onChange={(e) => handleChange("Stretch Goals", e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={4}
              value={form.Notes}
              onChange={(e) => handleChange("Notes", e.target.value)}
            />
          </div>

          <div className="modal-actions">
            {!isNew && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving}
              >
                Delete
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : isNew ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
