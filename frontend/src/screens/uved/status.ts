import { CB } from "../../data/borderColors";
import type { UvedStatus } from "./types";

export type StatusGroup =
  | "draft"
  | "issued"
  | "progress"
  | "success"
  | "partial"
  | "rejected";

export interface StatusMeta {
  /** Foreground colour (text/border accent) */
  fg: string;
  /** Background tint for chip/card */
  bg: string;
  /** Russian label (fallback to backend statusDisplay if available) */
  label: string;
  group: StatusGroup;
  /** Is this a terminal status — auto-refetch can stop. */
  terminal: boolean;
}

export const STATUS_META: Record<string, StatusMeta> = {
  DRAFT: {
    fg: CB.textSec,
    bg: CB.grayLight,
    label: "Черновик",
    group: "draft",
    terminal: false,
  },
  ISSUED: {
    fg: CB.primary,
    bg: CB.primaryLight,
    label: "Выписан",
    group: "issued",
    terminal: false,
  },
  REJECTED: {
    fg: CB.red,
    bg: CB.redBg,
    label: "Отклонён",
    group: "rejected",
    terminal: true,
  },
  ARRIVED: {
    fg: CB.amber,
    bg: CB.amberBg,
    label: "Прибыл на СВХ",
    group: "progress",
    terminal: false,
  },
  SVH_NUMBER_ASSIGNED: {
    fg: CB.amber,
    bg: CB.amberBg,
    label: "Учёт СВХ присвоен",
    group: "progress",
    terminal: false,
  },
  DXT_ASSIGNED: {
    fg: CB.amber,
    bg: CB.amberBg,
    label: "ДХТ присвоен",
    group: "progress",
    terminal: false,
  },
  DT_TD_FILLED: {
    fg: CB.amber,
    bg: CB.amberBg,
    label: "ДТ/ТД оформлен",
    group: "progress",
    terminal: false,
  },
  COMPLETED: {
    fg: CB.green,
    bg: CB.greenBg,
    label: "Выпуск разрешён",
    group: "success",
    terminal: true,
  },
  RELEASE_PARTIAL: {
    fg: "#65a30d",
    bg: "#ecfccb",
    label: "Частичный выпуск",
    group: "partial",
    terminal: true,
  },
  RELEASE_REJECTED: {
    fg: CB.red,
    bg: CB.redBg,
    label: "Выпуск запрещён",
    group: "rejected",
    terminal: true,
  },
  ARRIVED_AT_POST: {
    fg: CB.green,
    bg: CB.greenBg,
    label: "Прибыл на пост назначения",
    group: "success",
    terminal: true,
  },
};

export function statusMeta(status: UvedStatus): StatusMeta {
  return (
    STATUS_META[status] ?? {
      fg: CB.textSec,
      bg: CB.grayLight,
      label: status,
      group: "draft",
      terminal: false,
    }
  );
}

export function isTerminal(status: UvedStatus): boolean {
  return statusMeta(status).terminal;
}
