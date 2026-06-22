import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CB } from "../../data/borderColors";
import { getRouteSheet, postBorderPass, type MLFetchError } from "./api";
import { DEMO_FIXTURE } from "./demoFixture";
import type { MLBorderPass, MLRouteSheet } from "./types";
import { fmtAlmaty, minutesUntil } from "./format";

const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", "JetBrains Mono", "Roboto Mono", Consolas, monospace';
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

  if (loading) return <CenterShell><div style={{ color: CB.textSec }}>Загружаем маршрутный лист…</div></CenterShell>;
  if (error) return <ErrorView error={error} code={code} onRetry={() => location.reload()} onBack={() => navigate(-1)} />;
  if (!data) return <CenterShell><div style={{ color: CB.textSec }}>Нет данных</div></CenterShell>;

  if (success) {
    return (
      <Shell>
        <BackBar onBack={() => navigate(-1)} title="Маршрутный лист" />
        <div style={{ padding: 16, textAlign: "center" }}>
          <div
            style={{
              background: CB.greenBg,
              border: `1px solid ${CB.green}`,
              borderRadius: 16,
              padding: "28px 16px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: CB.green, marginBottom: 4 }}>
              Событие записано
            </div>
            <div style={{ fontSize: 13, color: CB.text }}>
              {success.statusDisplay}
              {success.passedAt ? ` · ${fmtAlmaty(success.passedAt)}` : ""}
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: CB.primary,
              color: CB.white,
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Сканировать дальше
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <BackBar onBack={() => navigate(-1)} title="Маршрутный лист" />
      <div style={{ padding: "12px 12px 110px" }}>
        <DecisionBanner data={data} />
        <IdBlock data={data} />
        <RouteBlock data={data} />
        <VehicleBlock data={data} />
        <UvedBlock data={data} />
        <InvoiceBlock data={data} />
        <DeadlinesBlock data={data} />
        <PrevBorderPassBlock bp={data.borderPass} />
      </div>
      <ActionBar
        onPass={() => setConfirm("pass")}
        onFail={() => setConfirm("fail")}
      />
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

/* ───────────── helpers / blocks ───────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: CB.bg, color: CB.text, position: "relative" }}>
      {children}
    </div>
  );
}

function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <Shell>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        {children}
      </div>
    </Shell>
  );
}

function BackBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div
      style={{
        background: CB.primary,
        color: CB.white,
        padding: "12px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <button
        onClick={onBack}
        aria-label="Назад"
        style={{
          width: 32,
          height: 32,
          border: "none",
          borderRadius: 8,
          background: "rgba(255,255,255,.15)",
          color: CB.white,
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        ←
      </button>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
    </div>
  );
}

function DecisionBanner({ data }: { data: MLRouteSheet }) {
  const ok = data.isValidForExit;
  return (
    <div
      style={{
        background: ok ? CB.greenBg : CB.redBg,
        border: `2px solid ${ok ? CB.green : CB.red}`,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 6 }}>{ok ? "✅" : "⛔"}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: ok ? CB.green : CB.red,
          letterSpacing: 0.5,
        }}
      >
        {ok ? "ВЫПУСК РАЗРЕШЁН" : "ВЫПУСК ЗАПРЕЩЁН"}
      </div>
      <div style={{ fontSize: 13, color: CB.text, marginTop: 6, lineHeight: 1.4 }}>
        {ok ? (data.statusDisplay ?? "") : (data.validationMessage ?? data.statusDisplay ?? "")}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
  accent,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: CB.white,
        border: `1px solid ${CB.grayBorder}`,
        borderLeft: accent ? `4px solid ${accent}` : `1px solid ${CB.grayBorder}`,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: CB.textSec,
            marginBottom: 8,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function IdBlock({ data }: { data: MLRouteSheet }) {
  const big = data.serialNumber ?? data.lookupCode;
  return (
    <Card>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 20,
          fontWeight: 700,
          color: CB.text,
          wordBreak: "break-all",
          lineHeight: 1.2,
        }}
      >
        {big}
      </div>
      {data.serialNumber && (
        <div style={{ fontFamily: MONO, fontSize: 12, color: CB.textSec, marginTop: 4 }}>
          код: {data.lookupCode}
        </div>
      )}
    </Card>
  );
}

function RouteBlock({ data }: { data: MLRouteSheet }) {
  let label = "Маршрут";
  let icon = "📍";
  let accent: string = CB.primary;
  let target = "";
  if (data.routeType === "TO_SVH") {
    label = "На СВХ";
    icon = "🏬";
    target = data.destinationSvh?.name ?? "";
  } else if (data.routeType === "SVH_TO_SVH") {
    label = "Перемещение между СВХ";
    icon = "🔀";
    accent = CB.amber;
    target = data.destinationSvh?.name ?? "";
  } else if (data.routeType === "TO_CUSTOMS_POST") {
    label = "На таможенный пост";
    icon = "🏛️";
    accent = CB.amber;
    target = data.destinationCustomsPostName ?? "";
  } else {
    target = data.destinationSvh?.name ?? data.destinationCustomsPostName ?? "—";
  }
  return (
    <Card title="Маршрут" accent={accent}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 14, color: CB.text, lineHeight: 1.35 }}>{target || "—"}</div>
        </div>
      </div>
    </Card>
  );
}

function VehicleBlock({ data }: { data: MLRouteSheet }) {
  const [vinsOpen, setVinsOpen] = useState(false);
  const multi = (data.vehicleCount ?? 1) > 1;
  return (
    <Card title="ТС и груз" accent={multi ? CB.amber : undefined}>
      <Row label="ГРНЗ тягача">
        <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>{data.grnz ?? "—"}</span>
      </Row>
      {data.grnzTrailer && (
        <Row label="ГРНЗ прицепа">
          <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700 }}>{data.grnzTrailer}</span>
        </Row>
      )}
      <Row label="Количество ТС">
        <span style={{ fontSize: 13, fontWeight: multi ? 800 : 600, color: multi ? CB.amber : CB.text }}>
          {data.vehicleCount ?? 1}
          {multi ? " (автовоз)" : " автомобиль"}
        </span>
      </Row>
      {data.vins.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: CB.textSec, marginBottom: 4 }}>VIN</div>
          {data.vins.length === 1 ? (
            <div style={{ fontFamily: MONO, fontSize: 13, wordBreak: "break-all" }}>{data.vins[0]}</div>
          ) : vinsOpen ? (
            <>
              {data.vins.map((v) => (
                <div key={v} style={{ fontFamily: MONO, fontSize: 13, wordBreak: "break-all", marginBottom: 2 }}>
                  {v}
                </div>
              ))}
              <button
                onClick={() => setVinsOpen(false)}
                style={{ background: "none", border: "none", color: CB.primary, fontSize: 12, padding: 0, cursor: "pointer", marginTop: 4 }}
              >
                свернуть
              </button>
            </>
          ) : (
            <>
              <div style={{ fontFamily: MONO, fontSize: 13, wordBreak: "break-all" }}>{data.vins[0]}</div>
              <button
                onClick={() => setVinsOpen(true)}
                style={{ background: "none", border: "none", color: CB.primary, fontSize: 12, padding: 0, cursor: "pointer", marginTop: 4 }}
              >
                +{data.vins.length - 1} ещё
              </button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function UvedBlock({ data }: { data: MLRouteSheet }) {
  const u = data.uved;
  if (!u) return null;
  return (
    <Card title="УВЭД (отправитель)">
      <div style={{ fontSize: 15, fontWeight: 700, color: CB.text, lineHeight: 1.3 }}>
        {u.companyName ?? "—"}
      </div>
      {u.iinBin && (
        <div style={{ fontFamily: MONO, fontSize: 13, color: CB.text, marginTop: 4 }}>{u.iinBin}</div>
      )}
      {u.fullName && (
        <div style={{ fontSize: 12, color: CB.textSec, marginTop: 4 }}>{u.fullName}</div>
      )}
    </Card>
  );
}

function InvoiceBlock({ data }: { data: MLRouteSheet }) {
  const [open, setOpen] = useState(false);
  const text = data.invoiceInfo;
  if (!text) return null;
  const long = text.length > 220;
  const visible = !long || open ? text : text.slice(0, 220) + "…";
  return (
    <Card title="Инвойсы / описание груза">
      <div
        style={{
          fontSize: 13,
          color: CB.text,
          background: CB.grayLight,
          padding: 10,
          borderRadius: 8,
          whiteSpace: "pre-wrap",
          lineHeight: 1.4,
        }}
      >
        {visible}
      </div>
      {long && (
        <button
          onClick={() => setOpen((o) => !o)}
          style={{ background: "none", border: "none", color: CB.primary, fontSize: 12, padding: 0, cursor: "pointer", marginTop: 6 }}
        >
          {open ? "свернуть" : "развернуть"}
        </button>
      )}
    </Card>
  );
}

function DeadlinesBlock({ data }: { data: MLRouteSheet }) {
  const left = minutesUntil(data.expiresAt);
  const expiring = left !== null && left < 15;
  return (
    <Card title="Сроки">
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
      {data.arrivalDeadlineMinutes != null && (
        <Row label="На доезд">{data.arrivalDeadlineMinutes} мин</Row>
      )}
    </Card>
  );
}

function PrevBorderPassBlock({ bp }: { bp: MLBorderPass }) {
  if (bp.status === "NOT_RECORDED") {
    return (
      <div style={{ fontSize: 11, color: CB.textSec, padding: "4px 6px 8px" }}>
        Ранее не пропускался
      </div>
    );
  }
  const passed = bp.status === "PASSED";
  return (
    <Card title="Предыдущее событие" accent={passed ? CB.green : CB.red}>
      <div style={{ fontSize: 14, fontWeight: 700, color: passed ? CB.green : CB.red, marginBottom: 6 }}>
        {bp.statusDisplay ?? (passed ? "Выпущен" : "Отказ")}
      </div>
      {bp.passedAt && <Row label="Время">{fmtAlmaty(bp.passedAt)}</Row>}
      {bp.inspectorFullName && <Row label="Инспектор">{bp.inspectorFullName}</Row>}
      {bp.post && <Row label="Пост">{bp.post}</Row>}
      {bp.comment && <Row label="Комментарий">{bp.comment}</Row>}
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, padding: "4px 0" }}>
      <div style={{ fontSize: 12, color: CB.textSec }}>{label}</div>
      <div style={{ fontSize: 13, color: CB.text, textAlign: "right", wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

function ActionBar({ onPass, onFail }: { onPass: () => void; onFail: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: CB.white,
        borderTop: `1px solid ${CB.grayBorder}`,
        padding: 10,
        display: "flex",
        gap: 8,
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <button
        onClick={onFail}
        style={{
          flex: 1,
          padding: "14px 0",
          background: CB.red,
          color: CB.white,
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 0.5,
          cursor: "pointer",
        }}
      >
        ОТКАЗАТЬ
      </button>
      <button
        onClick={onPass}
        style={{
          flex: 1,
          padding: "14px 0",
          background: CB.green,
          color: CB.white,
          border: "none",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 0.5,
          cursor: "pointer",
        }}
      >
        ВЫПУСТИТЬ
      </button>
    </div>
  );
}

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
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CB.white,
          width: "100%",
          maxWidth: 420,
          borderRadius: "16px 16px 0 0",
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: isPass ? CB.green : CB.red,
            marginBottom: 4,
          }}
        >
          {isPass ? "Подтвердить выпуск" : "Подтвердить отказ"}
        </div>
        <div style={{ fontSize: 12, color: CB.textSec, marginBottom: 12 }}>
          МЛ <span style={{ fontFamily: MONO }}>{data.lookupCode}</span> · {data.grnz ?? "—"}
        </div>

        {dangerWarning && (
          <div
            style={{
              background: CB.redBg,
              border: `1px solid ${CB.red}`,
              borderRadius: 10,
              padding: 10,
              marginBottom: 12,
              fontSize: 12,
              color: CB.red,
              lineHeight: 1.4,
            }}
          >
            ⚠️ Система Smart ML отметила МЛ как невалидный:
            <div style={{ marginTop: 4, fontWeight: 600 }}>{data.validationMessage ?? "—"}</div>
            <div style={{ marginTop: 4 }}>Решение остаётся за вами.</div>
          </div>
        )}

        <Field label="ФИО пограничника">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Иванов И.И."
            disabled={busy}
            style={inputStyle}
          />
        </Field>
        <Field label="Комментарий (опционально)">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            disabled={busy}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
          />
        </Field>

        {err && (
          <div style={{ fontSize: 12, color: CB.red, marginBottom: 10 }}>{err}</div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px 0",
              background: CB.grayLight,
              color: CB.text,
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Отмена
          </button>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              flex: 1,
              padding: "12px 0",
              background: isPass ? CB.green : CB.red,
              color: CB.white,
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Отправка…" : isPass ? "Выпустить" : "Отказать"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${CB.grayBorder}`,
  borderRadius: 10,
  fontSize: 14,
  background: CB.white,
  color: CB.text,
  outline: "none",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: CB.textSec, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

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
      <BackBar onBack={onBack} title="Маршрутный лист" />
      <div style={{ padding: 16 }}>
        <div
          style={{
            background: CB.redBg,
            border: `1px solid ${CB.red}`,
            borderRadius: 14,
            padding: 16,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 6 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: CB.red, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, color: CB.text, lineHeight: 1.4 }}>{msg}</div>
        </div>
        {canRetry && (
          <button
            onClick={onRetry}
            style={{
              width: "100%",
              padding: "14px 0",
              background: CB.primary,
              color: CB.white,
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              marginTop: 12,
              cursor: "pointer",
            }}
          >
            Повторить
          </button>
        )}
      </div>
    </Shell>
  );
}
