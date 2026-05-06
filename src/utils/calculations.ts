import { exerciseLibrary, getExerciseDefinition } from "../data/exercises";
import { muscleGroups, weekDays } from "../data/muscles";
import type {
  ExerciseDefinition,
  MuscleFrequency,
  MuscleGroup,
  MusclePlanStatus,
  MuscleVolume,
  Settings,
  WeeklyPlan,
  Workout,
} from "../types";

type CalculationInput = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  exerciseLibrary?: ExerciseDefinition[];
  settings: Settings;
};

const emptyVolume = (): Record<MuscleGroup, MuscleVolume> =>
  Object.fromEntries(
    muscleGroups.map((muscle) => [
      muscle,
      { directSets: 0, indirectSets: 0, totalSets: 0 },
    ]),
  ) as Record<MuscleGroup, MuscleVolume>;

const emptyFrequency = (): Record<MuscleGroup, MuscleFrequency> =>
  Object.fromEntries(
    muscleGroups.map((muscle) => [
      muscle,
      { directDays: 0, indirectDays: 0, totalDays: 0 },
    ]),
  ) as Record<MuscleGroup, MuscleFrequency>;

const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item]));

function findExercise(library: ExerciseDefinition[], id: string) {
  return library.find((exercise) => exercise.id === id);
}

function finalizeVolume(
  volume: Record<MuscleGroup, MuscleVolume>,
  settings: Settings,
) {
  muscleGroups.forEach((muscle) => {
    const item = volume[muscle];
    item.totalSets = settings.countIndirectSets
      ? item.directSets + item.indirectSets
      : item.directSets;
  });
  return volume;
}

function addExerciseVolume(
  volume: Record<MuscleGroup, MuscleVolume>,
  exercise: ExerciseDefinition,
  sets: number,
  settings: Settings,
) {
  const normalizedSets = Number.isFinite(sets) ? Math.max(0, sets) : 0;
  volume[exercise.primaryMuscle].directSets += normalizedSets;
  exercise.secondaryMuscles.forEach((muscle) => {
    volume[muscle].indirectSets += normalizedSets * settings.indirectSetMultiplier;
  });
}

export function calculateMuscleVolume({
  workouts,
  weeklyPlan,
  exerciseLibrary: library = exerciseLibrary,
  settings,
}: CalculationInput) {
  const volume = emptyVolume();
  const workoutMap = byId(workouts);

  weekDays.forEach(({ key }) => {
    const workoutId = weeklyPlan[key];
    const workout = workoutId ? workoutMap.get(workoutId) : undefined;
    if (!workout) return;

    workout.exercises.forEach((workoutExercise) => {
      const exercise = findExercise(library, workoutExercise.exerciseId);
      if (!exercise) return;
      addExerciseVolume(volume, exercise, workoutExercise.sets, settings);
    });
  });

  return finalizeVolume(volume, settings);
}

export function calculatePlanStatus({
  muscleVolume,
  targetVolumes,
}: {
  muscleVolume: Record<MuscleGroup, MuscleVolume>;
  targetVolumes: Partial<Record<MuscleGroup, number>>;
}) {
  return Object.fromEntries(
    muscleGroups.map((muscle) => {
      const target = targetVolumes[muscle];
      const total = muscleVolume[muscle].totalSets;
      if (!target || target <= 0) {
        return [muscle, { status: "unset" } satisfies MusclePlanStatus];
      }

      const percentage = (total / target) * 100;
      const difference = total - target;
      const status =
        total < target * 0.9 ? "below" : total > target * 1.1 ? "above" : "within";

      return [
        muscle,
        { status, difference, percentage, target } satisfies MusclePlanStatus,
      ];
    }),
  ) as Record<MuscleGroup, MusclePlanStatus>;
}

export function calculateMuscleFrequency({
  workouts,
  weeklyPlan,
  exerciseLibrary: library = exerciseLibrary,
}: CalculationInput) {
  const frequency = emptyFrequency();
  const workoutMap = byId(workouts);

  weekDays.forEach(({ key }) => {
    const workoutId = weeklyPlan[key];
    const workout = workoutId ? workoutMap.get(workoutId) : undefined;
    if (!workout) return;

    const direct = new Set<MuscleGroup>();
    const indirect = new Set<MuscleGroup>();

    workout.exercises.forEach((workoutExercise) => {
      const exercise = findExercise(library, workoutExercise.exerciseId);
      if (!exercise || workoutExercise.sets <= 0) return;
      direct.add(exercise.primaryMuscle);
      exercise.secondaryMuscles.forEach((muscle) => indirect.add(muscle));
    });

    muscleGroups.forEach((muscle) => {
      if (direct.has(muscle)) frequency[muscle].directDays += 1;
      if (indirect.has(muscle)) frequency[muscle].indirectDays += 1;
      if (direct.has(muscle) || indirect.has(muscle)) frequency[muscle].totalDays += 1;
    });
  });

  return frequency;
}

export function calculateVolumeByDay({
  workouts,
  weeklyPlan,
  exerciseLibrary: library = exerciseLibrary,
  settings,
}: CalculationInput) {
  const workoutMap = byId(workouts);

  return Object.fromEntries(
    weekDays.map(({ key }) => {
      const volume = emptyVolume();
      const workoutId = weeklyPlan[key];
      const workout = workoutId ? workoutMap.get(workoutId) : undefined;
      if (workout) {
        workout.exercises.forEach((workoutExercise) => {
          const exercise = findExercise(library, workoutExercise.exerciseId);
          if (!exercise) return;
          addExerciseVolume(volume, exercise, workoutExercise.sets, settings);
        });
      }
      return [key, finalizeVolume(volume, settings)];
    }),
  );
}

export function calculateVolumeByWorkout({
  workouts,
  exerciseLibrary: library = exerciseLibrary,
  settings,
}: {
  workouts: Workout[];
  exerciseLibrary?: ExerciseDefinition[];
  settings: Settings;
}) {
  return Object.fromEntries(
    workouts.map((workout) => {
      const volume = emptyVolume();
      workout.exercises.forEach((workoutExercise) => {
        const exercise = findExercise(library, workoutExercise.exerciseId);
        if (!exercise) return;
        addExerciseVolume(volume, exercise, workoutExercise.sets, settings);
      });
      return [workout.id, finalizeVolume(volume, settings)];
    }),
  ) as Record<string, Record<MuscleGroup, MuscleVolume>>;
}

export { getExerciseDefinition };
