import type { ReactNode } from "react";

export default function AppShell({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#analysis">
          Buckyball
        </a>
        <nav aria-label="页面">
          <a
            href="#analysis"
            aria-current={page === "analysis" ? "page" : undefined}
          >
            单次分析
          </a>
          <a
            href="#trends"
            aria-current={page === "trends" ? "page" : undefined}
          >
            趋势
          </a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
