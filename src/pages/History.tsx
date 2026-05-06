import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { EmptyState, ExpandableDetails, PageHeader, SectionCard, StatCard } from "../components/ui";
import { muscleGroups } from "../data/muscles";
import type { Settings, WeekLog, WeeklyPlan, Workout } from "../types";
import { addWeeks, formatShortDate, getWeekStart } from "../utils/dates";
import {
  calculateAdherenceMetrics,
  calculateExerciseLoadHistory,
  calculateHeatmapData,
  calculateMovementPatternVolume,
  calculatePerformedVolumeForWeek,
  compareWeeks,
} from "../utils/history";
import { formatNumber, signedNumber } from "../utils/format";

type HistoryProps = {
  weekLogs: WeekLog[];
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
};

export function History({ weekLogs, workouts, weeklyPlan, settings }: HistoryProps) {
  const sortedWeeks = [...weekLogs].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const [selectedWeekStart, setSelectedWeekStart] = useState(sortedWeeks[0]?.weekStart ?? getWeekStart());
  const [heatmapMode, setHeatmapMode] = useState<"planned" | "performed">("performed");
  const current = weekLogs.find((week) => week.weekStart === selectedWeekStart);
  const previous = weekLogs.find((week) => week.weekStart === addWeeks(selectedWeekStart, -1));
  const currentVolume = calculatePerformedVolumeForWeek(current, settings);
  const previousVolume = calculatePerformedVolumeForWeek(previous, settings);
  const comparison = compareWeeks(current, previous, settings);
  const heatmap = calculateHeatmapData({ workouts, weeklyPlan, weekLog: current, settings, mode: heatmapMode });
  const loadHistory = useMemo(() => calculateExerciseLoadHistory(weekLogs), [weekLogs]);
  const movementPlanned = calculateMovementPatternVolume(current?.sessions ?? [], settings, "planned");
  const movementPerformed = calculateMovementPatternVolume(current?.sessions ?? [], settings, "performed");
  const metrics = calculateAdherenceMetrics({ workouts, weeklyPlan, weekLog: current, settings });
  const totalCurrent = muscleGroups.reduce((sum, muscle) => sum + currentVolume[muscle].totalSets, 0);
  const totalPrevious = muscleGroups.reduce((sum, muscle) => sum + previousVolume[muscle].totalSets, 0);
  const variation = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious) * 100 : undefined;

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Histórico"
        title="Resumo por semana"
        description="Veja o panorama primeiro e abra detalhes quando quiser."
      />

      <SectionCard>
        <div className="filters minimal">
          <select value={selectedWeekStart} onChange={(event) => setSelectedWeekStart(event.target.value)}>
            {sortedWeeks.length === 0 ? <option value={selectedWeekStart}>Semana atual</option> : null}
            {sortedWeeks.map((week) => <option value={week.weekStart} key={week.weekStart}>Semana de {formatShortDate(week.weekStart)}</option>)}
          </select>
        </div>
        <div className="history-summary">
          <h3>Semana de {formatShortDate(selectedWeekStart)}</h3>
          <p>{metrics.performedSessions} de {metrics.plannedSessions} treinos feitos</p>
          <div className="stat-grid compact">
            <StatCard label="Aderência" value={`${formatNumber(metrics.sessionAdherence)}%`} />
            <StatCard label="Volume" value={formatNumber(totalCurrent)} />
            <StatCard label="Vs anterior" value={variation === undefined ? "sem dados" : `${signedNumber(variation)}%`} />
          </div>
        </div>
        {current?.weekNote ? <p className="note-line">{current.weekNote}</p> : null}
      </SectionCard>

      <SectionCard title="Músculos" description="Lista compacta do volume realizado.">
        <div className="muscle-grid compact-list">
          {muscleGroups
            .filter((muscle) => currentVolume[muscle].totalSets > 0)
            .slice(0, 8)
            .map((muscle) => (
              <article className="muscle-card compact" key={muscle}>
                <div className="card-title-row">
                  <h3>{muscle}</h3>
                  <Badge>{formatNumber(currentVolume[muscle].totalSets)} séries</Badge>
                </div>
                <small>Anterior: {formatNumber(comparison[muscle].previous)} · diferença {signedNumber(comparison[muscle].difference)}</small>
              </article>
            ))}
        </div>
        {currentVolume && muscleGroups.every((muscle) => currentVolume[muscle].totalSets === 0) ? <EmptyState title="Sem volume realizado" /> : null}
      </SectionCard>

      <SectionCard title="Ver detalhes">
        <ExpandableDetails label="Comparação completa">
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>Músculo</th>
                  <th>Atual</th>
                  <th>Anterior</th>
                  <th>Dif.</th>
                </tr>
              </thead>
              <tbody>
                {muscleGroups.map((muscle) => (
                  <tr key={muscle}>
                    <td>{muscle}</td>
                    <td>{formatNumber(comparison[muscle].current)}</td>
                    <td>{formatNumber(comparison[muscle].previous)}</td>
                    <td>{signedNumber(comparison[muscle].difference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExpandableDetails>

        <ExpandableDetails label="Mapa de calor">
          <div className="filters minimal">
            <select value={heatmapMode} onChange={(event) => setHeatmapMode(event.target.value as "planned" | "performed")}>
              <option value="performed">Realizado</option>
              <option value="planned">Planejado</option>
            </select>
          </div>
          <div className="heatmap">
            <div />
            {heatmap.map((day) => <strong key={day.weekday}>{day.label}</strong>)}
            {muscleGroups.map((muscle) => (
              <>
                <strong key={`${muscle}-label`}>{muscle}</strong>
                {heatmap.map((day) => {
                  const value = day.volume[muscle].totalSets;
                  return <span key={`${muscle}-${day.weekday}`} className="heat-cell" style={{ opacity: Math.min(1, 0.15 + value / 14) }}>{formatNumber(value)}</span>;
                })}
              </>
            ))}
          </div>
        </ExpandableDetails>

        <ExpandableDetails label="Padrões de movimento">
          <div className="movement-grid">
            <MovementColumn title="Planejado" data={movementPlanned} />
            <MovementColumn title="Realizado" data={movementPerformed} />
          </div>
        </ExpandableDetails>

        <ExpandableDetails label="Histórico de carga">
          <div className="card-grid minimal">
            {loadHistory.length === 0 ? <EmptyState title="Nenhuma carga registrada" /> : null}
            {loadHistory.map((item) => (
              <article className="mini-card" key={item.exerciseName}>
                <div className="card-title-row">
                  <h3>{item.exerciseName}</h3>
                  {item.bestNumeric !== undefined ? <Badge tone="green">Maior {formatNumber(item.bestNumeric)}</Badge> : <Badge>Texto</Badge>}
                </div>
                {item.entries.slice(-5).map((entry) => (
                  <p key={`${entry.date}-${entry.load}`}>{formatShortDate(entry.date)}: {entry.load}</p>
                ))}
              </article>
            ))}
          </div>
        </ExpandableDetails>
      </SectionCard>
    </div>
  );
}

function MovementColumn({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <div className="mini-card">
      <h3>{title}</h3>
      {entries.length === 0 ? <p>Sem dados.</p> : null}
      {entries.map(([pattern, value]) => (
        <p key={pattern}>{pattern}: {formatNumber(value)}</p>
      ))}
    </div>
  );
}
