import { getExerciseDefinition } from "../data/exercises";
import { muscleGroups, weekDays } from "../data/muscles";
import type {
  ActiveWorkoutExercise,
  ActiveWorkoutSession,
  MuscleGroup,
  MuscleVolume,
  PerformedExercise,
  PerformedSet,
  PlannedSessionExercise,
  Settings,
  WeekLog,
  Weekday,
  WeeklyPlan,
  Workout,
  WorkoutExercise,
  WorkoutSession,
} from "../types";
import { getDateForWeekday } from "./dates";

const emptyVolume = (): Record<MuscleGroup, MuscleVolume> =>
  Object.fromEntries(
    muscleGroups.map((muscle) => [
      muscle,
      { directSets: 0, indirectSets: 0, totalSets: 0 },
    ]),
  ) as Record<MuscleGroup, MuscleVolume>;

function finalizeVolume(volume: Record<MuscleGroup, MuscleVolume>, settings: Settings) {
  muscleGroups.forEach((muscle) => {
    volume[muscle].totalSets = settings.countIndirectSets
      ? volume[muscle].directSets + volume[muscle].indirectSets
      : volume[muscle].directSets;
  });
  return volume;
}

function addSnapshotVolume(
  volume: Record<MuscleGroup, MuscleVolume>,
  snapshot: Pick<PlannedSessionExercise, "primaryMuscle" | "secondaryMuscles">,
  sets: number,
  settings: Settings,
) {
  const normalizedSets = Number.isFinite(sets) ? Math.max(0, sets) : 0;
  volume[snapshot.primaryMuscle].directSets += normalizedSets;
  snapshot.secondaryMuscles.forEach((muscle) => {
    volume[muscle].indirectSets += normalizedSets * settings.indirectSetMultiplier;
  });
}

export function createPerformedSets({
  workSets,
  warmupSets = 0,
  reps,
  load,
  rpe,
  rir,
  completed = true,
}: {
  workSets: number;
  warmupSets?: number;
  reps?: string;
  load?: string;
  rpe?: string;
  rir?: string;
  completed?: boolean;
}): PerformedSet[] {
  const warmups = Array.from({ length: Math.max(0, warmupSets) }, (_, index) => ({
    id: crypto.randomUUID(),
    setNumber: index + 1,
    load,
    reps,
    rpe,
    rir,
    isWarmup: true,
    completed,
  }));
  const working = Array.from({ length: Math.max(0, workSets) }, (_, index) => ({
    id: crypto.randomUUID(),
    setNumber: warmups.length + index + 1,
    load,
    reps,
    rpe,
    rir,
    isWarmup: false,
    completed,
  }));
  return [...warmups, ...working];
}

export function countValidSets(performed: PerformedExercise | ActiveWorkoutExercise) {
  return performed.sets.filter((set) => set.completed && !set.isWarmup).length;
}

export function countWarmupSets(performed: PerformedExercise | ActiveWorkoutExercise) {
  return performed.sets.filter((set) => set.completed && set.isWarmup).length;
}

export function normalizePerformedExercise(performed: PerformedExercise | Record<string, unknown>): PerformedExercise {
  const legacy = performed as PerformedExercise & {
    performedSets?: number;
    reps?: string;
    load?: string;
    rpe?: string;
    rir?: string;
    warmupSets?: number;
  };
  if (Array.isArray(legacy.sets)) {
    return {
      ...legacy,
      sets: legacy.sets.map((set, index) => ({
        ...set,
        id: set.id || crypto.randomUUID(),
        setNumber: set.setNumber || index + 1,
        completed: Boolean(set.completed),
      })),
    };
  }

  return {
    id: legacy.id || crypto.randomUUID(),
    exerciseId: legacy.exerciseId,
    plannedSnapshotId: legacy.plannedSnapshotId,
    exerciseNameSnapshot: legacy.exerciseNameSnapshot,
    primaryMuscle: legacy.primaryMuscle,
    secondaryMuscles: legacy.secondaryMuscles,
    type: legacy.type,
    equipment: legacy.equipment,
    movementPattern: legacy.movementPattern,
    isExtra: legacy.isExtra,
    skipped: legacy.skipped,
    notes: legacy.notes,
    sets: createPerformedSets({
      workSets: legacy.performedSets ?? 0,
      warmupSets: legacy.warmupSets ?? 0,
      reps: legacy.reps,
      load: legacy.load,
      rpe: legacy.rpe,
      rir: legacy.rir,
      completed: true,
    }),
  };
}

