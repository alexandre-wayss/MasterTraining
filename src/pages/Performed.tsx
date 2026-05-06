import { CheckCircle2, ClipboardList, SkipForward } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/Badge";
import { EmptyState, ExpandableDetails, PageHeader, SectionCard, StatCard } from "../components/ui";
import { weekDays } from "../data/muscles";
import type { PerformedExercise, SessionStatus, Settings, WeekLog, WeeklyPlan, Workout, WorkoutSession, Weekday } from "../types";
import { calculateAdherenceMetrics, countValidSets, countWarmupSets, createSessionFromWorkout, markSessionAsPlanned } from "../utils/history";
import { formatNumber } from "../utils/format";

type PerformedProps = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
  weekLog: WeekLog;
  onWeekNoteChange: (weekStart: string, note: string) => void;
  onSessionChange: (weekStart: string, session: WorkoutSession) => void;
};

export function Performed({ workouts, weeklyPlan, settings, weekLog, onWeekNoteChange, onSessionChange }: PerformedProps) {
  const [selectedDay, setSelectedDay] = useState<Weekday>("monday");
  const workoutMap = new Map(workouts.map((workout) => [workout.id, workout]));
  const metrics = calculateAdherenceMetrics({ workouts, weeklyPlan, weekLog, settings });
  const selectedMeta = weekDays.find((day) => day.key === selectedDay)!;
  const selectedWorkout = weeklyPlan[selectedDay] ? workoutMap.get(weeklyPlan[selectedDay]!) : undefined;
  const selectedSession = weekLog.sessions.find((session) => session.weekday === selectedDay);

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Realizado"
        title="Registrar semana"
        description="Escolha um dia, registre o essencial e abra detalhes quando precisar."
      />

      <div className="stat-grid compact">
        <StatCard label="Planejados" value={metrics.plannedSessions} />
        <StatCard label="Feitos" value={metrics.performedSessions} />
        <StatCard label="Pulados" value={metrics.skippedSessions} />
        <StatCard label="Aderência" value={`${formatNumber(metrics.sessionAdherence)}%`} />
      </div>

      <SectionCard>
        <div className="weekday-strip">
          {weekDays.map((day) => {
            const session = weekLog.sessions.find((item) => item.weekday === day.key);
            const workout = weeklyPlan[day.key] ? workoutMap.get(weeklyPlan[day.key]!) : undefined;
            return (
              <button
                className={selectedDay === day.key ? "weekday-card active" : "weekday-card"}
                key={day.key}
                onClick={() => setSelectedDay(day.key)}
                type="button"
              >
                <span>{day.short}</span>
                <strong>{workout?.name ?? "Descanso"}</strong>
                <Badge tone={sessionTone(session?.status)}>{session?.status ?? "pendente"}</Badge>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title={`${selectedMeta.label} · ${selectedWorkout?.name ?? "Descanso"}`}
        description="O realizado salva um snapshot e não altera o treino original."
      >
        <div className="action-row left sticky-actions">
          <button
            className="secondary-btn"
            disabled={!selectedWorkout}
            onClick={() => selectedWorkout && onSessionChange(weekLog.weekStart, createSessionFromWorkout({ workout: selectedWorkout, weekStart: weekLog.weekStart, weekday: selectedDay, status: "partial", fillPerformed: true }))}
            type="button"
          >
            <ClipboardList size={16} /> Preencher
          </button>
          <button
            className="primary-btn"
            disabled={!selectedWorkout}
            onClick={() => onSessionChange(weekLog.weekStart, markSessionAsPlanned(selectedWorkout, weekLog.weekStart, selectedDay))}
            type="button"
          >
            <CheckCircle2 size={16} /> Feito conforme planejado
          </button>
          <button
            className="secondary-btn"
            onClick={() => onSessionChange(weekLog.weekStart, createSessionFromWorkout({ workout: selectedWorkout, weekStart: weekLog.weekStart, weekday: selectedDay, status: "skipped", fillPerformed: false }))}
            type="button"
          >
            <SkipForward size={16} /> Pular
          </button>
        </div>

        {!selectedSession ? <EmptyState title="Dia pendente" text="Use uma das ações acima para criar o registro." /> : null}
        {selectedSession ? <SessionEditor session={selectedSession} onChange={(next) => onSessionChange(weekLog.weekStart, next)} /> : null}
      </SectionCard>

      <SectionCard title="Nota da semana">
        <label className="wide-label">
          <textarea value={weekLog.weekNote ?? ""} onChange={(event) => onWeekNoteChange(weekLog.weekStart, event.target.value)} placeholder="Observações gerais da semana" />
        </label>
      </SectionCard>
    </div>
  );
}

function SessionEditor({ session, onChange }: { session: WorkoutSession; onChange: (session: WorkoutSession) => void }) {
  function updatePerformed(id: string, patch: Partial<PerformedExercise>) {
    onChange({
      ...session,
      performedExercises: session.performedExercises.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  }

  function updateSet(performedId: string, setId: string, patch: Partial<PerformedExercise["sets"][number]>) {
    onChange({
      ...session,
      performedExercises: session.performedExercises.map((item) => (
        item.id === performedId
          ? { ...item, sets: item.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)) }
          : item
      )),
    });
  }

  function updateStatus(status: SessionStatus) {
    onChange({ ...session, status, performedExercises: status === "skipped" ? [] : session.performedExercises });
  }

  return (
    <div className="session-editor compact">
      <div className="form-grid compact">
        <label>Status
          <select value={session.status} onChange={(event) => updateStatus(event.target.value as SessionStatus)}>
            <option value="completed">completed</option>
            <option value="partial">partial</option>
            <option value="skipped">skipped</option>
          </select>
        </label>
        <label>Duração<input type="number" min={0} value={session.durationMinutes ?? ""} onChange={(event) => onChange({ ...session, durationMinutes: event.target.value ? Number(event.target.value) : undefined })} /></label>
      </div>

      <ExpandableDetails label="Nota da sessão">
        <textarea value={session.sessionNote ?? ""} onChange={(event) => onChange({ ...session, sessionNote: event.target.value })} />
      </ExpandableDetails>

      {session.status === "skipped" ? <EmptyState title="Sessão pulada" text="Este dia não gera volume realizado." /> : null}

      <div className="exercise-stack">
        {session.performedExercises.map((performed) => {
          const snapshot = session.plannedSnapshot.find((item) => item.id === performed.plannedSnapshotId);
          return (
            <article className="performed-exercise compact" key={performed.id}>
              <div className="card-title-row">
                <div>
                  <h4>{snapshot?.exerciseName ?? performed.exerciseId}</h4>
                  <p>Planejado: {snapshot?.plannedSets ?? 0} x {snapshot?.reps ?? "-"} · Realizado: {countValidSets(performed)} séries</p>
                </div>
              </div>
              <div className="subtle-list">
                <span>Aquecimentos concluídos: {countWarmupSets(performed)}</span>
              </div>
              <ExpandableDetails>
                <div className="set-list">
                  {performed.sets.map((set) => (
                    <div className={set.completed ? "set-row completed" : "set-row"} key={set.id}>
                      <span>{set.isWarmup ? "Aq" : set.setNumber}</span>
                      <input value={set.load ?? ""} onChange={(event) => updateSet(performed.id, set.id, { load: event.target.value })} placeholder="kg" />
                      <input value={set.reps ?? ""} onChange={(event) => updateSet(performed.id, set.id, { reps: event.target.value })} placeholder="reps" />
                      <label className="checkbox-label"><input checked={set.completed} onChange={(event) => updateSet(performed.id, set.id, { completed: event.target.checked })} type="checkbox" /> feita</label>
                      <label className="checkbox-label"><input checked={Boolean(set.isWarmup)} onChange={(event) => updateSet(performed.id, set.id, { isWarmup: event.target.checked })} type="checkbox" /> aquecimento</label>
                    </div>
                  ))}
                </div>
                <label className="wide-label">
                  Nota
                  <textarea value={performed.notes ?? ""} onChange={(event) => updatePerformed(performed.id, { notes: event.target.value })} />
                </label>
              </ExpandableDetails>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function sessionTone(status?: SessionStatus) {
  if (status === "completed") return "green";
  if (status === "partial") return "amber";
  if (status === "skipped") return "neutral";
  return "neutral";
}
