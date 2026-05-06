import type { ReactNode } from "react";
import type { MuscleFrequency, MuscleGroup, MusclePlanStatus, MuscleVolume, PlanStatus } from "../types";
import { formatNumber, statusLabels } from "../utils/format";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header-action">{action}</div> : null}
    </header>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section-card">
      {title || description || action ? (
        <div className="section-heading compact">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: ReactNode; detail?: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function EmptyState({ title, text }: { title: string; text?: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

export function ExpandableDetails({ label = "Detalhes", children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <details className="expandable-details">
      <summary>{label}</summary>
      <div>{children}</div>
    </details>
  );
}

export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="filter-chips">
      {options.map((option) => (
        <button
          className={value === option.value ? "chip active" : "chip"}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }: { status: PlanStatus }) {
  return <Badge tone={statusTone(status)}>{shortStatus(status)}</Badge>;
}

export function MuscleProgressCard({
  muscle,
  volume,
  status,
  frequency,
  isEmphasis,
  dayDetails,
  compact = false,
}: {
  muscle: MuscleGroup;
  volume: MuscleVolume;
  status: MusclePlanStatus;
  frequency?: MuscleFrequency;
  isEmphasis?: boolean;
  dayDetails?: ReactNode;
  compact?: boolean;
}) {
  return (
    <article className={isEmphasis ? (compact ? "muscle-card compact emphasis" : "muscle-card emphasis") : compact ? "muscle-card compact" : "muscle-card"}>
      <div className="card-title-row">
        <h3>{muscle}</h3>
        {compact ? null : <StatusBadge status={status.status} />}
      </div>
      <strong className="metric-line">
        {formatNumber(volume.totalSets)}{status.target ? ` / ${formatNumber(status.target)}` : ""} incluídas
      </strong>
      <div className={compact ? "compact-progress" : ""}>
        <ProgressBar value={volume.totalSets} target={status.target} />
      </div>
      {compact ? null : (
        <ExpandableDetails>
        <div className="detail-grid">
          <span>Diretas <strong>{formatNumber(volume.directSets)}</strong></span>
          <span>Indiretas <strong>{formatNumber(volume.indirectSets)}</strong></span>
          <span>Frequência <strong>{frequency?.totalDays ?? 0}x</strong></span>
          <span>Diferença <strong>{status.difference === undefined ? "sem meta" : formatNumber(status.difference)}</strong></span>
        </div>
        {dayDetails}
      </ExpandableDetails>
      )}
    </article>
  );
}

function shortStatus(status: PlanStatus) {
  if (status === "below") return "Abaixo";
  if (status === "within") return "Dentro";
  if (status === "above") return "Acima";
  return statusLabels[status];
}

function statusTone(status: PlanStatus) {
  if (status === "below") return "amber";
  if (status === "within") return "green";
  if (status === "above") return "neutral";
  return "neutral";
}
