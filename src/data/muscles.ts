import type { MuscleGroup, Weekday } from "../types";

export const muscleGroups: MuscleGroup[] = [
  "Peito",
  "Costas",
  "Ombros",
  "Ombro anterior",
  "Ombro lateral",
  "Ombro posterior",
  "Bíceps",
  "Tríceps",
  "Quadríceps",
  "Posterior de coxa",
  "Glúteos",
  "Panturrilhas",
  "Abdômen",
  "Trapézio",
  "Lombar",
];

export const weekDays: { key: Weekday; label: string; short: string }[] = [
  { key: "monday", label: "Segunda", short: "Seg" },
  { key: "tuesday", label: "Terça", short: "Ter" },
  { key: "wednesday", label: "Quarta", short: "Qua" },
  { key: "thursday", label: "Quinta", short: "Qui" },
  { key: "friday", label: "Sexta", short: "Sex" },
  { key: "saturday", label: "Sábado", short: "Sáb" },
  { key: "sunday", label: "Domingo", short: "Dom" },
];
