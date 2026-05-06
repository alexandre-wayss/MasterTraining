import type { PlannerSettings, Settings, WeeklyPlan, Workout } from "../types";

export const demoWorkouts: Workout[] = [
  {
    id: "workout-push",
    name: "Push",
    exercises: [
      { id: "we-push-1", exerciseId: "supino-reto", sets: 4, reps: "8-10" },
      { id: "we-push-2", exerciseId: "supino-inclinado", sets: 3, reps: "8-10" },
      { id: "we-push-3", exerciseId: "desenvolvimento-militar", sets: 3, reps: "8-10" },
      { id: "we-push-4", exerciseId: "elevacao-lateral", sets: 4, reps: "12-15" },
      { id: "we-push-5", exerciseId: "triceps-corda", sets: 3, reps: "10-12" },
    ],
  },
  {
    id: "workout-pull",
    name: "Pull",
    exercises: [
      { id: "we-pull-1", exerciseId: "puxada-alta", sets: 4, reps: "8-10" },
      { id: "we-pull-2", exerciseId: "remada-curvada", sets: 4, reps: "8-10" },
      { id: "we-pull-3", exerciseId: "remada-baixa", sets: 3, reps: "10-12" },
      { id: "we-pull-4", exerciseId: "rosca-direta", sets: 3, reps: "8-10" },
      { id: "we-pull-5", exerciseId: "rosca-martelo", sets: 2, reps: "10-12" },
    ],
  },
  {
    id: "workout-legs",
    name: "Legs",
    exercises: [
      { id: "we-legs-1", exerciseId: "agachamento-livre", sets: 4, reps: "6-8" },
      { id: "we-legs-2", exerciseId: "leg-press", sets: 4, reps: "10-12" },
      { id: "we-legs-3", exerciseId: "cadeira-extensora", sets: 3, reps: "12-15" },
      { id: "we-legs-4", exerciseId: "mesa-flexora", sets: 4, reps: "10-12" },
      { id: "we-legs-5", exerciseId: "panturrilha-em-pe", sets: 4, reps: "12-15" },
    ],
  },
];

export const demoWeeklyPlan: WeeklyPlan = {
  monday: "workout-push",
  tuesday: "workout-pull",
  wednesday: "workout-legs",
  friday: "workout-push",
  saturday: "workout-pull",
};

export const demoSettings: Settings = {
  countIndirectSets: true,
  indirectSetMultiplier: 0.5,
};

export const demoPlannerSettings: PlannerSettings = {
  emphasisMuscles: ["Peito", "Costas", "Ombro lateral"],
  targetVolumes: {
    Peito: 12,
    Costas: 14,
    "Ombro lateral": 12,
    "Ombro anterior": 8,
    Bíceps: 8,
    Tríceps: 8,
    Quadríceps: 12,
    "Posterior de coxa": 10,
    Glúteos: 8,
    Panturrilhas: 8,
    Abdômen: 6,
  },
};
