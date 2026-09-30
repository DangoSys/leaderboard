import { Activity } from "lucide-react";
import type { Run, ModelResult } from "../../types/report";
import { formatCycles } from "../../lib/metrics";
import { BarChart3, Clock3, Layers3 } from "lucide-react";

export default function ModelStats({
  selected,
  selectedModel,
  activeModel,
  historyChange,
}: {
  selected: Run;
  selectedModel: ModelResult;
  activeModel: string;
  historyChange: number | null;
}) {
  return (
    <section className="stats">
      <div className="stat">
        <div className="stat-label">
          Selected model cycles <Activity size={16} />
        </div>
        <strong>
          {selectedModel.cycles === null
            ? "—"
            : formatCycles(selectedModel.cycles)}
        </strong>
        <span className="stat-caption">
          {activeModel}{" "}
          <span className={`status ${selectedModel.status}`}>
            {selectedModel.status.replace("_", " ")}
          </span>
        </span>
      </div>
      <div className="stat">
        <div className="stat-label">
          Change since first passing run <BarChart3 size={16} />
        </div>
        <strong
          className={
            historyChange === null
              ? ""
              : historyChange > 0
                ? "red-text"
                : "green-text"
          }
        >
          {historyChange === null
            ? "—"
            : `${historyChange > 0 ? "+" : ""}${historyChange.toFixed(1)}%`}
        </strong>
        <span className="stat-caption">
          Same model and measurement conditions
        </span>
      </div>
      <div className="stat">
        <div className="stat-label">
          Model latency <Clock3 size={16} />
        </div>
        <strong>
          {selectedModel.cycles === null
            ? "—"
            : ((selectedModel.cycles / selected.clock_hz) * 1000).toFixed(2)}
          <em>ms</em>
        </strong>
        <span className="stat-caption">
          At {(selected.clock_hz / 1e6).toFixed(0)} MHz · measured trace span
        </span>
      </div>
      <div className="stat">
        <div className="stat-label">
          Model results <Layers3 size={16} />
        </div>
        <strong>
          {selected.models.filter((model) => model.status === "pass").length}
          <em>/ {selected.models.length}</em>
        </strong>
        <span className="stat-caption">Passed in the selected run</span>
      </div>
    </section>
  );
}
