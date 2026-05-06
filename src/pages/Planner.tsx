import { useMemo, useState } from "react";
import { MuscleVolumeTable } from "../components/MuscleVolumeTable";
import { muscleGroups, weekDays } from "../data/muscles";
import type {
  MuscleGroup,
  PlanStatus,
  PlannerSettings,
  Settings,
  WeeklyPlan,
  Workout,
} from "../types";
import {
  calculateMuscleFrequency,
  calculateMuscleVolume,
  calculatePlanStatus,
  calculateVolumeByDay,
  calculateVolumeByWorkout,
} from "../utils/calculations";
import { formatNumber, signedNumber, statusLabels } from "../utils/format";
import { Badge } from "../components/Badge";
import {
  ExpandableDetails,
  FilterChips,
  MuscleProgressCard,
  PageHeader,
  SectionCard,
} from "../components/ui";

type PlannerProps = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
  plannerSettings: PlannerSettings;
  onTargetVolumeChange: (
    muscle: MuscleGroup,
    value: number | undefined,
  ) => void;
  onToggleEmphasis: (muscle: MuscleGroup) => void;
};

type PlannerFilter = "all" | "emphasis" | PlanStatus;

export function Planner({
  workouts,
  weeklyPlan,
  settings,
  plannerSettings,
  onTargetVolumeChange,
  onToggleEmphasis,
}: PlannerProps) {
  const [filter, setFilter] = useState<PlannerFilter>("all");
  const volume = calculateMuscleVolume({ workouts, weeklyPlan, settings });
  const status = calculatePlanStatus({
    muscleVolume: volume,
    targetVolumes: plannerSettings.targetVolumes,
  });
  const frequency = calculateMuscleFrequency({
    workouts,
    weeklyPlan,
    settings,
  });
  const byDay = calculateVolumeByDay({ workouts, weeklyPlan, settings });
  const byWorkout = calculateVolumeByWorkout({ workouts, settings });

  const visibleMuscles = useMemo(() => {
    return muscleGroups.filter((muscle) => {
      if (filter === "all") return true;
      if (filter === "emphasis")
        return plannerSettings.emphasisMuscles.includes(muscle);
      return status[muscle].status === filter;
    });
  }, [filter, plannerSettings.emphasisMuscles, status]);

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Planejador"
        title="S�ries inclu�das"
        description="Vis�o do que est� inclu�do no plano semanal por grupamento muscular"
      />

      <SectionCard>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todos" },
            { value: "emphasis", label: "Ênfase" },
            { value: "below", label: "Abaixo" },
            { value: "within", label: "Dentro" },
            { value: "above", label: "Acima" },
            { value: "unset", label: "Sem meta" },
          ]}
        />
      </SectionCard>

      <section className="muscle-grid">
        {visibleMuscles.map((muscle) => {
          const activeDays = weekDays
            .map((day) => ({ day, volume: byDay[day.key][muscle] }))
            .filter(
              (item) =>
                item.volume.totalSets > 0 ||
                item.volume.directSets > 0 ||
                item.volume.indirectSets > 0,
            );
          return (
            <MuscleProgressCard
              key={muscle}
              muscle={muscle}
              volume={volume[muscle]}
              status={status[muscle]}
              frequency={frequency[muscle]}
              isEmphasis={plannerSettings.emphasisMuscles.includes(muscle)}
              dayDetails={
                <div className="subtle-list">
                  {activeDays.length === 0 ? (
                    <span>Sem dias com volume.</span>
                  ) : null}
                  {activeDays.map(({ day, volume: dayVolume }) => (
                    <span key={day.key}>
                      {day.label}: {formatNumber(dayVolume.totalSets)} séries
                    </span>
                  ))}
                </div>
              }
            />
          );
        })}
      </section>

      <SectionCard
        title="Metas e ênfase"
        description="Quantidade de séries previstas por músculo e musculaturas enfatizadas"
      >
        <ExpandableDetails label="Editar metas">
          <div className="target-grid">
            {muscleGroups.map((muscle) => (
              <label className="target-row" key={muscle}>
                <button
                  className={
                    plannerSettings.emphasisMuscles.includes(muscle)
                      ? "star-toggle active"
                      : "star-toggle"
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleEmphasis(muscle);
                  }}
                  type="button"
                  title="Alternar ênfase"
                >
                  Ênfase
                </button>
                <span>{muscle}</span>
                <input
                  min={0}
                  type="number"
                  value={plannerSettings.targetVolumes[muscle] ?? ""}
                  onChange={(event) =>
                    onTargetVolumeChange(
                      muscle,
                      event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    )
                  }
                  placeholder="Meta"
                />
              </label>
            ))}
          </div>
        </ExpandableDetails>
      </SectionCard>

      <SectionCard
        title="Visualização detalhada"
        description="Tabela completa, frequ�ncia e s�ries inclu�das por treino."
      >
        <ExpandableDetails label="Abrir detalhes avançados">
          <MuscleVolumeTable
            volume={volume}
            status={status}
            frequency={frequency}
            emphasisMuscles={plannerSettings.emphasisMuscles}
          />
          <div className="card-grid minimal">
            {workouts.map((workout) => (
              <article className="mini-card" key={workout.id}>
                <h3>{workout.name}</h3>
                {muscleGroups
                  .filter(
                    (muscle) =>
                      byWorkout[workout.id][muscle].directSets > 0 ||
                      byWorkout[workout.id][muscle].indirectSets > 0,
                  )
                  .slice(0, 6)
                  .map((muscle) => (
                    <p key={muscle}>
                      {muscle}:{" "}
                      {formatNumber(byWorkout[workout.id][muscle].directSets)}{" "}
                      dir +{" "}
                      {formatNumber(byWorkout[workout.id][muscle].indirectSets)}{" "}
                      ind
                    </p>
                  ))}
              </article>
            ))}
          </div>
        </ExpandableDetails>
      </SectionCard>

      <SectionCard
        title="Ênfase"
        description="Distância das metas dos músculos prioritários."
      >
        <div className="card-grid minimal">
          {plannerSettings.emphasisMuscles.length === 0 ? (
            <p className="empty compact">
              Nenhum músculo de ênfase configurado.
            </p>
          ) : null}
          {plannerSettings.emphasisMuscles.map((muscle) => (
            <article className="mini-card" key={muscle}>
              <div className="card-title-row">
                <h3>{muscle}</h3>
                <Badge tone="purple">Ênfase</Badge>
              </div>
              <strong>
                {formatNumber(volume[muscle].totalSets)} /{" "}
                {status[muscle].target ?? "sem meta"}
              </strong>
              <p>
                {statusLabels[status[muscle].status]} · diferença{" "}
                {signedNumber(status[muscle].difference)}
              </p>
            </article>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

