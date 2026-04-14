import { C } from "../data/colors";
import type { ExitStep, StepStatus } from "../types";
import { styCfg } from "./stepStyles";

interface Props {
  step: ExitStep;
  status: StepStatus;
  isLast: boolean;
}

export function ExitStepRow({ step, status, isLast }: Props) {
  const s = styCfg[status];
  const subText = status === "passed" ? step.subs[0] : "";
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px solid ${s.ring}`,
            background: s.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: s.color,
            flexShrink: 0,
          }}
        >
          {s.icon}
        </div>
        {!isLast && (
          <div style={{ width: 2, flex: 1, background: C.grayBorder, minHeight: 12 }} />
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
            {step.label}
          </div>
          {step.isCustoms && status === "passed" && (
            <div style={{ fontSize: 10, color: C.green, marginTop: 2, fontWeight: 600 }}>
              {step.subs[0]}
            </div>
          )}
          {step.isCustoms && status === "pending" && (
            <div style={{ fontSize: 10, color: C.gray, marginTop: 2, fontStyle: "italic" }}>
              {step.subs.join(" / ")}
            </div>
          )}
        </div>
        {!step.isCustoms && subText && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 20,
              flexShrink: 0,
              background: C.greenBg,
              color: C.green,
              whiteSpace: "nowrap",
            }}
          >
            ({subText})
          </span>
        )}
      </div>
    </div>
  );
}
