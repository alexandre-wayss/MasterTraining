import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red" | "purple";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
