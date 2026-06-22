import { useNavigate, useParams } from "react-router-dom";
import { CB } from "../../data/borderColors";

export function UvedRouteSheetScreen() {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  return (
    <div style={{ minHeight: "100vh", background: CB.bg, fontFamily: "'DM Sans', sans-serif", color: CB.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div
        style={{
          background: `linear-gradient(135deg, ${CB.primary} 0%, ${CB.primaryDark} 100%)`,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span onClick={() => navigate("/uved")} style={{ color: CB.white, fontSize: 13, cursor: "pointer" }}>← Назад</span>
        <div style={{ color: CB.white, fontSize: 14, fontWeight: 700 }}>МЛ {code}</div>
        <div style={{ width: 40 }} />
      </div>
      <div style={{ margin: "10px 12px", background: CB.white, borderRadius: 14, padding: 24, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: CB.textSec }}>Карточка МЛ для УВЭДа будет реализована в следующем коммите.</div>
      </div>
    </div>
  );
}
