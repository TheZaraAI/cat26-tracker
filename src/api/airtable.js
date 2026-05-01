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
const TABLE_NAME = "Initiatives";
const SUBTASKS_TABLE = "Subtasks";
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
  Completed: "Completed",
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

function url(path = "", table = TABLE_NAME) {
  return `${API_ROOT}/${BASE_ID}/${encodeURIComponent(table)}${path}`;
}

/**
 * Fetch all initiative records (handles pagination).
 */
export async function fetchInitiatives() {
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
export async function updateInitiative(recordId, fields) {
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
 * Create a new initiative record.
 */
export async function createInitiative(fields) {
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
export async function deleteInitiative(recordId) {
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
// Subtask CRUD
// =====================================================================

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
      data.records.map((r) => ({ id: r.id, ...r.fields }))
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
      records: [{ fields }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  const r = data.records[0];
  return { id: r.id, ...r.fields };
}

/**
 * Update a subtask record.
 */
export async function updateSubtask(recordId, fields) {
  const res = await fetch(url("", SUBTASKS_TABLE), {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      records: [{ id: recordId, fields }],
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Airtable ${res.status}`);
  }

  const data = await res.json();
  const r = data.records[0];
  return { id: r.id, ...r.fields };
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
