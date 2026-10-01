import { useState } from "react";
import type { Run } from "../../types/report";
import Select from "../../components/ui/Select";
import PerformanceTrend from "../../components/charts/PerformanceTrend";
import { comparisonKey, formatCycles } from "../../lib/metrics";
import { time, unique } from "../../lib/format";

export default function Trends({
  runs,
  onSelectRun,
}: {
  runs: Run[];
  onSelectRun: (id: string, modelName: string) => void;
}) {
  const [chip, setChip] = useState(runs.at(-1)!.chip);
  const [branch, setBranch] = useState(runs.at(-1)!.branch);
  const [modelName, setModelName] = useState(runs.at(-1)!.models[0].name);
  const [seriesKey, setSeriesKey] = useState("");
  const chipRuns = runs.filter((run) => run.chip === chip);
  const filtered = chipRuns.filter((run) => run.branch === branch);
  const groups = new Map<string, Run[]>();
  for (const run of filtered) {
    const model = run.models.find((candidate) => candidate.name === modelName);
    if (!model) continue;
    const key = comparisonKey(run, model);
    const group = groups.get(key);
    if (group) group.push(run);
    else groups.set(key, [run]);
  }
  const activeKey = seriesKey || [...groups.keys()].at(-1)!;
  const series = groups.get(activeKey)!;
  return (
    <>
      <h1>趋势</h1>
      <div className="filters">
        <Select
          label="Chip"
          value={chip}
          options={unique(runs.map((run) => run.chip)).map((value) => ({
            value,
            label: value,
          }))}
          onChange={(value) => {
            const latest = runs.findLast((run) => run.chip === value)!;
            setChip(value);
            setBranch(latest.branch);
            setModelName(latest.models[0].name);
            setSeriesKey("");
          }}
        />
        <Select
          label="分支"
          value={branch}
          options={unique(chipRuns.map((run) => run.branch)).map((value) => ({
            value,
            label: value,
          }))}
          onChange={(value) => {
            const latest = chipRuns.findLast((run) => run.branch === value)!;
            setBranch(value);
            setModelName(latest.models[0].name);
            setSeriesKey("");
          }}
        />
        <Select
          label="模型"
          value={modelName}
          options={unique(
            filtered.flatMap((run) => run.models.map((model) => model.name)),
          ).map((value) => ({ value, label: value }))}
          onChange={(value) => {
            setModelName(value);
            setSeriesKey("");
          }}
        />
        {groups.size > 1 && (
          <Select
            label="测量配置"
            value={activeKey}
            options={[...groups.entries()].map(([value, group]) => ({
              value,
              label: `${group[0].backend} · ${group[0].config_hash.slice(0, 8)} · ${(group[0].clock_hz / 1e6).toFixed(0)} MHz · ${group.length} 次运行`,
            }))}
            onChange={setSeriesKey}
          />
        )}
      </div>
      <PerformanceTrend runs={series} modelName={modelName} />
      <p className="footnote">
        同一曲线使用相同测量配置。日期为 UTC；点击运行查看详细分析。
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>运行时间（UTC）</th>
              <th>Commit</th>
              <th>Cycles</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {series.toReversed().map((run) => {
              const model = run.models.find(
                (candidate) => candidate.name === modelName,
              )!;
              return (
                <tr key={run.id}>
                  <td>
                    <button
                      className="text-button"
                      onClick={() => onSelectRun(run.id, modelName)}
                    >
                      {time(run.timestamp)}
                    </button>
                  </td>
                  <td>{run.commit.slice(0, 7)}</td>
                  <td>
                    {model.cycles === null ? "—" : formatCycles(model.cycles)}
                  </td>
                  <td>{model.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
