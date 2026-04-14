import { C } from "../data/colors";

interface Props {
  system: string;
  number: string;
  status: string;
}

export function SourceCard({ system, number, status }: Props) {
  const ok = ["Подтверждено", "Выдан", "В пути"].includes(status);
  return (
    <div
      style={{
        background: C.grayLight,
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>{system}</div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 7px",
            borderRadius: 12,
            background: ok ? C.greenBg : C.amberBg,
            color: ok ? C.green : C.amber,
          }}
        >
          {status}
        </span>
      </div>
      <div
        style={{
          fontSize: 11,
          color: C.textSec,
          fontFamily: "monospace",
          marginTop: 3,
        }}
      >
        {number}
      </div>
    </div>
  );
}
