import { PriorityBadge, StatusBadge } from "./Badge";
import { shortDate, isPastDue } from "../utils/dateHelpers";

const STATUS_OPTIONS = ["Not started", "In progress", "Blocked", "Completed", "Planning"];

export default function InitiativeTable({
  title,
  initiatives,
  pendingIds,
  onStatusChange,
  onEdit,
}) {
  if (initiatives.length === 0) return null;

  const completed = initiatives.filter((i) => i.Status === "Completed").length;
  const pct = Math.round((completed / initiatives.length) * 100);

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
            <th>Name</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Target</th>
            <th>DRI</th>
            <th>Days</th>
          </tr>
        </thead>
        <tbody>
          {initiatives.map((item) => {
            const pending = pendingIds.has(item.id);
            const pastDue = isPastDue(item["Target Date"], item.Status);
            return (
              <tr
                key={item.id}
                className={`${pending ? "row-pending" : ""} ${pastDue ? "row-past-due" : ""}`}
                onClick={() => onEdit(item)}
              >
                <td className="cell-name">
                  {item.Name}
                  {item["Stretch Goals"] && (
                    <span className="stretch-indicator" title={item["Stretch Goals"]}>+S</span>
                  )}
                </td>
                <td><PriorityBadge value={item.Priority} /></td>
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
                <td className={pastDue ? "text-danger" : ""}>
                  {shortDate(item["Target Date"])}
                </td>
                <td>{item.DRI || "\u2014"}</td>
                <td>{item["Days Needed"] ?? "\u2014"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
