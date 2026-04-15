import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { C } from "../data/colors";
import type { CPPCard } from "../types";

interface Props {
  card: CPPCard;
  variant?: "primary" | "draft";
  label?: string;
}

export function QrButton({ card, variant = "primary", label }: Props) {
  const [open, setOpen] = useState(false);
  const color = variant === "draft" ? C.draft : C.primary;
  const borderStyle = variant === "draft" ? "dashed" : "solid";
  const btnLabel = label || (variant === "draft" ? "⊞ QR Draft" : "⊞ QR рейса");

  // Компактный payload для QR: id + plate + scenario
  const payload = JSON.stringify({
    app: "SmartCargo",
    cpp: card.id,
    plate: card.plate,
    scenario: card.scenario,
    direction: card.direction,
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: 14,
          background: C.white,
          border: `2px ${borderStyle} ${color}`,
          borderRadius: 12,
          color,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {btnLabel}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.65)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 340,
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, textAlign: "left" }}>
                {btnLabel.replace("⊞ ", "")}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  border: "none",
                  background: C.grayLight,
                  cursor: "pointer",
                  fontSize: 14,
                  color: C.textSec,
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.grayBorder}`,
                borderRadius: 12,
                padding: 16,
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <QRCodeSVG
                value={payload}
                size={220}
                level="M"
                bgColor={C.white}
                fgColor={C.text}
              />
            </div>
            <div style={{ fontSize: 11, color: C.gray, textTransform: "uppercase", marginBottom: 2 }}>
              ГРНЗ
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", marginBottom: 8 }}>
              {card.plate}
            </div>
            <div style={{ fontSize: 11, color: C.textSec, fontFamily: "monospace" }}>{card.id}</div>
            <div
              style={{
                marginTop: 12,
                fontSize: 10,
                color: C.gray,
                lineHeight: 1.4,
              }}
            >
              Отсканируйте на посту для быстрого доступа к ЦПП
            </div>
          </div>
        </div>
      )}
    </>
  );
}
