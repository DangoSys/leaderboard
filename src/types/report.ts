export type Operator = {
  id: string;
  name: string;
  category: string;
  cycles: number;
  calls: number;
  start_cycle: number;
  level: number;
};

export type ModelResult = {
  name: string;
  status: "pass" | "fail" | "timeout" | "infra_error";
  workload_hash: string;
  dataset_hash: string;
  cycles: number | null;
  accuracy: number | null;
  accuracy_metric: string | null;
  error: string | null;
  trace_url: string | null;
  operators: Operator[];
};

export type Run = {
  schema_version: 1;
  id: string;
  timestamp: string;
  repository: string;
  branch: string;
  commit: string;
  chip: string;
  backend: string;
  config_hash: string;
  clock_hz: number;
  provenance?: {
    source_dirty: boolean;
    bitstream_sha256: string;
    executable_sha256: string;
    workflow_url: string | null;
    trace_scopes: {
      compiled: number;
      executed: number;
      unexecuted: number[][];
    };
  };
  models: ModelResult[];
};

export type ReportIndex = { schema_version: 1; runs: string[] };
