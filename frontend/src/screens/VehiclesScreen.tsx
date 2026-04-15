import { C } from "../data/colors";
import { mockVehicles } from "../data/mockData";

export function VehiclesScreen() {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          padding: 16,
          color: C.white,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>Транспортные средства</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Реестр ТС компании</div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div
          style={{
            fontSize: 11,
            color: C.textSec,
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Все ТС ({mockVehicles.length})
        </div>
        {mockVehicles.map((v) => (
          <div
            key={v.id}
            style={{
              background: C.white,
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              borderLeft: `4px solid ${C.primary}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace" }}>
                {v.plate}
              </span>
              <span style={{ fontSize: 10, color: C.gray, fontFamily: "monospace" }}>
                {v.year}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>
              {v.model}
            </div>
            {v.trailer && (
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>
                Прицеп: <span style={{ fontFamily: "monospace" }}>{v.trailer}</span>
              </div>
            )}
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>
              {v.tech}
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.primary,
                background: C.primaryLight,
                padding: "1px 6px",
                borderRadius: 4,
                display: "inline-block",
                marginTop: 4,
              }}
            >
              {v.company}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
