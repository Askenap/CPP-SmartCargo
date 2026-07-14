import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../data/colors";
import { StatusBadge } from "../components/StatusBadge";
import { fetchMyRouteSheets, type MyRouteSheetsPage, type UvedApiError } from "./uved/api";
import { statusMeta } from "./uved/status";
import { fmtAlmaty } from "./ml/format";
import type { CPPCard } from "../types";
import type { UvedRouteSheet } from "./uved/types";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';

type ListMode = "cpp" | "ml";

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
  const [chooserOpen, setChooserOpen] = useState(false);
  const [addCodeOpen, setAddCodeOpen] = useState(false);
  const [mode, setMode] = useState<ListMode>("cpp");

  // ─── ML state (lazy) ───
  const [mlItems, setMlItems] = useState<UvedRouteSheet[]>([]);
  const [mlPage, setMlPage] = useState(0);
  const [mlTotalPages, setMlTotalPages] = useState<number | null>(null);
  const [mlTotalElements, setMlTotalElements] = useState(0);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlLoadingMore, setMlLoadingMore] = useState(false);
  const [mlError, setMlError] = useState<UvedApiError | null>(null);
  const [mlLoaded, setMlLoaded] = useState(false);

  async function loadMlPage(page: number, mode: "initial" | "append") {
    if (mode === "initial") setMlLoading(true);
    else setMlLoadingMore(true);
    setMlError(null);
    try {
      const r: MyRouteSheetsPage = await fetchMyRouteSheets(page);
      if (mode === "initial") setMlItems(r.content);
      else setMlItems((prev) => [...prev, ...r.content]);
      setMlTotalElements(r.totalElements);
      setMlTotalPages(r.totalPages);
      setMlPage(r.page + 1);
      setMlLoaded(true);
    } catch (e) {
      setMlError(e as UvedApiError);
    } finally {
      setMlLoading(false);
      setMlLoadingMore(false);
    }
  }

  // Ленивая подгрузка при первом переключении на МЛ
  useEffect(() => {
    if (mode === "ml" && !mlLoaded && !mlLoading && !mlError) {
      loadMlPage(0, "initial");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const hasMoreMl = mlTotalPages != null && mlPage < mlTotalPages;

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

        {/* Свитчер: ЦПП / МЛ */}
        <ModeSwitcher mode={mode} onChange={setMode} cppCount={cards.length} mlCount={mlLoaded ? mlTotalElements : null} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
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
            {mode === "cpp"
              ? `Все ЦПП (${cards.length})`
              : `Мои МЛ${mlLoaded ? ` (${mlTotalElements})` : ""}`}
          </div>
          {mode === "cpp" && onReset && (
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
          {mode === "ml" && mlLoaded && (
            <button
              onClick={() => loadMlPage(0, "initial")}
              disabled={mlLoading}
              style={{
                fontSize: 10,
                color: C.textSec,
                background: "transparent",
                border: `1px solid ${C.grayBorder}`,
                borderRadius: 6,
                padding: "3px 8px",
                cursor: mlLoading ? "default" : "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              ⟳ Обновить
            </button>
          )}
        </div>

        {/* ─── Контент по режиму ─── */}
        {mode === "cpp" ? (
          <>
            {cards.length === 0 && (
              <EmptyBox text="Пока ничего нет. Нажмите «Создать перевозку»." />
            )}
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
          </>
        ) : (
          <>
            {mlLoading && <EmptyBox text="Загружаем ваши маршрутные листы…" />}
            {mlError && !mlLoading && (
              <MlErrorBox error={mlError} onRetry={() => loadMlPage(0, "initial")} />
            )}
            {!mlLoading && !mlError && mlItems.length === 0 && (
              <EmptyBox text="У вас пока нет маршрутных листов." />
            )}
            {!mlLoading && !mlError && mlItems.map((it) => (
              <MlServerCard
                key={it.lookupCode}
                sheet={it}
                onOpen={() =>
                  navigate(`/uved/by-code/${it.lookupCode}`, { state: { preloaded: it } })
                }
              />
            ))}
            {hasMoreMl && !mlError && (
              <button
                onClick={() => loadMlPage(mlPage, "append")}
                disabled={mlLoadingMore}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.primaryLight,
                  color: C.primary,
                  border: "none",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: mlLoadingMore ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: mlLoadingMore ? 0.7 : 1,
                  marginTop: 4,
                }}
              >
                {mlLoadingMore ? "Загружаем…" : `Показать ещё · страница ${mlPage + 1} из ${mlTotalPages}`}
              </button>
            )}

            {/* «Добавить МЛ по коду» — только в МЛ-режиме */}
            <button
              onClick={() => setAddCodeOpen(true)}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 8,
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
              🔎 Открыть чужой МЛ по коду
            </button>
          </>
        )}

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

/* ───────── Switcher ───────── */

function ModeSwitcher({
  mode,
  onChange,
  cppCount,
  mlCount,
}: {
  mode: ListMode;
  onChange: (m: ListMode) => void;
  cppCount: number;
  mlCount: number | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: C.grayLight,
        borderRadius: 12,
        padding: 4,
        gap: 4,
      }}
    >
      <SwitchTab
        active={mode === "cpp"}
        onClick={() => onChange("cpp")}
        label="ЦПП"
        count={cppCount}
      />
      <SwitchTab
        active={mode === "ml"}
        onClick={() => onChange("ml")}
        label="МЛ"
        count={mlCount}
      />
    </div>
  );
}

function SwitchTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number | null;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "9px 0",
        background: active ? C.white : "transparent",
        color: active ? C.primary : C.textSec,
        border: "none",
        borderRadius: 9,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,.06)" : "none",
        transition: "background 0.15s",
      }}
    >
      {label}
      {count != null && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 6,
            background: active ? C.primaryLight : "transparent",
            color: active ? C.primary : C.gray,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ───────── ML card от сервера ───────── */

function MlServerCard({ sheet, onOpen }: { sheet: UvedRouteSheet; onOpen: () => void }) {
  const meta = statusMeta(sheet.status);
  const destination =
    sheet.destinationSvh?.name ?? sheet.destinationCustomsPostName ?? "—";
  const dateSource = sheet.createdAt || sheet.issuedAt;
  const dateLabel = sheet.createdAt ? "Создан" : sheet.issuedAt ? "Выписан" : "";
  const dateFmt = dateSource ? fmtAlmaty(dateSource) : "";
  const vinsCount = sheet.vins?.length ?? 0;
  const grnzChunk = sheet.grnz ?? "—";

  return (
    <div
      onClick={onOpen}
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "12px 14px",
        marginBottom: 8,
        boxShadow: "0 1px 3px rgba(0,0,0,.04)",
        borderLeft: `4px solid ${meta.fg}`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: MONO,
            wordBreak: "break-all",
            minWidth: 0,
            flex: 1,
          }}
        >
          {sheet.serialNumber ?? sheet.lookupCode}
        </div>
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
          {sheet.statusDisplay ?? meta.label}
        </span>
      </div>
      {sheet.serialNumber && (
        <div style={{ fontSize: 9, color: C.gray, fontFamily: MONO, marginBottom: 4 }}>
          код: {sheet.lookupCode}
        </div>
      )}
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4, lineHeight: 1.35 }}>
        {destination}
      </div>
      <div
        style={{
          fontSize: 10,
          color: C.gray,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 6,
        }}
      >
        <span>{dateLabel && dateFmt ? `${dateLabel} ${dateFmt}` : ""}</span>
        <span style={{ fontFamily: MONO }}>
          {grnzChunk}
          {vinsCount > 0 ? ` · VIN ×${vinsCount}` : ""}
        </span>
      </div>
    </div>
  );
}

