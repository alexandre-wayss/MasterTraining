import { useEffect, useState } from "react";
import type { ActiveWorkoutSession, Weekday, Workout } from "../types";
import { createActiveWorkoutSession } from "../utils/activeWorkout";

const ACTIVE_KEY = "activeWorkoutSession";

function loadActiveWorkout() {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as ActiveWorkoutSession;
  } catch {
    return undefined;
  }
}

export function useActiveWorkoutSession() {
  const [activeWorkoutSession, setActiveWorkoutSession] = useState<ActiveWorkoutSession | undefined>(() => loadActiveWorkout());

  useEffect(() => {
    if (!activeWorkoutSession) {
      localStorage.removeItem(ACTIVE_KEY);
      return;
    }
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(activeWorkoutSession));
  }, [activeWorkoutSession]);

  function startWorkout(workout: Workout, weekStart: string, date: string, weekday: Weekday) {
    const next = createActiveWorkoutSession({ workout, weekStart, date, weekday });
    setActiveWorkoutSession(next);
    return next;
  }

  function updateActiveWorkoutSession(next: ActiveWorkoutSession) {
    setActiveWorkoutSession({ ...next, updatedAt: new Date().toISOString() });
  }

  function clearActiveWorkoutSession() {
    setActiveWorkoutSession(undefined);
  }

  return {
    activeWorkoutSession,
    startWorkout,
    updateActiveWorkoutSession,
    clearActiveWorkoutSession,
  };
}
