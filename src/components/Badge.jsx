const PRIORITY_STYLES = {
  P1: { bg: "#FCEBEB", color: "#791F1F", border: "#F09595", label: "P1 Critical" },
  P2: { bg: "#FAEEDA", color: "#633806", border: "#FAC775", label: "P2 High" },
  P3: { bg: "#E1F5EE", color: "#085041", border: "#5DCAA5", label: "P3 Medium" },
  // Also handle raw Airtable values in case they leak through
  Critical: { bg: "#FCEBEB", color: "#791F1F", border: "#F09595", label: "P1 Critical" },
  High: { bg: "#FAEEDA", color: "#633806", border: "#FAC775", label: "P2 High" },
  Medium: { bg: "#E1F5EE", color: "#085041", border: "#5DCAA5", label: "P3 Medium" },
  Low: { bg: "#F1EFE8", color: "#444441", border: "#D1D0C8", label: "P4 Low" },
};

const STATUS_STYLES = {
  "Not started": { bg: "#F1EFE8", color: "#444441" },
  "In progress": { bg: "#E6F1FB", color: "#0C447C" },
  Blocked: { bg: "#FCEBEB", color: "#791F1F" },
  Completed: { bg: "#E1F5EE", color: "#085041" },
  Planning: { bg: "#F0E6FB", color: "#4A1D8E" },
  // Also handle raw Airtable values
  "Not Started": { bg: "#F1EFE8", color: "#444441" },
  "In Progress": { bg: "#E6F1FB", color: "#0C447C" },
  "On Hold": { bg: "#FCEBEB", color: "#791F1F" },
};

const WORKSTREAM_STYLES = {
  TA50: { bg: "#E6F1FB", color: "#0C447C" },
  "Video RAG": { bg: "#F0E6FB", color: "#4A1D8E" },
};

export function PriorityBadge({ value }) {
  const s = PRIORITY_STYLES[value];
  if (!s) return <span>{value}</span>;
  return (
    <span
      className="badge"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

export function StatusBadge({ value }) {
  const s = STATUS_STYLES[value];
  if (!s) return <span>{value}</span>;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {value}
    </span>
  );
}

export function WorkstreamBadge({ value }) {
  const s = WORKSTREAM_STYLES[value];
  if (!s) return <span>{value}</span>;
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {value}
    </span>
  );
}
