import { useMemo, useState } from "react";
import { muscleGroups } from "../data/muscles";
import type { MuscleFrequency, MuscleGroup, MusclePlanStatus, MuscleVolume, PlanStatus } from "../types";
import { formatNumber, signedNumber, statusLabels } from "../utils/format";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";

type Filter = "all" | "emphasis" | PlanStatus;

type MuscleVolumeTableProps = {
  volume: Record<MuscleGroup, MuscleVolume>;
  status: Record<MuscleGroup, MusclePlanStatus>;
  frequency: Record<MuscleGroup, MuscleFrequency>;
  emphasisMuscles: MuscleGroup[];
};

export function MuscleVolumeTable({ volume, status, frequency, emphasisMuscles }: MuscleVolumeTableProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"muscle" | "total" | "difference">("muscle");

  const rows = useMemo(() => {
    return muscleGroups
      .filter((muscle) => {
        if (filter === "all") return true;
        if (filter === "emphasis") return emphasisMuscles.includes(muscle);
        return status[muscle].status === filter;
      })
      .sort((a, b) => {
        if (sort === "total") return volume[b].totalSets - volume[a].totalSets;
        if (sort === "difference") return (status[a].difference ?? -999) - (status[b].difference ?? -999);
        return a.localeCompare(b);
      });
  }, [emphasisMuscles, filter, sort, status, volume]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Tabela geral</h2>
          <p>Status calculado contra as metas configuradas.</p>
        </div>
      </div>
      <div className="filters">
        <select value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
          <option value="all">Todos</option>
          <option value="emphasis">Músculos de ênfase</option>
          <option value="below">Abaixo da meta</option>
          <option value="within">Dentro da meta</option>
          <option value="above">Acima da meta</option>
          <option value="unset">Sem meta definida</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as "muscle" | "total" | "difference")}>
          <option value="muscle">Ordenar por músculo</option>
          <option value="total">Ordenar por total</option>
          <option value="difference">Ordenar por diferença</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Músculo</th>
              <th>Meta</th>
              <th>Diretas</th>
              <th>Indiretas</th>
              <th>Total</th>
              <th>Diferença</th>
              <th>Frequência</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((muscle) => (
              <tr key={muscle}>
                <td>
                  <div className="cell-title">
                    {muscle}
                    {emphasisMuscles.includes(muscle) ? <Badge tone="purple">Ênfase</Badge> : null}
                  </div>
                  <ProgressBar value={volume[muscle].totalSets} target={status[muscle].target} />
                </td>
                <td>{status[muscle].target ?? "—"}</td>
                <td>{formatNumber(volume[muscle].directSets)}</td>
                <td>{formatNumber(volume[muscle].indirectSets)}</td>
                <td>{formatNumber(volume[muscle].totalSets)}</td>
                <td>{signedNumber(status[muscle].difference)}</td>
                <td>{frequency[muscle].totalDays}x</td>
                <td><Badge tone={statusTone(status[muscle].status)}>{statusLabels[status[muscle].status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function statusTone(status: PlanStatus) {
  if (status === "below") return "amber";
  if (status === "within") return "green";
  if (status === "above") return "red";
  return "neutral";
}
