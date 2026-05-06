import { Copy, Download, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Badge } from "../components/Badge";
import { EmptyState, ExpandableDetails, PageHeader, SectionCard } from "../components/ui";
import { weekDays } from "../data/muscles";
import type { WeeklyPlan, Workout } from "../types";
import { exportWorkoutPdf } from "../utils/exportPdf";

type WorkoutsProps = {
  workouts: Workout[];
  scheduledWorkoutIds: Set<string>;
  weeklyPlan: WeeklyPlan;
  onWorkoutsChange: (workouts: Workout[]) => void;
  onEdit: (workoutId: string) => void;
};

export function Workouts({ workouts, scheduledWorkoutIds, weeklyPlan, onWorkoutsChange, onEdit }: WorkoutsProps) {
  function createWorkout() {
    const workout: Workout = {
      id: crypto.randomUUID(),
      name: `Novo treino ${workouts.length + 1}`,
      exercises: [],
    };
    onWorkoutsChange([...workouts, workout]);
    onEdit(workout.id);
  }

  function duplicateWorkout(workout: Workout) {
    onWorkoutsChange([
      ...workouts,
      {
        ...workout,
        id: crypto.randomUUID(),
        name: `${workout.name} cópia`,
        exercises: workout.exercises.map((exercise) => ({ ...exercise, id: crypto.randomUUID() })),
      },
    ]);
  }

  function removeWorkout(workoutId: string) {
    onWorkoutsChange(workouts.filter((workout) => workout.id !== workoutId));
  }

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Treinos"
        title="Seus treinos"
        description="Abra um treino para ver e ajustar os exercícios."
        action={<button className="primary-btn" onClick={createWorkout} type="button"><Plus size={18} /> Criar</button>}
      />

      <SectionCard>
        {workouts.length === 0 ? <EmptyState title="Nenhum treino criado" text="Crie um treino para começar a montar a semana." /> : null}
        <div className="workout-list compact">
          {workouts.map((workout) => {
            const totalSets = workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
            const scheduledDays = weekDays.filter((day) => weeklyPlan[day.key] === workout.id).map((day) => day.label.toLowerCase());
            return (
              <article className="workout-card compact" key={workout.id}>
                <button className="card-main-action" onClick={() => onEdit(workout.id)} type="button">
                  <div>
                    <h3>{workout.name}</h3>
                    <p>{workout.exercises.length} exercícios · {totalSets} séries</p>
                    <small>{scheduledDays.length ? scheduledDays.join(" e ") : "não agendado"}</small>
                  </div>
                  <Badge tone={scheduledWorkoutIds.has(workout.id) ? "green" : "neutral"}>
                    {scheduledWorkoutIds.has(workout.id) ? "Agendado" : "Livre"}
                  </Badge>
                </button>
                <ExpandableDetails label={<MoreHorizontal size={18} />}>
                  <div className="action-row left">
                    <button className="secondary-btn" onClick={() => exportWorkoutPdf(workout)} type="button"><Download size={16} /> PDF</button>
                    <button className="secondary-btn" onClick={() => duplicateWorkout(workout)} type="button"><Copy size={16} /> Duplicar</button>
                    <button className="secondary-btn danger-text" onClick={() => removeWorkout(workout.id)} type="button"><Trash2 size={16} /> Excluir</button>
                  </div>
                </ExpandableDetails>
              </article>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
