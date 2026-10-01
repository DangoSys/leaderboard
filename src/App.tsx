import { useEffect, useState } from "react";
import AppShell from "./components/layout/AppShell";
import RunAnalysis from "./features/reports/RunAnalysis";
import Trends from "./features/trends/Trends";
import { useReports } from "./hooks/useReports";

export default function App() {
  const [page, setPage] = useState(
    location.hash === "#trends" ? "trends" : "analysis",
  );
  const [selectedId, setSelectedId] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const { runs, loading, error } = useReports();
  useEffect(() => {
    const navigate = () =>
      setPage(location.hash === "#trends" ? "trends" : "analysis");
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);
  return (
    <AppShell page={page}>
      {loading ? (
        <p className="empty" role="status">
          正在加载报告…
        </p>
      ) : error ? (
        <div className="empty" role="alert">
          <h1>报告加载失败</h1>
          <p>{error}</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="empty">
          <h1>暂无报告</h1>
          <p>运行结果上传后会显示在这里。</p>
        </div>
      ) : page === "trends" ? (
        <Trends
          runs={runs}
          onSelectRun={(id, modelName) => {
            setSelectedId(id);
            setSelectedModel(modelName);
            location.hash = "analysis";
          }}
        />
      ) : (
        <RunAnalysis
          key={selectedId}
          runs={runs}
          selectedId={selectedId}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onSelectRun={(id) => {
            setSelectedId(id);
            setSelectedModel("");
          }}
        />
      )}
    </AppShell>
  );
}
