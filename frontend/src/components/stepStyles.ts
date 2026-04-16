import { C } from "../data/colors";
import type { StepStatus } from "../types";

export const styCfg: Record<
  StepStatus,
  { color: string; bg: string; ring: string; icon: string }
> = {
  passed: { color: C.green, bg: C.greenBg, ring: C.green, icon: "✓" },
  current: { color: C.amber, bg: C.amberBg, ring: C.amber, icon: "●" },
  pending: { color: C.gray, bg: C.grayLight, ring: C.grayBorder, icon: "·" },
};

/** Линейный статус по счётчику */
export function stepSt(i: number, p: number): StepStatus {
  return i < p ? "passed" : i === p ? "current" : "pending";
}

/**
 * Статус с учётом независимых отметок пограничника.
 * borderMarks[stepId] === "passed" перекрывает линейный статус.
 */
export function stepStWithMarks(
  stepId: string,
  linearIndex: number,
  linearCounter: number,
  borderMarks?: Record<string, string>
): StepStatus {
  if (borderMarks?.[stepId] === "passed") return "passed";
  return stepSt(linearIndex, linearCounter);
}
