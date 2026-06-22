import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CB } from "../../data/borderColors";
import { useUvedRouteSheets } from "./storage";
import { statusMeta } from "./status";
import { fmtAlmaty } from "../ml/format";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';

export function UvedHomeScreen() {
  const navigate = useNavigate();
  const { items, remove } = useUvedRouteSheets();
  const [addCode, setAddCode] = useState("");
  const [addErr, setAddErr] = useState<string | null>(null);

  function addByCode(e: React.FormEvent) {
    e.preventDefault();
    const code = addCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setAddErr("Код — ровно 6 цифр");
      return;
    }
    setAddErr(null);
    navigate(`/uved/by-code/${code}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CB.bg,
        fontFamily: "'DM Sans', sans-serif",
        color: CB.text,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${CB.primary} 0%, ${CB.primaryDark} 100%)`,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          onClick={() => navigate("/")}
          style={{ color: CB.white, fontSize: 13, cursor: "pointer" }}
        >
          ← Назад
        </span>
        <div style={{ color: CB.white, fontSize: 14, fontWeight: 700 }}>
          УВЭД · Маршрутные листы
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Actions */}
      <div style={{ padding: "10px 12px 0" }}>
        <button
          onClick={() => navigate("/uved/new")}
          style={{
            width: "100%",
            padding: 14,
            background: CB.primary,
            color: CB.white,
            border: "none",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 10,
          }}
        >
          ＋ Новый маршрутный лист
        </button>

        <form
          onSubmit={addByCode}
          style={{
            background: CB.white,
            borderRadius: 12,
            padding: 10,
            marginBottom: 12,
            border: `1px solid ${CB.grayBorder}`,
          }}
        >
          <div style={{ fontSize: 11, color: CB.textSec, marginBottom: 6 }}>
            Добавить существующий МЛ по коду (6 цифр):
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={addCode}
              onChange={(e) => {
                setAddErr(null);
                setAddCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              }}
              placeholder="055131"
              inputMode="numeric"
              maxLength={6}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontFamily: MONO,
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
                background: CB.primaryLight,
                color: CB.primary,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Открыть
            </button>
          </div>
          {addErr && (
            <div style={{ fontSize: 11, color: CB.red, marginTop: 6 }}>{addErr}</div>
          )}
        </form>
      </div>

      {/* List */}
      <div style={{ padding: "0 12px 24px" }}>
        <div
          style={{
            fontSize: 11,
            color: CB.textSec,
            fontWeight: 600,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Мои маршрутные листы ({items.length})
        </div>

        {items.length === 0 ? (
          <div
            style={{
              background: CB.white,
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
              color: CB.textSec,
              fontSize: 13,
            }}
          >
            Нет сохранённых МЛ. Создайте новый или добавьте существующий по коду.
          </div>
        ) : (
          items.map((it) => {
            const meta = statusMeta(it.status);
            return (
              <div
                key={it.lookupCode}
                style={{
                  background: CB.white,
                  borderRadius: 14,
                  padding: "12px 14px",
                  marginBottom: 8,
                  borderLeft: `4px solid ${meta.fg}`,
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/uved/by-code/${it.lookupCode}`)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: MONO,
                        wordBreak: "break-all",
                      }}
                    >
                      {it.serialNumber ?? it.lookupCode}
                    </div>
                    {it.serialNumber && (
                      <div
                        style={{
                          fontSize: 10,
                          color: CB.textSec,
                          fontFamily: MONO,
                          marginTop: 2,
                        }}
                      >
                        код: {it.lookupCode}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: CB.textSec, marginTop: 4 }}>
                      {it.destinationName || "—"}
                    </div>
                    <div style={{ fontSize: 10, color: CB.gray, marginTop: 2 }}>
                      {it.grnz ? `${it.grnz} · ` : ""}
                      создан {fmtAlmaty(it.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: meta.bg,
                        color: meta.fg,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {it.statusDisplay || meta.label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Удалить МЛ ${it.lookupCode} из списка?`)) {
                          remove(it.lookupCode);
                        }
                      }}
                      title="Удалить из списка"
                      style={{
                        fontSize: 10,
                        color: CB.gray,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        fontFamily: "inherit",
                      }}
                    >
                      ✕ убрать
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
