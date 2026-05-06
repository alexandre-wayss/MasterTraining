import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/Badge";
import { EmptyState, ExpandableDetails, FilterChips, PageHeader, SectionCard } from "../components/ui";
import { exerciseLibrary } from "../data/exercises";
import type { MuscleGroup } from "../types";
import { exerciseTypeLabel } from "../utils/format";

type LibraryFilter = "all" | "Peito" | "Costas" | "Pernas" | "Ombros" | "Bíceps" | "Tríceps";

export function ExerciseLibrary() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LibraryFilter>("all");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return exerciseLibrary.filter((exercise) => {
      const matchesQuery = !normalized || exercise.name.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all" || matchesGroup(filter, exercise.primaryMuscle, exercise.secondaryMuscles);
      return matchesQuery && matchesFilter;
    });
  }, [filter, query]);

  return (
    <div className="page-grid">
      <PageHeader
        eyebrow="Biblioteca"
        title="Exercícios"
        description="Lista interna simples, só leitura."
      />

      <SectionCard>
        <label className="search-field full"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar exercício" /></label>
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todos" },
            { value: "Peito", label: "Peito" },
            { value: "Costas", label: "Costas" },
            { value: "Pernas", label: "Pernas" },
            { value: "Ombros", label: "Ombros" },
            { value: "Bíceps", label: "Bíceps" },
            { value: "Tríceps", label: "Tríceps" },
          ]}
        />
      </SectionCard>

      <SectionCard>
        <div className="library-list">
          {filtered.map((exercise) => (
            <article className="library-row" key={exercise.id}>
              <div className="card-title-row">
                <div>
                  <h3>{exercise.name}</h3>
                  <p>{exercise.primaryMuscle}</p>
                </div>
                <Badge tone={exercise.type === "compound" ? "blue" : "green"}>{exerciseTypeLabel(exercise.type)}</Badge>
              </div>
              <ExpandableDetails>
                <div className="detail-grid">
                  <span>Principal <strong>{exercise.primaryMuscle}</strong></span>
                  <span>Secundários <strong>{exercise.secondaryMuscles.join(", ") || "Nenhum"}</strong></span>
                  <span>Equipamentos <strong>{exercise.equipment.join(", ")}</strong></span>
                  <span>Padrão <strong>{exercise.movementPattern || "Não definido"}</strong></span>
                </div>
              </ExpandableDetails>
            </article>
          ))}
        </div>
        {filtered.length === 0 ? <EmptyState title="Nada encontrado" text="Tente limpar a busca ou trocar o filtro." /> : null}
      </SectionCard>
    </div>
  );
}

function matchesGroup(filter: LibraryFilter, primary: MuscleGroup, secondary: MuscleGroup[]) {
  const muscles = [primary, ...secondary];
  if (filter === "Pernas") {
    return muscles.some((muscle) => ["Quadríceps", "Posterior de coxa", "Glúteos", "Panturrilhas"].includes(muscle));
  }
  if (filter === "Ombros") {
    return muscles.some((muscle) => ["Ombros", "Ombro anterior", "Ombro lateral", "Ombro posterior"].includes(muscle));
  }
  return muscles.includes(filter as MuscleGroup);
}
