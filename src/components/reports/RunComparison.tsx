import { useState } from "react";
import type { Run } from "../../types/report";
import {
  comparisonKey,
  formatCycles,
  operatorDiff,
  percentageChange,
  topLevelOperators,
} from "../../lib/metrics";
import { date } from "../../lib/format";
import Select from "../ui/Select";
import Delta from "../ui/Delta";
import { ChevronRight, Split } from "lucide-react";

export default function RunComparison({
  runs,
  modelName,
}: {
  runs: Run[];
  modelName: string;
}) {
  const [beforeId, setBeforeId] = useState(
    runs.at(-2)?.id ?? runs[0]?.id ?? "",
  );
  const [afterId, setAfterId] = useState(runs.at(-1)?.id ?? "");
  const before = runs.find((run) => run.id === beforeId);
  const after = runs.find((run) => run.id === afterId);
  const old = before?.models.find((model) => model.name === modelName);
  const current = after?.models.find((model) => model.name === modelName);
  const compatible =
    before &&
    after &&
    old &&
    current &&
    comparisonKey(before, old) === comparisonKey(after, current);
  const options = runs.map((run) => ({
    value: run.id,
    label: `${date(run.timestamp)} · ${run.commit.slice(0, 7)}`,
  }));
  return (
    <section className="panel" id="compare">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">SIDE BY SIDE</div>
          <h2>Compare two runs</h2>
        </div>
        <Split size={19} className="muted" />
      </div>
      <div className="comparison-selectors">
        <Select
          label="Baseline"
          value={beforeId}
          options={options}
          onChange={setBeforeId}
        />
        <ChevronRight size={18} />
        <Select
          label="Candidate"
          value={afterId}
          options={options}
          onChange={setAfterId}
        />
      </div>
      {!compatible ? (
        <p className="notice">
          These runs have different measurement conditions and cannot be
          compared.
        </p>
      ) : old.status !== "pass" || current.status !== "pass" ? (
        <p className="notice">
          Both models must pass before their performance can be compared.
        </p>
      ) : (
        <>
          <div className="compare-total">
            <span>Total model cycles</span>
            <strong>
              {formatCycles(old.cycles!)} <span>→</span>{" "}
              {formatCycles(current.cycles!)}
            </strong>
            <Delta value={percentageChange(old.cycles!, current.cycles!)} />
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Baseline</th>
                  <th>Candidate</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {operatorDiff(
                  topLevelOperators(old.operators),
                  topLevelOperators(current.operators),
                ).map((operator) => (
                  <tr key={operator.id}>
                    <td>
                      {operator.name}
                      <small>{operator.id}</small>
                    </td>
                    <td className="numeric">
                      {operator.before === null
                        ? "new"
                        : formatCycles(operator.before)}
                    </td>
                    <td className="numeric">
                      {operator.after === null
                        ? "removed"
                        : formatCycles(operator.after)}
                    </td>
                    <td>
                      <Delta value={operator.change} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="footnote">
            Lower cycles are better. Added and removed operators have no
            percentage change.
          </p>
        </>
      )}
    </section>
  );
}
