import { useState } from "react";
import type { Run, ModelResult } from "../../types/report";
import {
  categoryColors,
  formatCycles,
  topLevelOperators,
} from "../../lib/metrics";
import { CircleHelp, Layers3 } from "lucide-react";

export default function OperatorBreakdown({
  run,
  model,
}: {
  run: Run;
  model: ModelResult;
}) {
  const [allLevels, setAllLevels] = useState(false);
  const top = topLevelOperators(model.operators);
  const categoryTotals = Object.entries(
    top.reduce<Record<string, number>>((result, operator) => {
      result[operator.category] =
        (result[operator.category] ?? 0) + operator.cycles;
      return result;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const operatorSum = top.reduce((sum, operator) => sum + operator.cycles, 0);
  const operators = (allLevels ? model.operators : top).toSorted(
    (a, b) => b.cycles - a.cycles,
  );
  return (
    <section className="panel breakdown">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">INSIDE THE MODEL</div>
          <h2>Where the cycles go</h2>
        </div>
        <Layers3 size={19} className="muted" />
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
            aria-label="Share of measured top-level operator cycles"
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
            <span>{operators.length} measured operators</span>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={allLevels}
                onChange={(event) => setAllLevels(event.target.checked)}
              />{" "}
              Include nested traces
            </label>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Cycles</th>
                  <th>Time</th>
                  <th>Share</th>
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
                        {operator.name}
                      </span>
                      <small>
                        {operator.id}
                        {allLevels ? ` · level ${operator.level}` : ""}
                      </small>
                    </td>
                    <td className="numeric">{formatCycles(operator.cycles)}</td>
                    <td className="numeric">
                      {((operator.cycles / run.clock_hz) * 1000).toFixed(3)} ms
                    </td>
                    <td className="numeric">
                      {!top.includes(operator)
                        ? "nested"
                        : `${((operator.cycles / operatorSum) * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            <CircleHelp size={13} /> Shares use measured top-level operator
            cycles, excluding nested traces. Parallel operator durations may
            overlap; shares are not a partition of wall time.
          </p>
        </>
      )}
    </section>
  );
}
