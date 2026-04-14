import { C } from "../data/colors";
import type { StepStatus } from "../types";
import { styCfg } from "./stepStyles";

interface Props {
  label: string;
  status: StepStatus;
  isLast: boolean;
  sub?: string | null;
  isDashed?: boolean;
  subLabel?: string;
  isCustoms?: boolean;
}

export function EntryStepRow({ label, status, isLast, sub, isDashed, subLabel, isCustoms }: Props) {
  const s = styCfg[status];
  const tm: Record<StepStatus, string> = { passed: "Пройден", current: "В процессе", pending: "" };
  const dashed = !!isDashed && status === "pending";
  return (
    <div style={{ display: "flex", gap: 10, opacity: dashed ? 0.5 : 1 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px ${dashed ? "dashed" : "solid"} ${s.ring}`,
            background: dashed ? "transparent" : s.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: s.color,
            flexShrink: 0,
          }}
        >
          {dashed ? "?" : s.icon}
        </div>
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: C.grayBorder,
              minHeight: 12,
              borderLeft: dashed ? `1px dashed ${C.grayBorder}` : "none",
            }}
          />
        )}
      </div>
      <div
        style={{
          paddingBottom: isLast ? 0 : 10,
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 4,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: status === "pending" ? C.gray : C.text,
              lineHeight: 1.3,
            }}
          >
            {label}
          </div>
          {sub && <div style={{ fontSize: 9, color: C.gray, marginTop: 1 }}>{sub}</div>}
          {isCustoms && subLabel && (
            <div
              style={{
                fontSize: 10,
                color: status === "passed" ? C.green : C.gray,
                marginTop: 2,
                fontStyle: status === "pending" ? "italic" : "normal",
                fontWeight: 600,
              }}
            >
              {subLabel}
            </div>
          )}
          {dashed && (
            <div style={{ fontSize: 9, color: C.amber, fontStyle: "italic", marginTop: 1 }}>
              Не определено
            </div>
          )}
        </div>
        {!isCustoms && tm[status] && !dashed && (
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 20,
              flexShrink: 0,
              background: s.bg,
              color: s.color,
              whiteSpace: "nowrap",
            }}
          >
            {tm[status]}
          </span>
        )}
      </div>
    </div>
  );
}
