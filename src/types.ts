export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Ombro anterior"
  | "Ombro lateral"
  | "Ombro posterior"
  | "Bíceps"
  | "Tríceps"
  | "Quadríceps"
  | "Posterior de coxa"
  | "Glúteos"
  | "Panturrilhas"
  | "Abdômen"
  | "Trapézio"
  | "Lombar";

export type ExerciseDefinition = {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: "compound" | "isolation";
  equipment: string[];
  movementPattern?: string;
};

export type WorkoutExercise = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  load?: string;
  notes?: string;
  warmupSets?: number;
  estimatedMinutes?: number;
  targetRpe?: string;
  targetRir?: string;
  restSeconds?: number;
};

export type Workout = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WeeklyPlan = Partial<Record<Weekday, string>>;

export type Settings = {
  countIndirectSets: boolean;
  indirectSetMultiplier: number;
};

export type PlannerSettings = {
  emphasisMuscles: MuscleGroup[];
  targetVolumes: Partial<Record<MuscleGroup, number>>;
};

export type MuscleVolume = {
  directSets: number;
  indirectSets: number;
  totalSets: number;
};

export type MuscleFrequency = {
  directDays: number;
  indirectDays: number;
  totalDays: number;
};

export type PlanStatus = "below" | "within" | "above" | "unset";

export type MusclePlanStatus = {
  status: PlanStatus;
  difference?: number;
  percentage?: number;
  target?: number;
};

export type SessionStatus = "completed" | "partial" | "skipped";

export type PlannedSessionExercise = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  type: "compound" | "isolation";
  equipment: string[];
  movementPattern?: string;
  plannedSets: number;
  reps: string;
  load?: string;
  warmupSets?: number;
  targetRpe?: string;
  targetRir?: string;
  estimatedMinutes?: number;
  restSeconds?: number;
  notes?: string;
};

export type PerformedSet = {
  id: string;
  setNumber: number;
  load?: string;
  reps?: string;
  rpe?: string;
  rir?: string;
  isWarmup?: boolean;
  completed: boolean;
};

export type PerformedExercise = {
  id: string;
  exerciseId: string;
  plannedSnapshotId?: string;
  exerciseNameSnapshot?: string;
  primaryMuscle?: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  type?: "compound" | "isolation";
  equipment?: string[];
  movementPattern?: string;
  isExtra?: boolean;
  skipped?: boolean;
  sets: PerformedSet[];
  notes?: string;
};

export type WorkoutSession = {
  id: string;
  date: string;
  weekday: Weekday;
  workoutId?: string;
  workoutNameSnapshot?: string;
  status: SessionStatus;
  durationMinutes?: number;
  sessionNote?: string;
  plannedSnapshot: PlannedSessionExercise[];
  performedExercises: PerformedExercise[];
};

export type WeekLog = {
  id: string;
  weekStart: string;
  weekNote?: string;
  sessions: WorkoutSession[];
};

export type ActiveWorkoutExercise = PlannedSessionExercise & {
  activeId: string;
  isExtra?: boolean;
  skipped?: boolean;
  sets: PerformedSet[];
  notes?: string;
};

export type RestTimer = {
  exerciseActiveId: string;
  startedAt: string;
  durationSeconds: number;
};

export type ActiveWorkoutSession = {
  id: string;
  weekStart: string;
  date: string;
  weekday: Weekday;
  startedAt: string;
  updatedAt: string;
  workoutId?: string;
  workoutNameSnapshot: string;
  plannedSnapshot: PlannedSessionExercise[];
  exercises: ActiveWorkoutExercise[];
  currentExerciseIndex: number;
  restTimer?: RestTimer;
};

export type AppExportData = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
  plannerSettings: PlannerSettings;
  weekLogs: WeekLog[];
};
