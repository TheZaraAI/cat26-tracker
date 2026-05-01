import { useState, useMemo } from "react";
import { isConfigured } from "./api/airtable";
import { useAirtable } from "./hooks/useAirtable";
import { exportToExcel } from "./utils/exportExcel";
import { formatTime } from "./utils/dateHelpers";
import ExecDashboard from "./components/ExecDashboard";
import WorkstreamTabs from "./components/WorkstreamTabs";
import FilterBar from "./components/FilterBar";
import InitiativeTable from "./components/InitiativeTable";
import EditModal from "./components/EditModal";

// ---------- Setup screen when env vars are missing ----------
function SetupScreen() {
  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1>CAT26 Initiative Tracker</h1>
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

// ---------- Main App ----------
export default function App() {
  if (!isConfigured()) return <SetupScreen />;

  const {
    initiatives,
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
  } = useAirtable();

  const [activeTab, setActiveTab] = useState("All");
  const [filters, setFilters] = useState({ priority: new Set(), status: new Set() });
  const [editRecord, setEditRecord] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

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
          <h1>CAT26 Initiative Tracker</h1>
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
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <ExecDashboard initiatives={initiatives} />

      {/* Tabs */}
      <WorkstreamTabs
        active={activeTab}
        onChange={setActiveTab}
        initiatives={initiatives}
      />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Empty state */}
      {!loading && initiatives.length === 0 && (
        <div className="empty-state">
          <p>No initiatives found.</p>
          <button className="btn btn-primary" onClick={seed}>
            Seed default data
          </button>
        </div>
      )}

      {/* Tables */}
      {(activeTab === "All" || activeTab === "TA50") && (
        <InitiativeTable
          title="TA50 \u2014 Sentinel Inventory"
          initiatives={ta50}
          pendingIds={pendingIds}
          onStatusChange={updateStatus}
          onEdit={setEditRecord}
        />
      )}
      {(activeTab === "All" || activeTab === "Video RAG") && (
        <InitiativeTable
          title="Video RAG \u2014 Multimodal Intelligence"
          initiatives={videoRag}
          pendingIds={pendingIds}
          onStatusChange={updateStatus}
          onEdit={setEditRecord}
        />
      )}

      {/* Edit modal */}
      {editRecord && (
        <EditModal
          record={editRecord}
          onSave={handleSaveEdit}
          onDelete={removeRecord}
          onClose={() => setEditRecord(null)}
          isNew={false}
        />
      )}

      {/* Add modal */}
      {showAdd && (
        <EditModal
          record={null}
          onSave={handleSaveNew}
          onDelete={() => {}}
          onClose={() => setShowAdd(false)}
          isNew={true}
        />
      )}
    </div>
  );
}
