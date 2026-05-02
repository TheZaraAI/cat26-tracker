import { useState, Fragment } from "react";
import { PriorityBadge } from "./Badge";
import { shortDate, isPastDue } from "../utils/dateHelpers";

const STATUS_OPTIONS = ["Not started", "In progress", "Blocked", "Closed", "Planning"];
const SUBTASK_STATUS_OPTIONS = ["Not Started", "In Progress", "On Hold", "Closed"];

/**
 * Generate initiative IDs based on workstream.
 * Video RAG -> VICTOR-01, VICTOR-02, ...
 * TA50 -> TANGO ALPHA-01, TANGO ALPHA-02, ...
 */
function generateId(workstream, index) {
  const num = String(index + 1).padStart(2, "0");
  if (workstream === "Video RAG") return `VICTOR-${num}`;
  if (workstream === "TA50") return `TANGO ALPHA-${num}`;
  return `${workstream}-${num}`;
}

function SubtaskBadge({ subtasks }) {
  if (!subtasks || subtasks.length === 0) return null;
  const completed = subtasks.filter((s) => s.Status === "Closed").length;
  return (
    <span className="subtask-count-badge">
      {completed}/{subtasks.length}
    </span>
  );
}

function SubtaskRows({
  subtasks,
  onUpdateSubtask,
  onDeleteSubtask,
  onAddSubtask,
  parentId,
}) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleQuickAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    await onAddSubtask({
      Name: newName.trim(),
      "Parent Initiative": parentId,
      Status: "Not Started",
    });
    setNewName("");
    setAdding(false);
  }

  return (
    <>
      {subtasks.map((st) => (
        <tr key={st.id} className="subtask-row">
          <td className="subtask-indent-cell" colSpan={1}>
            <span className="subtask-indent-marker">&nbsp;</span>
          </td>
          <td colSpan={1}>&nbsp;</td>
          <td className="subtask-name-cell">
            <span className="subtask-bullet">&#9656;</span>
            {st.Name}
          </td>
          <td onClick={(e) => e.stopPropagation()}>
            <select
              className="status-select status-select-sm"
              value={st.Status || "Not Started"}
              onChange={(e) => onUpdateSubtask(st.id, { Status: e.target.value })}
            >
              {SUBTASK_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </td>
          <td>{st["Due Date"] ? shortDate(st["Due Date"]) : "\u2014"}</td>
          <td>{st.DRI || "\u2014"}</td>
          <td onClick={(e) => e.stopPropagation()}>
            <button
              className="subtask-delete-btn"
              title="Delete subtask"
              onClick={() => onDeleteSubtask(st.id)}
            >
              &times;
            </button>
          </td>
        </tr>
      ))}
      <tr className="subtask-row subtask-add-row">
        <td colSpan={7}>
          <div className="subtask-add-inline">
            {adding ? (
              <form onSubmit={handleQuickAdd} className="subtask-quick-form">
                <input
                  type="text"
                  className="subtask-quick-input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Subtask name..."
                  autoFocus
                />
                <button type="submit" className="btn btn-primary btn-xs">Add</button>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => { setAdding(false); setNewName(""); }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                className="subtask-add-btn"
                onClick={(e) => { e.stopPropagation(); setAdding(true); }}
              >
                + Add subtask
              </button>
            )}
          </div>
        </td>
      </tr>
    </>
  );
}

export default function InitiativeTable({
  title,
  initiatives,
  pendingIds,
  onStatusChange,
  onEdit,
  subtasks = [],
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());

  if (initiatives.length === 0) return null;

  const completed = initiatives.filter((i) => i.Status === "Closed").length;
  const pct = Math.round((completed / initiatives.length) * 100);

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Build subtask map: parentId -> subtask[]
  const subtaskMap = {};
  for (const st of subtasks) {
    const parentId = st["Parent Initiative"];
    if (parentId) {
      if (!subtaskMap[parentId]) subtaskMap[parentId] = [];
      subtaskMap[parentId].push(st);
    }
  }

  return (
    <div className="initiative-group">
      <div className="group-header">
        <h3>{title}</h3>
        <div className="group-progress">
          <div className="group-bar-track">
            <div
              className="group-bar-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="group-pct">
            {completed}/{initiatives.length} ({pct}%)
          </span>
        </div>
      </div>
      <table className="init-table">
        <thead>
          <tr>
            <th className="col-expand">&nbsp;</th>
            <th className="col-id">ID</th>
            <th>Name</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Target</th>
            <th>DRI</th>
          </tr>
        </thead>
        <tbody>
          {initiatives.map((item, idx) => {
            const pending = pendingIds.has(item.id);
            const pastDue = isPastDue(item["Target Date"], item.Status);
            const expanded = expandedIds.has(item.id);
            const itemSubtasks = subtaskMap[item.id] || [];
            const initId = generateId(item.Workstream, idx);
            const isVictor = item.Workstream === "Video RAG";

            return (
              <Fragment key={item.id}>
                <tr
                  className={`${pending ? "row-pending" : ""} ${pastDue ? "row-past-due" : ""} ${expanded ? "row-expanded" : ""}`}
                >
                  <td
                    className="cell-expand"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                  >
                    <span className={`expand-arrow ${expanded ? "expand-arrow-open" : ""}`}>&#9654;</span>
                  </td>
                  <td className="cell-id" onClick={() => onEdit(item)}>
                    <span className={`id-badge ${isVictor ? "id-badge-victor" : "id-badge-tango"}`}>
                      {initId}
                    </span>
                  </td>
                  <td className="cell-name" onClick={() => onEdit(item)}>
                    {item.Name}
                    {item["Stretch Goals"] && (
                      <span className="stretch-indicator" title={item["Stretch Goals"]}>+S</span>
                    )}
                    <SubtaskBadge subtasks={itemSubtasks} />
                  </td>
                  <td onClick={() => onEdit(item)}><PriorityBadge value={item.Priority} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="status-select"
                      value={item.Status || "Not started"}
                      onChange={(e) => onStatusChange(item.id, e.target.value)}
                      disabled={pending}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className={pastDue ? "text-danger" : ""} onClick={() => onEdit(item)}>
                    {shortDate(item["Target Date"])}
                  </td>
                  <td onClick={() => onEdit(item)}>{item.DRI || "\u2014"}</td>
                </tr>
                {expanded && (
                  <SubtaskRows
                    subtasks={itemSubtasks}
                    parentId={item.id}
                    onAddSubtask={onAddSubtask}
                    onUpdateSubtask={onUpdateSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                  />
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
