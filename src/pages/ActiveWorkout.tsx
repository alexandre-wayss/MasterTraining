import { Check, Download, Plus, TimerReset, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { ExercisePicker } from "../components/ExercisePicker";
import { EmptyState, ExpandableDetails, PageHeader, SectionCard, StatCard } from "../components/ui";
import type { ActiveWorkoutExercise, ActiveWorkoutSession, PerformedSet, Settings, WeekLog, WorkoutSession } from "../types";
import { createExtraActiveExercise, elapsedMinutes } from "../utils/activeWorkout";
import {
  activeWorkoutToSession,
  calculateSessionPerformedVolume,
  countValidSets,
  countWarmupSets,
  formatLastPerformance,
  getLastExercisePerformance,
} from "../utils/history";
import { exportActiveWorkoutPdf } from "../utils/exportPdf";
import { muscleGroups } from "../data/muscles";
import { formatNumber } from "../utils/format";

type ActiveWorkoutProps = {
  activeWorkoutSession: ActiveWorkoutSession;
  weekLogs: WeekLog[];
  settings: Settings;
  onUpdate: (session: ActiveWorkoutSession) => void;
  onSave: (weekStart: string, session: WorkoutSession) => void;
  onClear: () => void;
  onDone: () => void;
};

export function ActiveWorkout({ activeWorkoutSession, weekLogs, settings, onUpdate, onSave, onClear, onDone }: ActiveWorkoutProps) {
  const [now, setNow] = useState(() => Date.now());
  const [showSummary, setShowSummary] = useState(false);
  const [openExerciseId, setOpenExerciseId] = useState<string | undefined>();

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const active = activeWorkoutSession;
  const openExercise = openExerciseId
    ? active.exercises.find((exercise) => exercise.activeId === openExerciseId)
    : undefined;
  const elapsed = elapsedMinutes(active.startedAt);
  const validSets = active.exercises.reduce((sum, exercise) => sum + (exercise.skipped ? 0 : countValidSets(exercise)), 0);
  const warmupSets = active.exercises.reduce((sum, exercise) => sum + (exercise.skipped ? 0 : countWarmupSets(exercise)), 0);
  const completedExercises = active.exercises.filter((exercise) => exercise.skipped || countValidSets(exercise) >= Math.max(1, exercise.plannedSets)).length;
  const totalWorkSets = active.exercises.reduce((sum, exercise) => sum + Math.max(1, exercise.plannedSets || 0), 0);
  const restRemaining = getRestRemaining(active, now);

  const sessionPreview = useMemo(() => activeWorkoutToSession(active, elapsed), [active, elapsed]);
  const volume = calculateSessionPerformedVolume(sessionPreview, settings);

  function patch(next: Partial<ActiveWorkoutSession>) {
    onUpdate({ ...active, ...next });
  }

  function updateExercise(activeId: string, updater: (exercise: ActiveWorkoutExercise) => ActiveWorkoutExercise) {
    patch({ exercises: active.exercises.map((exercise) => (exercise.activeId === activeId ? updater(exercise) : exercise)) });
  }

  function updateSet(activeId: string, setId: string, update: Partial<PerformedSet>) {
    const exercise = active.exercises.find((item) => item.activeId === activeId);
    const nextExercises = active.exercises.map((item) =>
      item.activeId === activeId
        ? {
            ...item,
            skipped: false,
            sets: item.sets.map((set) => (set.id === setId ? { ...set, ...update } : set)),
          }
        : item,
    );
    const nextCompleted = update.completed === true;
    const targetSet = exercise?.sets.find((set) => set.id === setId);
    onUpdate({
      ...active,
      exercises: nextExercises,
      restTimer: nextCompleted && exercise?.restSeconds && !targetSet?.isWarmup
        ? {
            exerciseActiveId: activeId,
            durationSeconds: exercise.restSeconds,
            startedAt: new Date().toISOString(),
          }
        : active.restTimer,
    });
  }

  function removeSet(activeId: string, setId: string) {
    updateExercise(activeId, (exercise) => {
      const nextSets = exercise.sets
        .filter((set) => set.id !== setId)
        .map((set, index) => ({
          ...set,
          setNumber: index + 1,
        }));
      return {
        ...exercise,
        sets: nextSets,
      };
    });
  }

  function addSet(activeId: string, isWarmup = false) {
    updateExercise(activeId, (exercise) => ({
      ...exercise,
      sets: [
        ...exercise.sets,
        {
          id: crypto.randomUUID(),
          setNumber: exercise.sets.length + 1,
          load: exercise.load,
          reps: exercise.reps,
          isWarmup,
          completed: false,
        },
      ],
    }));
  }

  function startRest(exerciseActiveId: string, durationSeconds = 90) {
    patch({
      restTimer: {
        exerciseActiveId,
        durationSeconds,
        startedAt: new Date().toISOString(),
      },
    });
  }

  function adjustRest(deltaSeconds: number) {
    if (!active.restTimer) return;
    const remaining = Math.max(0, restRemaining + deltaSeconds);
    patch({
      restTimer: {
        ...active.restTimer,
        durationSeconds: remaining,
        startedAt: new Date().toISOString(),
      },
    });
  }

  function addExtraExercise(exerciseId: string) {
    const extra = createExtraActiveExercise(exerciseId);
    if (!extra) return;
    patch({ exercises: [...active.exercises, extra], currentExerciseIndex: active.exercises.length });
    setOpenExerciseId(extra.activeId);
  }

  function openExerciseModal(activeId: string) {
    patch({ currentExerciseIndex: active.exercises.findIndex((exercise) => exercise.activeId === activeId) });
    setOpenExerciseId(activeId);
  }

  function closeExerciseModal() {
    setOpenExerciseId(undefined);
  }

  function saveWorkout() {
    const session = activeWorkoutToSession(active, elapsed);
    onSave(active.weekStart, session);
    onClear();
    onDone();
  }

  return (
    <div className="page-grid active-workout-page">
      <PageHeader
        eyebrow="Treino em andamento"
        title={active.workoutNameSnapshot}
        description={`${elapsed} min · ${completedExercises}/${active.exercises.length} exercícios`}
      />

      {active.restTimer ? (
        <section className="rest-timer-card">
          <span>Descanso</span>
          <strong>{formatTimer(restRemaining)}</strong>
          <div className="action-row">
            <button className="secondary-btn" onClick={() => adjustRest(30)} type="button">+30s</button>
            <button className="secondary-btn" onClick={() => adjustRest(-15)} type="button">-15s</button>
            <button className="secondary-btn" onClick={() => patch({ restTimer: undefined })} type="button">Pular</button>
          </div>
        </section>
      ) : null}

      <div className="stat-grid compact">
        <StatCard label="Exercícios" value={`${completedExercises}/${active.exercises.length}`} />
        <StatCard label="Séries" value={`${validSets}/${totalWorkSets}`} />
        <StatCard label="Aquecimento" value={warmupSets} />
        <StatCard label="Tempo" value={`${elapsed} min`} />
      </div>

      <SectionCard title="Volume por músculo" description="Leitura rápida do que já foi feito, incluindo indiretas.">
        <div className="muscle-mini-strip">
          {muscleGroups
            .filter((muscle) => volume[muscle].totalSets > 0 || volume[muscle].directSets > 0 || volume[muscle].indirectSets > 0)
            .map((muscle) => (
              <div className="muscle-mini-chip" key={muscle}>
                <strong>{muscle}</strong>
                <span>{formatNumber(volume[muscle].totalSets)} feitas</span>
                <small>{formatNumber(volume[muscle].directSets)} dir · {formatNumber(volume[muscle].indirectSets)} ind</small>
              </div>
            ))}
        </div>
      </SectionCard>

      <SectionCard title="Exercícios">
        <div className="active-exercise-list">
          {active.exercises.length === 0 ? (
            <EmptyState title="Sem exercícios" text="Adicione um exercício extra para registrar algo neste treino." />
          ) : null}
          {active.exercises.map((exercise, index) => (
            <button
              className={index === active.currentExerciseIndex ? "active-exercise-pill active" : "active-exercise-pill"}
              key={exercise.activeId}
              onClick={() => openExerciseModal(exercise.activeId)}
              type="button"
            >
              <div className="exercise-pill-main">
                <span>{exercise.exerciseName}</span>
                <small>{exercise.primaryMuscle} · {exercise.reps || "reps livres"}</small>
              </div>
              <div className="exercise-pill-meta">
                {exercise.isExtra ? <Badge tone="purple">Extra</Badge> : null}
                <Badge tone={countValidSets(exercise) >= Math.max(1, exercise.plannedSets) ? "green" : "amber"}>
                  {`${countValidSets(exercise)}/${Math.max(1, exercise.plannedSets)}`}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Exercício extra">
        <ExpandableDetails label="Adicionar exercício extra">
          <ExercisePicker onPick={(exercise) => addExtraExercise(exercise.id)} />
        </ExpandableDetails>
      </SectionCard>

      <SectionCard title="Finalizar treino">
        <div className="action-row">
          <button className="secondary-btn" onClick={() => exportActiveWorkoutPdf(active)} type="button">
            <Download size={18} /> PDF
          </button>
          <button className="primary-btn wide" onClick={() => setShowSummary((value) => !value)} type="button">
            <Check size={18} /> Finalizar treino
          </button>
        </div>
        {showSummary ? (
          <div className="finish-summary">
            <div className="stat-grid compact">
              <StatCard label="Duração" value={`${elapsed} min`} />
              <StatCard label="Séries válidas" value={validSets} />
              <StatCard label="Aquecimento" value={warmupSets} />
              <StatCard label="Aderência" value={`${formatNumber(totalWorkSets ? (validSets / totalWorkSets) * 100 : 0)}%`} />
            </div>
            <ExpandableDetails label="Volume por músculo">
              <div className="subtle-list">
                {muscleGroups.filter((muscle) => volume[muscle].totalSets > 0).map((muscle) => (
                  <span key={muscle}>{muscle}: {formatNumber(volume[muscle].totalSets)} séries</span>
                ))}
              </div>
            </ExpandableDetails>
            <button className="primary-btn wide" onClick={saveWorkout} type="button">Salvar treino</button>
          </div>
        ) : null}
      </SectionCard>

      {openExercise ? (
        <ExerciseModal
          beforeDate={active.date}
          exercise={openExercise}
          onAddSet={addSet}
          onClose={closeExerciseModal}
          onRemoveSet={removeSet}
          onSetChange={updateSet}
          onStartRest={startRest}
          weekLogs={weekLogs}
        />
      ) : null}
    </div>
  );
}

function ExerciseModal({
  exercise,
  weekLogs,
  beforeDate,
  onClose,
  onRemoveSet,
  onSetChange,
  onAddSet,
  onStartRest,
}: {
  exercise: ActiveWorkoutExercise;
  weekLogs: WeekLog[];
  beforeDate: string;
  onClose: () => void;
  onRemoveSet: (activeId: string, setId: string) => void;
  onSetChange: (activeId: string, setId: string, update: Partial<PerformedSet>) => void;
  onAddSet: (activeId: string, isWarmup?: boolean) => void;
  onStartRest: (activeId: string, durationSeconds?: number) => void;
}) {
  const lastPerformance = getLastExercisePerformance({ exerciseId: exercise.exerciseId, weekLogs, beforeDate });
  const orderedSets = [...exercise.sets].sort((a, b) => {
    if (a.isWarmup !== b.isWarmup) return a.isWarmup ? -1 : 1;
    return a.setNumber - b.setNumber;
  });
  let warmupCounter = 0;
  let workingCounter = 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <article className="exercise-modal" onClick={(event) => event.stopPropagation()}>
        <div className="card-title-row">
          <div>
            <h3>{exercise.exerciseName}</h3>
            <p>{exercise.primaryMuscle} · {exercise.reps || "reps livres"} · descanso {exercise.restSeconds ?? 90}s</p>
          </div>
          <div className="badge-row">
            {exercise.isExtra ? <Badge tone="purple">Extra</Badge> : null}
            <button className="text-btn" onClick={onClose} type="button"><X size={17} /> Fechar</button>
          </div>
        </div>
        <p className="last-performance">{formatLastPerformance(lastPerformance)}</p>

        <div className="set-list">
          {orderedSets.map((set) => {
            const displayNumber = set.isWarmup ? ++warmupCounter : ++workingCounter;
            return (
            <div className={set.completed ? "set-row completed" : "set-row"} key={set.id}>
              <span>{set.isWarmup ? `Aq ${displayNumber}` : displayNumber}</span>
              <input value={set.load ?? ""} onChange={(event) => onSetChange(exercise.activeId, set.id, { load: event.target.value })} placeholder="kg" />
              <input value={set.reps ?? ""} onChange={(event) => onSetChange(exercise.activeId, set.id, { reps: event.target.value })} placeholder="reps" />
              <button
                className={set.completed ? "set-complete active" : "set-complete"}
                onClick={() => onSetChange(exercise.activeId, set.id, { completed: !set.completed })}
                type="button"
              >
                <span className="set-complete-box" aria-hidden="true" />
                <span>Concluída</span>
              </button>
              <button className="icon-btn danger set-remove" onClick={() => onRemoveSet(exercise.activeId, set.id)} type="button" title="Remover série">
                <Trash2 size={16} />
              </button>
              <ExpandableDetails label="Mais">
                <div className="form-grid compact">
                  <label>RPE<input value={set.rpe ?? ""} onChange={(event) => onSetChange(exercise.activeId, set.id, { rpe: event.target.value })} /></label>
                  <label>RIR<input value={set.rir ?? ""} onChange={(event) => onSetChange(exercise.activeId, set.id, { rir: event.target.value })} /></label>
                  <label className="checkbox-label"><input checked={Boolean(set.isWarmup)} onChange={(event) => onSetChange(exercise.activeId, set.id, { isWarmup: event.target.checked })} type="checkbox" /> Aquecimento</label>
                </div>
              </ExpandableDetails>
            </div>
            );
          })}
        </div>

        <div className="action-row left">
          <button className="secondary-btn" onClick={() => onAddSet(exercise.activeId)} type="button"><Plus size={16} /> Série</button>
          <button className="secondary-btn" onClick={() => onAddSet(exercise.activeId, true)} type="button"><Plus size={16} /> Aquecimento</button>
          <button className="secondary-btn" onClick={() => onStartRest(exercise.activeId, exercise.restSeconds ?? 90)} type="button"><TimerReset size={16} /> Descanso</button>
        </div>
      </article>
    </div>
  );
}

function getRestRemaining(active: ActiveWorkoutSession, now: number) {
  if (!active.restTimer) return 0;
  const elapsed = Math.floor((now - new Date(active.restTimer.startedAt).getTime()) / 1000);
  return Math.max(0, active.restTimer.durationSeconds - elapsed);
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}
