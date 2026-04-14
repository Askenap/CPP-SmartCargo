import { C } from "../data/colors";

interface Props {
  title: string;
  sub?: string;
  onBack: () => void;
}

export function Header({ title, sub, onBack }: Props) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span onClick={onBack} style={{ color: C.white, fontSize: 13, cursor: "pointer" }}>
        ← Назад
      </span>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>{sub}</div>}
      </div>
      <div style={{ width: 40 }} />
    </div>
  );
}
