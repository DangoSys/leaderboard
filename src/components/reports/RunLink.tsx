import type { Run } from "../../types/report";

export default function RunLink({ run }: { run: Run }) {
  return (
    <a
      href={`https://github.com/${run.repository}/commit/${run.commit}`}
      target="_blank"
      rel="noreferrer"
    >
      {run.commit.slice(0, 7)}
    </a>
  );
}
