import { useState, useEffect } from "react";
import { shortDate } from "../utils/dateHelpers";

const WORKSTREAMS = ["TA50", "Video RAG"];
const PRIORITIES = ["P1", "P2", "P3"];
const STATUSES = ["Not started", "In progress", "Blocked", "Closed", "Planning"];
const SUBTASK_STATUSES = ["Not Started", "In Progress", "On Hold", "Closed"];

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

const EMPTY_SUBTASK = {
  Name: "",
  Status: "Not Started",
  DRI: "",
  "Due Date": "",
  Notes: "",
};

export default function EditModal({
  record,
  onSave,
  onDelete,
  onClose,
  isNew,
  // Subtask mode props
  mode = "milestone", // "milestone" | "subtask"
  milestones = [],
  teamMembers = [],
  // Subtask management within initiative edit
  subtasks = [],
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) {
  const [form, setForm] = useState(EMPTY);
  const [subtaskForm, setSubtaskForm] = useState({ ...EMPTY_SUBTASK, "Parent Milestone": "" });
  const [saving, setSaving] = useState(false);
  const [showSubtaskAdd, setShowSubtaskAdd] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);

  useEffect(() => {
    if (mode === "subtask") {
      setSubtaskForm({
        Name: "",
        Status: "Not Started",
        DRI: "",
        "Due Date": "",
        Notes: "",
        "Parent Milestone": milestones.length > 0 ? milestones[0].Name : "",
      });
      return;
    }
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
  }, [record, mode, milestones]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubtaskFormChange(field, value) {
    setSubtaskForm((prev) => ({ ...prev, [field]: value }));
  }

  // Submit milestone
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.Name.trim()) return;

    setSaving(true);
    try {
      const fields = {
        ...form,
        "Days Needed": form["Days Needed"] !== "" ? Number(form["Days Needed"]) : undefined,
      };
      Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k]);
      await onSave(fields);
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setSaving(false);
    }
  }

  // Submit subtask (when mode === "subtask")
  async function handleSubtaskSubmit(e) {
    e.preventDefault();
    if (!subtaskForm.Name.trim() || !subtaskForm["Parent Milestone"]) return;

    setSaving(true);
    try {
      const fields = { ...subtaskForm };
      if (!fields["Due Date"]) delete fields["Due Date"];
      if (!fields.Notes) delete fields.Notes;
      if (!fields.DRI) delete fields.DRI;
      await onAddSubtask(fields);
      onClose();
    } catch {
      // error handled by hook
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this milestone?")) return;
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

  // Inline subtask add within milestone edit
  async function handleInlineSubtaskAdd() {
    if (!editingSubtask || !editingSubtask.Name.trim()) return;
    try {
      const fields = {
        Name: editingSubtask.Name,
        "Parent Milestone": record.Name,
        Status: editingSubtask.Status || "Not Started",
        DRI: editingSubtask.DRI || "",
      };
      if (editingSubtask["Due Date"]) fields["Due Date"] = editingSubtask["Due Date"];
      if (editingSubtask.Notes) fields.Notes = editingSubtask.Notes;
      await onAddSubtask(fields);
      setEditingSubtask(null);
      setShowSubtaskAdd(false);
    } catch {
      // error handled by hook
    }
  }

  // --- Subtask mode rendering ---
  if (mode === "subtask") {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Add Subtask</h2>
            <button className="modal-close" onClick={onClose}>&times;</button>
          </div>
          <form onSubmit={handleSubtaskSubmit}>
            <div className="form-group">
              <label>Parent Milestone *</label>
              <select
                value={subtaskForm["Parent Milestone"]}
                onChange={(e) => handleSubtaskFormChange("Parent Milestone", e.target.value)}
                required
              >
                <option value="">Select milestone...</option>
                {milestones.map((ms) => (
                  <option key={ms.id} value={ms.Name}>{ms.Name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={subtaskForm.Name}
                onChange={(e) => handleSubtaskFormChange("Name", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={subtaskForm.Status}
                  onChange={(e) => handleSubtaskFormChange("Status", e.target.value)}
                >
                  {SUBTASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>DRI</label>
                <select
                  value={subtaskForm.DRI}
                  onChange={(e) => handleSubtaskFormChange("DRI", e.target.value)}
                >
                  <option value="">— Select DRI —</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={subtaskForm["Due Date"]}
                  onChange={(e) => handleSubtaskFormChange("Due Date", e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows={3}
                value={subtaskForm.Notes}
                onChange={(e) => handleSubtaskFormChange("Notes", e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <div />
              <div className="modal-actions-right">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Create Subtask"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- Milestone mode rendering ---
  const initSubtasks = subtasks.filter((s) => s["Parent Milestone"] === record?.Name);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? "Add Milestone" : "Edit Milestone"}</h2>
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
              <select
                value={form.DRI}
                onChange={(e) => handleChange("DRI", e.target.value)}
              >
                <option value="">— Select DRI —</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
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

          {/* Subtasks section (only when editing existing milestone) */}
          {!isNew && record && (
            <div className="modal-subtasks">
              <div className="modal-subtasks-header">
                <label>Subtasks ({initSubtasks.length})</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    setShowSubtaskAdd(true);
                    setEditingSubtask({ Name: "", Status: "Not Started", DRI: "", "Due Date": "", Notes: "" });
                  }}
                >
                  + Add
                </button>
              </div>

              {initSubtasks.length > 0 && (
                <div className="modal-subtask-list">
                  {initSubtasks.map((st) => (
                    <div key={st.id} className="modal-subtask-item">
                      <div className="modal-subtask-info">
                        <span className={`modal-subtask-status-dot ${st.Status === "Closed" ? "dot-completed" : st.Status === "In Progress" ? "dot-progress" : st.Status === "On Hold" ? "dot-hold" : "dot-default"}`} />
                        <span className="modal-subtask-name">{st.Name}</span>
                      </div>
                      <div className="modal-subtask-meta">
                        {st.DRI && <span className="modal-subtask-dri">{st.DRI}</span>}
                        {st["Due Date"] && <span className="modal-subtask-date">{shortDate(st["Due Date"])}</span>}
                        <select
                          className="status-select status-select-xs"
                          value={st.Status || "Not Started"}
                          onChange={(e) => onUpdateSubtask(st.id, { Status: e.target.value })}
                        >
                          {SUBTASK_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="subtask-delete-btn"
                          onClick={() => onDeleteSubtask(st.id)}
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showSubtaskAdd && editingSubtask && (
                <div className="modal-subtask-add-form">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Subtask name..."
                      value={editingSubtask.Name}
                      onChange={(e) => setEditingSubtask({ ...editingSubtask, Name: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <select
                        value={editingSubtask.Status}
                        onChange={(e) => setEditingSubtask({ ...editingSubtask, Status: e.target.value })}
                      >
                        {SUBTASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <select
                        value={editingSubtask.DRI}
                        onChange={(e) => setEditingSubtask({ ...editingSubtask, DRI: e.target.value })}>
                        <option value="">— DRI —</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <input
                        type="date"
                        value={editingSubtask["Due Date"]}
                        onChange={(e) => setEditingSubtask({ ...editingSubtask, "Due Date": e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="modal-subtask-add-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={handleInlineSubtaskAdd}
                    >
                      Add Subtask
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => { setShowSubtaskAdd(false); setEditingSubtask(null); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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
