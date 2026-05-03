const MARKERS = {
  TA50: [
    {
      id: 1,
      initiative: "Evidence pipeline + AI detection integration",
      title: "Soldier submits inventory with photo evidence",
      priority: "Must Have",
      priorityNote: "Core demo loop. If this doesn't work nothing else matters.",
      criteria: [
        "Soldier completes checklist and attaches photo evidence per item",
        "Submission stored with categories, quantities, and confirmation enforced",
        "Photos stored and viewable via signed URLs",
        "Duplicate photos detected via SHA-256 hash",
      ],
    },
    {
      id: 2,
      initiative: "Web app MVP + end-to-end submission flow",
      title: "End-to-end submission works on mobile",
      priority: "Must Have",
      priorityNote: "This is the evaluator's \"wow\" moment.",
      criteria: [
        "Soldier opens the app on a phone browser with no install required",
        "Checklist, photo capture, and submission complete end-to-end without errors",
        "Submission record written to the database and visible in the commander view",
      ],
    },
    {
      id: 3,
      initiative: "Readiness aggregation + packing list engine",
      title: "Commander sees readiness at a glance",
      priority: "Must Have",
      priorityNote: "Readiness rollup is the commander's decision tool.",
      criteria: [
        "Readiness rolls up from Soldier to Squad to Platoon to Company",
        "Dashboard shows readiness percentage compared against the OSJ packing list",
        "Deficiencies visible with severity — required vs. optional items distinguished",
        "Readiness deltas tracked between submissions",
      ],
    },
    {
      id: 4,
      initiative: "Report export — PDF and CSV",
      title: "Export readiness data",
      priority: "Should Have",
      priorityNote: "CSV is in scope. PDF export is post-evaluation and out of scope for CAT26.",
      criteria: [
        "CSV export downloads in one click from the commander dashboard",
        "Export includes soldier readiness data, deficiencies, and submission timestamps",
        "PDF export is post-evaluation and out of scope for CAT26",
      ],
    },
  ],
  "Video RAG": [
    {
      id: 1,
      initiative: "Pre-process demo videos + validate VLM captioner",
      title: "Demo dataset ingested and queryable",
      priority: "Must Have",
      priorityNote: "Foundation for all RAG use cases. Must be solid before Day 1.",
      criteria: [
        "At least one demo dataset ingested and queryable end-to-end (UCF Crime, VIRAT, or MEVA)",
        "VLM captioner validated — GPT-4V or LLaVA selected and producing usable captions",
        "Hero use case confirmed — Force Protection vs. Criminal Investigations contradiction resolved",
      ],
    },
    {
      id: 2,
      initiative: "Frame classifier + VLM captioner integrated",
      title: "Every frame classified and captioned",
      priority: "Must Have",
      priorityNote: "Classification + captioning quality drives all downstream results.",
      criteria: [
        "Every extracted frame has a category label — person, vehicle, object, event, environment",
        "Every extracted frame has a natural-language caption stored with metadata",
        "Frames extracted at semantically meaningful moments, not naive uniform sampling",
      ],
    },
    {
      id: 3,
      initiative: "RAG chat interface + clip retrieval working",
      title: "Analyst queries return ranked clips",
      priority: "Must Have",
      priorityNote: "Core analyst workflow. This is what evaluators will use.",
      criteria: [
        "Analyst types a plain-English query and gets ranked clips with thumbnails, captions, timestamps, and confidence scores",
        "Results filterable by time range, video source, and category",
        "Query returns results in 5 seconds or less",
      ],
    },
    {
      id: 4,
      initiative: "Criminal investigations use case (UC1) demo-ready",
      title: "Criminal investigations demo runs end-to-end",
      priority: "Must Have",
      priorityNote: "Hero demo for evaluators.",
      criteria: [
        "Person and vehicle description search returns visually relevant ranked results",
        "Cross-video entity matching demonstrated across at least 2 camera feeds",
        "Full 6-step demo script runs end-to-end without critical failure",
      ],
    },
    {
      id: 5,
      initiative: "Force protection use case (UC2) + performance eval",
      title: "Force protection log and benchmarks documented",
      priority: "Must Have",
      priorityNote: "Performance metrics required for evaluation report.",
      criteria: [
        "Gate and perimeter activity log generated from pre-recorded footage with timestamps",
        "After-hours temporal filter surfaces correct clips",
        "Performance benchmarks documented — frame relevance ≥80%, classification ≥90%, query latency ≤5 seconds",
      ],
    },
    {
      id: 6,
      initiative: "Detainee ops — Whisper ASR (stretch goal)",
      title: "Audio transcription and multimodal search",
      priority: "Nice to Have",
      priorityNote: "Stretch goal. Descope gracefully if data or time unavailable.",
      criteria: [
        "Audio transcribed and indexed alongside visual frame embeddings",
        "Keyword search over spoken content returns relevant clips",
        "Multimodal query combining visual description and audio keyword works end-to-end",
      ],
    },
  ],
};

const PRIORITY_STYLES = {
  "Must Have": { bg: "#FCEBEB", color: "#791F1F", border: "#F09595" },
  "Nice to Have": { bg: "#E8F5E1", color: "#2D5016", border: "#8BC47A" },
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
                  <span className="success-card-id">{workstream === "TA50" ? "TA" : "VR"}-M{marker.id}</span>
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
                <p className="success-card-initiative">Initiative: {marker.initiative}</p>
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
