import { CB } from "../../data/borderColors";
import type { CPPCard } from "../../types";

interface Props {
  cards: CPPCard[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function BorderScanModal({ cards, onSelect, onClose }: Props) {
  const available = cards.filter((c) => c.status === "active" || c.status === "draft");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.7)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CB.white,
          borderRadius: "16px 16px 0 0",
          padding: "16px 12px 20px",
          width: "100%",
          maxWidth: 420,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700 }}>Симуляция сканирования QR</div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "none",
              background: CB.grayLight,
              cursor: "pointer",
              fontSize: 14,
              color: CB.textSec,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ fontSize: 11, color: CB.textSec, marginBottom: 14 }}>
          Выберите ЦПП для «сканирования» (в реальности — камера читает QR):
        </div>
        {available.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: CB.gray, fontSize: 12 }}>
            Нет доступных ЦПП для сканирования
          </div>
        ) : (
          available.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              style={{
                width: "100%",
                padding: 12,
                background: CB.white,
                border: `1px solid ${CB.grayBorder}`,
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                marginBottom: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
                  {c.plate}
                </div>
                <div style={{ fontSize: 11, color: CB.textSec }}>
                  {c.driver} · {c.scenarioLabel || c.type}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background:
                    c.status === "draft" ? CB.amberBg : CB.primaryLight,
                  color: c.status === "draft" ? CB.amber : CB.primary,
                }}
              >
                {c.status === "draft" ? "Черновик" : "Активный"}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
