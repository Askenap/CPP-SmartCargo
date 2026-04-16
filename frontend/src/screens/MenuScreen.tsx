import { C } from "../data/colors";
import { StatusBadge } from "../components/StatusBadge";
import type { CPPCard } from "../types";

interface Props {
  cards: CPPCard[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReset?: () => void;
  onBorderMode?: () => void;
}

export function MenuScreen({ cards, onSelect, onCreate, onReset, onBorderMode }: Props) {
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{c.plate}</span>
                <StatusBadge status={c.status} />
              </div>
              {c.cppNumber && (
                <div style={{ fontSize: 9, color: C.gray, fontFamily: "monospace", marginBottom: 3 }}>
                  {c.cppNumber}
                </div>
              )}
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 3 }}>{c.driver}</div>
              <div style={{ fontSize: 10, color: C.textSec, marginBottom: 3 }}>
                {c.from || "—"} → {c.to || "—"}
              </div>
              <div style={{ fontSize: 9, color: C.gray, marginBottom: 3 }}>
                {c.customsPost}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: "1px 5px", borderRadius: 4 }}>
                  {c.type}
                </span>
                {c.scenarioLabel && (
                  <span style={{ fontSize: 9, fontWeight: 600, color: C.draft, background: "#eef2ff", padding: "1px 5px", borderRadius: 4 }}>
                    {c.scenarioLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Демо: интерфейс пограничника */}
        {onBorderMode && (
          <button
            onClick={onBorderMode}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 12,
              background: "#1e3a5f",
              border: "none",
              borderRadius: 12,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🛡 Интерфейс пограничника ПС КНБ
          </button>
        )}
      </div>
    </div>
  );
}
