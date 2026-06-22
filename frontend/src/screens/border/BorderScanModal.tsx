import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CB } from "../../data/borderColors";
import type { CPPCard } from "../../types";

interface Props {
  cards: CPPCard[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function BorderScanModal({ cards, onSelect, onClose }: Props) {
  const navigate = useNavigate();
  const [mlCode, setMlCode] = useState("");
  const [mlError, setMlError] = useState<string | null>(null);

  const available = cards.filter((c) => c.status === "active" || c.status === "draft");

  function submitMl(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = mlCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setMlError("Код МЛ — ровно 6 цифр");
      return;
    }
    onClose();
    navigate(`/ml/${trimmed}`);
  }

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

        <form
          onSubmit={submitMl}
          style={{
            border: `1px solid ${CB.grayBorder}`,
            background: CB.grayLight,
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, color: CB.textSec, marginBottom: 6 }}>
            QR от Smart Cargo ML (6 цифр):
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={mlCode}
              onChange={(e) => {
                setMlError(null);
                setMlCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="055131"
              maxLength={6}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 2,
                border: `1px solid ${CB.grayBorder}`,
                borderRadius: 8,
                background: CB.white,
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 14px",
                background: CB.primary,
                color: CB.white,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Открыть
            </button>
          </div>
          {mlError && (
            <div style={{ fontSize: 11, color: CB.red, marginTop: 6 }}>{mlError}</div>
          )}
        </form>

        <div style={{ fontSize: 11, color: CB.textSec, marginBottom: 8 }}>
          Или выберите ЦПП из списка (в реальности — камера читает QR):
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
