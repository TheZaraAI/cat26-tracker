export default function StatCard({ label, value, total, color, icon }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const showBar = total !== undefined && total > 0;

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-icon" style={{ color }}>{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {showBar && (
        <div className="stat-bar-track">
          <div
            className="stat-bar-fill"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      )}
      {showBar && (
        <div className="stat-pct">{pct}% of {total}</div>
      )}
    </div>
  );
}
