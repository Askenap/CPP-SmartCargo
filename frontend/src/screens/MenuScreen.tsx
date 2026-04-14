import { C } from "../data/colors";
import { StatusBadge } from "../components/StatusBadge";
import type { CPPCard } from "../types";

interface Props {
  cards: CPPCard[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onReset?: () => void;
}

export function MenuScreen({ cards, onSelect, onCreate, onActivate, onDelete, onReset }: Props) {
  const active = cards.find((c) => c.status === "active");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
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
        <div style={{ fontSize: 16, fontWeight: 700 }}>SmartCargo</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Цифровой паспорт перевозки</div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        {active && (
          <button
            onClick={() => onSelect(active.id)}
            style={{
              width: "100%",
              padding: 12,
              background: C.primary,
              border: "none",
              borderRadius: 12,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: 10,
            }}
          >
            ⟳ Активный · {active.plate}
          </button>
        )}
        <button
          onClick={onCreate}
          style={{
            width: "100%",
            padding: 12,
            background: C.white,
            border: `2px dashed ${C.primary}`,
            borderRadius: 12,
            color: C.primary,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 12,
          }}
        >
          ＋ Создать ЦПП
        </button>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: C.textSec,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Все ЦПП ({cards.length})
          </div>
          {onReset && (
            <button
              onClick={() => {
                if (confirm("Сбросить все данные к демо-набору?")) onReset();
              }}
              style={{
                fontSize: 10,
                color: C.textSec,
                background: "transparent",
                border: `1px solid ${C.grayBorder}`,
                borderRadius: 6,
                padding: "3px 8px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              ⟲ Сбросить демо
            </button>
          )}
        </div>
        {cards.map((c) => (
          <div
            key={c.id}
            style={{
              background: C.white,
              borderRadius: 14,
              padding: "12px 14px",
              marginBottom: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,.04)",
              borderLeft: `4px solid ${
                c.status === "active" ? C.primary : c.status === "draft" ? C.draft : C.green
              }`,
            }}
          >
            <div onClick={() => onSelect(c.id)} style={{ cursor: "pointer" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700 }}>{c.plate}</span>
                <StatusBadge status={c.status} />
              </div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>{c.driver}</div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: C.primary,
                  background: C.primaryLight,
                  padding: "1px 5px",
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                {c.type}
              </div>
              {c.scenarioLabel && (
                <div
                  style={{
                    fontSize: 10,
                    color: C.draft,
                    marginTop: 2,
                    fontWeight: 600,
                  }}
                >
                  {c.scenarioLabel}
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                borderTop: `1px solid ${C.grayLight}`,
                paddingTop: 8,
              }}
            >
              {c.status === "draft" && (
                <button
                  onClick={() => onActivate(c.id)}
                  style={{
                    flex: 1,
                    padding: "6px 0",
                    borderRadius: 8,
                    border: "none",
                    background: C.greenBg,
                    color: C.green,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  ▶ Активировать
                </button>
              )}
              <button
                onClick={() => onDelete(c.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: C.redBg,
                  color: C.red,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  ...(c.status !== "draft" ? { flex: 1 } : {}),
                }}
              >
                🗑 Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
