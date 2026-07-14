import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../data/colors";
import { StatusBadge } from "../components/StatusBadge";
import { useUvedRouteSheets } from "./uved/storage";
import { statusMeta } from "./uved/status";
import { fmtAlmaty } from "./ml/format";
import type { CPPCard } from "../types";
import type { UvedRouteSheetSlim } from "./uved/types";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';

interface Props {
  cards: CPPCard[];
  onSelect: (id: string) => void;
  onCreate: () => void;
  onReset?: () => void;
  onBorderMode?: () => void;
}

export function MenuScreen({ cards, onSelect, onCreate, onReset, onBorderMode }: Props) {
  const active = cards.find((c) => c.status === "active");
  const navigate = useNavigate();
  const { items: mlItems, remove: removeMl } = useUvedRouteSheets();
  const [chooserOpen, setChooserOpen] = useState(false);
  const [addCodeOpen, setAddCodeOpen] = useState(false);

  const total = cards.length + mlItems.length;

  // ML items: most recent (addedAt desc)
  const sortedMl = useMemo(
    () => [...mlItems].sort((a, b) => (b.addedAt || "").localeCompare(a.addedAt || "")),
    [mlItems]
  );

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
          onClick={() => setChooserOpen(true)}
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
          ＋ Создать перевозку
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
            Все перевозки ({total})
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

        {total === 0 && (
          <div
            style={{
              background: C.white,
              borderRadius: 14,
              padding: 24,
              textAlign: "center",
              color: C.textSec,
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            Пока ничего нет. Нажмите «Создать перевозку» или добавьте существующий МЛ по коду.
          </div>
        )}

        {/* ML cards first */}
        {sortedMl.map((it) => (
          <MlCardRow
            key={it.lookupCode}
            item={it}
            onOpen={() => navigate(`/uved/by-code/${it.lookupCode}`)}
            onRemove={() => {
              if (confirm(`Удалить МЛ ${it.lookupCode} из списка?`)) removeMl(it.lookupCode);
            }}
          />
        ))}

        {/* CPP cards */}
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
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{c.plate}</span>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <TypeChip kind="cpp" />
                  <StatusBadge status={c.status} />
                </div>
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
              <div style={{ fontSize: 9, color: C.gray, marginBottom: 3 }}>{c.customsPost}</div>
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

        {/* Мои МЛ из Smart ML (по профилю) */}
        <button
          onClick={() => navigate("/uved/my")}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 4,
            background: C.primaryLight,
            border: "none",
            borderRadius: 12,
            color: C.primary,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          📋 Мои МЛ из Smart ML
        </button>

        {/* «Добавить МЛ по коду» — вторичное действие */}
        <button
          onClick={() => setAddCodeOpen(true)}
          style={{
            width: "100%",
            padding: 10,
            marginTop: 6,
            background: "transparent",
            border: `1px dashed ${C.grayBorder}`,
            borderRadius: 12,
            color: C.textSec,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          🔎 Добавить МЛ по коду
        </button>

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

      {chooserOpen && (
        <CreateChooser
          onClose={() => setChooserOpen(false)}
          onPickCpp={() => {
            setChooserOpen(false);
            onCreate();
          }}
          onPickMl={() => {
            setChooserOpen(false);
            navigate("/uved/new");
          }}
        />
      )}

      {addCodeOpen && (
        <AddByCodeModal
          onClose={() => setAddCodeOpen(false)}
          onOpen={(code) => {
            setAddCodeOpen(false);
            navigate(`/uved/by-code/${code}`);
          }}
        />
      )}
    </div>
  );
}

/* ───────── ML row ───────── */

function MlCardRow({
  item,
  onOpen,
  onRemove,
}: {
  item: UvedRouteSheetSlim;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const meta = statusMeta(item.status);
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        borderLeft: `4px solid ${meta.fg}`,
        cursor: "pointer",
      }}
      onClick={onOpen}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO, wordBreak: "break-all" }}>
          {item.serialNumber ?? item.lookupCode}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <TypeChip kind="ml" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 6,
              background: meta.bg,
              color: meta.fg,
              whiteSpace: "nowrap",
            }}
          >
            {item.statusDisplay || meta.label}
          </span>
        </div>
      </div>
      {item.serialNumber && (
        <div style={{ fontSize: 9, color: C.gray, fontFamily: MONO, marginBottom: 3 }}>
          код: {item.lookupCode}
        </div>
      )}
      <div style={{ fontSize: 11, color: C.textSec, marginBottom: 3 }}>
        {item.destinationName || "—"}
      </div>
      <div style={{ fontSize: 10, color: C.gray, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span>
          {item.grnz ? `${item.grnz} · ` : ""}создан {fmtAlmaty(item.createdAt)}
        </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{ color: C.gray, cursor: "pointer", padding: 2 }}
        >
          ✕ убрать
        </span>
      </div>
    </div>
  );
}

function TypeChip({ kind }: { kind: "cpp" | "ml" }) {
  const styles =
    kind === "cpp"
      ? { bg: C.primaryLight, fg: C.primary, l: "ЦПП" }
      : { bg: "#fef3c7", fg: "#d97706", l: "МЛ" };
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 5,
        background: styles.bg,
        color: styles.fg,
        letterSpacing: 0.4,
      }}
    >
      {styles.l}
    </span>
  );
}

/* ───────── modals ───────── */

function CreateChooser({
  onClose,
  onPickCpp,
  onPickMl,
}: {
  onClose: () => void;
  onPickCpp: () => void;
  onPickMl: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: C.white,
          borderRadius: "16px 16px 0 0",
          padding: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>
          Что создать?
        </div>

        <button onClick={onPickCpp} style={pickStyle(C.primary, C.primaryLight)}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 22 }}>📦</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>ЦПП</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>
                Цифровой паспорт перевозки
              </div>
            </div>
          </div>
        </button>

        <button onClick={onPickMl} style={pickStyle("#d97706", "#fef3c7")}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 22 }}>📋</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>МЛ</div>
              <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>
                Маршрутный лист Smart ML
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: 11,
            marginTop: 4,
            background: "transparent",
            color: C.textSec,
            border: "none",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

function pickStyle(_fg: string, bg: string): React.CSSProperties {
  return {
    width: "100%",
    padding: 14,
    marginBottom: 8,
    background: bg,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
  };
}

function AddByCodeModal({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setErr("Код — ровно 6 цифр");
      return;
    }
    onOpen(code);
  }
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        style={{ background: C.white, borderRadius: 16, padding: 18, width: "100%", maxWidth: 340 }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Открыть МЛ по коду</div>
        <div style={{ fontSize: 11, color: C.textSec, marginBottom: 12 }}>
          Введите 6-значный код маршрутного листа Smart ML
        </div>
        <input
          autoFocus
          value={code}
          onChange={(e) => {
            setErr(null);
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
          }}
          placeholder="055131"
          inputMode="numeric"
          maxLength={6}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 3,
            border: `1px solid ${C.grayBorder}`,
            borderRadius: 10,
            background: C.white,
            outline: "none",
            marginBottom: 6,
          }}
        />
        {err && <div style={{ fontSize: 11, color: C.red, marginBottom: 6 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: `1px solid ${C.grayBorder}`,
              background: C.white,
              color: C.textSec,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Отмена
          </button>
          <button
            type="submit"
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: "none",
              background: C.primary,
              color: C.white,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Открыть
          </button>
        </div>
      </form>
    </div>
  );
}
