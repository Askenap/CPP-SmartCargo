import { C } from "../data/colors";
import { mockDrivers } from "../data/mockData";

export function DriversScreen() {
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>Водители</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Реестр водителей компании</div>
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
          Все водители ({mockDrivers.length})
        </div>
        {mockDrivers.map((d) => (
          <div
            key={d.id}
            style={{
              background: C.white,
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              borderLeft: `4px solid ${C.transit}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{d.fullName}</span>
            </div>
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>
              ИИН: <span style={{ fontFamily: "monospace" }}>{d.iin}</span>
            </div>
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>
              Права: <span style={{ fontFamily: "monospace" }}>{d.license}</span>
            </div>
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>{d.phone}</div>
            <div
              style={{
                fontSize: 10,
                color: C.transit,
                background: C.transitBg,
                padding: "1px 6px",
                borderRadius: 4,
                display: "inline-block",
                marginTop: 4,
              }}
            >
              {d.company}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
