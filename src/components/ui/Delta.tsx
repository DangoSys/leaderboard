import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="muted">—</span>;
  return (
    <span
      className={`delta ${value > 0 ? "regression" : value < 0 ? "improvement" : ""}`}
    >
      {value > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}
