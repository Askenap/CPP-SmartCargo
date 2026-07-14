import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { C } from "../../data/colors";
import { getRouteSheetByCode, pdfUrl, type UvedApiError } from "./api";
import { useUvedRouteSheets } from "./storage";
import { statusMeta, isTerminal } from "./status";
import { fmtAlmaty, minutesUntil } from "../ml/format";
import type { UvedRouteSheet } from "./types";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';
const REFETCH_MS = 30_000;

export function UvedRouteSheetScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { code = "" } = useParams<{ code: string }>();

  // Preloaded из /uved/my — не делаем повторный fetch на initial mount.
  const preloaded = (location.state as { preloaded?: UvedRouteSheet } | null)?.preloaded ?? null;

  const [data, setData] = useState<UvedRouteSheet | null>(preloaded);
  const [loading, setLoading] = useState(!preloaded);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<UvedApiError | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [qrOpen, setQrOpen] = useState(false);

  const { items, add, patch, remove, has } = useUvedRouteSheets();

  async function load(initial: boolean) {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const r = await getRouteSheetByCode(code);
      setData(r);

      const destinationName =
        r.destinationSvh?.name ?? r.destinationCustomsPostName ?? "";
      if (has(code)) {
        patch(code, {
          serialNumber: r.serialNumber,
          status: r.status,
          statusDisplay: r.statusDisplay ?? statusMeta(r.status).label,
          destinationName,
          grnz: r.grnz,
        });
      } else {
        // Открыли по коду извне (через «Добавить по коду») — сохраним
        add({
          lookupCode: code,
          serialNumber: r.serialNumber,
          status: r.status,
          statusDisplay: r.statusDisplay ?? statusMeta(r.status).label,
          destinationName,
          createdAt: r.createdAt ?? "",
          grnz: r.grnz,
          addedAt: new Date().toISOString(),
        });
      }
    } catch (e: any) {
      setError(e as UvedApiError);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // Если карточку передали preloaded (пришли из /uved/my) — не дёргаем
    // публичный endpoint при первом mount. Пользователь может вручную
    // нажать «Обновить», auto-refetch тоже сработает по таймеру ниже,
    // если статус не финальный.
    if (preloaded) return;
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Auto-refetch every 30s when status is non-terminal
  useEffect(() => {
    if (!data || isTerminal(data.status)) return;
    const t = setInterval(() => load(false), REFETCH_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status]);

  // Tick "now" every 30s so countdown updates
  useEffect(() => {
    if (!data || isTerminal(data.status) || !data.expiresAt || data.arrivedAt) return;
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, [data?.status, data?.expiresAt, data?.arrivedAt]);

  if (loading) return <Shell><Header onBack={() => navigate("/")} title={`МЛ ${code}`} /><EmptyState text="Загружаем маршрутный лист…" /></Shell>;
  if (error) return <ErrorView error={error} code={code} onRetry={() => load(true)} onBack={() => navigate("/")} />;
  if (!data) return <Shell><Header onBack={() => navigate("/")} title={`МЛ ${code}`} /><EmptyState text="Нет данных" /></Shell>;

  const meta = statusMeta(data.status);
  const canDownloadPdf = data.status !== "DRAFT";
  const destinationName = data.destinationSvh?.name ?? data.destinationCustomsPostName ?? "—";

  return (
    <Shell>
      <Header onBack={() => navigate("/")} title={`МЛ ${data.lookupCode}`} />

      {/* Hero: статус + serial + назначение */}
      <div
        style={{
          margin: "10px 12px 0",
          background: C.white,
          borderRadius: 14,
          padding: "14px 16px",
          borderLeft: `4px solid ${meta.fg}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "5px 12px",
              borderRadius: 8,
              background: meta.bg,
              color: meta.fg,
              letterSpacing: 0.4,
            }}
          >
            {data.statusDisplay ?? meta.label}
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "#fef3c7", color: "#d97706", letterSpacing: 0.4 }}>
            МЛ
          </span>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO, wordBreak: "break-all", lineHeight: 1.2 }}>
          {data.serialNumber ?? data.lookupCode}
        </div>
        {data.serialNumber && (
          <div style={{ fontSize: 11, fontFamily: MONO, color: C.textSec, marginTop: 2 }}>
            код: {data.lookupCode}
          </div>
        )}
        <div style={{ fontSize: 12, color: C.textSec, marginTop: 8, lineHeight: 1.35 }}>
          {destinationName}
        </div>

        {/* Countdown / overdue / arrived */}
        {data.status === "ISSUED" && data.expiresAt && !data.arrivedAt && (
          <Countdown expiresAt={data.expiresAt} now={now} />
        )}
        {data.arrivedAt && (
          <div style={{ fontSize: 11, color: C.green, marginTop: 6, fontWeight: 600 }}>
            ✓ Прибыл на СВХ — {fmtAlmaty(data.arrivedAt)}
          </div>
        )}
      </div>

      {/* Rejection reason */}
      {(data.status === "REJECTED" || data.status === "RELEASE_REJECTED") && data.rejectionReason && (
        <div style={{ margin: "10px 12px 0", background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 12, padding: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: "uppercase", marginBottom: 4 }}>
            Причина отказа
          </div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.4 }}>{data.rejectionReason}</div>
        </div>
      )}

      {/* Груз и ТС */}
      <Section title="Груз и ТС">
        {data.invoiceInfo && (
          <Field label="Инвойсы / описание">
            <div style={{ fontSize: 12, background: C.grayLight, borderRadius: 8, padding: 10, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
              {data.invoiceInfo}
            </div>
          </Field>
        )}
        <Row label="ГРНЗ тягача">
          <span style={{ fontFamily: MONO, fontWeight: 700 }}>{data.grnz ?? "—"}</span>
        </Row>
        {data.grnzTrailer && (
          <Row label="ГРНЗ прицепа">
            <span style={{ fontFamily: MONO, fontWeight: 700 }}>{data.grnzTrailer}</span>
          </Row>
        )}
        <Row label="Кол-во ТС">
          <span style={{ fontWeight: 600, color: (data.vehicleCount ?? 1) > 1 ? C.amber : C.text }}>
            {(data.vehicleCount ?? 1) > 1 ? `${data.vehicleCount} (автовоз)` : data.vehicleCount ?? 1}
          </span>
        </Row>
        {data.vins.length > 0 && <VinsBlock vins={data.vins} />}
      </Section>

      {/* Контакты УВЭДа */}
      {data.uved && (
        <Section title="Контакты УВЭДа">
          {data.uved.companyName && (
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{data.uved.companyName}</div>
          )}
          {data.uved.iinBin && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: C.text }}>{data.uved.iinBin}</div>
          )}
          {data.uved.fullName && (
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{data.uved.fullName}</div>
          )}
          {data.uved.phone && (
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 2, fontFamily: MONO }}>{data.uved.phone}</div>
          )}
        </Section>
      )}

      {/* Сроки */}
      <Section title="Сроки">
        <Row label="Создан">{fmtAlmaty(data.createdAt)}</Row>
        {data.issuedAt && <Row label="Выписан">{fmtAlmaty(data.issuedAt)}</Row>}
        {data.expiresAt && (
          <Row label="Срок до">
            <DeadlineValue
              expiresAt={data.expiresAt}
              arrivedAt={data.arrivedAt}
              isTerminal={isTerminal(data.status)}
              now={now}
            />
          </Row>
        )}
        {data.arrivedAt && <Row label="Прибыл на СВХ">{fmtAlmaty(data.arrivedAt)}</Row>}
        {data.arrivalDeadlineMinutes != null && (
          <Row label="На доезд">{data.arrivalDeadlineMinutes} мин</Row>
        )}
      </Section>

      {/* Пост Нур-Жолы */}
      <BorderPassSection bp={data.borderPass} />

      {/* Таможенные реквизиты */}
      {(data.svhAccountingNumber || data.dxtNumber || (data.dtTdEntries?.length ?? 0) > 0) && (
        <Section title="Таможенные реквизиты">
          {data.svhAccountingNumber && (
            <Row label="Учётный № СВХ">
              <span style={{ fontFamily: MONO }}>{data.svhAccountingNumber}</span>
            </Row>
          )}
          {data.dxtNumber && (
            <Row label="ДХТ №">
              <span style={{ fontFamily: MONO }}>{data.dxtNumber}</span>
            </Row>
          )}
          {(data.dtTdEntries?.length ?? 0) > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 6 }}>ДТ / ТД</div>
              {data.dtTdEntries!.map((dt) => (
                <DtTdRow key={dt.number} dt={dt} />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Действия */}
      <div style={{ padding: "12px 12px 28px" }}>
        <button onClick={() => setQrOpen(true)} style={primaryBtn}>
          📱 Показать QR
        </button>
        {canDownloadPdf && (
          <button
            onClick={() => window.open(pdfUrl(code), "_blank", "noopener,noreferrer")}
            style={{ ...secondaryBtn, marginTop: 8 }}
          >
            📄 Скачать PDF
          </button>
        )}
        <button
          onClick={() => load(false)}
          disabled={refreshing}
          style={{ ...secondaryBtn, marginTop: 8, opacity: refreshing ? 0.6 : 1 }}
        >
          {refreshing ? "Обновляем…" : "⟳ Обновить"}
        </button>
        <button
          onClick={() => {
            if (confirm(`Убрать МЛ ${code} из вашего списка? (Это не удалит МЛ из системы Smart ML.)`)) {
              remove(code);
              navigate("/");
            }
          }}
          style={{ ...secondaryBtn, marginTop: 8, color: C.red, borderColor: "#fee2e2" }}
        >
          ✕ Убрать из моего списка
        </button>
      </div>

      {qrOpen && <QrModal code={data.lookupCode} onClose={() => setQrOpen(false)} />}
    </Shell>
  );
}

/* ───────── pieces ───────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "'DM Sans', sans-serif",
        color: C.text,
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {children}
    </div>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
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
      <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{title}</div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: 24, textAlign: "center", color: C.textSec, fontSize: 13 }}>
      {text}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.6 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "4px 0" }}>
      <div style={{ fontSize: 11, color: C.textSec }}>{label}</div>
      <div style={{ fontSize: 13, color: C.text, textAlign: "right", wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

function VinsBlock({ vins }: { vins: string[] }) {
  const [open, setOpen] = useState(vins.length <= 3);
  const visible = open ? vins : vins.slice(0, 1);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>VIN ({vins.length})</div>
      {visible.map((v) => (
        <div key={v} style={{ fontFamily: MONO, fontSize: 12, wordBreak: "break-all", padding: "2px 0", borderBottom: open ? `1px solid ${C.grayLight}` : "none" }}>
          {v}
        </div>
      ))}
      {vins.length > 3 && (
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ background: "none", border: "none", color: C.primary, fontSize: 11, fontWeight: 600, padding: 0, cursor: "pointer", marginTop: 6, fontFamily: "inherit" }}
        >
          {open ? "свернуть" : `+${vins.length - 1} ещё`}
        </button>
      )}
    </div>
  );
}

function Countdown({ expiresAt, now }: { expiresAt: string; now: number }) {
  const total = new Date(expiresAt).getTime();
  if (isNaN(total)) return null;
  const mins = Math.round((total - now) / 60000);
  if (mins <= 0) {
    return (
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: C.red }}>
        ⛔ Просрочен {-mins} мин назад
      </div>
    );
  }
  const color = mins <= 5 ? C.red : mins <= 30 ? C.amber : C.green;
  return (
    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color }}>
      ⏱ Осталось {mins} мин
    </div>
  );
}

function DeadlineValue({
  expiresAt,
  arrivedAt,
  isTerminal: terminal,
  now,
}: {
  expiresAt: string;
  arrivedAt: string | null;
  isTerminal: boolean;
  now: number;
}) {
  const formatted = fmtAlmaty(expiresAt);
  if (arrivedAt || terminal) {
    return <span>{formatted}</span>;
  }
  const left = minutesUntil(expiresAt);
  if (left == null) return <span>{formatted}</span>;
  const overdue = left < 0;
  const color = overdue ? C.red : left < 15 ? C.red : left < 60 ? C.amber : C.text;
  // refresh on tick by referencing `now`
  void now;
  return (
    <span style={{ color, fontWeight: overdue || left < 15 ? 700 : 400 }}>
      {formatted}
      <span style={{ marginLeft: 6, fontSize: 11 }}>
        {overdue ? `(истёк ${-left} мин назад)` : `(${left} мин)`}
      </span>
    </span>
  );
}

function BorderPassSection({ bp }: { bp: UvedRouteSheet["borderPass"] }) {
  if (bp.status === "NOT_RECORDED") {
    return (
      <Section title="Пост Нур-Жолы">
        <div style={{ fontSize: 12, color: C.textSec }}>{bp.statusDisplay ?? "Ещё не пройден"}</div>
      </Section>
    );
  }
  const passed = bp.status === "PASSED";
  return (
    <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "12px 14px", borderLeft: `4px solid ${passed ? C.green : C.red}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.gray, textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.6 }}>
        Пост Нур-Жолы
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: passed ? C.green : C.red, marginBottom: 6 }}>
        {bp.statusDisplay ?? (passed ? "Выпущен" : "Отказ")}
      </div>
      {bp.passedAt && <Row label="Время">{fmtAlmaty(bp.passedAt)}</Row>}
      {bp.inspectorFullName && <Row label="Инспектор">{bp.inspectorFullName}</Row>}
      {bp.post && <Row label="Пост">{bp.post}</Row>}
      {bp.comment && <Row label="Комментарий">{bp.comment}</Row>}
    </div>
  );
}

