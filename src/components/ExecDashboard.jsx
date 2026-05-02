import StatCard from "./StatCard";
import { daysToEval } from "../utils/dateHelpers";

export default function ExecDashboard({ initiatives }) {
  const total = initiatives.length;
  const completed = initiatives.filter((i) => i.Status === "Closed").length;
  const inProgress = initiatives.filter((i) => i.Status === "In progress").length;
  const blocked = initiatives.filter((i) => i.Status === "Blocked").length;
  const days = daysToEval();

  return (
    <div className="exec-dashboard">
      <StatCard
        label="Total"
        value={total}
        icon={"\u25A0"}
        color="#9CA3AF"
      />
      <StatCard
        label="Closed"
        value={completed}
        total={total}
        icon={"\u2713"}
        color="#22C55E"
      />
      <StatCard
        label="In Progress"
        value={inProgress}
        total={total}
        icon={"\u25B6"}
        color="#3B82F6"
      />
      <StatCard
        label="Blocked"
        value={blocked}
        total={total}
        icon={"\u26A0"}
        color="#EF4444"
      />
      <StatCard
        label="Days to Eval"
        value={days}
        icon={"\u23F1"}
        color={days <= 3 ? "#EF4444" : days <= 7 ? "#F59E0B" : "#9CA3AF"}
      />
    </div>
  );
}