function MlErrorBox({
  error,
  onRetry,
}: {
  error: UvedApiError;
  onRetry: () => void;
}) {
  let title = "Ошибка";
  let msg = "";
  let hint: string | null = null;
  let canRetry = true;
  if (error.kind === "profile_incomplete") {
    title = "Профиль не заполнен";
    msg = error.message;
    hint = "Заполните ИИН/БИН или телефон в профиле и повторите.";
    canRetry = false;
  } else if (error.kind === "network") {
    title = "Нет связи";
    msg = "Нет связи с системой Smart Cargo ML. Повторите попытку.";
  } else if (error.kind === "rate_limited") {
    title = "Слишком много запросов";
    msg = "Подождите минуту и повторите.";
  } else {
    title = "Ошибка сервера";
    msg = error.message ?? `Код ${(error as any).status ?? ""}. Повторите попытку.`;
  }
  return (
    <div>
      <div
        style={{
          background: C.redBg,
          border: `1px solid ${C.red}`,
          borderRadius: 14,
          padding: 14,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 4 }}>⚠️</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.red, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{msg}</div>
        {hint && (
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 6 }}>{hint}</div>
        )}
      </div>
      {canRetry && (
        <button
          onClick={onRetry}
          style={{
            width: "100%",
            padding: 11,
            marginTop: 8,
            background: C.primary,
            color: C.white,
            border: "none",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Повторить
        </button>
      )}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
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
      {text}
    </div>
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