export function normalizeWeekLogs(weekLogs: WeekLog[]) {
  return weekLogs.map((week) => ({
    ...week,
    sessions: week.sessions.map((session) => ({
      ...session,
      performedExercises: session.performedExercises.map(normalizePerformedExercise),
    })),
  }));
}

export function createPlannedSessionSnapshot(workout: Workout): PlannedSessionExercise[] {
  return workout.exercises.flatMap((item: WorkoutExercise) => {
    const exercise = getExerciseDefinition(item.exerciseId);
    if (!exercise) return [];
    return [{
      id: crypto.randomUUID(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      secondaryMuscles: [...exercise.secondaryMuscles],
      type: exercise.type,
      equipment: [...exercise.equipment],
      movementPattern: exercise.movementPattern,
      plannedSets: item.sets,
      reps: item.reps,
      load: item.load,
      warmupSets: item.warmupSets ?? 0,
      targetRpe: item.targetRpe,
      targetRir: item.targetRir,
      estimatedMinutes: item.estimatedMinutes,
      restSeconds: item.restSeconds,
      notes: item.notes,
    }];
  });
}

export function createPerformedFromPlanned(snapshot: PlannedSessionExercise, completed = true): PerformedExercise {
  return {
    id: crypto.randomUUID(),
    exerciseId: snapshot.exerciseId,
    plannedSnapshotId: snapshot.id,
    exerciseNameSnapshot: snapshot.exerciseName,
    primaryMuscle: snapshot.primaryMuscle,
    secondaryMuscles: [...snapshot.secondaryMuscles],
    type: snapshot.type,
    equipment: [...snapshot.equipment],
    movementPattern: snapshot.movementPattern,
    sets: createPerformedSets({
      workSets: snapshot.plannedSets,
      warmupSets: snapshot.warmupSets ?? 0,
      reps: snapshot.reps,
      load: snapshot.load,
      rpe: snapshot.targetRpe,
      rir: snapshot.targetRir,
      completed,
    }),
    notes: "",
  };
}

export function createPerformedFromActiveExercise(exercise: ActiveWorkoutExercise): PerformedExercise {
  return {
    id: crypto.randomUUID(),
    exerciseId: exercise.exerciseId,
    plannedSnapshotId: exercise.isExtra ? undefined : exercise.id,
    exerciseNameSnapshot: exercise.exerciseName,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: [...exercise.secondaryMuscles],
    type: exercise.type,
    equipment: [...exercise.equipment],
    movementPattern: exercise.movementPattern,
    isExtra: exercise.isExtra,
    skipped: exercise.skipped,
    sets: exercise.sets.map((set) => ({ ...set })),
    notes: exercise.notes,
  };
}

export function calculateWorkoutDuration(snapshot: PlannedSessionExercise[]) {
  return snapshot.reduce((total, exercise) => total + (exercise.estimatedMinutes ?? 0), 0);
}

export function createSessionFromWorkout({
  workout,
  weekStart,
  weekday,
  status,
  fillPerformed,
}: {
  workout?: Workout;
  weekStart: string;
  weekday: Weekday;
  status: "completed" | "partial" | "skipped";
  fillPerformed: boolean;
}): WorkoutSession {
  const plannedSnapshot = workout ? createPlannedSessionSnapshot(workout) : [];
  return {
    id: crypto.randomUUID(),
    date: getDateForWeekday(weekStart, weekday),
    weekday,
    workoutId: workout?.id,
    workoutNameSnapshot: workout?.name ?? "Descanso",
    status,
    durationMinutes: calculateWorkoutDuration(plannedSnapshot) || undefined,
    sessionNote: "",
    plannedSnapshot,
    performedExercises: status === "skipped" || !fillPerformed
      ? []
      : plannedSnapshot.map((snapshot) => createPerformedFromPlanned(snapshot, true)),
  };
}

export function markSessionAsPlanned(workout: Workout | undefined, weekStart: string, weekday: Weekday) {
  return createSessionFromWorkout({ workout, weekStart, weekday, status: "completed", fillPerformed: true });
}

function getPerformedSnapshot(session: WorkoutSession, performed: PerformedExercise) {
  const snapshot = performed.plannedSnapshotId
    ? session.plannedSnapshot.find((item) => item.id === performed.plannedSnapshotId)
    : undefined;
  if (snapshot) return snapshot;
  if (performed.primaryMuscle && performed.secondaryMuscles) {
    return {
      primaryMuscle: performed.primaryMuscle,
      secondaryMuscles: performed.secondaryMuscles,
      movementPattern: performed.movementPattern,
      exerciseName: performed.exerciseNameSnapshot ?? performed.exerciseId,
    };
  }
  const exercise = getExerciseDefinition(performed.exerciseId);
  if (!exercise) return undefined;
  return {
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles,
    movementPattern: exercise.movementPattern,
    exerciseName: exercise.name,
  };
}

export function calculateSessionPlannedVolume(session: WorkoutSession, settings: Settings) {
  const volume = emptyVolume();
  session.plannedSnapshot.forEach((snapshot) => addSnapshotVolume(volume, snapshot, snapshot.plannedSets, settings));
  return finalizeVolume(volume, settings);
}

export function calculateSessionPerformedVolume(session: WorkoutSession, settings: Settings) {
  const volume = emptyVolume();
  if (session.status === "skipped") return finalizeVolume(volume, settings);
  session.performedExercises.map(normalizePerformedExercise).forEach((performed) => {
    if (performed.skipped) return;
    const snapshot = getPerformedSnapshot(session, performed);
    if (!snapshot) return;
    addSnapshotVolume(volume, snapshot, countValidSets(performed), settings);
  });
  return finalizeVolume(volume, settings);
}

export function calculatePlannedVolumeForWeek(workouts: Workout[], weeklyPlan: WeeklyPlan, settings: Settings) {
  const volume = emptyVolume();
  const workoutMap = new Map(workouts.map((workout) => [workout.id, workout]));
  weekDays.forEach(({ key }) => {
    const workout = weeklyPlan[key] ? workoutMap.get(weeklyPlan[key]!) : undefined;
    if (!workout) return;
    createPlannedSessionSnapshot(workout).forEach((snapshot) => {
      addSnapshotVolume(volume, snapshot, snapshot.plannedSets, settings);
    });
  });
  return finalizeVolume(volume, settings);
}

export function calculatePerformedVolumeForWeek(weekLog: WeekLog | undefined, settings: Settings) {
  const volume = emptyVolume();
  weekLog?.sessions.forEach((session) => {
    const sessionVolume = calculateSessionPerformedVolume(session, settings);
    muscleGroups.forEach((muscle) => {
      volume[muscle].directSets += sessionVolume[muscle].directSets;
      volume[muscle].indirectSets += sessionVolume[muscle].indirectSets;
    });
  });
  return finalizeVolume(volume, settings);
}

export function calculatePlannedVsPerformedVolume({
  workouts,
  weeklyPlan,
  weekLog,
  settings,
}: {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  weekLog?: WeekLog;
  settings: Settings;
}) {
  return {
    planned: calculatePlannedVolumeForWeek(workouts, weeklyPlan, settings),
    performed: calculatePerformedVolumeForWeek(weekLog, settings),
  };
}

export function calculateAdherenceMetrics({
  workouts,
  weeklyPlan,
  weekLog,
  settings,
}: {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  weekLog?: WeekLog;
  settings: Settings;
}) {
  const plannedSessions = Object.values(weeklyPlan).filter(Boolean).length;
  const performedSessions = weekLog?.sessions.filter((session) => session.status === "completed" || session.status === "partial").length ?? 0;
  const skippedSessions = weekLog?.sessions.filter((session) => session.status === "skipped").length ?? 0;
  const plannedVolume = calculatePlannedVolumeForWeek(workouts, weeklyPlan, settings);
  const performedVolume = calculatePerformedVolumeForWeek(weekLog, settings);
  const plannedTotal = muscleGroups.reduce((sum, muscle) => sum + plannedVolume[muscle].totalSets, 0);
  const performedTotal = muscleGroups.reduce((sum, muscle) => sum + performedVolume[muscle].totalSets, 0);
  const volumeByMuscle = Object.fromEntries(
    muscleGroups.map((muscle) => [
      muscle,
      plannedVolume[muscle].totalSets > 0
        ? (performedVolume[muscle].totalSets / plannedVolume[muscle].totalSets) * 100
        : undefined,
    ]),
  ) as Partial<Record<MuscleGroup, number>>;

  return {
    plannedSessions,
    performedSessions,
    skippedSessions,
    sessionAdherence: plannedSessions > 0 ? (performedSessions / plannedSessions) * 100 : 0,
    plannedVolumeTotal: plannedTotal,
    performedVolumeTotal: performedTotal,
    volumeAdherence: plannedTotal > 0 ? (performedTotal / plannedTotal) * 100 : 0,
    volumeByMuscle,
  };
}

export function compareWeeks(current: WeekLog | undefined, previous: WeekLog | undefined, settings: Settings) {
  const currentVolume = calculatePerformedVolumeForWeek(current, settings);
  const previousVolume = calculatePerformedVolumeForWeek(previous, settings);
  return Object.fromEntries(
    muscleGroups.map((muscle) => {
      const currentTotal = currentVolume[muscle].totalSets;
      const previousTotal = previousVolume[muscle].totalSets;
      return [
        muscle,
        {
          current: currentTotal,
          previous: previousTotal,
          difference: currentTotal - previousTotal,
          percent: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : undefined,
        },
      ];
    }),
  ) as Record<MuscleGroup, { current: number; previous: number; difference: number; percent?: number }>;
}

export function calculateMovementPatternVolume(sessions: WorkoutSession[], _settings: Settings, mode: "planned" | "performed") {
  const result: Record<string, number> = {};
  sessions.forEach((session) => {
    if (mode === "performed" && session.status === "skipped") return;
    if (mode === "planned") {
      session.plannedSnapshot.forEach((snapshot) => {
        const key = snapshot.movementPattern || "Sem padrão";
        result[key] = (result[key] ?? 0) + snapshot.plannedSets;
      });
    } else {
      session.performedExercises.map(normalizePerformedExercise).forEach((performed) => {
        if (performed.skipped) return;
        const snapshot = getPerformedSnapshot(session, performed);
        if (!snapshot) return;
        const key = snapshot.movementPattern || "Sem padrão";
        result[key] = (result[key] ?? 0) + countValidSets(performed);
      });
    }
  });
  return result;
}

export function calculateHeatmapData({
  workouts,
  weeklyPlan,
  weekLog,
  settings,
  mode,
}: {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  weekLog?: WeekLog;
  settings: Settings;
  mode: "planned" | "performed";
}) {
  const workoutMap = new Map(workouts.map((workout) => [workout.id, workout]));
  return weekDays.map(({ key, label }) => {
    let volume = emptyVolume();
    if (mode === "performed") {
      const session = weekLog?.sessions.find((item) => item.weekday === key);
      volume = session ? calculateSessionPerformedVolume(session, settings) : volume;
    } else {
      const workout = weeklyPlan[key] ? workoutMap.get(weeklyPlan[key]!) : undefined;
      if (workout) {
        createPlannedSessionSnapshot(workout).forEach((snapshot) => addSnapshotVolume(volume, snapshot, snapshot.plannedSets, settings));
      }
      finalizeVolume(volume, settings);
    }
    return { weekday: key, label, volume };
  });
}

type LoadEntry = {
  weekStart: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  load: string;
  reps?: string;
  rpe?: string;
  rir?: string;
  numericLoad?: number;
};

export function calculateExerciseLoadHistory(weekLogs: WeekLog[]) {
  const entries: LoadEntry[] = weekLogs
    .flatMap((week) => week.sessions.map((session) => ({ week, session })))
    .flatMap(({ week, session }) =>
      session.performedExercises.map(normalizePerformedExercise).flatMap((performed) => {
        const snapshot = getPerformedSnapshot(session, performed);
        return performed.sets
          .filter((set) => set.completed && !set.isWarmup && set.load)
          .map((set) => {
            const numeric = parseFloat(String(set.load).replace(",", ".").replace(/[^\d.-]/g, ""));
            return {
              weekStart: week.weekStart,
              date: session.date,
              exerciseId: performed.exerciseId,
              exerciseName: snapshot?.exerciseName ?? performed.exerciseNameSnapshot ?? performed.exerciseId,
              load: set.load ?? "",
              reps: set.reps,
              rpe: set.rpe,
              rir: set.rir,
              numericLoad: Number.isFinite(numeric) ? numeric : undefined,
            };
          });
      }),
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return Object.values(
    entries.reduce<Record<string, { exerciseName: string; entries: LoadEntry[]; bestNumeric?: number }>>((acc, entry) => {
      const key = entry.exerciseId;
      acc[key] ??= { exerciseName: entry.exerciseName, entries: [], bestNumeric: undefined };
      acc[key].entries.push(entry);
      if (entry.numericLoad !== undefined) {
        acc[key].bestNumeric = Math.max(acc[key].bestNumeric ?? entry.numericLoad, entry.numericLoad);
      }
      return acc;
    }, {}),
  );
}

export function getLastExercisePerformance({
  exerciseId,
  weekLogs,
  beforeDate,
}: {
  exerciseId: string;
  weekLogs: WeekLog[];
  beforeDate: string;
}) {
  const sessions = weekLogs
    .flatMap((week) => week.sessions)
    .filter((session) => session.date < beforeDate && session.status !== "skipped")
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const session of sessions) {
    const performed = session.performedExercises
      .map(normalizePerformedExercise)
      .find((item) => item.exerciseId === exerciseId && !item.skipped && countValidSets(item) > 0);
    if (performed) {
      return {
        date: session.date,
        exerciseName: getPerformedSnapshot(session, performed)?.exerciseName ?? performed.exerciseNameSnapshot ?? performed.exerciseId,
        sets: performed.sets.filter((set) => set.completed && !set.isWarmup),
      };
    }
  }
  return undefined;
}

export function formatLastPerformance(performance: ReturnType<typeof getLastExercisePerformance>) {
  if (!performance || performance.sets.length === 0) return "Sem histórico anterior";
  const firstLoad = performance.sets.find((set) => set.load)?.load;
  const allSameLoad = firstLoad && performance.sets.every((set) => !set.load || set.load === firstLoad);
  if (allSameLoad) {
    return `Última vez: ${firstLoad} x ${performance.sets.map((set) => set.reps || "-").join(", ")}`;
  }
  return `Última vez: ${performance.sets.map((set) => `${set.load || "sem carga"} x ${set.reps || "-"}`).join("; ")}`;
}

export function activeWorkoutToSession(active: ActiveWorkoutSession, durationMinutes?: number): WorkoutSession {
  const plannedWorkSets = active.plannedSnapshot.reduce((sum, exercise) => sum + exercise.plannedSets, 0);
  const validSets = active.exercises.reduce((sum, exercise) => sum + (exercise.skipped ? 0 : countValidSets(exercise)), 0);
  const hasSkipped = active.exercises.some((exercise) => exercise.skipped);
  const status = validSets >= plannedWorkSets && !hasSkipped ? "completed" : "partial";

  return {
    id: crypto.randomUUID(),
    date: active.date,
    weekday: active.weekday,
    workoutId: active.workoutId,
    workoutNameSnapshot: active.workoutNameSnapshot,
    status,
    durationMinutes,
    sessionNote: "",
    plannedSnapshot: active.plannedSnapshot.map((snapshot) => ({ ...snapshot })),
    performedExercises: active.exercises.map(createPerformedFromActiveExercise),
  };
}
