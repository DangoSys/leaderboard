import { useState } from "react";
import AppShell from "./components/layout/AppShell";
import Dashboard from "./features/dashboard/Dashboard";
import { useReports } from "./hooks/useReports";
import { BarChart3, ChevronRight, RefreshCw } from "lucide-react";

export default function App() {
  const [demo, setDemo] = useState(
    new URLSearchParams(location.search).get("demo") === "1",
  );
  const { runs, loading, error } = useReports(demo);
  const changeMode = (value: boolean) => {
    setDemo(value);
    const url = new URL(location.href);
    if (value) url.searchParams.set("demo", "1");
    else url.searchParams.delete("demo");
    history.replaceState(null, "", url);
  };
  return (
    <AppShell demo={demo}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">BUCKYBALL LEADERBOARD</div>
          <h1>Performance, in perspective.</h1>
          <p>Track every model. Understand every cycle.</p>
        </div>
        <div className="segmented data-mode" aria-label="Report dataset">
          <button
            className={!demo ? "active" : ""}
            onClick={() => changeMode(false)}
          >
            Recorded runs
          </button>
          <button
            className={demo ? "active" : ""}
            onClick={() => changeMode(true)}
          >
            Explore demo
          </button>
        </div>
      </div>
      {demo && (
        <div className="demo-banner">
          <span className="demo-dot" />
          <strong>Demo workspace</strong>
          <span>
            All numbers are illustrative. No hardware measurements are shown.
          </span>
        </div>
      )}
      {loading ? (
        <section className="panel empty" role="status">
          <RefreshCw className="spin" size={28} />
          <h2>Loading reports</h2>
        </section>
      ) : error ? (
        <section className="panel empty" role="alert">
          <h2>Reports could not be loaded</h2>
          <p>{error}</p>
        </section>
      ) : runs.length ? (
        <Dashboard key={String(demo)} runs={runs} demo={demo} />
      ) : (
        <section className="panel empty">
          <div className="empty-icon">
            <BarChart3 size={34} />
          </div>
          <div className="eyebrow">READY FOR YOUR FIRST RUN</div>
          <h2>Your performance history starts here.</h2>
          <p>
            Import a cycle trace report to start tracking model performance.
            <br />
            Until then, explore the demo to see trends, operator breakdowns, and
            comparisons.
          </p>
          <button className="primary-button" onClick={() => changeMode(true)}>
            Explore the demo <ChevronRight size={15} />
          </button>
        </section>
      )}
    </AppShell>
  );
}
