import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CB } from "../../data/borderColors";
import { getRouteSheet, postBorderPass, type MLFetchError } from "./api";
import { DEMO_FIXTURE } from "./demoFixture";
import type { MLBorderPass, MLRouteSheet } from "./types";
import { fmtAlmaty, minutesUntil } from "./format";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';
const INSPECTOR_LS_KEY = "ml.inspectorFullName";

interface Props {
  /** Если передан — пропускаем fetch и рендерим переданное (используется демо-роутом). */
  demo?: boolean;
}

export function MLRouteSheetScreen({ demo = false }: Props) {
  const { code: codeParam } = useParams<{ code: string }>();
  const code = demo ? DEMO_FIXTURE.lookupCode : (codeParam ?? "");
  const navigate = useNavigate();

  const [data, setData] = useState<MLRouteSheet | null>(demo ? DEMO_FIXTURE : null);
  const [loading, setLoading] = useState<boolean>(!demo);
  const [error, setError] = useState<MLFetchError | null>(null);
  const [confirm, setConfirm] = useState<"pass" | "fail" | null>(null);
  const [success, setSuccess] = useState<MLBorderPass | null>(null);

  useEffect(() => {
    if (demo) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getRouteSheet(code)
      .then((r) => {
        if (!cancelled) setData(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e as MLFetchError);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, demo]);

  if (loading) return <Shell><Header onBack={() => navigate(-1)} /><EmptyState text="Загружаем маршрутный лист…" /></Shell>;
  if (error) return <ErrorView error={error} code={code} onRetry={() => location.reload()} onBack={() => navigate(-1)} />;
  if (!data) return <Shell><Header onBack={() => navigate(-1)} /><EmptyState text="Нет данных" /></Shell>;

  if (success) {
    return (
      <Shell>
        <Header onBack={() => navigate(-1)} />
        <div style={{ margin: "10px 12px 0", background: CB.white, borderRadius: 14, padding: "28px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: CB.green, marginBottom: 4 }}>Событие записано</div>
          <div style={{ fontSize: 12, color: CB.textSec }}>
            {success.statusDisplay}
            {success.passedAt ? ` · ${fmtAlmaty(success.passedAt)}` : ""}
          </div>
        </div>
        <div style={{ padding: "10px 12px 0" }}>
          <button
            onClick={() => navigate(-1)}
            style={{ width: "100%", padding: 14, background: CB.primary, color: CB.white, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Сканировать дальше
          </button>
        </div>
      </Shell>
    );
  }

  const ok = data.isValidForExit;
  const alreadyProcessed = data.borderPass.status !== "NOT_RECORDED";
  const routeMeta = describeRoute(data);

  return (
    <Shell>
      <Header onBack={() => navigate(-1)} />

      {/* Инфо-карточка */}
      <div style={{ margin: "10px 12px 0", background: CB.white, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: routeMeta.badgeBg, color: routeMeta.badgeFg }}>
            {routeMeta.icon} {routeMeta.label}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: CB.grayLight, color: CB.text }}>
            → {routeMeta.target || "—"}
          </span>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase", marginBottom: 4 }}>Серия МЛ</div>
          <div style={{ fontSize: 13, fontFamily: MONO, fontWeight: 700, wordBreak: "break-all" }}>
            {data.serialNumber ?? data.lookupCode}
          </div>
          {data.serialNumber && (
            <div style={{ fontSize: 11, color: CB.textSec, fontFamily: MONO, marginTop: 2 }}>код: {data.lookupCode}</div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
          <div>
            <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase" }}>ГРНЗ тягача</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO }}>{data.grnz ?? "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase" }}>Водитель</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{data.uved?.fullName ?? "—"}</div>
          </div>
          {data.grnzTrailer && (
            <div>
              <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase" }}>ГРНЗ прицепа</div>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO }}>{data.grnzTrailer}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase" }}>Количество ТС</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: (data.vehicleCount ?? 1) > 1 ? CB.amber : CB.text }}>
              {(data.vehicleCount ?? 1) > 1 ? `${data.vehicleCount} (автовоз)` : "1"}
            </div>
          </div>
        </div>
      </div>

      {/* Статус */}
      <div
        style={{
          margin: "10px 12px 0",
          background: ok ? CB.greenBg : CB.redBg,
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 20 }}>{ok ? "✅" : "⛔"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ok ? CB.green : CB.red }}>
            {ok ? "Выпуск разрешён" : "Выпуск запрещён"}
          </div>
          <div style={{ fontSize: 11, color: CB.textSec, marginTop: 2, lineHeight: 1.35 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: CB.white, color: ok ? CB.green : CB.red, marginRight: 6 }}>
              {data.statusDisplay ?? data.status}
            </span>
            {ok ? "Все проверки пройдены" : (data.validationMessage ?? "—")}
          </div>
        </div>
      </div>

      {/* Действия по роли */}
      <div style={{ padding: "10px 12px 0" }}>
        {!alreadyProcessed ? (
          <div style={{ background: CB.white, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CB.textSec, textTransform: "uppercase", marginBottom: 10 }}>
              🛡 Выпуск с поста
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirm("fail")} style={btnDanger}>⊘ Отказать</button>
              <button onClick={() => setConfirm("pass")} style={btnAllow}>☑ Выпустить</button>
            </div>
          </div>
        ) : (
          <div style={{ background: CB.white, borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CB.textSec, textTransform: "uppercase", marginBottom: 10 }}>
              🛡 Выпуск с поста
            </div>
            <div style={{ fontSize: 12, color: CB.textSec }}>
              Уже обработан — повторная отметка невозможна.
            </div>
          </div>
        )}
      </div>

      {/* Детали */}
      <Section title="Маршрут">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <div style={{ fontSize: 20, lineHeight: 1 }}>{routeMeta.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: routeMeta.badgeFg, marginBottom: 2 }}>{routeMeta.label}</div>
            <div style={{ fontSize: 13, color: CB.text, lineHeight: 1.35 }}>{routeMeta.target || "—"}</div>
          </div>
        </div>
      </Section>

      {data.vins.length > 0 && <VinsSection vins={data.vins} />}

      {data.uved && (
        <Section title="УВЭД (отправитель)">
          <div style={{ fontSize: 14, fontWeight: 700, color: CB.text }}>{data.uved.companyName ?? "—"}</div>
          {data.uved.iinBin && (
            <div style={{ fontFamily: MONO, fontSize: 12, color: CB.text, marginTop: 4 }}>{data.uved.iinBin}</div>
          )}
          {data.uved.fullName && (
            <div style={{ fontSize: 12, color: CB.textSec, marginTop: 2 }}>{data.uved.fullName}</div>
          )}
        </Section>
      )}

      {data.invoiceInfo && <InvoiceSection text={data.invoiceInfo} />}

      <DeadlinesSection data={data} />

      {alreadyProcessed && <PrevBorderPassSection bp={data.borderPass} />}

      {/* Bottom spacing */}
      <div style={{ height: 24 }} />

      {confirm && (
        <ConfirmDialog
          mode={confirm}
          data={data}
          onClose={() => setConfirm(null)}
          onDone={(bp) => {
            setConfirm(null);
            setData((d) => (d ? { ...d, borderPass: bp } : d));
            setSuccess(bp);
          }}
        />
      )}
    </Shell>
  );
}

/* ───────────── layout shells ───────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: CB.bg, fontFamily: "'DM Sans', sans-serif", color: CB.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {children}
    </div>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${CB.primary} 0%, ${CB.primaryDark} 100%)`,
        padding: "12px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span onClick={onBack} style={{ color: CB.white, fontSize: 13, cursor: "pointer" }}>← Назад</span>
      <div style={{ color: CB.white, fontSize: 14, fontWeight: 700 }}>Маршрутный лист</div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "10px 12px 0", background: CB.white, borderRadius: 14, padding: "12px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: CB.gray, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ margin: "10px 12px 0", background: CB.white, borderRadius: 14, padding: 28, textAlign: "center", color: CB.textSec, fontSize: 13 }}>
      {text}
    </div>
  );
}

/* ───────────── sections ───────────── */

function VinsSection({ vins }: { vins: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Section title={vins.length > 1 ? `VIN-коды (${vins.length})` : "VIN"}>
      {vins.length === 1 ? (
        <div style={{ fontFamily: MONO, fontSize: 13, wordBreak: "break-all" }}>{vins[0]}</div>
      ) : open ? (
        <>
          {vins.map((v) => (
            <div key={v} style={{ fontFamily: MONO, fontSize: 13, wordBreak: "break-all", padding: "3px 0", borderBottom: `1px solid ${CB.grayLight}` }}>
              {v}
            </div>
          ))}
          <button onClick={() => setOpen(false)} style={linkBtn}>свернуть</button>
        </>
      ) : (
        <>
          <div style={{ fontFamily: MONO, fontSize: 13, wordBreak: "break-all" }}>{vins[0]}</div>
          <button onClick={() => setOpen(true)} style={linkBtn}>+{vins.length - 1} ещё</button>
        </>
      )}
    </Section>
  );
}

function InvoiceSection({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 220;
  const visible = !long || open ? text : text.slice(0, 220) + "…";
  return (
    <Section title="Инвойсы / описание груза">
      <div style={{ fontSize: 12, color: CB.text, background: CB.grayLight, padding: 10, borderRadius: 8, whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
        {visible}
      </div>
      {long && (
        <button onClick={() => setOpen((o) => !o)} style={linkBtn}>
          {open ? "свернуть" : "развернуть"}
        </button>
      )}
    </Section>
  );
}

function DeadlinesSection({ data }: { data: MLRouteSheet }) {
  const left = minutesUntil(data.expiresAt);
  const expiring = left !== null && left < 15;
  return (
    <Section title="Сроки">
      <Row label="Выписан">{fmtAlmaty(data.issuedAt)}</Row>
      <Row label="Срок до">
        <span style={{ color: expiring ? CB.red : CB.text, fontWeight: expiring ? 700 : 400 }}>
          {fmtAlmaty(data.expiresAt)}
          {left !== null && (
            <span style={{ marginLeft: 8, fontSize: 11, color: expiring ? CB.red : CB.textSec }}>
              {left < 0 ? `истёк ${-left} мин назад` : `${left} мин`}
            </span>
          )}
        </span>
      </Row>
      {data.arrivalDeadlineMinutes != null && <Row label="На доезд">{data.arrivalDeadlineMinutes} мин</Row>}
    </Section>
  );
}

function PrevBorderPassSection({ bp }: { bp: MLBorderPass }) {
  const passed = bp.status === "PASSED";
  return (
    <div style={{ margin: "10px 12px 0", background: CB.white, borderRadius: 14, padding: "12px 16px", borderLeft: `4px solid ${passed ? CB.green : CB.red}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: CB.gray, textTransform: "uppercase", marginBottom: 8 }}>Предыдущее событие</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: passed ? CB.green : CB.red, marginBottom: 6 }}>
        {bp.statusDisplay ?? (passed ? "Выпущен" : "Отказ")}
      </div>
      {bp.passedAt && <Row label="Время">{fmtAlmaty(bp.passedAt)}</Row>}
      {bp.inspectorFullName && <Row label="Инспектор">{bp.inspectorFullName}</Row>}
      {bp.post && <Row label="Пост">{bp.post}</Row>}
      {bp.comment && <Row label="Комментарий">{bp.comment}</Row>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "3px 0" }}>
      <div style={{ fontSize: 11, color: CB.textSec }}>{label}</div>
      <div style={{ fontSize: 13, color: CB.text, textAlign: "right", wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

/* ───────────── helpers ───────────── */

function describeRoute(data: MLRouteSheet): {
  label: string;
  icon: string;
  target: string;
  badgeBg: string;
  badgeFg: string;
} {
  if (data.routeType === "TO_SVH") {
    return { label: "На СВХ", icon: "🏬", target: data.destinationSvh?.name ?? "", badgeBg: "#dbeafe", badgeFg: "#2563eb" };
  }
  if (data.routeType === "SVH_TO_SVH") {
    return { label: "Между СВХ", icon: "🔀", target: data.destinationSvh?.name ?? "", badgeBg: CB.amberBg, badgeFg: CB.amber };
  }
  if (data.routeType === "TO_CUSTOMS_POST") {
    return { label: "На таможенный пост", icon: "🏛️", target: data.destinationCustomsPostName ?? "", badgeBg: CB.amberBg, badgeFg: CB.amber };
  }
  return {
    label: "Маршрут",
    icon: "📍",
    target: data.destinationSvh?.name ?? data.destinationCustomsPostName ?? "—",
    badgeBg: CB.grayLight,
    badgeFg: CB.text,
  };
}

/* ───────────── confirm dialog ───────────── */

function ConfirmDialog({
  mode,
  data,
  onClose,
  onDone,
}: {
  mode: "pass" | "fail";
  data: MLRouteSheet;
  onClose: () => void;
  onDone: (bp: MLBorderPass) => void;
}) {
  const [name, setName] = useState<string>(() => localStorage.getItem(INSPECTOR_LS_KEY) ?? "");
  const [comment, setComment] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isPass = mode === "pass";
  const dangerWarning = isPass && !data.isValidForExit;

  async function submit() {
    if (!name.trim()) {
      setErr("Укажите ФИО пограничника");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const r = await postBorderPass(data.lookupCode, {
        passed: isPass,
        inspectorFullName: name.trim(),
        comment: comment.trim() || null,
        passedAt: new Date().toISOString(),
      });
      localStorage.setItem(INSPECTOR_LS_KEY, name.trim());
      onDone(r.borderPass);
    } catch (e) {
      const fe = e as { kind?: string; status?: number; message?: string };
      if (fe.kind === "network") setErr("Нет связи с Smart ML. Повторите.");
      else if (fe.kind === "rate_limited") setErr("Слишком много запросов. Подождите 1 минуту.");
      else if (fe.kind === "not_found") setErr("Маршрутный лист не найден.");
      else if (fe.kind === "config") setErr("Ошибка конфигурации, обратитесь в поддержку.");
      else setErr(fe.message ?? `Ошибка ${fe.status ?? ""}`.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      onClick={busy ? undefined : onClose}
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: CB.white, borderRadius: 16, padding: 20, width: "100%", maxWidth: 360 }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: CB.text, marginBottom: 4 }}>
          {isPass ? "Разрешить выпуск?" : "Запретить выпуск?"}
        </div>
        <div style={{ fontSize: 12, color: CB.textSec, lineHeight: 1.5, marginBottom: 14 }}>
          МЛ <span style={{ fontFamily: MONO }}>{data.lookupCode}</span> · {data.grnz ?? "—"}
          {isPass ? ". Действие записывается в журнал Smart ML." : ". Действие будет записано в журнал Smart ML."}
        </div>

        {dangerWarning && (
          <div
            style={{
              background: CB.redBg,
              border: `1px solid ${CB.red}`,
              borderRadius: 10,
              padding: 10,
              marginBottom: 12,
              fontSize: 11,
              color: CB.red,
              lineHeight: 1.4,
            }}
          >
            ⚠️ Система Smart ML отметила МЛ как невалидный:
            <div style={{ marginTop: 4, fontWeight: 600 }}>{data.validationMessage ?? "—"}</div>
          </div>
        )}

        <Field label="ФИО пограничника">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Иванов И.И." disabled={busy} style={inputStyle} />
        </Field>
        <Field label="Комментарий (опционально)">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} disabled={busy} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </Field>

        {err && <div style={{ fontSize: 11, color: CB.red, marginBottom: 10 }}>{err}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: `1px solid ${CB.grayBorder}`,
              background: CB.white,
              color: CB.textSec,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              flex: 1,
              padding: 11,
              borderRadius: 10,
              border: "none",
              background: isPass ? CB.green : CB.red,
              color: CB.white,
              fontSize: 13,
              fontWeight: 700,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
              fontFamily: "inherit",
            }}
          >
            {busy ? "Отправка…" : isPass ? "Разрешить" : "Запретить"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${CB.grayBorder}`,
  borderRadius: 10,
  fontSize: 13,
  background: CB.white,
  color: CB.text,
  outline: "none",
  fontFamily: "inherit",
};

const btnAllow: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: CB.green,
  color: CB.white,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const btnDanger: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: CB.red,
  color: CB.white,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const linkBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: CB.primary,
  fontSize: 11,
  fontWeight: 600,
  padding: 0,
  cursor: "pointer",
  marginTop: 6,
  fontFamily: "inherit",
};

/* ───────────── error view ───────────── */

function ErrorView({
  error,
  code,
  onRetry,
  onBack,
}: {
  error: MLFetchError;
  code: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  let title = "Ошибка";
  let msg = "";
  let canRetry = false;
  if (error.kind === "not_found") {
    title = "МЛ не найден";
    msg = `Маршрутный лист с кодом ${code} не найден. Возможно, отсканирован старый или чужой QR.`;
  } else if (error.kind === "rate_limited") {
    title = "Слишком много запросов";
    msg = "Подождите 1 минуту и повторите.";
    canRetry = true;
  } else if (error.kind === "config") {
    title = "Ошибка конфигурации";
    msg = "Обратитесь в поддержку.";
  } else if (error.kind === "network") {
    title = "Нет связи";
    msg = "Нет связи с системой Smart Cargo ML. Повторите попытку.";
    canRetry = true;
  } else {
    title = "Ошибка сервера";
    msg = error.message ?? `Код ${error.status}. Повторите попытку.`;
    canRetry = true;
  }
  return (
    <Shell>
      <Header onBack={onBack} />
      <div style={{ margin: "10px 12px 0", background: CB.redBg, border: `1px solid ${CB.red}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 6 }}>⚠️</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: CB.red, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: CB.text, lineHeight: 1.4 }}>{msg}</div>
      </div>
      {canRetry && (
        <div style={{ padding: "10px 12px 0" }}>
          <button
            onClick={onRetry}
            style={{ width: "100%", padding: 12, background: CB.primary, color: CB.white, border: "none", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            Повторить
          </button>
        </div>
      )}
    </Shell>
  );
}
