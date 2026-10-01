import { useState } from "react";
import type { Run, ModelResult } from "../../types/report";
import { categoryColors, formatCycles } from "../../lib/metrics";

export default function OperatorBreakdown({
  run,
  model,
}: {
  run: Run;
  model: ModelResult;
}) {
  const [level, setLevel] = useState(0);
  const levels = ["buddy", "linalg", "buckyball"];
  const selected = model.operators.filter(
    (operator) => operator.level === level,
  );
  const categoryTotals = Object.entries(
    selected.reduce<Record<string, number>>((result, operator) => {
      result[operator.category] =
        (result[operator.category] ?? 0) + operator.cycles;
      return result;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const operatorSum = selected.reduce(
    (sum, operator) => sum + operator.cycles,
    0,
  );
  const operators = selected.toSorted((a, b) => b.cycles - a.cycles);
  return (
    <section className="panel breakdown">
      <div className="panel-heading">
        <h2>算子耗时</h2>
      </div>
      {model.status !== "pass" ? (
        <div className="empty-inline">
          <strong>{model.status.replace("_", " ")}</strong>
          <p>{model.error}</p>
        </div>
      ) : (
        <>
          <div
            className="distribution"
            role="img"
            aria-label={`Share of measured ${levels[level]} cycles`}
          >
            {categoryTotals.map(([category, cycles]) => (
              <div
                key={category}
                style={{
                  width: `${(cycles / operatorSum) * 100}%`,
                  background: categoryColors[category],
                }}
                title={`${category}: ${formatCycles(cycles)} cycles`}
              />
            ))}
          </div>
          <div className="legend">
            {categoryTotals.map(([category, cycles]) => (
              <div key={category}>
                <i style={{ background: categoryColors[category] }} />
                <span>{category}</span>
                <strong>{((cycles / operatorSum) * 100).toFixed(1)}%</strong>
              </div>
            ))}
          </div>
          <div className="table-toolbar">
            <span>{operators.length} 个操作</span>
            <label>
              层级{" "}
              <select
                value={level}
                onChange={(event) => setLevel(Number(event.target.value))}
              >
                {levels.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>操作</th>
                  <th>Cycles</th>
                  <th>调用次数</th>
                  <th>耗时</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((operator) => (
                  <tr key={operator.id}>
                    <td>
                      <span className="op-name">
                        <i
                          style={{
                            background: categoryColors[operator.category],
                          }}
                        />
                        <span className="op-label" title={operator.name}>
                          {operator.name}
                        </span>
                      </span>
                      <small>
                        {operator.id}
                        {` · ${levels[operator.level]}`}
                      </small>
                    </td>
                    <td className="numeric">{formatCycles(operator.cycles)}</td>
                    <td className="numeric">
                      {operator.calls.toLocaleString()}
                    </td>
                    <td className="numeric">
                      {((operator.cycles / run.clock_hz) * 1000).toFixed(3)} ms
                    </td>
                    <td className="numeric">
                      {operatorSum === 0
                        ? "—"
                        : `${((operator.cycles / operatorSum) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            占比只计算当前层级，父级与子级不累加。并行区间可能重叠。
          </p>
        </>
      )}
    </section>
  );
}
