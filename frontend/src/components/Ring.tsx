import { C } from "../data/colors";

interface RingProps {
  passed: number;
  total: number;
  size?: number;
}

export function Ring({ passed, total, size = 46 }: RingProps) {
  const sw = 4;
  const r = (size - sw * 2) / 2;
  const ci = 2 * Math.PI * r;
  const pct = total > 0 ? (passed / total) * 100 : 0;
  const col = passed === total && total > 0 ? C.green : C.primary;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.grayBorder} strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={sw}
          strokeDasharray={ci}
          strokeDashoffset={ci - (ci * pct) / 100}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .3s" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: size * 0.24, fontWeight: 700, color: C.text }}>
          {passed}
          <span style={{ color: C.gray, fontWeight: 500, fontSize: size * 0.18 }}>/{total}</span>
        </span>
      </div>
    </div>
  );
}
