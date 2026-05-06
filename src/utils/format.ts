import type { PlanStatus } from "../types";

export const statusLabels: Record<PlanStatus, string> = {
  below: "Abaixo da meta",
  within: "Dentro da meta",
  above: "Acima da meta",
  unset: "Sem meta definida",
};

export function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function signedNumber(value?: number) {
  if (value === undefined) return "—";
  const formatted = formatNumber(value);
  return value > 0 ? `+${formatted}` : formatted;
}

export function exerciseTypeLabel(type: "compound" | "isolation") {
  return type === "compound" ? "Composto" : "Isolador";
}
