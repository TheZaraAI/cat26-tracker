# CAT26 Milestone Tracker — MCP Server

An MCP (Model Context Protocol) server that wraps the Airtable-backed CAT26 Milestone Tracker. Lets AI coding agents (Claude Code, Codex, etc.) read and update tracker data through structured tools.

## Setup

### 1. Install dependencies

```bash
cd mcp-server
npm install
```

### 2. Set your Airtable token

Create a `.env` file (or export the variable in your shell):

```bash
export AIRTABLE_TOKEN="pat_your_token_here"
```

You can also copy `.env.example` as a starting point.

### 3. Add to Claude Code

```bash
claude mcp add cat26-tracker -- node /Users/jaxs./Military/cat26-tracker/mcp-server/index.js
```

Or add it to your project-level `.mcp.json`:

```json
{
  "mcpServers": {
    "cat26-tracker": {
      "command": "node",
      "args": ["/Users/jaxs./Military/cat26-tracker/mcp-server/index.js"],
      "env": {
        "AIRTABLE_TOKEN": "pat_your_token_here"
      }
    }
  }
}
```

### 4. Add to Codex

In your Codex MCP configuration (typically `~/.codex/mcp.json` or project-level):

```json
{
  "servers": {
    "cat26-tracker": {
      "command": "node",
      "args": ["/Users/jaxs./Military/cat26-tracker/mcp-server/index.js"],
      "env": {
        "AIRTABLE_TOKEN": "pat_your_token_here"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_milestones` | List all milestones. Filter by workstream (`TA50`, `Video RAG`) and/or status (`Not Started`, `In Progress`, `On Hold`, `Completed`, `Planning`). |
| `get_milestone` | Get a single milestone by Project Name or Airtable record ID. |
| `create_milestone` | Create a new milestone with project name, workstream, priority, and optional fields. |
| `update_milestone` | Update status, priority, DRI, target date, notes, etc. on an existing milestone. |
| `list_subtasks` | List subtasks, optionally filtered by parent milestone name. |
| `get_subtask` | Get a single subtask by Title or record ID. |
| `create_subtask` | Create a subtask linked to a parent milestone. |
| `update_subtask` | Update subtask fields (status, DRI, due date, notes, etc.). |
| `list_team_members` | List all team members from the tracker. |
| `get_tracker_status` | Summary dashboard: total milestones, completed/blocked counts, days to eval (May 14, 2026), per-workstream breakdown. |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AIRTABLE_TOKEN` | Yes | Airtable personal access token with read/write access to the CAT26 base. |

## Airtable Schema

**Milestones table** — fields: Project Name, Workstream, Priority, Status, Target Date, DRI, Days Needed, Stretch Goals, Notes

**Subtasks table** — fields: Title, Milestone Title, Status, DRI, Due Date, Notes, Workstream, Priority

**Team Members table** — lists personnel associated with the project
