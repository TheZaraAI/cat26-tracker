const PRIORITIES = ["P1", "P2", "P3"];
const STATUSES = ["Not started", "In progress", "Blocked", "Completed", "Planning"];

export default function FilterBar({ filters, onChange }) {
  function toggle(type, value) {
    const current = new Set(filters[type]);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    onChange({ ...filters, [type]: current });
  }

  return (
    <div className="filter-bar">
      <span className="filter-label">Priority</span>
      <div className="filter-pills">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            className={`pill ${filters.priority.has(p) ? "pill-active" : ""}`}
            onClick={() => toggle("priority", p)}
          >
            {p}
          </button>
        ))}
      </div>
      <span className="filter-label">Status</span>
      <div className="filter-pills">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`pill ${filters.status.has(s) ? "pill-active" : ""}`}
            onClick={() => toggle("status", s)}
          >
            {s}
          </button>
        ))}
      </div>
      {(filters.priority.size > 0 || filters.status.size > 0) && (
        <button
          className="pill pill-clear"
          onClick={() => onChange({ priority: new Set(), status: new Set() })}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
