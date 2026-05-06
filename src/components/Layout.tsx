import {
  BarChart3,
  CalendarDays,
  Dumbbell,
  History,
  Home,
  Library,
  ClipboardList,
  Settings,
  Target,
} from "lucide-react";
import type { ReactNode } from "react";
import type { PageKey } from "../App";

const navItems: { key: PageKey; label: string; icon: ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { key: "workouts", label: "Treinos", icon: <Dumbbell size={18} /> },
  { key: "weekly", label: "Semana", icon: <CalendarDays size={18} /> },
  { key: "planner", label: "Planejador", icon: <Target size={18} /> },
  { key: "history", label: "Histórico", icon: <History size={18} /> },
];

const secondaryNavItems: { key: PageKey; label: string; icon: ReactNode }[] = [
  { key: "performed", label: "Realizado", icon: <ClipboardList size={18} /> },
  { key: "library", label: "Biblioteca", icon: <Library size={18} /> },
  { key: "settings", label: "Configurações", icon: <Settings size={18} /> },
];

type LayoutProps = {
  page: PageKey;
  onPageChange: (page: PageKey) => void;
  children: ReactNode;
};

export function Layout({ page, onPageChange, children }: LayoutProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><BarChart3 size={22} /></div>
          <div>
            <strong>VolumeLab</strong>
            <span>Treinos analíticos</span>
          </div>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={page === item.key ? "nav-item active" : "nav-item"}
              key={item.key}
              onClick={() => onPageChange(item.key)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <nav className="nav-list secondary-nav">
          {secondaryNavItems.map((item) => (
            <button
              className={page === item.key ? "nav-item active" : "nav-item"}
              key={item.key}
              onClick={() => onPageChange(item.key)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Musculação sem automação prescritiva</span>
            <h1>Planeje, monte e leia seu volume semanal</h1>
          </div>
        </header>
        <main>{children}</main>
      </div>
      <nav className="bottom-nav">
        {navItems.map((item) => (
          <button
            className={page === item.key ? "bottom-nav-item active" : "bottom-nav-item"}
            key={item.key}
            onClick={() => onPageChange(item.key)}
            type="button"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
