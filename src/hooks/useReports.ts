import { useEffect, useState } from "react";
import type { Run, ReportIndex } from "../types/report";

export function useReports() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const fetchJson = async (path: string) => {
          const response = await fetch(path, {
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(`Could not load ${path}: HTTP ${response.status}`);
          return response.json();
        };
        const index: ReportIndex = await fetchJson("data/index.json");
        if (index.schema_version !== 1 || !Array.isArray(index.runs))
          throw new Error("Unsupported report index");
        const reports: Run[] = await Promise.all(
          index.runs.map((path) => fetchJson(`data/${path}`)),
        );
        if (reports.some((run) => run.schema_version !== 1))
          throw new Error("Unsupported report schema");
        if (!controller.signal.aborted)
          setRuns(
            reports.toSorted(
              (a, b) =>
                Date.parse(a.timestamp) - Date.parse(b.timestamp) ||
                a.id.localeCompare(b.id),
            ),
          );
      } catch (cause) {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);
  return { runs, loading, error };
}
