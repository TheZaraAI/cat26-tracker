# CAT26 Initiative Tracker

Real-time initiative tracker for the **75th Innovation Command, Detachment 5/6** CAT26 code-a-thon (May 3-16 2026, Austin TX).

Two workstreams tracked:
- **TA50** -- Sentinel Inventory
- **Video RAG** -- Multimodal Intelligence

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create the Airtable base (requires AIRTABLE_TOKEN and AIRTABLE_WORKSPACE_ID in .env)
npm run setup

# 3. Add the VITE_BASE_ID from setup output to .env
#    Also add VITE_AIRTABLE_TOKEN (same token, prefixed for Vite)

# 4. Start dev server
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `AIRTABLE_TOKEN` | Airtable personal access token (for setup script) |
| `AIRTABLE_WORKSPACE_ID` | Airtable workspace ID (for setup script) |
| `VITE_AIRTABLE_TOKEN` | Same token, exposed to Vite frontend |
| `VITE_BASE_ID` | Base ID returned by setup script |

## Features

- Polls Airtable every 30 seconds for multi-user collaboration
- Optimistic UI updates on status changes
- Excel export with 4-sheet workbook (Summary, All, TA50, Video RAG)
- Filter by priority and status
- Edit modal for full record editing
- Inline status dropdown
- Responsive dark theme
- Seed data button when table is empty
- Deployed via GitHub Pages

## Deployment

Push to `main` to trigger the GitHub Actions workflow. Set `VITE_AIRTABLE_TOKEN` and `VITE_BASE_ID` as repository secrets.

## Stack

- React 18 (Vite)
- Airtable REST API
- SheetJS (xlsx)
- GitHub Pages
