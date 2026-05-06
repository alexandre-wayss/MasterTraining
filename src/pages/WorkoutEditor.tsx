import { ArrowLeft, Check, Download, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ExercisePicker } from "../components/ExercisePicker";
import { Badge } from "../components/Badge";
import { ExpandableDetails, PageHeader } from "../components/ui";
import type { Workout, WorkoutExercise } from "../types";
import { getExerciseDefinition } from "../utils/calculations";
import { exportWorkoutPdf } from "../utils/exportPdf";
import { exerciseTypeLabel } from "../utils/format";

type WorkoutEditorProps = {
  workoutId?: string;
  workouts: Workout[];
  onWorkoutsChange: (workouts: Workout[]) => void;
  onBack: () => void;
};

export function WorkoutEditor({ workoutId, workouts, onWorkoutsChange, onBack }: WorkoutEditorProps) {
  const [draggingId, setDraggingId] = useState<string | undefined>();
  const [dropTargetId, setDropTargetId] = useState<string | undefined>();
  const [draftWorkout, setDraftWorkout] = useState<Workout | undefined>();
  const workout = workouts.find((item) => item.id === workoutId);

  useEffect(() => {
    setDraftWorkout(workout ? structuredClone(workout) : undefined);
  }, [workout]);

  if (!workout) {
    return (
      <section className="panel">
        <p className="empty">Treino não encontrado.</p>
        <button className="secondary-btn" onClick={onBack} type="button"><ArrowLeft size={17} /> Voltar</button>
      </section>
    );
  }

  const activeWorkout = draftWorkout ?? workout;

  function updateWorkout(nextWorkout: Workout) {
    setDraftWorkout(nextWorkout);
  }

  function addExercise(exerciseId: string) {
    const newItem: WorkoutExercise = {
      id: crypto.randomUUID(),
      exerciseId,
      sets: 3,
      reps: "8-10",
    };
    updateWorkout({ ...activeWorkout, exercises: [...activeWorkout.exercises, newItem] });
  }

  function updateExercise(itemId: string, patch: Partial<WorkoutExercise>) {
    updateWorkout({
      ...activeWorkout,
      exercises: activeWorkout.exercises.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    });
  }

  function removeExercise(itemId: string) {
    updateWorkout({ ...activeWorkout, exercises: activeWorkout.exercises.filter((item) => item.id !== itemId) });
  }

  function reorderExercise(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const from = activeWorkout.exercises.findIndex((item) => item.id === draggingId);
    const to = activeWorkout.exercises.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;
    const exercises = [...activeWorkout.exercises];
    const [moved] = exercises.splice(from, 1);
    exercises.splice(to, 0, moved);
    updateWorkout({ ...activeWorkout, exercises });
    setDraggingId(undefined);
    setDropTargetId(undefined);
  }

  function saveWorkout() {
    onWorkoutsChange(workouts.map((item) => (item.id === activeWorkout.id ? activeWorkout : item)));
    onBack();
  }

  return (
    <div className="page-grid two-column">
      <section className="panel workout-editor-panel">
        <PageHeader
          eyebrow="Editor"
          title="Montar treino"
          action={
            <div className="action-row">
              <button className="secondary-btn" onClick={() => exportWorkoutPdf(activeWorkout)} type="button"><Download size={17} /> PDF</button>
              <button className="text-btn" onClick={onBack} type="button"><ArrowLeft size={17} /> Treinos</button>
              <button className="primary-btn" onClick={saveWorkout} type="button"><Check size={17} /> Salvar</button>
            </div>
          }
        />
        <input
          className="title-input"
          value={activeWorkout.name}
          onChange={(event) => updateWorkout({ ...activeWorkout, name: event.target.value })}
        />
        {activeWorkout.exercises.length === 0 ? <p className="empty">Este treino ainda não tem exercícios.</p> : null}
        <div className="editor-list">
          {activeWorkout.exercises.map((item) => {
            const exercise = getExerciseDefinition(item.exerciseId);
            return (
              <article
                className={
                  [
                    "editor-card",
                    draggingId === item.id ? "dragging" : "",
                    dropTargetId === item.id ? "drop-target" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                }
                draggable
                key={item.id}
                onDragEnd={() => {
                  setDraggingId(undefined);
                  setDropTargetId(undefined);
                }}
                onDragEnter={() => {
                  if (draggingId && draggingId !== item.id) setDropTargetId(item.id);
                }}
                onDragLeave={() => {
                  if (dropTargetId === item.id) setDropTargetId(undefined);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={(event) => {
                  setDraggingId(item.id);
                  setDropTargetId(undefined);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDrop={() => reorderExercise(item.id)}
              >
                <div className="card-title-row">
                  <div>
                    <h3><GripVertical size={16} /> {exercise?.name ?? "Exercício não encontrado"}</h3>
                    {exercise ? <p>{exercise.primaryMuscle} · {exercise.secondaryMuscles.join(", ") || "sem secundários"}</p> : null}
                  </div>
                  <button className="icon-btn danger" onClick={() => removeExercise(item.id)} title="Remover" type="button"><Trash2 size={16} /></button>
                </div>
                {exercise ? (
                  <>
                    <div className="badge-row">
                      <Badge tone={exercise.type === "compound" ? "blue" : "green"}>{exerciseTypeLabel(exercise.type)}</Badge>
                      <Badge>{exercise.primaryMuscle}</Badge>
                    </div>
                  </>
                ) : (
                  <p className="empty compact">Este exercício não existe mais na biblioteca e será ignorado nos cálculos.</p>
                )}
                <div className="form-grid compact">
                  <label>Séries<input type="number" min={0} value={item.sets} onChange={(event) => updateExercise(item.id, { sets: Number(event.target.value) })} /></label>
                  <label>Reps<input value={item.reps} onChange={(event) => updateExercise(item.id, { reps: event.target.value })} /></label>
                  <label>Carga<input value={item.load ?? ""} onChange={(event) => updateExercise(item.id, { load: event.target.value })} placeholder="opcional" /></label>
                </div>
                <ExpandableDetails>
                  {exercise ? (
                    <div className="readonly-grid">
                      <span><strong>Principal</strong>{exercise.primaryMuscle}</span>
                      <span><strong>Secundários</strong>{exercise.secondaryMuscles.join(", ") || "Nenhum"}</span>
                      <span><strong>Tipo</strong>{exerciseTypeLabel(exercise.type)}</span>
                      <span><strong>Equipamentos</strong>{exercise.equipment.join(", ")}</span>
                    </div>
                  ) : null}
                  <div className="form-grid compact">
                  <label>Aquecimento<input type="number" min={0} value={item.warmupSets ?? 0} onChange={(event) => updateExercise(item.id, { warmupSets: Number(event.target.value) })} /></label>
                  <label>Minutos<input type="number" min={0} value={item.estimatedMinutes ?? ""} onChange={(event) => updateExercise(item.id, { estimatedMinutes: event.target.value ? Number(event.target.value) : undefined })} placeholder="estimado" /></label>
                  <label>RPE alvo<input value={item.targetRpe ?? ""} onChange={(event) => updateExercise(item.id, { targetRpe: event.target.value })} placeholder="opcional" /></label>
                  <label>RIR alvo<input value={item.targetRir ?? ""} onChange={(event) => updateExercise(item.id, { targetRir: event.target.value })} placeholder="opcional" /></label>
                  <label>Descanso<input type="number" min={0} value={item.restSeconds ?? ""} onChange={(event) => updateExercise(item.id, { restSeconds: event.target.value ? Number(event.target.value) : undefined })} placeholder="segundos" /></label>
                  <label>Observações<input value={item.notes ?? ""} onChange={(event) => updateExercise(item.id, { notes: event.target.value })} placeholder="opcional" /></label>
                  </div>
                </ExpandableDetails>
              </article>
            );
          })}
        </div>
      </section>
      <ExercisePicker onPick={(exercise) => addExercise(exercise.id)} />
      <button className="floating-add" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })} type="button"><Plus size={18} /></button>
    </div>
  );
}
