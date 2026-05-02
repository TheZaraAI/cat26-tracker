import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchMilestones,
  updateMilestone,
  createMilestone,
  deleteMilestone,
  seedRecords,
  fetchSubtasks,
  createSubtask as apiCreateSubtask,
  updateSubtask as apiUpdateSubtask,
  deleteSubtask as apiDeleteSubtask,
  fetchTeamMembers,
} from "../api/airtable";

const POLL_INTERVAL = 30_000; // 30 seconds

const SEED_DATA = [
  {
    Name: "Evidence pipeline + AI detection integration",
    Workstream: "TA50", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-06", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Lightweight segmentation model for local inference",
    Notes: "Photo upload S3 + SHA-256 hash, AI model top-3 categories with confidence scores, perceptual hash dedup, signed URL generation",
  },
  {
    Name: "Web app MVP + end-to-end submission flow",
    Workstream: "TA50", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-09", DRI: "", "Days Needed": 3,
    "Stretch Goals": "iOS/Android browser support",
    Notes: "Mobile browser UI, photo capture \u2192 AI detection \u2192 human confirmation \u2192 DB submission, fraud flag endpoint for supervisors",
  },
  {
    Name: "Readiness aggregation + packing list engine",
    Workstream: "TA50", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-13", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Commander dashboard heatmap view",
    Notes: "Soldier \u2192 Squad \u2192 Plt \u2192 Company rollup, readiness % vs. configurable packing list, deficiency count + severity classification",
  },
  {
    Name: "Report export \u2014 PDF and CSV",
    Workstream: "TA50", Priority: "P2", Status: "Not started",
    "Target Date": "2026-05-14", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Searchable photo archive with date-range queries",
    Notes: "PDF + CSV export from formation readiness data; fallback to CSV-only if time constrained before eval",
  },
  {
    Name: "Pre-process demo videos + validate VLM captioner",
    Workstream: "Video RAG", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-09", DRI: "", "Days Needed": 2,
    "Stretch Goals": "",
    Notes: "LLaVA vs GPT-4o-mini decision on 20-30 UCF sample frames; pgvector vs Milvus decision; must pre-process all demo videos before CAT26 Day 1 (May 10)",
  },
  {
    Name: "Frame classifier + VLM captioner integrated",
    Workstream: "Video RAG", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-11", DRI: "", "Days Needed": 2,
    "Stretch Goals": "GroundingDINO open-vocabulary detection",
    Notes: "YOLOv8 classification into pipeline, category labels written to Postgres, VLM captions stored with frame metadata, metadata filtering live (time/source/category)",
  },
  {
    Name: "RAG chat interface + clip retrieval working",
    Workstream: "Video RAG", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-13", DRI: "", "Days Needed": 2,
    "Stretch Goals": "Multi-turn conversation history",
    Notes: "Streamlit or SKOPE RAG interface, ranked results with thumbnails, 10-sec clip playback via FFmpeg \u00b110s, confidence score display and threshold slider",
  },
  {
    Name: "Criminal investigations use case (UC1) demo-ready",
    Workstream: "Video RAG", Priority: "P1", Status: "Not started",
    "Target Date": "2026-05-14", DRI: "", "Days Needed": 2,
    "Stretch Goals": "License plate matching",
    Notes: "Hero demo use case: person + vehicle description search, cross-video entity matching (appearance-based not biometric), temporal filtering, confidence threshold tuning",
  },
  {
    Name: "Force protection use case (UC2) + performance eval",
    Workstream: "Video RAG", Priority: "P2", Status: "Not started",
    "Target Date": "2026-05-14", DRI: "", "Days Needed": 1,
    "Stretch Goals": "Real-time alerting (CAT27 requirement)",
    Notes: "Gate/perimeter activity log, after-hours temporal filter, frame relevance \u226580%, classification \u226590%, query latency \u22645s for \u2264500 video dataset \u2014 document all metrics",
  },
  {
    Name: "Detainee ops \u2014 Whisper ASR (stretch goal)",
    Workstream: "Video RAG", Priority: "P3", Status: "Not started",
    "Target Date": "2026-05-23", DRI: "", "Days Needed": 3,
    "Stretch Goals": "Multimodal visual + audio combined query",
    Notes: "faster-whisper ASR integration, transcript chunks stored + embedded in vector DB, keyword search over spoken content (fight, escape); descope gracefully if data or time unavailable",
  },
];

export function useAirtable() {
  const [initiatives, setInitiatives] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState(new Set());
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [initData, subtaskData, teamData] = await Promise.all([
        fetchMilestones(),
        fetchSubtasks().catch(() => []),
        fetchTeamMembers().catch(() => []),
      ]);
      setInitiatives(initData);
      setSubtasks(subtaskData);
      setTeamMembers(teamData);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  const dismissError = useCallback(() => setError(null), []);

  // Optimistic status update
  const updateStatus = useCallback(async (recordId, newStatus) => {
    setPendingIds((prev) => new Set(prev).add(recordId));

    // Optimistic local update
    setInitiatives((prev) =>
      prev.map((i) => (i.id === recordId ? { ...i, Status: newStatus } : i))
    );

    try {
      const updated = await updateMilestone(recordId, { Status: newStatus });
      setInitiatives((prev) =>
        prev.map((i) => (i.id === recordId ? updated : i))
      );
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      // Revert -- re-fetch to get truth
      setError(err.message);
      await refresh();
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  }, [refresh]);

  // Full record update
  const updateRecord = useCallback(async (recordId, fields) => {
    setPendingIds((prev) => new Set(prev).add(recordId));
    try {
      const updated = await updateMilestone(recordId, fields);
      setInitiatives((prev) =>
        prev.map((i) => (i.id === recordId ? updated : i))
      );
      setLastSync(new Date());
      setError(null);
      return updated;
    } catch (err) {
      setError(err.message);
      await refresh();
      throw err;
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  }, [refresh]);

  // Create new record
  const addRecord = useCallback(async (fields) => {
    try {
      const created = await createMilestone(fields);
      setInitiatives((prev) => [...prev, created]);
      setLastSync(new Date());
      setError(null);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete record
  const removeRecord = useCallback(async (recordId) => {
    setPendingIds((prev) => new Set(prev).add(recordId));
    try {
      await deleteMilestone(recordId);
      setInitiatives((prev) => prev.filter((i) => i.id !== recordId));
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  }, []);

  // Seed default data
  const seed = useCallback(async () => {
    setLoading(true);
    try {
      const created = await seedRecords(SEED_DATA);
      setInitiatives(created);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- Subtask operations ----

  const addSubtask = useCallback(async (fields) => {
    try {
      const created = await apiCreateSubtask(fields);
      setSubtasks((prev) => [...prev, created]);
      setLastSync(new Date());
      setError(null);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateSubtaskRecord = useCallback(async (recordId, fields) => {
    try {
      const updated = await apiUpdateSubtask(recordId, fields);
      setSubtasks((prev) =>
        prev.map((s) => (s.id === recordId ? updated : s))
      );
      setLastSync(new Date());
      setError(null);
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const removeSubtask = useCallback(async (recordId) => {
    try {
      await apiDeleteSubtask(recordId);
      setSubtasks((prev) => prev.filter((s) => s.id !== recordId));
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    initiatives,
    subtasks,
    teamMembers,
    lastSync,
    loading,
    error,
    pendingIds,
    refresh,
    dismissError,
    updateStatus,
    updateRecord,
    addRecord,
    removeRecord,
    seed,
    addSubtask,
    updateSubtaskRecord,
    removeSubtask,
  };
}
