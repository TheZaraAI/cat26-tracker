const MARKERS = {
  TA50: [
    {
      id: 1,
      title: "Soldier submits inventory with photo evidence",
      priority: "Must Have",
      priorityNote: "Core demo loop. If this doesn't work nothing else matters.",
      criteria: [
        "Web app opens on phone browser — no install needed",
        "Packing list pre-loads with all items",
        "Soldier marks each item present/absent and attaches a photo",
        "Photo uploads to S3 and is visible in UI after submission",
        "Submission is written to DB and visible in commander view",
        "Duplicate photo detected if same photo submitted twice",
        "End-to-end submission completes in under 10 seconds",
      ],
    },
    {
      id: 2,
      title: "Commander sees readiness at a glance",
      priority: "Must Have",
      priorityNote: "This is the evaluator's \"wow\" moment.",
      criteria: [
        "Dashboard shows readiness % per soldier and squad/company rollup",
        "Absent items appear as deficiencies with severity",
        "Dashboard updates within 30 seconds of a submission",
        "Evaluator can ask \"Is Alpha Company ready for OSJ?\" and get a real number",
        "Deficiency list shows who submitted vs. who hasn't",
        "CSV export downloads in one click",
      ],
    },
    {
      id: 3,
      title: "Natural language query returns a real answer",
      priority: "Nice to Have",
      priorityNote: "Attempt Days 8-9 only if M1 + M2 are locked. Descope cleanly if not.",
      criteria: [
        "Analyst types plain-English question — e.g. \"What cold weather gear is Alpha Company missing?\"",
        "Response is grounded in live readiness data, not hallucinated",
        "At least 2 demo queries work reliably end-to-end",
        "Latency under 8 seconds from question to answer",
        "Query interface is visible to evaluators — not a terminal",
      ],
    },
  ],
  "Video RAG": [],
};

const PRIORITY_STYLES = {
  "Must Have": { bg: "#FCEBEB", color: "#791F1F", border: "#F09595" },
  "Nice to Have": { bg: "#E1F5EE", color: "#085041", border: "#5DCAA5" },
  "Should Have": { bg: "#FAEEDA", color: "#633806", border: "#FAC775" },
};

export default function SuccessMarkers({ onBack }) {
  return (
    <div className="success-markers">
      <div className="success-markers-header">
        <button className="btn btn-secondary" onClick={onBack}>&larr; Back to Tracker</button>
        <h2>Success Markers</h2>
        <p className="success-markers-subtitle">Evaluation criteria for CAT26 — May 14, 2026</p>
      </div>

      {Object.entries(MARKERS).map(([workstream, markers]) => (
        <div key={workstream} className="success-workstream">
          <h3 className="success-workstream-title">{workstream}</h3>
          {markers.length === 0 && (
            <p className="success-empty">Success markers coming soon.</p>
          )}
          {markers.map((marker) => {
            const pStyle = PRIORITY_STYLES[marker.priority] || PRIORITY_STYLES["Should Have"];
            return (
              <div key={marker.id} className="success-card">
                <div className="success-card-header">
                  <span className="success-card-id">M{marker.id}</span>
                  <h4 className="success-card-title">{marker.title}</h4>
                  <span
                    className="success-priority-badge"
                    style={{
                      background: pStyle.bg,
                      color: pStyle.color,
                      border: `1px solid ${pStyle.border}`,
                    }}
                  >
                    {marker.priority}
                  </span>
                </div>
                <p className="success-card-note">{marker.priorityNote}</p>
                <ul className="success-criteria-list">
                  {marker.criteria.map((c, i) => (
                    <li key={i} className="success-criteria-item">
                      <span className="success-check">&#9744;</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
