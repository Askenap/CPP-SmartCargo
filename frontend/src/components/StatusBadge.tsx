import { C } from "../data/colors";
import type { CPPStatus } from "../types";

export function StatusBadge({ status }: { status: CPPStatus }) {
  const m: Record<CPPStatus, { l: string; bg: string; c: string }> = {
    draft: { l: "Черновик", bg: C.draftBg, c: C.draft },
    active: { l: "Активный", bg: C.amberBg, c: C.amber },
    completed: { l: "Завершён", bg: C.greenBg, c: C.green },
  };
  const s = m[status];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 6,
        background: s.bg,
        color: s.c,
      }}
    >
      {s.l}
    </span>
  );
}
