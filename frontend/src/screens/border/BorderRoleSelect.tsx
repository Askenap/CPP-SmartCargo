import { CB } from "../../data/borderColors";

export type BorderRole = "sentry" | "inspection" | "admin";

interface Props {
  onSelect: (role: BorderRole) => void;
  onBack: () => void;
}

const ROLES: { k: BorderRole; icon: string; title: string; desc: string }[] = [
  {
    k: "sentry",
    icon: "🛡",
    title: "Часовой шлагбаума",
    desc: "Контроль въезда/выезда АТС на территорию поста",
  },
  {
    k: "inspection",
    icon: "🔍",
    title: "Наряд досмотра ТС",
    desc: "Физический досмотр транспортного средства",
  },
  {
    k: "admin",
    icon: "⚙",
    title: "Администратор ПС",
    desc: "Управление сотрудниками, журнал действий",
  },
];

export function BorderRoleSelect({ onSelect, onBack }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: CB.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          background: `linear-gradient(135deg, ${CB.primary} 0%, ${CB.primaryDark} 100%)`,
          padding: "16px 16px 20px",
          color: CB.white,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Пограничная служба</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>КНБ Республики Казахстан</div>
          </div>
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,.15)",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              color: CB.white,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            ← Водитель
          </button>
        </div>
      </div>
      <div style={{ padding: "20px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: CB.text, marginBottom: 14 }}>
          Выберите роль
        </div>
        {ROLES.map((r) => (
          <button
            key={r.k}
            onClick={() => onSelect(r.k)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: 16,
              border: `2px solid ${CB.grayBorder}`,
              borderRadius: 14,
              background: CB.white,
              cursor: "pointer",
              marginBottom: 10,
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 28 }}>{r.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: CB.text }}>{r.title}</div>
              <div style={{ fontSize: 11, color: CB.textSec, marginTop: 2 }}>{r.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
