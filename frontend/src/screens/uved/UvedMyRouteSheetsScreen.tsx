import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../../data/colors";
import { CURRENT_USER } from "../../data/currentUser";
import { fetchMyRouteSheets, type MyRouteSheetsPage, type UvedApiError } from "./api";
import { statusMeta } from "./status";
import { fmtAlmaty } from "../ml/format";
import type { UvedRouteSheet } from "./types";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';

export function UvedMyRouteSheetsScreen() {
  const navigate = useNavigate();
  const [items, setItems] = useState<UvedRouteSheet[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [nextPage, setNextPage] = useState(0);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<UvedApiError | null>(null);

  async function loadPage(page: number, mode: "initial" | "append") {
    if (mode === "initial") setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const r: MyRouteSheetsPage = await fetchMyRouteSheets(page);
      if (mode === "initial") setItems(r.content);
      else setItems((prev) => [...prev, ...r.content]);
      setTotalElements(r.totalElements);
      setTotalPages(r.totalPages);
      setNextPage(r.page + 1);
    } catch (e) {
      setError(e as UvedApiError);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadPage(0, "initial");
  }, []);

  const hasMore = totalPages != null && nextPage < totalPages;

  return (
    <Shell>
      <Header onBack={() => navigate("/")} />

      <ProfileChip />

      {loading && <EmptyState text="Загружаем ваши маршрутные листы…" />}

      {error && !loading && (
        <ErrorBox
          error={error}
          onRetry={() => loadPage(0, "initial")}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <EmptyState text="У вас пока нет маршрутных листов." />
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div
            style={{
              padding: "10px 12px 6px",
              fontSize: 11,
              color: C.textSec,
              fontWeight: 600,
              textTransform: "uppercase",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Мои маршрутные листы</span>
            <span style={{ color: C.text }}>Всего: {totalElements}</span>
          </div>

          <div style={{ padding: "0 12px 12px" }}>
            {items.map((it) => (
              <MyCard
                key={it.lookupCode}
                sheet={it}
                onOpen={() =>
                  navigate(`/uved/by-code/${it.lookupCode}`, { state: { preloaded: it } })
                }
              />
            ))}

            {hasMore && (
              <button
                onClick={() => loadPage(nextPage, "append")}
                disabled={loadingMore}
                style={{
                  width: "100%",
                  padding: 13,
                  background: C.primaryLight,
                  color: C.primary,
                  border: "none",
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loadingMore ? "default" : "pointer",
                  fontFamily: "inherit",
                  opacity: loadingMore ? 0.7 : 1,
                }}
              >
                {loadingMore ? "Загружаем…" : `Показать ещё · страница ${nextPage + 1} из ${totalPages}`}
              </button>
            )}
          </div>
        </>
      )}
    </Shell>
  );
}

/* ───────── pieces ───────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span onClick={onBack} style={{ color: C.white, fontSize: 13, cursor: "pointer" }}>
        ← Назад
      </span>
      <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>Мои МЛ</div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function ProfileChip() {
  const iin = CURRENT_USER.iinBin;
  return (
    <div
      style={{
        margin: "10px 12px 0",
        background: C.white,
        borderRadius: 12,
        padding: "10px 12px",
        border: `1px solid ${C.grayBorder}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ fontSize: 18 }}>🔒</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase", marginBottom: 2 }}>
          Ваш профиль
        </div>
        <div style={{ fontSize: 12, fontFamily: MONO, color: C.text }}>
          ИИН/БИН: {iin || "—"}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        margin: "10px 12px 0",
        background: C.white,
        borderRadius: 14,
        padding: 24,
        textAlign: "center",
        color: C.textSec,
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}

function ErrorBox({
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
  } else if (error.kind === "not_found") {
    title = "Не найдено";
    msg = error.message;
  } else {
    title = "Ошибка сервера";
    msg = error.message ?? `Код ${(error as any).status ?? ""}. Повторите попытку.`;
  }
  return (
    <div style={{ padding: "10px 12px 0" }}>
      <div
        style={{
          background: C.redBg,
          border: `1px solid ${C.red}`,
          borderRadius: 14,
          padding: 16,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 6 }}>{title}</div>
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
            padding: 12,
            marginTop: 10,
            background: C.primary,
            color: C.white,
            border: "none",
            borderRadius: 12,
            fontSize: 13,
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

function MyCard({ sheet, onOpen }: { sheet: UvedRouteSheet; onOpen: () => void }) {
  const meta = statusMeta(sheet.status);
  const destination =
    sheet.destinationSvh?.name ?? sheet.destinationCustomsPostName ?? "—";
  const dateSource = sheet.createdAt || sheet.issuedAt;
  const dateLabel = sheet.createdAt ? "Создан" : sheet.issuedAt ? "Выписан" : "";
  const dateFmt = dateSource ? fmtAlmaty(dateSource) : "—";
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
        <span>{dateLabel ? `${dateLabel} ${dateFmt}` : ""}</span>
        <span style={{ fontFamily: MONO }}>
          {grnzChunk}
          {vinsCount > 0 ? ` · VIN ×${vinsCount}` : ""}
        </span>
      </div>
    </div>
  );
}
