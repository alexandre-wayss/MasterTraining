import { weekDays } from "../data/muscles";
import type { Weekday } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getWeekStart(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  return toDateInputValue(copy);
}

export function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export function addWeeks(dateString: string, weeks: number) {
  return addDays(dateString, weeks * 7);
}

export function getDateForWeekday(weekStart: string, weekday: Weekday) {
  const index = weekDays.findIndex((day) => day.key === weekday);
  return addDays(weekStart, Math.max(0, index));
}

export function getWeekdayFromDate(date = new Date()): Weekday {
  const index = date.getDay() === 0 ? 6 : date.getDay() - 1;
  return weekDays[index].key;
}

export function formatShortDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function daysBetween(start: string, end: string) {
  return Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / DAY_MS);
}
