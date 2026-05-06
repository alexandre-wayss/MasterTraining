import { muscleGroups } from "../data/muscles";
import type {
  ActiveWorkoutSession,
  PlannerSettings,
  Settings,
  WeeklyPlan,
  Workout,
  WeekLog,
} from "../types";
import { calculateMuscleFrequency, calculatePlanStatus } from "../utils/calculations";
import { calculatePerformedVolumeForWeek } from "../utils/history";
import { MuscleProgressCard, PageHeader, SectionCard } from "../components/ui";
import { elapsedMinutes } from "../utils/activeWorkout";
import { countValidSets } from "../utils/history";

type DashboardProps = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
  plannerSettings: PlannerSettings;
  weekLog?: WeekLog;
  todayWorkout?: Workout;
  activeWorkoutSession?: ActiveWorkoutSession;
  onStartWorkout: () => void;
  onContinueWorkout: () => void;
  onOpenPlanner: () => void;
};

export function Dashboard({
  workouts,
  weeklyPlan,
  settings,
  plannerSettings,
  weekLog,
  todayWorkout,
  activeWorkoutSession,
  onStartWorkout,
  onContinueWorkout,
  onOpenPlanner,
}: DashboardProps) {
  const performedVolume = calculatePerformedVolumeForWeek(weekLog, settings);
  const status = calculatePlanStatus({ muscleVolume: performedVolume, targetVolumes: plannerSettings.targetVolumes });
  const frequency = calculateMuscleFrequency({ workouts, weeklyPlan, settings });
  const visibleMuscles = muscleGroups
    .slice()
    .sort((a, b) => performedVolume[b].totalSets - performedVolume[a].totalSets || a.localeCompare(b));

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Dashboard"
        title="Resumo da semana"
        description="O essencial do realizado, sem ruído."
        action={<button className="secondary-btn" onClick={onOpenPlanner} type="button">Ver planejador completo</button>}
      />

      {activeWorkoutSession ? (
        <ActiveWorkoutCard activeWorkoutSession={activeWorkoutSession} onContinueWorkout={onContinueWorkout} />
      ) : (
        <SectionCard title="Hoje" description={todayWorkout ? `${todayWorkout.name} planejado para hoje.` : "Nenhum treino planejado para hoje."}>
          <button className="primary-btn wide" onClick={onStartWorkout} type="button">
            {todayWorkout ? "Iniciar treino" : "Iniciar treino manual"}
          </button>
        </SectionCard>
      )}

      <SectionCard title="Músculos" description="Volume feito na semana, por músculo.">
        <div className="muscle-grid">
          {visibleMuscles.map((muscle) => (
            <MuscleProgressCard
              key={muscle}
              muscle={muscle}
              volume={performedVolume[muscle]}
              status={status[muscle]}
              frequency={frequency[muscle]}
              isEmphasis={plannerSettings.emphasisMuscles.includes(muscle)}
              compact
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ActiveWorkoutCard({
  activeWorkoutSession,
  onContinueWorkout,
}: {
  activeWorkoutSession: ActiveWorkoutSession;
  onContinueWorkout: () => void;
}) {
  const exerciseDone = activeWorkoutSession.exercises.filter((exercise) => exercise.skipped || countValidSets(exercise) >= Math.max(1, exercise.plannedSets)).length;
  const setDone = activeWorkoutSession.exercises.reduce((sum, exercise) => sum + countValidSets(exercise), 0);
  const setTotal = activeWorkoutSession.exercises.reduce((sum, exercise) => sum + Math.max(1, exercise.plannedSets || 0), 0);
  return (
    <section className="active-workout-card dashboard-active">
      <div>
        <span className="eyebrow">Treino em andamento</span>
        <h2>{activeWorkoutSession.workoutNameSnapshot}</h2>
        <p>{exerciseDone}/{activeWorkoutSession.exercises.length} exercícios · {setDone}/{setTotal} séries · {elapsedMinutes(activeWorkoutSession.startedAt)} min</p>
      </div>
      <button className="primary-btn" onClick={onContinueWorkout} type="button">Continuar treino</button>
    </section>
  );
}
