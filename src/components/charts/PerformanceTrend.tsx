import { useState } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Run } from "../../types/report";
import { date } from "../../lib/format";
import { formatCycles } from "../../lib/metrics";
import Select from "../ui/Select";

export default function PerformanceTrend({
  runs,
  modelNames,
  activeModel,
  seriesKey,
  seriesOptions,
  demo,
  onModelChange,
  onSeriesChange,
}: {
  runs: Run[];
  modelNames: string[];
  activeModel: string;
  seriesKey: string;
  seriesOptions: { value: string; label: string }[];
  demo: boolean;
  onModelChange: (name: string) => void;
  onSeriesChange: (key: string) => void;
}) {
  const [metric, setMetric] = useState<"cycles" | "latency">("cycles");
  const successful = runs.filter(
    (run) =>
      run.models.find((model) => model.name === activeModel)?.status === "pass",
  );
  const chartData = runs.map((run) => {
    const model = run.models.find((model) => model.name === activeModel)!;
    return {
      id: run.id,
      date: date(run.timestamp),
      commit: run.commit.slice(0, 7),
      status: model.status,
      value:
        model.cycles === null
          ? null
          : metric === "cycles"
            ? model.cycles
            : (model.cycles / run.clock_hz) * 1000,
    };
  });
  return (
    <section className="panel trend" id="overview">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">PERFORMANCE OVER TIME</div>
          <h2>
            Every run tells a story
            <span className="heading-dot" />
          </h2>
          <p>Follow model performance across commits. Lower is better.</p>
        </div>
        <div className="segmented" aria-label="Chart metric">
          <button
            className={metric === "cycles" ? "active" : ""}
            onClick={() => setMetric("cycles")}
          >
            Cycles
          </button>
          <button
            className={metric === "latency" ? "active" : ""}
            onClick={() => setMetric("latency")}
          >
            Latency
          </button>
        </div>
      </div>
      <div className="model-tabs" role="group" aria-label="Model selection">
        {modelNames.map((name) => (
          <button
            key={name}
            className={name === activeModel ? "active" : ""}
            onClick={() => onModelChange(name)}
          >
            <span />
            {name}
          </button>
        ))}
      </div>
      <div className="series-selector">
        <Select
          label="Measurement series"
          value={seriesKey}
          options={seriesOptions}
          onChange={onSeriesChange}
        />
        <span className="muted">
          {demo ? "Illustrative data" : "Recorded measurements"} · UTC
        </span>
      </div>
      <div className="chart" aria-label={`${activeModel} historical ${metric}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 18, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="cycle-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5868ec" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#5868ec" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 5"
              vertical={false}
              stroke="#e9ecf3"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8a92a6", fontSize: 11 }}
              dy={10}
              minTickGap={22}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8a92a6", fontSize: 11 }}
              tickFormatter={(value) =>
                metric === "cycles"
                  ? formatCycles(Number(value))
                  : `${Number(value).toFixed(1)}`
              }
              width={62}
              domain={["auto", "auto"]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload;
                return (
                  <div className="chart-tooltip">
                    <strong>
                      {point.date} · {point.commit}
                    </strong>
                    <span>
                      {point.value === null
                        ? point.status
                        : metric === "cycles"
                          ? `${Number(point.value).toLocaleString("en-US")} cycles`
                          : `${Number(point.value).toFixed(3)} ms`}
                    </span>
                  </div>
                );
              }}
            />
            <Area
              type="linear"
              dataKey="value"
              stroke="#5868ec"
              strokeWidth={2.5}
              fill="url(#cycle-fill)"
              connectNulls={false}
              dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
            {chartData.length > 3 && (
              <Brush
                dataKey="date"
                height={22}
                stroke="#dce1f0"
                fill="#f8f9fc"
                travellerWidth={7}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-caption">
        <span>
          <i className="line-key" />
          {activeModel} · {successful.length} passing runs
        </span>
        <span>Hover to inspect · Drag the range to zoom</span>
      </div>
    </section>
  );
}
