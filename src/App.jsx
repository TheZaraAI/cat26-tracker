import { useState, useMemo, useRef, useEffect } from "react";
import { isConfigured } from "./api/airtable";
import { useAirtable } from "./hooks/useAirtable";
import { exportToExcel } from "./utils/exportExcel";
import { formatTime } from "./utils/dateHelpers";
import ExecDashboard from "./components/ExecDashboard";
import WorkstreamTabs from "./components/WorkstreamTabs";
import FilterBar from "./components/FilterBar";
import InitiativeTable from "./components/InitiativeTable";
import EditModal from "./components/EditModal";
import SuccessMarkers from "./components/SuccessMarkers";

// ---------- Setup screen when env vars are missing ----------
function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>CAT26 Milestone Tracker</h1>
        <p>Configuration required. Set the following environment variables:</p>
        <pre>
{`VITE_AIRTABLE_TOKEN=pat...
VITE_BASE_ID=app...`}
        </pre>
        <p>
          1. Copy <code>.env.example</code> to <code>.env</code><br />
          2. Run <code>npm run setup</code> to create the Airtable base<br />
          3. Add the <code>VITE_BASE_ID</code> from setup output to <code>.env</code><br />
          4. Restart the dev server
        </p>
      </div>
    </div>
  );
}

// ---------- Add Dropdown ----------
function AddDropdown({ onAddMilestone, onAddSubtask }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="add-dropdown-wrap" ref={ref}>
      <button className="btn btn-primary" onClick={() => setOpen(!open)}>
        + Add
      </button>
      {open && (
        <div className="add-dropdown-menu">
          <button
            className="add-dropdown-item"
            onClick={() => { setOpen(false); onAddMilestone(); }}
          >
            Add Milestone
          </button>
          <button
            className="add-dropdown-item"
            onClick={() => { setOpen(false); onAddSubtask(); }}
          >
            Add Subtask
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- Main App ----------
export default function App() {
  if (!isConfigured()) return <SetupScreen />;

  const {
    initiatives,
    subtasks,
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
    teamMembers,
  } = useAirtable();

  const [activeTab, setActiveTab] = useState("All");
  const [filters, setFilters] = useState({ priority: new Set(), status: new Set() });
  const [editRecord, setEditRecord] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [showSuccessMarkers, setShowSuccessMarkers] = useState(false);

  // Filter initiatives
  const filtered = useMemo(() => {
    let list = initiatives;
    if (activeTab !== "All") {
      list = list.filter((i) => i.Workstream === activeTab);
    }
    if (filters.priority.size > 0) {
      list = list.filter((i) => filters.priority.has(i.Priority));
    }
    if (filters.status.size > 0) {
      list = list.filter((i) => filters.status.has(i.Status));
    }
    return list;
  }, [initiatives, activeTab, filters]);

  // Group by workstream for table display
  const ta50 = filtered.filter((i) => i.Workstream === "TA50");
  const videoRag = filtered.filter((i) => i.Workstream === "Video RAG");

  function handleSaveEdit(fields) {
    return updateRecord(editRecord.id, fields);
  }

  function handleSaveNew(fields) {
    return addRecord(fields);
  }

  return (
    <div className="app">
      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <span>API Error: {error}</span>
          <button onClick={dismissError}>&times;</button>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1>CAT26 Milestone Tracker</h1>
          <span className="header-subtitle">75th IC Det 5/6 | May 3-16, 2026 | Austin TX</span>
        </div>
        <div className="header-right">
          <span className="sync-time">
            Synced {formatTime(lastSync)}
          </span>
          <button className="btn btn-secondary" onClick={refresh} disabled={loading}>
            {loading ? "..." : "Refresh"}
          </button>
          <button className="btn btn-secondary" onClick={() => exportToExcel(initiatives)}>
            Export Excel
          </button>
          <button className="btn btn-accent" onClick={() => setShowSuccessMarkers(true)}>
            Success Markers
          </button>
          <AddDropdown
            onAddMilestone={() => setShowAdd(true)}
            onAddSubtask={() => setShowAddSubtask(true)}
          />
        </div>
      </header>

      {/* Success Markers page */}
      {showSuccessMarkers && (
        <SuccessMarkers onBack={() => setShowSuccessMarkers(false)} />
      )}

      {/* Dashboard — hide when viewing success markers */}
      {!showSuccessMarkers && <ExecDashboard initiatives={initiatives} />}

      {/* Tabs — hide when viewing success markers */}
      {!showSuccessMarkers && <WorkstreamTabs
        active={activeTab}
        onChange={setActiveTab}
        initiatives={initiatives}
      />}

      {!showSuccessMarkers && <>
      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Empty state */}
      {!loading && initiatives.length === 0 && (
        <div className="empty-state">
          <p>No milestones found.</p>
          <button className="btn btn-primary" onClick={seed}>
            Seed default data
          </button>
        </div>
      )}

      {/* Tables */}
      {(activeTab === "All" || activeTab === "TA50") && (
        <InitiativeTable
          title="TA50"
          initiatives={ta50}
          pendingIds={pendingIds}
          onStatusChange={updateStatus}
          onEdit={setEditRecord}
          subtasks={subtasks}
          onAddSubtask={addSubtask}
          onUpdateSubtask={updateSubtaskRecord}
          onDeleteSubtask={removeSubtask}
        />
      )}
      {(activeTab === "All" || activeTab === "Video RAG") && (
        <InitiativeTable
          title="Video RAG"
          initiatives={videoRag}
          pendingIds={pendingIds}
          onStatusChange={updateStatus}
          onEdit={setEditRecord}
          subtasks={subtasks}
          onAddSubtask={addSubtask}
          onUpdateSubtask={updateSubtaskRecord}
          onDeleteSubtask={removeSubtask}
        />
      )}
      </>}

      {/* Edit modal */}
      {editRecord && (
        <EditModal
          record={editRecord}
          onSave={handleSaveEdit}
          onDelete={removeRecord}
          onClose={() => setEditRecord(null)}
          isNew={false}
          teamMembers={teamMembers}
          subtasks={subtasks}
          onAddSubtask={addSubtask}
          onUpdateSubtask={updateSubtaskRecord}
          onDeleteSubtask={removeSubtask}
        />
      )}

      {/* Add milestone modal */}
      {showAdd && (
        <EditModal
          record={null}
          onSave={handleSaveNew}
          onDelete={() => {}}
          onClose={() => setShowAdd(false)}
          isNew={true}
          teamMembers={teamMembers}
        />
      )}

      {/* Add subtask modal */}
      {showAddSubtask && (
        <EditModal
          record={null}
          onSave={() => {}}
          onDelete={() => {}}
          onClose={() => setShowAddSubtask(false)}
          isNew={true}
          mode="subtask"
          milestones={initiatives}
          teamMembers={teamMembers}
          onAddSubtask={addSubtask}
        />
      )}
    </div>
  );
}
