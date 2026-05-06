import { jsPDF } from "jspdf";
import { exerciseLibrary } from "../data/exercises";
import type {
  ActiveWorkoutSession,
  Workout,
  WorkoutSession,
} from "../types";
import { countValidSets, countWarmupSets, normalizePerformedExercise } from "./history";

type PdfLine = {
  text: string;
  size?: number;
  color?: [number, number, number];
  bold?: boolean;
  gapAfter?: number;
};

function getExerciseName(exerciseId: string) {
  return exerciseLibrary.find((item) => item.id === exerciseId)?.name ?? exerciseId;
}

function addTextBlock(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, size = 11) {
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * (size * 0.45) + 2;
}

function addLines(doc: jsPDF, lines: PdfLine[], startY: number) {
  let y = startY;
  const left = 14;
  const width = doc.internal.pageSize.getWidth() - 28;
  lines.forEach((line) => {
    if (line.color) doc.setTextColor(...line.color);
    else doc.setTextColor(25, 27, 31);
    doc.setFontSize(line.size ?? 11);
    doc.setFont("helvetica", line.bold ? "bold" : "normal");
    y = addTextBlock(doc, line.text, left, y, width, line.size ?? 11);
    y += line.gapAfter ?? 3;
  });
  return y;
}

function maybePageBreak(doc: jsPDF, y: number, needed = 24) {
  const height = doc.internal.pageSize.getHeight();
  if (y + needed > height - 14) {
    doc.addPage();
    return 14;
  }
  return y;
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(18, 20, 24);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, 14, 17);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(subtitle, doc.internal.pageSize.getWidth() - 14, 17, { align: "right" });
  doc.setTextColor(25, 27, 31);
}

function addExerciseBlock(
  doc: jsPDF,
  y: number,
  title: string,
  meta: string,
  details: string[],
) {
  y = maybePageBreak(doc, y, 28);
  doc.setDrawColor(226, 229, 234);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, doc.internal.pageSize.getWidth() - 28, 18 + details.length * 4 + 20, 3, 3, "FD");
  let cursor = y + 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, 18, cursor);
  cursor += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 115, 123);
  cursor = addTextBlock(doc, meta, 18, cursor + 2, doc.internal.pageSize.getWidth() - 36, 8.5);
  doc.setTextColor(25, 27, 31);
  details.forEach((detail) => {
    cursor = addTextBlock(doc, detail, 18, cursor, doc.internal.pageSize.getWidth() - 36, 8.5);
  });
  return y + 18 + details.length * 4 + 24;
}

function describePerformedExercise(exercise: WorkoutSession["performedExercises"][number]) {
  const sets = normalizePerformedExercise(exercise);
  const workSets = countValidSets(sets);
  const warmups = countWarmupSets(sets);
  const reps = sets.sets.filter((set) => set.completed && !set.isWarmup).map((set) => set.reps || "—").join(", ");
  const load = sets.sets.filter((set) => set.completed && !set.isWarmup).map((set) => set.load || "—").join(", ");
  return {
    title: exercise.exerciseNameSnapshot ?? getExerciseName(exercise.exerciseId),
    meta: `${exercise.primaryMuscle ?? "—"}${exercise.secondaryMuscles?.length ? ` · ${exercise.secondaryMuscles.join(", ")}` : ""}`,
    details: [
      `Séries válidas: ${workSets}`,
      `Aquecimento: ${warmups}`,
      reps ? `Reps: ${reps}` : "",
      load ? `Carga: ${load}` : "",
      exercise.notes ? `Notas: ${exercise.notes}` : "",
    ].filter(Boolean),
  };
}

export function exportWorkoutPdf(workout: Workout) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  addHeader(doc, workout.name, "Ficha de treino");
  let y = 40;
  y = addLines(doc, [
    { text: `${workout.exercises.length} exercícios`, size: 12, bold: true },
    { text: `${workout.exercises.reduce((sum, item) => sum + item.sets, 0)} séries planejadas`, size: 10, color: [108, 114, 122] },
  ], y);

  workout.exercises.forEach((item, index) => {
    const exercise = exerciseLibrary.find((entry) => entry.id === item.exerciseId);
    const planned = exercise
      ? {
          meta: `${exercise.primaryMuscle}${exercise.secondaryMuscles.length ? ` · ${exercise.secondaryMuscles.join(", ")}` : ""}`,
          details: [
            `Tipo: ${exercise.type === "compound" ? "Composto" : "Isolador"}`,
            `Equipamentos: ${exercise.equipment.join(", ")}`,
            exercise.movementPattern ? `Movimento: ${exercise.movementPattern}` : "",
          ].filter(Boolean),
        }
      : {
          meta: "Exercício não encontrado",
          details: [],
        };
    y = addExerciseBlock(
      doc,
      y,
      `${index + 1}. ${exercise?.name ?? getExerciseName(item.exerciseId)}`,
      `${planned.meta} · ${item.sets}x ${item.reps}${item.load ? ` · ${item.load}` : ""}${item.restSeconds ? ` · ${item.restSeconds}s descanso` : ""}`,
      [
        ...planned.details,
        item.warmupSets ? `Aquecimento: ${item.warmupSets}` : "",
        item.targetRpe ? `RPE alvo: ${item.targetRpe}` : "",
        item.targetRir ? `RIR alvo: ${item.targetRir}` : "",
        item.notes ? `Notas: ${item.notes}` : "",
      ].filter(Boolean),
    );
  });

  doc.save(`${workout.name.replaceAll("/", "-")}.pdf`);
}

export function exportActiveWorkoutPdf(session: ActiveWorkoutSession | WorkoutSession) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = session.workoutNameSnapshot ?? "Treino";
  addHeader(doc, title, "Ficha de treino em andamento");
  let y = 40;
  const exercises = "exercises" in session ? session.exercises : session.performedExercises;
  y = addLines(doc, [
    { text: `${exercises.length} exercícios`, size: 12, bold: true },
  ], y);

  if ("exercises" in session) {
    session.exercises.forEach((exercise, index) => {
      const details = [
        `${exercise.plannedSets} séries planejadas`,
        exercise.reps ? `Reps: ${exercise.reps}` : "",
        exercise.restSeconds ? `Descanso: ${exercise.restSeconds}s` : "",
        exercise.isExtra ? "Extra" : "",
        exercise.notes ? `Notas: ${exercise.notes}` : "",
        exercise.sets.length
          ? `Checklist: ${exercise.sets.filter((set) => set.completed).length}/${exercise.sets.length}`
          : "",
      ].filter(Boolean);
      y = addExerciseBlock(
        doc,
        y,
        `${index + 1}. ${exercise.exerciseName}`,
        `${exercise.primaryMuscle}${exercise.secondaryMuscles.length ? ` · ${exercise.secondaryMuscles.join(", ")}` : ""}`,
        details,
      );
    });
  } else {
    session.performedExercises.forEach((exercise, index) => {
      const data = describePerformedExercise(exercise);
      y = addExerciseBlock(doc, y, `${index + 1}. ${data.title}`, data.meta, data.details);
    });
  }

  doc.save(`${title.replaceAll("/", "-")}.pdf`);
}

