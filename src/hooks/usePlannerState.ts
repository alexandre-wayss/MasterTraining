import { useEffect, useMemo, useState } from "react";
import { demoPlannerSettings, demoSettings, demoWeeklyPlan, demoWorkouts } from "../data/demo";
import { getWeekStart } from "../utils/dates";
import { normalizeWeekLogs } from "../utils/history";
import type { AppExportData, MuscleGroup, PlannerSettings, Settings, WeekLog, WeeklyPlan, Workout, WorkoutSession } from "../types";

const STORAGE_KEY = "volumelab-state-v1";

type StoredState = {
  workouts: Workout[];
  weeklyPlan: WeeklyPlan;
  settings: Settings;
  plannerSettings: PlannerSettings;
  weekLogs: WeekLog[];
};

const demoState = (): StoredState => ({
  workouts: structuredClone(demoWorkouts),
  weeklyPlan: structuredClone(demoWeeklyPlan),
  settings: structuredClone(demoSettings),
  plannerSettings: structuredClone(demoPlannerSettings),
  weekLogs: [{
    id: crypto.randomUUID(),
    weekStart: getWeekStart(),
    weekNote: "Semana demo para começar a registrar o realizado.",
    sessions: [],
  }],
});

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoState();
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : demoWorkouts,
      weeklyPlan: parsed.weeklyPlan ?? demoWeeklyPlan,
      settings: {
        countIndirectSets: parsed.settings?.countIndirectSets ?? true,
        indirectSetMultiplier: 0.5,
      },
      plannerSettings: {
        emphasisMuscles: parsed.plannerSettings?.emphasisMuscles ?? demoPlannerSettings.emphasisMuscles,
        targetVolumes: parsed.plannerSettings?.targetVolumes ?? demoPlannerSettings.targetVolumes,
      },
      weekLogs: Array.isArray(parsed.weekLogs) ? normalizeWeekLogs(parsed.weekLogs) : [],
    };
  } catch {
    return demoState();
  }
}

function normalizeImport(data: Partial<AppExportData>): StoredState | null {
  if (!Array.isArray(data.workouts) || !data.weeklyPlan || !data.settings || !data.plannerSettings) {
    return null;
  }

  return {
    workouts: data.workouts,
    weeklyPlan: data.weeklyPlan,
    settings: {
      countIndirectSets: data.settings.countIndirectSets ?? true,
      indirectSetMultiplier: 0.5,
    },
    plannerSettings: {
      emphasisMuscles: data.plannerSettings.emphasisMuscles ?? [],
      targetVolumes: data.plannerSettings.targetVolumes ?? {},
    },
    weekLogs: Array.isArray(data.weekLogs) ? normalizeWeekLogs(data.weekLogs) : [],
  };
}

export function usePlannerState() {
  const [state, setState] = useState<StoredState>(() => loadState());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const scheduledWorkoutIds = useMemo(
    () => new Set(Object.values(state.weeklyPlan).filter(Boolean)),
    [state.weeklyPlan],
  );

  function setWorkouts(workouts: Workout[]) {
    setState((current) => {
      const validIds = new Set(workouts.map((workout) => workout.id));
      const weeklyPlan = Object.fromEntries(
        Object.entries(current.weeklyPlan).filter(([, workoutId]) =>
          workoutId ? validIds.has(workoutId) : false,
        ),
      ) as WeeklyPlan;
      return { ...current, workouts, weeklyPlan };
    });
  }

  function setWeeklyPlan(weeklyPlan: WeeklyPlan) {
    setState((current) => ({ ...current, weeklyPlan }));
  }

  function setSettings(settings: Settings) {
    setState((current) => ({
      ...current,
      settings: { ...settings, indirectSetMultiplier: 0.5 },
    }));
  }

  function setTargetVolume(muscle: MuscleGroup, value: number | undefined) {
    setState((current) => {
      const targetVolumes = { ...current.plannerSettings.targetVolumes };
      if (value === undefined || value <= 0 || Number.isNaN(value)) {
        delete targetVolumes[muscle];
      } else {
        targetVolumes[muscle] = value;
      }
      return {
        ...current,
        plannerSettings: { ...current.plannerSettings, targetVolumes },
      };
    });
  }

  function toggleEmphasisMuscle(muscle: MuscleGroup) {
    setState((current) => {
      const active = current.plannerSettings.emphasisMuscles.includes(muscle);
      const emphasisMuscles = active
        ? current.plannerSettings.emphasisMuscles.filter((item) => item !== muscle)
        : [...current.plannerSettings.emphasisMuscles, muscle];
      return {
        ...current,
        plannerSettings: { ...current.plannerSettings, emphasisMuscles },
      };
    });
  }

  function resetDemoData() {
    setState(demoState());
  }

  function clearLocalData() {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      workouts: [],
      weeklyPlan: {},
      settings: { countIndirectSets: true, indirectSetMultiplier: 0.5 },
      plannerSettings: { emphasisMuscles: [], targetVolumes: {} },
      weekLogs: [],
    });
  }

  function upsertWeekLog(weekLog: WeekLog) {
    setState((current) => {
      const exists = current.weekLogs.some((item) => item.id === weekLog.id || item.weekStart === weekLog.weekStart);
      return {
        ...current,
        weekLogs: exists
          ? current.weekLogs.map((item) => (item.id === weekLog.id || item.weekStart === weekLog.weekStart ? weekLog : item))
          : [...current.weekLogs, weekLog],
      };
    });
  }

  function ensureWeekLog(weekStart: string) {
    const existing = state.weekLogs.find((item) => item.weekStart === weekStart);
    if (existing) return existing;
    return { id: crypto.randomUUID(), weekStart, sessions: [] };
  }

  function upsertSession(weekStart: string, session: WorkoutSession) {
    setState((current) => {
      const currentLog = current.weekLogs.find((item) => item.weekStart === weekStart) ?? {
        id: crypto.randomUUID(),
        weekStart,
        sessions: [],
      };
      const sessions = currentLog.sessions.some((item) => item.id === session.id || item.weekday === session.weekday)
        ? currentLog.sessions.map((item) => (item.id === session.id || item.weekday === session.weekday ? session : item))
        : [...currentLog.sessions, session];
      const nextLog = { ...currentLog, sessions };
      const hasLog = current.weekLogs.some((item) => item.id === currentLog.id);
      return {
        ...current,
        weekLogs: hasLog ? current.weekLogs.map((item) => (item.id === currentLog.id ? nextLog : item)) : [...current.weekLogs, nextLog],
      };
    });
  }

  function setWeekNote(weekStart: string, weekNote: string) {
    const weekLog = ensureWeekLog(weekStart);
    upsertWeekLog({ ...weekLog, weekNote });
  }

  function exportData() {
    const data: AppExportData = state;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `volumelab-${getWeekStart()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<AppExportData>;
    const normalized = normalizeImport(parsed);
    if (!normalized) throw new Error("Arquivo inválido para importação.");
    setState(normalized);
  }

  return {
    ...state,
    scheduledWorkoutIds,
    setWorkouts,
    setWeeklyPlan,
    setSettings,
    setTargetVolume,
    toggleEmphasisMuscle,
    resetDemoData,
    clearLocalData,
    ensureWeekLog,
    upsertWeekLog,
    upsertSession,
    setWeekNote,
    exportData,
    importData,
  };
}
