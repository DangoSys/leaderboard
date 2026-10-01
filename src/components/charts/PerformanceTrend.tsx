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

export default function PerformanceTrend({
  runs,
  modelName,
}: {
  runs: Run[];
  modelName: string;
}) {
  const points = runs.map((run) => ({
    date: date(run.timestamp),
    commit: run.commit.slice(0, 7),
    cycles: run.models.find((model) => model.name === modelName)!.cycles,
  }));
  return (
    <div className="chart" role="img" aria-label={`${modelName} cycles 趋势`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{ top: 20, right: 20, bottom: 12, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={72}
            domain={[0, "auto"]}
            tickFormatter={(value) => formatCycles(Number(value))}
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
                  <span>{Number(point.cycles).toLocaleString()} cycles</span>
                </div>
              );
            }}
          />
          <Area
            type="linear"
            dataKey="cycles"
            stroke="#5063db"
            fill="#eef1ff"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4, fill: "white", strokeWidth: 2 }}
            isAnimationActive={false}
          />
          {points.length > 3 && (
            <Brush
              dataKey="date"
              height={22}
              stroke="#d5d9e5"
              travellerWidth={7}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
