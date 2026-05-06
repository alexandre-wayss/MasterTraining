import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { exerciseLibrary } from "../data/exercises";
import { muscleGroups } from "../data/muscles";
import type { ExerciseDefinition, MuscleGroup } from "../types";
import { exerciseTypeLabel } from "../utils/format";
import { Badge } from "./Badge";

type ExercisePickerProps = {
  onPick: (exercise: ExerciseDefinition) => void;
};

export function ExercisePicker({ onPick }: ExercisePickerProps) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "">("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return exerciseLibrary.filter((exercise) => {
      const matchesQuery =
        !normalized ||
        exercise.name.toLowerCase().includes(normalized) ||
        exercise.equipment.join(" ").toLowerCase().includes(normalized);
      const matchesMuscle =
        !muscle ||
        exercise.primaryMuscle === muscle ||
        exercise.secondaryMuscles.includes(muscle);
      return matchesQuery && matchesMuscle;
    });
  }, [query, muscle]);

  return (
    <section className="panel exercise-picker-panel">
      <div className="section-heading">
        <div>
          <h2>Adicionar exercício</h2>
          <p>Escolha da biblioteca interna. Músculos não são editáveis.</p>
        </div>
      </div>
      <div className="filters">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar exercício ou equipamento" />
        </label>
        <select value={muscle} onChange={(event) => setMuscle(event.target.value as MuscleGroup | "")}>
          <option value="">Todos os músculos</option>
          {muscleGroups.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="picker-scroll">
        <div className="picker-grid">
          {filtered.map((exercise) => (
            <button key={exercise.id} className="exercise-pick" onClick={() => onPick(exercise)} type="button">
              <strong>{exercise.name}</strong>
              <span>{exercise.primaryMuscle}</span>
              <div className="badge-row">
                <Badge tone={exercise.type === "compound" ? "blue" : "green"}>{exerciseTypeLabel(exercise.type)}</Badge>
                <Badge>{exercise.equipment.join(", ")}</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? <p className="empty">Nenhum exercício encontrado com esses filtros.</p> : null}
    </section>
  );
}
