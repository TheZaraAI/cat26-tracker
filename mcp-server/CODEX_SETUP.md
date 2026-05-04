# CAT26 Milestone Tracker — Codex Integration Guide

## Overview

The CAT26 Milestone Tracker data lives in **Airtable** and is accessible through an MCP (Model Context Protocol) server. This lets AI coding agents like Codex read and update tracker data through structured tools. Changes appear on the dashboard within 30 seconds — no PRs or deploys needed for data updates.

**Dashboard:** https://thezaraai.github.io/cat26-tracker/

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/TheZaraAI/cat26-tracker.git
cd cat26-tracker/mcp-server
npm install
```

### 2. Add to your MCP config

Add this to your Codex MCP configuration:

```json
{
  "mcpServers": {
    "cat26-tracker": {
      "command": "node",
      "args": ["/path/to/cat26-tracker/mcp-server/index.js"],
      "env": {
        "AIRTABLE_TOKEN": "<your-scoped-token>"
      }
    }
  }
}
```

> Replace `/path/to/` with the actual path where you cloned the repo.
> Airtable token will be provided separately — do not commit it.

### For Claude Code users:

```bash
claude mcp add cat26-tracker -- node /path/to/cat26-tracker/mcp-server/index.js
```

Set `AIRTABLE_TOKEN` in your environment before running.

---

## Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `list_milestones` | List all milestones | `workstream` (TA50 \| Video RAG), `status` |
| `get_milestone` | Get a single milestone | `name` or `record_id` |
| `create_milestone` | Create a new milestone | `name`, `workstream`, `priority`, `status` |
| `update_milestone` | Update milestone fields | `record_id`, any updateable field |
| `list_subtasks` | List subtasks | `milestone_name` to filter by parent |
| `get_subtask` | Get a single subtask | `name` or `record_id` |
| `create_subtask` | Create a subtask | `name`, `milestone_name`, `status` |
| `update_subtask` | Update subtask fields | `record_id`, any updateable field |
| `list_team_members` | List all team members | — |
| `get_tracker_status` | Dashboard summary | — |

---

## Data Schema

### Milestones

| Field | Type | Valid Values |
|-------|------|-------------|
| Project Name | text | Primary field — initiative name |
| Workstream | select | `TA50`, `Video RAG` |
| Priority | select | `Critical`, `High`, `Medium`, `Low` |
| Status | select | `Not Started`, `In Progress`, `On Hold`, `Completed`, `Planning` |
| Target Date | date | `YYYY-MM-DD` |
| DRI | text | Full name from Team Members table |
| Days Needed | number | Decimal (e.g., 2.5) |
| Stretch Goals | text | Optional |
| Notes | multiline text | Optional |

### Subtasks

| Field | Type | Valid Values |
|-------|------|-------------|
| Title | text | Primary field — subtask name |
| Milestone Title | text | Must match a milestone's Project Name exactly |
| Status | select | `Open`, `In Progress`, `Closed` |
| DRI | text | Full name from Team Members table |
| Due Date | date | `YYYY-MM-DD` |
| Notes | multiline text | Optional |
| Workstream | text | `TA50` or `Video RAG` |
| Priority | text | Optional |

### Team Members

| Field | Type |
|-------|------|
| Name | text |
| Role | text |
| GitLab Username | text |

---

## ID Convention

Milestones are identified by workstream prefix:
- **TA50** items: `TA-01`, `TA-02`, ...
- **Video RAG** items: `VR-01`, `VR-02`, ...

---

## Example Usage

### List all milestones
```
Tool: list_milestones
```

### List milestones for one workstream
```
Tool: list_milestones
Input: { "workstream": "TA50" }
```

### Update a milestone status
```
Tool: update_milestone
Input: { "record_id": "recXXXXXX", "status": "In Progress" }
```

### Create a subtask
```
Tool: create_subtask
Input: {
  "name": "Set up S3 bucket for photo uploads",
  "milestone_name": "Evidence pipeline + AI detection integration",
  "status": "Open",
  "dri": "Scott, Jaclyn S CW3 USARMY (USA)"
}
```

### Get tracker summary
```
Tool: get_tracker_status
```
Returns: total milestones, completed count, blocked count, days to eval (May 14 2026), per-workstream breakdown.

---

## Architecture

```
Codex / Claude Code
       |
       | MCP (stdio)
       v
  MCP Server (Node.js)
       |
       | HTTPS (REST API)
       v
    Airtable
       |
       | Polled every 30s
       v
  GitHub Pages Dashboard
```

---

## Important Notes

- **Source of truth is Airtable** — the GitHub repo only contains frontend code
- **Data changes are live** — no deploy or PR needed, dashboard polls every 30 seconds
- **Do not commit tokens** — pass via environment variables only
- **Validation is built in** — the MCP server rejects invalid status, priority, or workstream values
- **Evaluation deadline: May 14, 2026**

---

## Questions?

Reach out to Jax (jax@outpostgray.com) or check the repo: https://github.com/TheZaraAI/cat26-tracker
