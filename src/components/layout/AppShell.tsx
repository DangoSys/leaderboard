import { Activity } from "lucide-react";
import { useState, type ReactNode } from "react";
const base = import.meta.env.BASE_URL;
import {
  ChevronRight,
  ExternalLink,
  Github,
  LayoutDashboard,
  Menu,
  Orbit,
  Split,
  X,
} from "lucide-react";

export default function AppShell({
  demo,
  children,
}: {
  demo: boolean;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <button
          className="sidebar-close"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        >
          <X size={18} />
        </button>
        <a className="brand" href={base}>
          <span className="brand-icon">
            <Orbit size={24} />
          </span>
          <span>
            Buckyball<small>PERFORMANCE LAB</small>
          </span>
        </a>
        <div className="nav-section-label">WORKSPACE</div>
        <nav>
          <a href="#overview" onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={17} />
            Overview
            <span className="nav-badge">{demo ? "Demo" : "Reports"}</span>
          </a>
          <a href="#runs" onClick={() => setMenuOpen(false)}>
            <Activity size={17} />
            Run reports
          </a>
          <a href="#compare" onClick={() => setMenuOpen(false)}>
            <Split size={17} />
            Compare runs
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-card">
            <span className="small-orbit">
              <Orbit size={19} />
            </span>
            <strong>From cycles to insight.</strong>
            <p>A shared view of how our chips evolve.</p>
          </div>
          <a
            className="repo-link"
            href="https://github.com/DangoSys/leaderboard"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} />
            DangoSys / leaderboard
            <ExternalLink size={12} />
          </a>
          <div className="sidebar-footer">
            <span className="online-dot" />
            Static reports · GitHub Pages
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="menu-button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>Performance overview</strong>
          </div>
          <div className="topbar-right">
            <span className="online-dot" />
            <span>Cycle trace reports</span>
            <a
              href="https://github.com/DangoSys/leaderboard"
              aria-label="Open GitHub repository"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={18} />
            </a>
          </div>
        </header>
        <main>
          {children}
          <footer>
            <span>
              <Orbit size={14} /> Buckyball performance lab
            </span>
            <span>Cycles are measured. Progress is understood.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
