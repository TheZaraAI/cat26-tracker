#!/usr/bin/env node
/**
 * CAT26 Airtable Setup Script
 *
 * Works with the EXISTING Airtable base (appbH0ung2ZJqkZOf).
 * Seeds initiative records into the "Initiatives" table and creates
 * the "Subtasks" table if it does not already exist.
 *
 * Usage:
 *   AIRTABLE_TOKEN=pat... node scripts/setup-airtable.js
 *
 * The script reads from .env in the project root if present.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load .env manually (no external deps)
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "..", ".env");
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env not found — rely on exported vars
  }
}

loadEnv();

const TOKEN = process.env.AIRTABLE_TOKEN || process.env.VITE_AIRTABLE_TOKEN;
const BASE_ID = process.env.VITE_BASE_ID || "appbH0ung2ZJqkZOf";

if (!TOKEN) {
  console.error(
    "Error: AIRTABLE_TOKEN (or VITE_AIRTABLE_TOKEN) must be set.\n" +
      "Export it or add it to .env in the project root."
  );
  process.exit(1);
}

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function airtableFetch(path, options = {}) {
  const url = `https://api.airtable.com/v0${path}`;
  const res = await fetch(url, { ...options, headers: { ...HEADERS, ...options.headers } });
  const body = await res.json();
  if (!res.ok) {
    console.error(`Airtable API error (${res.status}):`, JSON.stringify(body, null, 2));
    throw new Error(`Airtable ${res.status}`);
  }
  return body;
}

// ---------------------------------------------------------------------------
// 1. Verify Base Access
// ---------------------------------------------------------------------------
async function verifyBase() {
  console.log(`Verifying access to base ${BASE_ID}...`);
  const body = await airtableFetch(`/meta/bases/${BASE_ID}/tables`);
  const table = body.tables.find((t) => t.name === "Initiatives");
  if (!table) {
    throw new Error('Table "Initiatives" not found in base. Available tables: ' +
      body.tables.map((t) => t.name).join(", "));
  }
  console.log(`  Found table "${table.name}" (${table.id})`);
  console.log(`  Fields: ${table.fields.map((f) => f.name).join(", ")}`);

  const subtasksTable = body.tables.find((t) => t.name === "Subtasks");
  return { initiativesTable: table, subtasksTable, allTables: body.tables };
}

// ---------------------------------------------------------------------------
// 2. Create Subtasks Table
// ---------------------------------------------------------------------------
async function createSubtasksTable() {
  console.log('\nCreating "Subtasks" table...');
  const body = await airtableFetch(`/meta/bases/${BASE_ID}/tables`, {
    method: "POST",
    body: JSON.stringify({
      name: "Subtasks",
      description: "Subtasks for CAT26 initiatives",
      fields: [
        {
          name: "Name",
          type: "singleLineText",
          description: "Subtask name",
        },
        {
          name: "Parent Initiative",
          type: "singleLineText",
          description: "Record ID of the parent initiative",
        },
        {
          name: "Status",
          type: "singleSelect",
          options: {
            choices: [
              { name: "Not Started", color: "yellowLight2" },
              { name: "In Progress", color: "blueLight2" },
              { name: "On Hold", color: "redLight2" },
              { name: "Completed", color: "greenLight2" },
            ],
          },
        },
        {
          name: "DRI",
          type: "singleLineText",
          description: "Directly Responsible Individual",
        },
        {
          name: "Notes",
          type: "multilineText",
        },
        {
          name: "Due Date",
          type: "date",
          options: {
            dateFormat: { name: "iso" },
          },
        },
      ],
    }),
  });

  console.log(`  Created table "${body.name}" (${body.id})`);
  console.log(`  Fields: ${body.fields.map((f) => f.name).join(", ")}`);
  return body;
}

// ---------------------------------------------------------------------------
// 3. Seed Records (uses actual Airtable field names)
// ---------------------------------------------------------------------------
const SEED_RECORDS = [
  {
    "Project Name": "Evidence pipeline + AI detection integration",
    Workstream: "TA50", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-06", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Lightweight segmentation model for local inference",
    Notes: "Photo upload S3 + SHA-256 hash, AI model top-3 categories with confidence scores, perceptual hash dedup, signed URL generation",
  },
  {
    "Project Name": "Web app MVP + end-to-end submission flow",
    Workstream: "TA50", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-09", DRI: "", "Days Needed": 3,
    "Stretch Goals": "iOS/Android browser support",
    Notes: "Mobile browser UI, photo capture \u2192 AI detection \u2192 human confirmation \u2192 DB submission, fraud flag endpoint for supervisors",
  },
  {
    "Project Name": "Readiness aggregation + packing list engine",
    Workstream: "TA50", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-13", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Commander dashboard heatmap view",
    Notes: "Soldier \u2192 Squad \u2192 Plt \u2192 Company rollup, readiness % vs. configurable packing list, deficiency count + severity classification",
  },
  {
    "Project Name": "Report export \u2014 PDF and CSV",
    Workstream: "TA50", Priority: "High", Status: "Not Started",
    "Target Date": "2026-05-14", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Searchable photo archive with date-range queries",
    Notes: "PDF + CSV export from formation readiness data; fallback to CSV-only if time constrained before eval",
  },
  {
    "Project Name": "Pre-process demo videos + validate VLM captioner",
    Workstream: "Video RAG", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-09", DRI: "", "Days Needed": 2,
    "Stretch Goals": "",
    Notes: "LLaVA vs GPT-4o-mini decision on 20-30 UCF sample frames; pgvector vs Milvus decision; must pre-process all demo videos before CAT26 Day 1 (May 10)",
  },
  {
    "Project Name": "Frame classifier + VLM captioner integrated",
    Workstream: "Video RAG", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-11", DRI: "", "Days Needed": 2,
    "Stretch Goals": "GroundingDINO open-vocabulary detection",
    Notes: "YOLOv8 classification into pipeline, category labels written to Postgres, VLM captions stored with frame metadata, metadata filtering live (time/source/category)",
  },
  {
    "Project Name": "RAG chat interface + clip retrieval working",
    Workstream: "Video RAG", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-13", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Multi-turn conversation history",
    Notes: "Streamlit or SKOPE RAG interface, ranked results with thumbnails, 10-sec clip playback via FFmpeg \u00b110s, confidence score display and threshold slider",
  },
  {
    "Project Name": "Criminal investigations use case (UC1) demo-ready",
    Workstream: "Video RAG", Priority: "Critical", Status: "Not Started",
    "Target Date": "2026-05-14", DRI: "", "Days Needed": 2,
    "Stretch Goals": "License plate matching",
    Notes: "Hero demo use case: person + vehicle description search, cross-video entity matching (appearance-based not biometric), temporal filtering, confidence threshold tuning",
  },
  {
    "Project Name": "Force protection use case (UC2) + performance eval",
    Workstream: "Video RAG", Priority: "High", Status: "Not Started",
    "Target Date": "2026-05-14", DRI: "", "Days Needed": 1,
    "Stretch Goals": "Real-time alerting (CAT27 requirement)",
    Notes: "Gate/perimeter activity log, after-hours temporal filter, frame relevance \u226580%, classification \u226590%, query latency \u22645s for \u2264500 video dataset \u2014 document all metrics",
  },
  {
    "Project Name": "Detainee ops \u2014 Whisper ASR (stretch goal)",
    Workstream: "Video RAG", Priority: "Medium", Status: "Not Started",
    "Target Date": "2026-05-23", DRI: "", "Days Needed": 3,
    "Stretch Goals": "Multimodal visual + audio combined query",
    Notes: "faster-whisper ASR integration, transcript chunks stored + embedded in vector DB, keyword search over spoken content (fight, escape); descope gracefully if data or time unavailable",
  },
];

async function seedData() {
  console.log("Seeding 10 initiative records...");
  const records = SEED_RECORDS.map((fields) => ({ fields }));
  const body = await airtableFetch(`/${BASE_ID}/Initiatives`, {
    method: "POST",
    body: JSON.stringify({ records }),
  });
  console.log(`  Created ${body.records.length} records.`);
  return body.records;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== CAT26 Airtable Setup ===\n");
  console.log(`Using existing base: ${BASE_ID}\n`);

  const { subtasksTable } = await verifyBase();

  // Create Subtasks table if it doesn't exist
  if (subtasksTable) {
    console.log(`\n  "Subtasks" table already exists (${subtasksTable.id}). Skipping creation.`);
  } else {
    await createSubtasksTable();
  }

  const args = process.argv.slice(2);
  if (args.includes("--seed")) {
    await seedData();
  } else {
    console.log("\n  Base verified. To seed default data, run:");
    console.log("    npm run setup -- --seed");
  }

  console.log("\n=== Setup Complete ===");
  console.log(`\nEnsure your .env contains:\n`);
  console.log(`  VITE_AIRTABLE_TOKEN=<your-token>`);
  console.log(`  VITE_BASE_ID=${BASE_ID}`);
  console.log(`\nThen run: npm run dev`);
}

main().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
