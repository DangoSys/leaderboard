import type { Run } from "../../types/report";
import Select from "../../components/ui/Select";
import RunLink from "../../components/reports/RunLink";
import OperatorBreakdown from "../../components/reports/OperatorBreakdown";
import { formatCycles } from "../../lib/metrics";
import { time } from "../../lib/format";

export default function RunAnalysis({
  runs,
  selectedId,
  selectedModel,
  onSelectModel,
  onSelectRun,
}: {
  runs: Run[];
  selectedId: string;
  selectedModel: string;
  onSelectModel: (name: string) => void;
  onSelectRun: (id: string) => void;
}) {
  const run = selectedId
    ? runs.find((candidate) => candidate.id === selectedId)!
    : runs.at(-1)!;
  const modelName = selectedModel || run.models[0].name;
  const model = run.models.find((candidate) => candidate.name === modelName)!;
  return (
    <>
      <h1>单次分析</h1>
      <div className="filters">
        <Select
          label="运行"
          value={run.id}
          options={runs.toReversed().map((candidate) => ({
            value: candidate.id,
            label: `${time(candidate.timestamp)} UTC · ${candidate.chip} · ${candidate.branch} · ${candidate.commit.slice(0, 7)}`,
          }))}
          onChange={onSelectRun}
        />
        <Select
          label="模型"
          value={modelName}
          options={run.models.map((candidate) => ({
            value: candidate.name,
            label: candidate.name,
          }))}
          onChange={onSelectModel}
        />
      </div>
      <div className="run-metadata">
        <span>
          {run.chip} · {run.backend} · {run.branch}
        </span>
        <RunLink run={run} />
        {run.provenance?.source_dirty && (
          <span className="notice">包含未提交修改</span>
        )}
        {model.trace_url && (
          <a href={model.trace_url} download>
            下载原始 trace
          </a>
        )}
      </div>
      <dl className="measurements">
        <div>
          <dt>状态</dt>
          <dd>{model.status}</dd>
        </div>
        <div>
          <dt>总 cycles</dt>
          <dd>{model.cycles === null ? "—" : formatCycles(model.cycles)}</dd>
        </div>
        <div>
          <dt>耗时</dt>
          <dd>
            {model.cycles === null
              ? "—"
              : `${((model.cycles / run.clock_hz) * 1000).toFixed(3)} ms`}
          </dd>
        </div>
        {model.accuracy !== null && (
          <div>
            <dt>{model.accuracy_metric}</dt>
            <dd>{(model.accuracy * 100).toFixed(2)}%</dd>
          </div>
        )}
      </dl>
      <OperatorBreakdown key={modelName} run={run} model={model} />
      <details className="run-info">
        <summary>运行信息</summary>
        <dl>
          <dt>配置</dt>
          <dd>{run.config_hash}</dd>
          <dt>时钟</dt>
          <dd>{run.clock_hz.toLocaleString()} Hz</dd>
          <dt>输入</dt>
          <dd>{model.dataset_hash}</dd>
          {run.provenance && (
            <>
              <dt>执行范围</dt>
              <dd>
                {run.provenance.trace_scopes.executed} /{" "}
                {run.provenance.trace_scopes.compiled} 个插桩区间
              </dd>
            </>
          )}
        </dl>
      </details>
    </>
  );
}
