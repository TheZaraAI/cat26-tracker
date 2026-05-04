#!/usr/bin/env node

/**
 * CAT26 Milestone Tracker — MCP Server
 *
 * Exposes Airtable-backed milestone/subtask/team data as MCP tools
 * over stdio transport.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  listMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  listSubtasks,
  getSubtask,
  createSubtask,
  updateSubtask,
  listTeamMembers,
  getTrackerStatus,
} from "./airtable.js";

// ── Shared enums ────────────────────────────────────────────────────

const WORKSTREAMS = ["TA50", "Video RAG"];
const MILESTONE_STATUSES = ["Not Started", "In Progress", "On Hold", "Completed", "Planning"];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const SUBTASK_STATUSES = ["Open", "In Progress", "Closed"];

// ── Server setup ────────────────────────────────────────────────────

const server = new McpServer({
  name: "cat26-tracker",
  version: "1.0.0",
});

// Helper: wrap an async handler so errors become proper MCP error content
function toolHandler(fn) {
  return async (params) => {
    try {
      const result = await fn(params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  };
}

// ── Tools ───────────────────────────────────────────────────────────

server.tool(
  "list_milestones",
  "List all milestones. Optionally filter by workstream and/or status.",
  {
    workstream: z.enum(WORKSTREAMS).optional().describe("Filter by workstream"),
    status: z.enum(MILESTONE_STATUSES).optional().describe("Filter by status"),
  },
  toolHandler(async ({ workstream, status }) => {
    return listMilestones({ workstream, status });
  })
);

server.tool(
  "get_milestone",
  "Get a single milestone by its Project Name or Airtable record ID.",
  {
    name_or_id: z.string().describe("Project Name or Airtable record ID (starts with 'rec')"),
  },
  toolHandler(async ({ name_or_id }) => {
    return getMilestone(name_or_id);
  })
);

server.tool(
  "create_milestone",
  "Create a new milestone in the tracker.",
  {
    project_name: z.string().describe("Project Name (primary field)"),
    workstream: z.enum(WORKSTREAMS).describe("Workstream"),
    priority: z.enum(PRIORITIES).describe("Priority level"),
    status: z.enum(MILESTONE_STATUSES).optional().default("Not Started").describe("Status"),
    target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Target date (YYYY-MM-DD)"),
    dri: z.string().optional().describe("Directly Responsible Individual"),
    days_needed: z.number().optional().describe("Estimated days needed"),
    stretch_goals: z.string().optional().describe("Stretch goals"),
    notes: z.string().optional().describe("Notes"),
  },
  toolHandler(async (params) => {
    const fields = {
      "Project Name": params.project_name,
      Workstream: params.workstream,
      Priority: params.priority,
      Status: params.status,
    };
    if (params.target_date) fields["Target Date"] = params.target_date;
    if (params.dri) fields["DRI"] = params.dri;
    if (params.days_needed !== undefined) fields["Days Needed"] = params.days_needed;
    if (params.stretch_goals) fields["Stretch Goals"] = params.stretch_goals;
    if (params.notes) fields["Notes"] = params.notes;
    return createMilestone(fields);
  })
);

server.tool(
  "update_milestone",
  "Update fields on an existing milestone.",
  {
    name_or_id: z.string().describe("Project Name or record ID to update"),
    status: z.enum(MILESTONE_STATUSES).optional().describe("New status"),
    priority: z.enum(PRIORITIES).optional().describe("New priority"),
    workstream: z.enum(WORKSTREAMS).optional().describe("New workstream"),
    target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("New target date (YYYY-MM-DD)"),
    dri: z.string().optional().describe("New DRI"),
    days_needed: z.number().optional().describe("New days needed estimate"),
    stretch_goals: z.string().optional().describe("New stretch goals"),
    notes: z.string().optional().describe("New notes"),
  },
  toolHandler(async ({ name_or_id, ...updates }) => {
    const fields = {};
    if (updates.status) fields["Status"] = updates.status;
    if (updates.priority) fields["Priority"] = updates.priority;
    if (updates.workstream) fields["Workstream"] = updates.workstream;
    if (updates.target_date) fields["Target Date"] = updates.target_date;
    if (updates.dri) fields["DRI"] = updates.dri;
    if (updates.days_needed !== undefined) fields["Days Needed"] = updates.days_needed;
    if (updates.stretch_goals) fields["Stretch Goals"] = updates.stretch_goals;
    if (updates.notes) fields["Notes"] = updates.notes;

    if (Object.keys(fields).length === 0) {
      throw new Error("No update fields provided");
    }
    return updateMilestone(name_or_id, fields);
  })
);

server.tool(
  "list_subtasks",
  "List subtasks. Optionally filter by parent milestone name.",
  {
    milestone_name: z.string().optional().describe("Filter by parent milestone's Project Name"),
  },
  toolHandler(async ({ milestone_name }) => {
    return listSubtasks({ milestoneName: milestone_name });
  })
);

server.tool(
  "get_subtask",
  "Get a single subtask by Title or Airtable record ID.",
  {
    name_or_id: z.string().describe("Subtask Title or Airtable record ID"),
  },
  toolHandler(async ({ name_or_id }) => {
    return getSubtask(name_or_id);
  })
);

server.tool(
  "create_subtask",
  "Create a new subtask linked to a parent milestone.",
  {
    title: z.string().describe("Subtask title"),
    milestone_title: z.string().describe("Parent milestone's Project Name"),
    status: z.enum(SUBTASK_STATUSES).optional().default("Open").describe("Status"),
    dri: z.string().optional().describe("Directly Responsible Individual"),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Due date (YYYY-MM-DD)"),
    notes: z.string().optional().describe("Notes"),
    workstream: z.string().optional().describe("Workstream"),
    priority: z.string().optional().describe("Priority"),
  },
  toolHandler(async (params) => {
    const fields = {
      Title: params.title,
      "Milestone Title": params.milestone_title,
      Status: params.status,
    };
    if (params.dri) fields["DRI"] = params.dri;
    if (params.due_date) fields["Due Date"] = params.due_date;
    if (params.notes) fields["Notes"] = params.notes;
    if (params.workstream) fields["Workstream"] = params.workstream;
    if (params.priority) fields["Priority"] = params.priority;
    return createSubtask(fields);
  })
);

server.tool(
  "update_subtask",
  "Update fields on an existing subtask.",
  {
    name_or_id: z.string().describe("Subtask Title or record ID to update"),
    status: z.enum(SUBTASK_STATUSES).optional().describe("New status"),
    title: z.string().optional().describe("New title"),
    milestone_title: z.string().optional().describe("New parent milestone name"),
    dri: z.string().optional().describe("New DRI"),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("New due date (YYYY-MM-DD)"),
    notes: z.string().optional().describe("New notes"),
    workstream: z.string().optional().describe("New workstream"),
    priority: z.string().optional().describe("New priority"),
  },
  toolHandler(async ({ name_or_id, ...updates }) => {
    const fields = {};
    if (updates.status) fields["Status"] = updates.status;
    if (updates.title) fields["Title"] = updates.title;
    if (updates.milestone_title) fields["Milestone Title"] = updates.milestone_title;
    if (updates.dri) fields["DRI"] = updates.dri;
    if (updates.due_date) fields["Due Date"] = updates.due_date;
    if (updates.notes) fields["Notes"] = updates.notes;
    if (updates.workstream) fields["Workstream"] = updates.workstream;
    if (updates.priority) fields["Priority"] = updates.priority;

    if (Object.keys(fields).length === 0) {
      throw new Error("No update fields provided");
    }
    return updateSubtask(name_or_id, fields);
  })
);

server.tool(
  "list_team_members",
  "List all team members from the tracker.",
  {},
  toolHandler(async () => {
    return listTeamMembers();
  })
);

server.tool(
  "get_tracker_status",
  "Get a high-level summary of the tracker: totals, completion counts, days to eval (May 14 2026), and per-workstream breakdown.",
  {},
  toolHandler(async () => {
    return getTrackerStatus();
  })
);

// ── Start ───────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
