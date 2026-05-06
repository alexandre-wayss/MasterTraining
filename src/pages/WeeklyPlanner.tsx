import { CalendarDays } from "lucide-react";
import { weekDays } from "../data/muscles";
import type { WeeklyPlan, Workout } from "../types";

type WeeklyPlannerProps = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  onWeeklyPlanChange: (weeklyPlan: WeeklyPlan) => void;
};

export function WeeklyPlanner({ workouts, weeklyPlan, onWeeklyPlanChange }: WeeklyPlannerProps) {
  function setDay(day: keyof WeeklyPlan, workoutId: string) {
    const next = { ...weeklyPlan };
    if (!workoutId) {
      delete next[day];
    } else {
      next[day] = workoutId;
    }
    onWeeklyPlanChange(next);
  }

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Planejamento semanal</h2>
            <p>Somente estes dias entram no volume semanal calculado.</p>
          </div>
          <CalendarDays />
        </div>
        <div className="week-grid">
          {weekDays.map((day) => {
            const workout = workouts.find((item) => item.id === weeklyPlan[day.key]);
            return (
              <article className="day-card" key={day.key}>
                <span>{day.label}</span>
                <strong>{workout?.name ?? "Descanso"}</strong>
                <select value={weeklyPlan[day.key] ?? ""} onChange={(event) => setDay(day.key, event.target.value)}>
                  <option value="">Descanso</option>
                  {workouts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </article>
            );
          })}
        </div>
        {workouts.length === 0 ? <p className="empty">Crie treinos para associar aos dias da semana.</p> : null}
      </section>
    </div>
  );
}
