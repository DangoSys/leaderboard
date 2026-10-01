import type { ModelResult, Run } from "../types/report";

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
  Quantization: "#c080b0",
  Activation: "#eeac58",
  Pool: "#e47c94",
  Other: "#8994a9",
};
