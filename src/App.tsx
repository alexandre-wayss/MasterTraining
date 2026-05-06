import { useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { ActiveWorkout } from "./pages/ActiveWorkout";
import { ExerciseLibrary } from "./pages/ExerciseLibrary";
import { Planner } from "./pages/Planner";
import { Performed } from "./pages/Performed";
import { History } from "./pages/History";
import { SettingsPanel } from "./pages/SettingsPanel";
import { WeeklyPlanner } from "./pages/WeeklyPlanner";
import { WorkoutEditor } from "./pages/WorkoutEditor";
import { Workouts } from "./pages/Workouts";
import { usePlannerState } from "./hooks/usePlannerState";
import { useActiveWorkoutSession } from "./hooks/useActiveWorkoutSession";
import { getDateForWeekday, getWeekdayFromDate, getWeekStart, toDateInputValue } from "./utils/dates";
import { createManualActiveWorkoutSession } from "./utils/activeWorkout";

export type PageKey = "dashboard" | "workouts" | "editor" | "weekly" | "performed" | "planner" | "history" | "library" | "settings" | "active";

function App() {
  const planner = usePlannerState();
  const activeWorkout = useActiveWorkoutSession();
  const [page, setPage] = useState<PageKey>("dashboard");
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | undefined>();

  const selectedPage = useMemo(() => {
    if (page === "editor" && !editingWorkoutId) return "workouts";
    if (page === "active" && !activeWorkout.activeWorkoutSession) return "dashboard";
    return page;
  }, [activeWorkout.activeWorkoutSession, editingWorkoutId, page]);

  function editWorkout(workoutId: string) {
    setEditingWorkoutId(workoutId);
    setPage("editor");
  }

  const currentWeekLog = planner.ensureWeekLog(getWeekStart());
  const todayWeekday = getWeekdayFromDate();
  const todayDate = toDateInputValue(new Date());
  const todayWorkout = planner.weeklyPlan[todayWeekday]
    ? planner.workouts.find((workout) => workout.id === planner.weeklyPlan[todayWeekday])
    : undefined;

  function startTodayWorkout() {
    if (todayWorkout) {
      activeWorkout.startWorkout(todayWorkout, getWeekStart(), todayDate || getDateForWeekday(getWeekStart(), todayWeekday), todayWeekday);
    } else {
      activeWorkout.updateActiveWorkoutSession(
        createManualActiveWorkoutSession({
          weekStart: getWeekStart(),
          date: todayDate || getDateForWeekday(getWeekStart(), todayWeekday),
          weekday: todayWeekday,
        }),
      );
    }
    setPage("active");
  }

  return (
    <Layout page={selectedPage} onPageChange={setPage}>
      {selectedPage === "dashboard" ? (
        <Dashboard
          workouts={planner.workouts}
          weeklyPlan={planner.weeklyPlan}
          settings={planner.settings}
          plannerSettings={planner.plannerSettings}
          weekLog={currentWeekLog}
          todayWorkout={todayWorkout}
          activeWorkoutSession={activeWorkout.activeWorkoutSession}
          onStartWorkout={startTodayWorkout}
          onContinueWorkout={() => setPage("active")}
          onOpenPlanner={() => setPage("planner")}
        />
      ) : null}
      {selectedPage === "active" && activeWorkout.activeWorkoutSession ? (
        <ActiveWorkout
          activeWorkoutSession={activeWorkout.activeWorkoutSession}
          weekLogs={planner.weekLogs}
          settings={planner.settings}
          onUpdate={activeWorkout.updateActiveWorkoutSession}
          onSave={planner.upsertSession}
          onClear={activeWorkout.clearActiveWorkoutSession}
          onDone={() => setPage("dashboard")}
        />
      ) : null}
      {selectedPage === "workouts" ? (
        <Workouts
          workouts={planner.workouts}
          scheduledWorkoutIds={planner.scheduledWorkoutIds}
          weeklyPlan={planner.weeklyPlan}
          onWorkoutsChange={planner.setWorkouts}
          onEdit={editWorkout}
        />
      ) : null}
      {selectedPage === "editor" ? (
        <WorkoutEditor
          workoutId={editingWorkoutId}
          workouts={planner.workouts}
          onWorkoutsChange={planner.setWorkouts}
          onBack={() => setPage("workouts")}
        />
      ) : null}
      {selectedPage === "weekly" ? (
        <WeeklyPlanner
          workouts={planner.workouts}
          weeklyPlan={planner.weeklyPlan}
          onWeeklyPlanChange={planner.setWeeklyPlan}
        />
      ) : null}
      {selectedPage === "performed" ? (
        <Performed
          workouts={planner.workouts}
          weeklyPlan={planner.weeklyPlan}
          settings={planner.settings}
          weekLog={currentWeekLog}
          onWeekNoteChange={planner.setWeekNote}
          onSessionChange={planner.upsertSession}
        />
      ) : null}
      {selectedPage === "planner" ? (
        <Planner
          workouts={planner.workouts}
          weeklyPlan={planner.weeklyPlan}
          settings={planner.settings}
          plannerSettings={planner.plannerSettings}
          onTargetVolumeChange={planner.setTargetVolume}
          onToggleEmphasis={planner.toggleEmphasisMuscle}
        />
      ) : null}
      {selectedPage === "library" ? <ExerciseLibrary /> : null}
      {selectedPage === "history" ? (
        <History
          weekLogs={planner.weekLogs}
          workouts={planner.workouts}
          weeklyPlan={planner.weeklyPlan}
          settings={planner.settings}
        />
      ) : null}
      {selectedPage === "settings" ? (
        <SettingsPanel
          settings={planner.settings}
          onSettingsChange={planner.setSettings}
          onResetDemo={planner.resetDemoData}
          onClearLocal={planner.clearLocalData}
          onExport={planner.exportData}
          onImport={planner.importData}
        />
      ) : null}
    </Layout>
  );
}

export default App;
