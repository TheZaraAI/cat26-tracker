const TABS = ["All", "TA50", "Video RAG"];

export default function WorkstreamTabs({ active, onChange, initiatives }) {
  function count(tab) {
    if (tab === "All") return initiatives.length;
    return initiatives.filter((i) => i.Workstream === tab).length;
  }

  return (
    <div className="workstream-tabs">
      {TABS.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${active === tab ? "tab-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
          <span className="tab-badge">{count(tab)}</span>
        </button>
      ))}
    </div>
  );
}
