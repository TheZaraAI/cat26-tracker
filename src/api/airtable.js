/**
 * Airtable REST API layer for CAT26 Tracker.
 * Clean interface that can later be wrapped as an MCP server.
 *
 * Mapping layer: Airtable uses "Project Name", "Critical/High/Medium/Low",
 * and "Not Started/In Progress/On Hold/Completed/Planning".
 * The app UI uses "Name", "P1/P2/P3", and "Not started/In progress/Blocked/Completed".
 */

const TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const BASE_ID = import.meta.env.VITE_BASE_ID;
const TABLE_NAME = "Milestones";
const SUBTASKS_TABLE = "tblx1T6GElbJVPO81";
const API_ROOT = "https://api.airtable.com/v0";

// --- Priority mapping: Airtable <-> UI ---
const PRIORITY_AT_TO_UI = {
  Critical: "P1",
  High: "P2",
  Medium: "P3",
  Low: "P4",
};
const PRIORITY_UI_TO_AT = Object.fromEntries(
  Object.entries(PRIORITY_AT_TO_UI).map(([k, v]) => [v, k])
);

// --- Status mapping: Airtable <-> UI ---
const STATUS_AT_TO_UI = {
  "Not Started": "Not started",
  "In Progress": "In progress",
  "On Hold": "Blocked",
  Completed: "Closed",
  Planning: "Planning",
};
const STATUS_UI_TO_AT = Object.fromEntries(
  Object.entries(STATUS_AT_TO_UI).map(([k, v]) => [v, k])
);

/**
 * Convert an Airtable record's fields to the app's internal shape.
 * "Project Name" -> "Name", priority/status translated.
 */
function fromAirtable(fields) {
  const mapped = { ...fields };
  // Rename primary field
  if ("Project Name" in mapped) {
    mapped.Name = mapped["Project Name"];
    delete mapped["Project Name"];
  }
  // Translate priority
  if (mapped.Priority) {
    mapped.Priority = PRIORITY_AT_TO_UI[mapped.Priority] || mapped.Priority;
  }
  // Translate status
  if (mapped.Status) {
    mapped.Status = STATUS_AT_TO_UI[mapped.Status] || mapped.Status;
  }
  return mapped;
}

/**
 * Convert app-internal fields to Airtable field names/values for writes.
 * "Name" -> "Project Name", priority/status translated.
 */
// Fields that are linked records or read-only — strip before writing
const MILESTONE_STRIP_FIELDS = [
  "Project Lead", "Documentation", "Comments", "Subtasks",
  "Milestones", "Tasks", "Start Date", "End Date",
  "Description", "Technical Requirements", "Scope",
  "Progress (%)", "GitLab Milestone ID", "GitLab Project",
  "id",
];

function toAirtable(fields) {
  const mapped = { ...fields };
  // Rename primary field
  if ("Name" in mapped) {
    mapped["Project Name"] = mapped.Name;
    delete mapped.Name;
  }
  // Translate priority
  if (mapped.Priority) {
    mapped.Priority = PRIORITY_UI_TO_AT[mapped.Priority] || mapped.Priority;
  }
  // Translate status
  if (mapped.Status) {
    mapped.Status = STATUS_UI_TO_AT[mapped.Status] || mapped.Status;
  }
  // Strip linked record and read-only fields
  for (const f of MILESTONE_STRIP_FIELDS) {
    delete mapped[f];
  }
  return mapped;
}

export function isConfigured() {
  return Boolean(TOKEN && BASE_ID);
}

function headers() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

const TEAM_MEMBERS_TABLE = "Team%20Members";

function url(path = "", table = TABLE_NAME) {
  return `${API_ROOT}/${BASE_ID}/${encodeURIComponent(table)}${path}`;
}

/**
 * Fetch team members for DRI dropdown.
 */
export async function fetchTeamMembers() {
  const res = await fetch(`${API_ROOT}/${BASE_ID}/${TEAM_MEMBERS_TABLE}`, { headers: headers() });
  if (!res.ok) return [];
  const data = await res.json();
  return data.records.map((r) => ({
    id: r.id,
    name: r.fields.Name || "",
    role: r.fields.Role || "",
    username: r.fields["GitLab Username"] || "",
  }));
}

/**
 * Fetch all milestone records (handles pagination).
 */