function DtTdRow({ dt }: { dt: { number: string; status: string; statusDisplay: string } }) {
  const s = dt.status.toUpperCase();
  let fg: string = C.textSec;
  let bg: string = C.grayLight;
  if (s.includes("APPROV") || s.includes("RELEASE") || s.includes("COMPLET")) {
    fg = C.green;
    bg = C.greenBg;
  } else if (s.includes("REJECT") || s.includes("DENI")) {
    fg = C.red;
    bg = C.redBg;
  }
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${C.grayLight}`, gap: 8 }}>
      <span style={{ fontFamily: MONO, fontSize: 12, wordBreak: "break-all", flex: 1 }}>{dt.number}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: bg, color: fg, whiteSpace: "nowrap" }}>
        {dt.statusDisplay}
      </span>
    </div>
  );
}

function QrModal({ code, onClose }: { code: string; onClose: () => void }) {
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  function downloadPng() {
    const c = qrRef.current;
    if (!c) return;
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `ml-${code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.65)",
        zIndex: 200,
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
          maxWidth: 320,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>QR маршрутного листа</div>
        <div style={{ display: "inline-block", padding: 10, border: `1px solid ${C.grayBorder}`, borderRadius: 12 }}>
          <QRCodeCanvas value={code} size={220} level="M" ref={qrRef} />
        </div>
        <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 800, letterSpacing: 5, marginTop: 12 }}>{code}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button
            onClick={downloadPng}
            style={{ flex: 1, padding: 11, background: C.primaryLight, color: C.primary, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Скачать PNG
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: 11, background: C.primary, color: C.white, border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorView({
  error,
  code,
  onRetry,
  onBack,
}: {
  error: UvedApiError;
  code: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  let title = "Ошибка";
  let msg = "";
  let canRetry = false;
  if (error.kind === "not_found") {
    title = "МЛ не найден";
    msg = `Маршрутный лист с кодом ${code} не найден в Smart ML. Проверьте код или попросите УВЭДа отправить актуальный.`;
  } else if (error.kind === "rate_limited") {
    title = "Слишком много запросов";
    msg = "Подождите 1 минуту и повторите.";
    canRetry = true;
  } else if (error.kind === "network") {
    title = "Нет связи";
    msg = "Нет связи с системой Smart Cargo ML. Повторите попытку.";
    canRetry = true;
  } else {
    title = "Ошибка сервера";
    msg = error.message ?? `Код ${(error as any).status ?? ""}. Повторите попытку.`;
    canRetry = true;
  }
  return (
    <Shell>
      <Header onBack={onBack} title={`МЛ ${code}`} />
      <div style={{ margin: "10px 12px 0", background: C.redBg, border: `1px solid ${C.red}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 30, marginBottom: 6 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.red, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{msg}</div>
      </div>
      {canRetry && (
        <div style={{ padding: "10px 12px 0" }}>
          <button
            onClick={onRetry}
            style={{ width: "100%", padding: 13, background: C.primary, color: C.white, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Повторить
          </button>
        </div>
      )}
    </Shell>
  );
}

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: 13,
  background: C.primary,
  color: C.white,
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const secondaryBtn: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: C.white,
  color: C.text,
  border: `1px solid ${C.grayBorder}`,
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
};
