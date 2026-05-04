/**
 * Airtable API client for CAT26 Milestone Tracker.
 *
 * Uses the Airtable REST API directly (no SDK) so we keep dependencies minimal.
 */

const BASE_ID = "appbH0ung2ZJqkZOf";
const MILESTONES_TABLE = "Milestones";
const SUBTASKS_TABLE_ID = "tblx1T6GElbJVPO81";
const TEAM_MEMBERS_TABLE = "Team Members";

const API_ROOT = `https://api.airtable.com/v0/${BASE_ID}`;

function getToken() {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    throw new Error("AIRTABLE_TOKEN environment variable is not set");
  }
  return token;
}

async function airtableFetch(path, options = {}) {
  const token = getToken();
  const url = path.startsWith("http") ? path : `${API_ROOT}/${encodeURIComponent(path)}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable API error ${res.status}: ${body}`);
  }

  return res.json();
}

/**
 * Fetch all records from a table, handling pagination.
 */
async function listRecords(table, filterFormula) {
  const records = [];
  let offset;

  do {
    const params = new URLSearchParams();
    if (filterFormula) params.set("filterByFormula", filterFormula);
    if (offset) params.set("offset", offset);

    const qs = params.toString();
    const path = `${API_ROOT}/${encodeURIComponent(table)}${qs ? `?${qs}` : ""}`;
    const data = await airtableFetch(path);
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

/**
 * Get a single record by ID.
 */
async function getRecord(table, recordId) {
  const path = `${API_ROOT}/${encodeURIComponent(table)}/${recordId}`;
  return airtableFetch(path);
}

/**
 * Find a record by matching a field value (e.g. name).
 */
async function findRecordByField(table, fieldName, value) {
  const formula = `{${fieldName}} = "${value.replace(/"/g, '\\"')}"`;
  const records = await listRecords(table, formula);
  return records.length > 0 ? records[0] : null;
}

/**
 * Create a record.
 */
async function createRecord(table, fields) {
  const path = `${API_ROOT}/${encodeURIComponent(table)}`;
  return airtableFetch(path, {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
}

/**
 * Update (PATCH) a record.
 */
async function updateRecord(table, recordId, fields) {
  const path = `${API_ROOT}/${encodeURIComponent(table)}/${recordId}`;
  return airtableFetch(path, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

// ── Milestones ──────────────────────────────────────────────────────

export async function listMilestones({ workstream, status } = {}) {
  const clauses = [];
  if (workstream) clauses.push(`{Workstream} = "${workstream}"`);
  if (status) clauses.push(`{Status} = "${status}"`);

  const formula = clauses.length > 1
    ? `AND(${clauses.join(", ")})`
    : clauses[0] || null;

  const records = await listRecords(MILESTONES_TABLE, formula);
  return records.map(simplifyRecord);
}

export async function getMilestone(nameOrId) {
  if (nameOrId.startsWith("rec")) {
    const rec = await getRecord(MILESTONES_TABLE, nameOrId);
    return simplifyRecord(rec);
  }
  const rec = await findRecordByField(MILESTONES_TABLE, "Project Name", nameOrId);
  if (!rec) throw new Error(`Milestone not found: ${nameOrId}`);
  return simplifyRecord(rec);
}

export async function createMilestone(fields) {
  const rec = await createRecord(MILESTONES_TABLE, fields);
  return simplifyRecord(rec);
}

export async function updateMilestone(nameOrId, fields) {
  let recordId = nameOrId;
  if (!nameOrId.startsWith("rec")) {
    const rec = await findRecordByField(MILESTONES_TABLE, "Project Name", nameOrId);
    if (!rec) throw new Error(`Milestone not found: ${nameOrId}`);
    recordId = rec.id;
  }
  const rec = await updateRecord(MILESTONES_TABLE, recordId, fields);
  return simplifyRecord(rec);
}

// ── Subtasks ────────────────────────────────────────────────────────

export async function listSubtasks({ milestoneName } = {}) {
  const formula = milestoneName
    ? `{Milestone Title} = "${milestoneName.replace(/"/g, '\\"')}"`
    : null;

  const records = await listRecords(SUBTASKS_TABLE_ID, formula);
  return records.map(simplifyRecord);
}

export async function getSubtask(nameOrId) {
  if (nameOrId.startsWith("rec")) {
    const rec = await getRecord(SUBTASKS_TABLE_ID, nameOrId);
    return simplifyRecord(rec);
  }
  const rec = await findRecordByField(SUBTASKS_TABLE_ID, "Title", nameOrId);
  if (!rec) throw new Error(`Subtask not found: ${nameOrId}`);
  return simplifyRecord(rec);
}

export async function createSubtask(fields) {
  const rec = await createRecord(SUBTASKS_TABLE_ID, fields);
  return simplifyRecord(rec);
}

export async function updateSubtask(nameOrId, fields) {
  let recordId = nameOrId;
  if (!nameOrId.startsWith("rec")) {
    const rec = await findRecordByField(SUBTASKS_TABLE_ID, "Title", nameOrId);
    if (!rec) throw new Error(`Subtask not found: ${nameOrId}`);
    recordId = rec.id;
  }
  const rec = await updateRecord(SUBTASKS_TABLE_ID, recordId, fields);
  return simplifyRecord(rec);
}

// ── Team Members ────────────────────────────────────────────────────

export async function listTeamMembers() {
  const records = await listRecords(TEAM_MEMBERS_TABLE);
  return records.map(simplifyRecord);
}

// ── Tracker Status ──────────────────────────────────────────────────

export async function getTrackerStatus() {
  const milestones = await listRecords(MILESTONES_TABLE);

  const total = milestones.length;
  const completed = milestones.filter(r => r.fields.Status === "Completed").length;
  const blocked = milestones.filter(r => r.fields.Status === "On Hold").length;
  const inProgress = milestones.filter(r => r.fields.Status === "In Progress").length;
  const notStarted = milestones.filter(r => r.fields.Status === "Not Started").length;
  const planning = milestones.filter(r => r.fields.Status === "Planning").length;

  const evalDate = new Date("2026-05-14T00:00:00");
  const now = new Date();
  const daysToEval = Math.ceil((evalDate - now) / (1000 * 60 * 60 * 24));

  const workstreams = {};
  for (const r of milestones) {
    const ws = r.fields.Workstream || "Unassigned";
    if (!workstreams[ws]) {
      workstreams[ws] = { total: 0, completed: 0, inProgress: 0, blocked: 0 };
    }
    workstreams[ws].total++;
    if (r.fields.Status === "Completed") workstreams[ws].completed++;
    if (r.fields.Status === "In Progress") workstreams[ws].inProgress++;
    if (r.fields.Status === "On Hold") workstreams[ws].blocked++;
  }

  return {
    total,
    completed,
    inProgress,
    notStarted,
    planning,
    blocked,
    daysToEval,
    evalDate: "2026-05-14",
    workstreams,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

function simplifyRecord(record) {
  return {
    id: record.id,
    ...record.fields,
  };
}