export async function fetchMilestones() {
  let allRecords = [];
  let offset = undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set("offset", offset);

    const res = await fetch(`${url("", TABLE_NAME)}?${params}`, { headers: headers() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Airtable ${res.status}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(
      data.records.map((r) => ({ id: r.id, ...fromAirtable(r.fields) }))
    );
    offset = data.offset;
  } while (offset);

  return allRecords;
}

/**
 * Update a single record field(s) with PATCH.
 */
export async function updateMilestone(recordId, fields) {
  const res = await fetch(url("", TABLE_NAME), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      records: [{ id: recordId, fields: toAirtable(fields) }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  const r = data.records[0];
  return { id: r.id, ...fromAirtable(r.fields) };
}

/**
 * Create a new milestone record.
 */
export async function createMilestone(fields) {
  const res = await fetch(url("", TABLE_NAME), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      records: [{ fields: toAirtable(fields) }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  const r = data.records[0];
  return { id: r.id, ...fromAirtable(r.fields) };
}

/**
 * Delete a record by ID.
 */
export async function deleteMilestone(recordId) {
  const params = new URLSearchParams();
  params.set("records[]", recordId);

  const res = await fetch(`${url("", TABLE_NAME)}?${params}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  return true;
}

/**
 * Seed all default records in a single batch (max 10).
 */
export async function seedRecords(records) {
  const res = await fetch(url("", TABLE_NAME), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      records: records.map((fields) => ({ fields: toAirtable(fields) })),
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  return data.records.map((r) => ({ id: r.id, ...fromAirtable(r.fields) }));
}

// =====================================================================
// Subtask CRUD (GitLab Issues synced to Airtable)
// =====================================================================

/**
 * Convert a subtask record from Airtable to app-internal shape.
 * Airtable uses "Title" as the primary field; the app uses "Name".
 * Airtable uses "Milestone" to link to the parent milestone name;
 * the app uses "Parent Milestone" internally.
 */
// Fields to strip from subtask writes (linked records, read-only)
const SUBTASK_STRIP_FIELDS = [
  "Milestone", "Assigned To", "Labels (unused)", "id",
  "Last Synced", "GitLab Issue ID", "GitLab URL", "GitLab Project",
];

function subtaskFromAirtable(fields) {
  const mapped = { ...fields };
  if ("Title" in mapped) {
    mapped.Name = mapped.Title;
    delete mapped.Title;
  }
  // "Milestone Title" is the text field that stores the parent milestone name
  if ("Milestone Title" in mapped) {
    mapped["Parent Milestone"] = mapped["Milestone Title"];
    delete mapped["Milestone Title"];
  }
  // "Milestone" is a linked record field — ignore it for our purposes
  delete mapped.Milestone;
  delete mapped["Assigned To"];
  return mapped;
}

/**
 * Convert app-internal subtask fields to Airtable field names for writes.
 * "Name" -> "Title", "Parent Milestone" -> "Milestone Title" (text field).
 * Never write to "Milestone" (linked record field).
 */
function subtaskToAirtable(fields) {
  const mapped = { ...fields };
  if ("Name" in mapped) {
    mapped.Title = mapped.Name;
    delete mapped.Name;
  }
  if ("Parent Milestone" in mapped) {
    mapped["Milestone Title"] = mapped["Parent Milestone"];
    delete mapped["Parent Milestone"];
  }
  // Strip linked record and read-only fields
  for (const f of SUBTASK_STRIP_FIELDS) {
    delete mapped[f];
  }
  return mapped;
}

/**
 * Fetch all subtask records (handles pagination).
 */
export async function fetchSubtasks() {
  let allRecords = [];
  let offset = undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set("offset", offset);

    const res = await fetch(`${url("", SUBTASKS_TABLE)}?${params}`, { headers: headers() });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Airtable ${res.status}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(
      data.records.map((r) => ({ id: r.id, ...subtaskFromAirtable(r.fields) }))
    );
    offset = data.offset;
  } while (offset);

  return allRecords;
}

/**
 * Create a new subtask record.
 */
export async function createSubtask(fields) {
  const res = await fetch(url("", SUBTASKS_TABLE), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      records: [{ fields: subtaskToAirtable(fields) }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  const r = data.records[0];
  return { id: r.id, ...subtaskFromAirtable(r.fields) };
}

/**
 * Update a subtask record.
 */
export async function updateSubtask(recordId, fields) {
  const res = await fetch(url("", SUBTASKS_TABLE), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      records: [{ id: recordId, fields: subtaskToAirtable(fields) }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  const r = data.records[0];
  return { id: r.id, ...subtaskFromAirtable(r.fields) };
}

/**
 * Delete a subtask record by ID.
 */
export async function deleteSubtask(recordId) {
  const params = new URLSearchParams();
  params.set("records[]", recordId);

  const res = await fetch(`${url("", SUBTASKS_TABLE)}?${params}`, {
    method: "DELETE",
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  return true;
}
