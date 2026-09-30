import type { ModelResult, Operator, Run } from "../types/report";

export function comparisonKey(run: Run, model: ModelResult): string {
  return JSON.stringify([
    run.repository,
    run.chip,
    run.backend,
    run.config_hash,
    run.clock_hz,
    model.name,
    model.workload_hash,
    model.dataset_hash,
  ]);
}

export function percentageChange(before: number, after: number): number | null {
  return before === 0 ? null : ((after - before) / before) * 100;
}

export function operatorDiff(before: Operator[], after: Operator[]) {
  const ids = new Set([...before, ...after].map((op) => op.id));
  return [...ids]
    .map((id) => {
      const old = before.find((op) => op.id === id);
      const current = after.find((op) => op.id === id);
      const sameOperator = old && current && old.name === current.name;
      return {
        id,
        name: current?.name ?? old!.name,
        before: old?.cycles ?? null,
        after: current?.cycles ?? null,
        change: sameOperator
          ? percentageChange(old.cycles, current.cycles)
          : null,
      };
    })
    .sort(
      (a, b) =>
        Math.abs((b.after ?? 0) - (b.before ?? 0)) -
        Math.abs((a.after ?? 0) - (a.before ?? 0)),
    );
}

export function topLevelOperators(operators: Operator[]): Operator[] {
  if (!operators.length) return [];
  const level = Math.min(...operators.map((op) => op.level));
  return operators.filter((op) => op.level === level);
}

export const formatCycles = (cycles: number) =>
  cycles >= 1e6
    ? `${(cycles / 1e6).toFixed(2)}M`
    : cycles >= 1e3
      ? `${(cycles / 1e3).toFixed(1)}K`
      : cycles.toLocaleString("en-US");

export const categoryColors: Record<string, string> = {
  Conv: "#4f6df5",
  MatMul: "#8971e6",
  Transfer: "#38a9a0",
  Activation: "#eeac58",
  Pool: "#e47c94",
  Other: "#8994a9",
};
