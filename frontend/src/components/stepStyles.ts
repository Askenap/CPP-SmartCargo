import { C } from "../data/colors";
import type { StepStatus } from "../types";

export const styCfg: Record<
  StepStatus | "undetermined",
  { color: string; bg: string; ring: string; icon: string }
> = {
  passed: { color: C.green, bg: C.greenBg, ring: C.green, icon: "✓" },
  current: { color: C.amber, bg: C.amberBg, ring: C.amber, icon: "●" },
  pending: { color: C.gray, bg: C.grayLight, ring: C.grayBorder, icon: "·" },
  undetermined: { color: C.gray, bg: "transparent", ring: C.grayBorder, icon: "?" },
};

export function stepSt(i: number, p: number): StepStatus {
  return i < p ? "passed" : i === p ? "current" : "pending";
}
