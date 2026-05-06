import { getExerciseDefinition } from "../data/exercises";
import type { ActiveWorkoutExercise, ActiveWorkoutSession, PlannedSessionExercise, Weekday, Workout } from "../types";
import { createPerformedSets, createPlannedSessionSnapshot } from "./history";

export function createActiveExerciseFromSnapshot(snapshot: PlannedSessionExercise, isExtra = false): ActiveWorkoutExercise {
  return {
    ...snapshot,
    activeId: crypto.randomUUID(),
    isExtra,
    skipped: false,
    sets: createPerformedSets({
      workSets: Math.max(1, snapshot.plannedSets || 3),
      warmupSets: snapshot.warmupSets ?? 0,
      reps: snapshot.reps,
      load: snapshot.load,
      rpe: snapshot.targetRpe,
      rir: snapshot.targetRir,
      completed: false,
    }),
    notes: snapshot.notes,
  };
}

export function createActiveWorkoutSession({
  workout,
  weekStart,
  date,
  weekday,
}: {
  workout: Workout;
  weekStart: string;
  date: string;
  weekday: Weekday;
}): ActiveWorkoutSession {
  const plannedSnapshot = createPlannedSessionSnapshot(workout);
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    weekStart,
    date,
    weekday,
    startedAt: now,
    updatedAt: now,
    workoutId: workout.id,
    workoutNameSnapshot: workout.name,
    plannedSnapshot,
    exercises: plannedSnapshot.map((snapshot) => createActiveExerciseFromSnapshot(snapshot)),
    currentExerciseIndex: 0,
  };
}

export function createManualActiveWorkoutSession({
  weekStart,
  date,
  weekday,
}: {
  weekStart: string;
  date: string;
  weekday: Weekday;
}): ActiveWorkoutSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    weekStart,
    date,
    weekday,
    startedAt: now,
    updatedAt: now,
    workoutNameSnapshot: "Treino manual",
    plannedSnapshot: [],
    exercises: [],
    currentExerciseIndex: 0,
  };
}

export function createExtraActiveExercise(exerciseId: string): ActiveWorkoutExercise | undefined {
  const exercise = getExerciseDefinition(exerciseId);
  if (!exercise) return undefined;
  return createActiveExerciseFromSnapshot({
    id: crypto.randomUUID(),
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: [...exercise.secondaryMuscles],
    type: exercise.type,
    equipment: [...exercise.equipment],
    movementPattern: exercise.movementPattern,
    plannedSets: 0,
    reps: "",
    warmupSets: 0,
    restSeconds: 90,
  }, true);
}

export function elapsedMinutes(startedAt: string, endedAt = new Date().toISOString()) {
  return Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000));
}
