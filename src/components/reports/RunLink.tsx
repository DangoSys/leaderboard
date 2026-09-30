import type { Run } from "../../types/report";
import { ExternalLink, GitCommitHorizontal } from "lucide-react";

export default function RunLink({ run }: { run: Run }) {
  return run.demo ? (
    <span className="commit">
      <GitCommitHorizontal size={13} />
      {run.commit.slice(0, 7)}
    </span>
  ) : (
    <a
      className="commit"
      href={`https://github.com/${run.repository}/commit/${run.commit}`}
      target="_blank"
      rel="noreferrer"
    >
      <GitCommitHorizontal size={13} />
      {run.commit.slice(0, 7)}
      <ExternalLink size={11} />
    </a>
  );
}
