/**
 * Excel export using SheetJS.
 * Creates a 4-sheet workbook: Summary, All, TA50, Video RAG.
 */
import * as XLSX from "xlsx";
import { daysToEval } from "./dateHelpers";

const COLUMNS = [
  "Name",        // mapped from "Project Name" by the API layer
  "Workstream",
  "Priority",    // displayed as P1/P2/P3 (mapped from Critical/High/Medium)
  "Status",      // displayed as Not started/In progress/Blocked/Completed (mapped from Airtable values)
  "Target Date",
  "DRI",
  "Days Needed",
  "Stretch Goals",
  "Notes",
];

function toRows(records) {
  return records.map((r) =>
    COLUMNS.reduce((row, col) => {
      row[col] = r[col] ?? "";
      return row;
    }, {})
  );
}

function buildSummaryData(records) {
  const total = records.length;
  const completed = records.filter((r) => r.Status === "Closed").length;
  const inProgress = records.filter((r) => r.Status === "In progress").length;
  const blocked = records.filter((r) => r.Status === "Blocked" || r.Status === "On Hold").length;
  const notStarted = records.filter((r) => r.Status === "Not started" || r.Status === "Not Started").length;
  const planning = records.filter((r) => r.Status === "Planning").length;

  const ta50 = records.filter((r) => r.Workstream === "TA50");
  const videoRag = records.filter((r) => r.Workstream === "Video RAG");

  return [
    { Metric: "Total Milestones", Value: total },
    { Metric: "Closed", Value: completed },
    { Metric: "In Progress", Value: inProgress },
    { Metric: "Blocked", Value: blocked },
    { Metric: "Not Started", Value: notStarted },
    { Metric: "Planning", Value: planning },
    { Metric: "Completion %", Value: total ? `${Math.round((completed / total) * 100)}%` : "0%" },
    { Metric: "Days to Eval", Value: daysToEval() },
    { Metric: "", Value: "" },
    { Metric: "TA50 Milestones", Value: ta50.length },
    { Metric: "TA50 Completed", Value: ta50.filter((r) => r.Status === "Closed").length },
    { Metric: "Video RAG Milestones", Value: videoRag.length },
    { Metric: "Video RAG Completed", Value: videoRag.filter((r) => r.Status === "Closed").length },
    { Metric: "", Value: "" },
    { Metric: "Exported", Value: new Date().toISOString() },
    { Metric: "Event", Value: "CAT26 Code-a-thon, 75th IC Det 5/6" },
  ];
}

export function exportToExcel(records) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryWs = XLSX.utils.json_to_sheet(buildSummaryData(records));
  summaryWs["!cols"] = [{ wch: 24 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // All initiatives
  const allWs = XLSX.utils.json_to_sheet(toRows(records));
  allWs["!cols"] = COLUMNS.map((c) =>
    c === "Name" || c === "Notes" ? { wch: 50 } : { wch: 16 }
  );
  XLSX.utils.book_append_sheet(wb, allWs, "All");

  // TA50
  const ta50 = records.filter((r) => r.Workstream === "TA50");
  const ta50Ws = XLSX.utils.json_to_sheet(toRows(ta50));
  ta50Ws["!cols"] = allWs["!cols"];
  XLSX.utils.book_append_sheet(wb, ta50Ws, "TA50");

  // Video RAG
  const vr = records.filter((r) => r.Workstream === "Video RAG");
  const vrWs = XLSX.utils.json_to_sheet(toRows(vr));
  vrWs["!cols"] = allWs["!cols"];
  XLSX.utils.book_append_sheet(wb, vrWs, "Video RAG");

  XLSX.writeFile(wb, `CAT26_Tracker_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
