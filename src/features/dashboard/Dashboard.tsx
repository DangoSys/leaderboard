import { useState } from "react";
import type { Run } from "../../types/report";
import {
  comparisonKey,
  formatCycles,
  percentageChange,
} from "../../lib/metrics";
import { date, time, unique } from "../../lib/format";
import Select from "../../components/ui/Select";
import RunLink from "../../components/reports/RunLink";
import OperatorBreakdown from "../../components/reports/OperatorBreakdown";
import RunComparison from "../../components/reports/RunComparison";
import ModelStats from "../../components/reports/ModelStats";
import PerformanceTrend from "../../components/charts/PerformanceTrend";
const base = import.meta.env.BASE_URL;
import {
  Box,
  ChevronRight,
  Download,
  GitBranch,
  ListFilter,
  RefreshCw,
} from "lucide-react";

export default function Dashboard({
  runs,
  demo,
}: {
  runs: Run[];
  demo: boolean;
}) {
  const [chip, setChip] = useState(runs[0].chip);
  const [branch, setBranch] = useState("all");
  const [backend, setBackend] = useState("all");
  const [modelName, setModelName] = useState(runs[0].models[0].name);
  const [seriesKey, setSeriesKey] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const filtered = runs
    .filter(
      (run) =>
        run.chip === chip &&
        (branch === "all" || run.branch === branch) &&
        (backend === "all" || run.backend === backend),
    )
    .toSorted(
      (a, b) =>
        Date.parse(a.timestamp) - Date.parse(b.timestamp) ||
        a.id.localeCompare(b.id),
    );
  const modelNames = unique(
    filtered.flatMap((run) => run.models.map((model) => model.name)),
  );
  const activeModel = modelNames.includes(modelName)
    ? modelName
    : modelNames[0];
  const groups = new Map<string, Run[]>();
  for (const run of filtered) {
    const model = run.models.find((model) => model.name === activeModel);
    if (!model) continue;
    const key = comparisonKey(run, model);
    groups.set(key, [...(groups.get(key) ?? []), run]);
  }
  const activeKey = groups.has(seriesKey)
    ? seriesKey
    : [...groups.keys()].at(-1);
  const series = activeKey ? groups.get(activeKey)! : [];
  const selected = series.find((run) => run.id === selectedId) ?? series.at(-1);
  const selectedModel = selected?.models.find(
    (model) => model.name === activeModel,
  );
  const successful = series.filter(
    (run) =>
      run.models.find((model) => model.name === activeModel)?.status === "pass",
  );
  const firstModel = successful[0]?.models.find(
    (model) => model.name === activeModel,
  );
  const historyChange =
    selectedModel?.status === "pass" && firstModel
      ? percentageChange(firstModel.cycles!, selectedModel.cycles!)
      : null;
  const reset = () => {
    setBranch("all");
    setBackend("all");
    setSeriesKey("");
    setSelectedId("");
  };
  const download = () => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(selected, null, 2)], {
        type: "application/json",
      }),
    );
    link.download = `${selected!.id}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <>
      <section className="filters">
        <div className="filter-icon">
          <ListFilter size={18} />
        </div>
        <Select
          label="Chip"
          value={chip}
          options={unique(runs.map((run) => run.chip)).map((value) => ({
            value,
            label: value,
          }))}
          onChange={(value) => {
            setChip(value);
            reset();
          }}
        />
        <Select
          label="Branch"
          value={branch}
          options={[
            { value: "all", label: "All branches" },
            ...unique(
              runs.filter((run) => run.chip === chip).map((run) => run.branch),
            ).map((value) => ({ value, label: value })),
          ]}
          onChange={(value) => {
            setBranch(value);
            setSelectedId("");
          }}
        />
        <Select
          label="Backend"
          value={backend}
          options={[
            { value: "all", label: "All backends" },
            ...unique(
              runs.filter((run) => run.chip === chip).map((run) => run.backend),
            ).map((value) => ({ value, label: value })),
          ]}
          onChange={(value) => {
            setBackend(value);
            setSelectedId("");
          }}
        />
        <button className="text-button reset" onClick={reset}>
          <RefreshCw size={13} /> Reset
        </button>
      </section>
      {!selected || !selectedModel ? (
        <section className="panel empty">
          <ListFilter size={32} />
          <h2>No matching reports</h2>
          <p>Change the filters to see recorded runs.</p>
          <button className="primary-button" onClick={reset}>
            Reset filters
          </button>
        </section>
      ) : (
        <>
          <div className="section-title">
            <div>
              <span className="chip-tag">
                <Box size={13} />
                {chip}
              </span>
              <span className="muted"> / </span>
              <span>Model performance</span>
            </div>
            <span className="muted">{filtered.length} runs recorded</span>
          </div>
          <ModelStats
            selected={selected}
            selectedModel={selectedModel}
            activeModel={activeModel}
            historyChange={historyChange}
          />
          <PerformanceTrend
            runs={series}
            modelNames={modelNames}
            activeModel={activeModel}
            seriesKey={activeKey!}
            seriesOptions={[...groups.entries()].map(([key, group]) => ({
              value: key,
              label: `${group[0].backend} · config ${group[0].config_hash.slice(0, 8)} · ${(group[0].clock_hz / 1e6).toFixed(0)} MHz · ${group.length} runs · input ${group[0].models.find((model) => model.name === activeModel)!.workload_hash.slice(0, 8)}`,
            }))}
            demo={demo}
            onModelChange={(name) => {
              setModelName(name);
              setSelectedId("");
            }}
            onSeriesChange={(key) => {
              setSeriesKey(key);
              setSelectedId("");
            }}
          />
          <div className="detail-heading" id="runs">
            <div>
              <h2>Run details</h2>
              <p>Inspect the measurement behind the trend.</p>
            </div>
            <div className="detail-actions">
              <Select
                label="Run"
                value={selected.id}
                options={series.toReversed().map((run) => ({
                  value: run.id,
                  label: `${date(run.timestamp)} · ${run.commit.slice(0, 7)} · ${run.models.find((model) => model.name === activeModel)!.status}`,
                }))}
                onChange={setSelectedId}
              />
              <button className="secondary-button" onClick={download}>
                <Download size={15} /> Export JSON
              </button>
            </div>
          </div>
          <div className="run-metadata">
            <RunLink run={selected} />
            <span>
              <GitBranch size={13} />
              {selected.branch}
            </span>
            <span>{time(selected.timestamp)} UTC</span>
            <span>config {selected.config_hash.slice(0, 8)}</span>
            {selectedModel.accuracy !== null && (
              <span>
                {selectedModel.accuracy_metric}:{" "}
                {(selectedModel.accuracy * 100).toFixed(2)}%
              </span>
            )}
            {selectedModel.trace_url && (
              <a href={`${base}${selectedModel.trace_url}`} download>
                <Download size={13} />
                Raw trace
              </a>
            )}
          </div>
          <div className="detail-grid">
            <OperatorBreakdown
              key={`${selected.id}-${activeModel}`}
              run={selected}
              model={selectedModel}
            />
            <RunComparison
              key={`${activeKey}-${activeModel}`}
              runs={series}
              modelName={activeModel}
            />
          </div>
          <section className="panel run-results">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">COMPLETE RUN</div>
                <h2>All model results</h2>
              </div>
              <span className="muted">{selected.id}</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Cycles</th>
                    <th>Accuracy</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.models.map((model) => (
                    <tr key={model.name}>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => setModelName(model.name)}
                        >
                          {model.name}
                          <ChevronRight size={12} />
                        </button>
                      </td>
                      <td>
                        <span className={`status ${model.status}`}>
                          {model.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="numeric">
                        {model.cycles === null
                          ? "—"
                          : formatCycles(model.cycles)}
                      </td>
                      <td>
                        {model.accuracy === null
                          ? "—"
                          : `${(model.accuracy * 100).toFixed(2)}% ${model.accuracy_metric}`}
                      </td>
                      <td className="muted">
                        {model.error ??
                          `${model.operators.length} trace regions`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
