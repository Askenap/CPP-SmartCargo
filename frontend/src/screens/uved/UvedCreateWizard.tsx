import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { C } from "../../data/colors";
import { CURRENT_USER } from "../../data/currentUser";
import { createRouteSheet, fetchSvhDictionary } from "./api";
import type {
  CreateRouteSheetRequest,
  CreateRouteSheetResponse,
  UvedDestinationCustomsPost,
  UvedSvhEntry,
} from "./types";
import { useUvedRouteSheets } from "./storage";

const MONO = '"DM Mono", ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace';

const CUSTOMS_POSTS: { value: UvedDestinationCustomsPost; label: string }[] = [
  { value: "MCPS_KHORGOS", label: "Т/П МЦПС-Хоргос" },
  { value: "ALTYNKOL", label: "Т/П Алтынколь" },
];

interface FormState {
  iinBin: string;
  companyName: string;
  fullName: string;
  phone: string;
  invoiceInfo: string;
  grnz: string;
  grnzTrailer: string;
  vehicleCount: string;
  vins: string[];
  routeType: "TO_SVH" | "TO_CUSTOMS_POST";
  destinationSvhCode: string;
  destinationCustomsPost: UvedDestinationCustomsPost | "";
}

const initialForm: FormState = {
  iinBin: CURRENT_USER.iinBin,
  companyName: "",
  fullName: "",
  phone: CURRENT_USER.phone,
  invoiceInfo: "",
  grnz: "",
  grnzTrailer: "",
  vehicleCount: "1",
  vins: [],
  routeType: "TO_SVH",
  destinationSvhCode: "",
  destinationCustomsPost: "",
};

type FieldErrors = Partial<Record<string, string>>;

function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits.length === 10) digits = "7" + digits;
  if (digits.length === 11 && digits.startsWith("7")) return "+" + digits;
  return null;
}

export function UvedCreateWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateRouteSheetResponse | null>(null);

  const [svh, setSvh] = useState<UvedSvhEntry[] | null>(null);
  const [svhError, setSvhError] = useState<string | null>(null);

  const { add } = useUvedRouteSheets();

  useEffect(() => {
    if (step !== 2 || svh) return;
    fetchSvhDictionary()
      .then(setSvh)
      .catch((e) => setSvhError(e?.message ?? "Не удалось загрузить список СВХ"));
  }, [step, svh]);

  const svhGroups = useMemo(() => {
    if (!svh) return [] as { groupName: string; items: UvedSvhEntry[] }[];
    const m = new Map<string, UvedSvhEntry[]>();
    svh.forEach((s) => {
      const g = s.groupName || "Прочие";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(s);
    });
    return Array.from(m.entries()).map(([groupName, items]) => ({ groupName, items }));
  }, [svh]);

  function update<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateStep1(): boolean {
    const e: FieldErrors = {};
    if (!/^\d{12}$/.test(form.iinBin)) e.iinBin = "ИИН/БИН — ровно 12 цифр";
    if (!form.companyName.trim()) e.companyName = "Укажите название компании";
    else if (form.companyName.length > 200) e.companyName = "Не более 200 символов";
    if (!form.fullName.trim()) e.fullName = "Укажите ФИО";
    else if (form.fullName.length > 200) e.fullName = "Не более 200 символов";
    if (!normalizePhone(form.phone)) e.phone = "Телефон: +7 и 10 цифр";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2(): boolean {
    const e: FieldErrors = {};
    if (!form.invoiceInfo.trim()) e.invoiceInfo = "Укажите сведения о грузе";
    else if (form.invoiceInfo.length > 2000) e.invoiceInfo = "Не более 2000 символов";
    if (form.grnz.length > 20) e.grnz = "Не более 20 символов";
    if (form.grnzTrailer.length > 20) e.grnzTrailer = "Не более 20 символов";
    const vc = parseInt(form.vehicleCount, 10);
    if (!Number.isInteger(vc) || vc < 1 || vc > 999) e.vehicleCount = "1..999";
    const badVin = form.vins.find((v) => v.length > 50);
    if (badVin) e.vins = "VIN — не более 50 символов";
    else if (form.vins.length > 50) e.vins = "Максимум 50 VIN";
    if (form.routeType === "TO_SVH" && !form.destinationSvhCode)
      e.destinationSvhCode = "Выберите СВХ";
    if (form.routeType === "TO_CUSTOMS_POST" && !form.destinationCustomsPost)
      e.destinationCustomsPost = "Выберите таможенный пост";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    if (step === 2) submit();
  }

  function back() {
    if (step === 2) setStep(1);
    else navigate("/");
  }

  async function submit() {
    if (!validateStep2()) return;
    setServerError(null);
    setSubmitting(true);
    const phone = normalizePhone(form.phone)!;
    const vc = parseInt(form.vehicleCount, 10);
    const body: CreateRouteSheetRequest = {
      uved: {
        iinBin: form.iinBin,
        companyName: form.companyName.trim(),
        fullName: form.fullName.trim(),
        phone,
      },
      invoiceInfo: form.invoiceInfo.trim(),
      grnz: form.grnz.trim() || null,
      grnzTrailer: form.grnzTrailer.trim() || null,
      vins: form.vins.map((v) => v.trim()).filter(Boolean),
      vehicleCount: vc,
      routeType: form.routeType,
      destinationSvhCode:
        form.routeType === "TO_SVH" ? form.destinationSvhCode : null,
      destinationCustomsPost:
        form.routeType === "TO_CUSTOMS_POST" ? form.destinationCustomsPost || null : null,
    };
    try {
      const resp = await createRouteSheet(body);
      const destinationName =
        form.routeType === "TO_SVH"
          ? svh?.find((s) => s.code === form.destinationSvhCode)?.name ?? ""
          : CUSTOMS_POSTS.find((p) => p.value === form.destinationCustomsPost)?.label ?? "";
      add({
        lookupCode: resp.lookupCode,
        serialNumber: null,
        statusDisplay: "Черновик",
        status: resp.status,
        destinationName,
        createdAt: resp.createdAt,
        grnz: form.grnz.trim() || null,
        addedAt: new Date().toISOString(),
      });
      setCreated(resp);
      setStep(3);
    } catch (e: any) {
      if (e?.kind === "validation" && Array.isArray(e.fieldErrors)) {
        const fe: FieldErrors = {};
        e.fieldErrors.forEach((x: any) => {
          if (x.field) fe[mapServerField(x.field)] = x.message;
        });
        setErrors(fe);
        setServerError(e.message || "Проверьте поля формы");
      } else if (e?.kind === "rate_limited") {
        setServerError("Слишком много запросов. Подождите минуту.");
      } else if (e?.kind === "network") {
        setServerError("Нет связи с Smart ML. Повторите попытку.");
      } else {
        setServerError(e?.message ?? "Ошибка сервера. Повторите попытку.");
      }
    } finally {
      setSubmitting(false);
    }
  }

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

      <div
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span onClick={back} style={{ color: C.white, fontSize: 13, cursor: "pointer" }}>
          {step === 3 ? "" : "← Назад"}
        </span>
        <div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>
          {step === 3 ? "МЛ создан" : `Новый МЛ · ${step}/2`}
        </div>
        <div style={{ width: 40 }} />
      </div>

      {step !== 3 && <Stepper current={step} />}

      <div style={{ padding: "10px 12px 24px" }}>
        {step === 1 && (
          <Step1 form={form} update={update} errors={errors} />
        )}
        {step === 2 && (
          <Step2
            form={form}
            update={update}
            errors={errors}
            svh={svh}
            svhGroups={svhGroups}
            svhError={svhError}
          />
        )}
        {step === 3 && created && (
          <Step3
            created={created}
            destinationName={
              form.routeType === "TO_SVH"
                ? svh?.find((s) => s.code === form.destinationSvhCode)?.name ?? ""
                : CUSTOMS_POSTS.find((p) => p.value === form.destinationCustomsPost)?.label ?? ""
            }
            onOpen={() => navigate(`/uved/by-code/${created.lookupCode}`)}
            onHome={() => navigate("/")}
          />
        )}

        {serverError && step !== 3 && (
          <div
            style={{
              background: C.redBg,
              border: `1px solid ${C.red}`,
              borderRadius: 10,
              padding: 10,
              color: C.red,
              fontSize: 12,
              marginTop: 10,
            }}
          >
            {serverError}
          </div>
        )}

        {step !== 3 && (
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={back}
              disabled={submitting}
              style={{
                flex: 1,
                padding: 13,
                background: C.white,
                color: C.textSec,
                border: `1px solid ${C.grayBorder}`,
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {step === 1 ? "Отмена" : "← Назад"}
            </button>
            <button
              onClick={next}
              disabled={submitting}
              style={{
                flex: 1.4,
                padding: 13,
                background: C.primary,
                color: C.white,
                border: "none",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: submitting ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {step === 1 ? "Далее →" : submitting ? "Создаём…" : "Создать МЛ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Stepper ───────── */
function Stepper({ current }: { current: 1 | 2 }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "10px 12px 0" }}>
      {[1, 2].map((n) => (
        <div
          key={n}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: n <= current ? C.primary : C.grayBorder,
          }}
        />
      ))}
    </div>
  );
}

/* ───────── Step 1: contacts ───────── */
function Step1({
  form,
  update,
  errors,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: FieldErrors;
}) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        padding: "14px 14px 4px",
        marginTop: 6,
      }}
    >
      <SectionTitle>Контактные данные УВЭДа</SectionTitle>
      <Field label="ИИН/БИН" error={errors.iinBin} hint="🔒 из учётной записи">
        <input
          value={form.iinBin}
          disabled
          readOnly
          style={{ ...inputCss, ...lockedInputCss, fontFamily: MONO, letterSpacing: 1 }}
        />
      </Field>
      <Field label="Название компании" error={errors.companyName}>
        <input
          value={form.companyName}
          onChange={(e) => update("companyName", e.target.value.slice(0, 200))}
          placeholder="ТОО «Имя компании»"
          style={inputCss}
        />
      </Field>
      <Field label="ФИО декларанта / водителя" error={errors.fullName}>
        <input
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value.slice(0, 200))}
          placeholder="Иванов И.И."
          style={inputCss}
        />
      </Field>
      <Field label="Телефон" error={errors.phone} hint="🔒 из учётной записи">
        <input
          value={form.phone}
          disabled
          readOnly
          inputMode="tel"
          style={{ ...inputCss, ...lockedInputCss, fontFamily: MONO }}
        />
      </Field>
    </div>
  );
}

/* ───────── Step 2: cargo & route ───────── */
function Step2({
  form,
  update,
  errors,
  svh,
  svhGroups,
  svhError,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: FieldErrors;
  svh: UvedSvhEntry[] | null;
  svhGroups: { groupName: string; items: UvedSvhEntry[] }[];
  svhError: string | null;
}) {
  function addVin() {
    if (form.vins.length >= 50) return;
    update("vins", [...form.vins, ""]);
  }
  function updateVin(i: number, v: string) {
    update(
      "vins",
      form.vins.map((x, idx) => (idx === i ? v.slice(0, 50) : x))
    );
  }
  function removeVin(i: number) {
    update(
      "vins",
      form.vins.filter((_, idx) => idx !== i)
    );
  }

  return (
    <>
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: "14px 14px 4px",
          marginTop: 6,
        }}
      >
        <SectionTitle>Сведения о грузе</SectionTitle>
        <Field
          label="Инвойсы и описание груза"
          error={errors.invoiceInfo}
          hint="Например: №2135 от 03.05.26, лег. авто Toyota Camry"
        >
          <textarea
            value={form.invoiceInfo}
            onChange={(e) => update("invoiceInfo", e.target.value.slice(0, 2000))}
            rows={3}
            style={{ ...inputCss, fontFamily: "inherit", resize: "vertical" }}
          />
        </Field>
      </div>

      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: "14px 14px 4px",
          marginTop: 10,
        }}
      >
        <SectionTitle>Транспортное средство</SectionTitle>
        <Field label="ГРНЗ тягача (необязательно)" error={errors.grnz}>
          <input
            value={form.grnz}
            onChange={(e) => update("grnz", e.target.value.slice(0, 20))}
            placeholder="412 ABC 02"
            style={{ ...inputCss, fontFamily: MONO }}
          />
        </Field>
        <Field label="ГРНЗ прицепа (необязательно)" error={errors.grnzTrailer}>
          <input
            value={form.grnzTrailer}
            onChange={(e) => update("grnzTrailer", e.target.value.slice(0, 20))}
            placeholder="AB 123 CD"
            style={{ ...inputCss, fontFamily: MONO }}
          />
        </Field>
        <Field label="Количество ТС" error={errors.vehicleCount}>
          <input
            value={form.vehicleCount}
            onChange={(e) =>
              update("vehicleCount", e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            inputMode="numeric"
            style={{ ...inputCss, maxWidth: 100 }}
          />
        </Field>
        <Field label="VIN-коды (необязательно)" error={errors.vins}>
          {form.vins.length === 0 && (
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 6 }}>
              Если груз — автомобили, добавьте VIN каждого.
            </div>
          )}
          {form.vins.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input
                value={v}
                onChange={(e) => updateVin(i, e.target.value)}
                placeholder="WAUZZZ4H1JD012345"
                style={{ ...inputCss, fontFamily: MONO, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => removeVin(i)}
                style={{
                  width: 38,
                  border: `1px solid ${C.grayBorder}`,
                  background: C.white,
                  color: C.gray,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addVin}
            disabled={form.vins.length >= 50}
            style={{
              width: "100%",
              padding: 10,
              background: "transparent",
              color: C.primary,
              border: `1px dashed ${C.primary}`,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: 10,
            }}
          >
            ＋ Добавить VIN
          </button>
        </Field>
      </div>

      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: "14px 14px 6px",
          marginTop: 10,
        }}
      >
        <SectionTitle>Куда едет груз</SectionTitle>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          <RouteChip
            active={form.routeType === "TO_SVH"}
            onClick={() => update("routeType", "TO_SVH")}
            label="До СВХ"
          />
          <RouteChip
            active={form.routeType === "TO_CUSTOMS_POST"}
            onClick={() => update("routeType", "TO_CUSTOMS_POST")}
            label="До таможенного поста"
          />
        </div>
        {form.routeType === "TO_SVH" ? (
          <Field label="СВХ (склад временного хранения)" error={errors.destinationSvhCode}>
            <select
              value={form.destinationSvhCode}
              onChange={(e) => update("destinationSvhCode", e.target.value)}
              disabled={!svh && !svhError}
              style={{ ...inputCss, appearance: "none", background: C.white }}
            >
              <option value="">
                {svh ? "Выберите СВХ…" : svhError ?? "Загрузка списка СВХ…"}
              </option>
              {svhGroups.map((g) => (
                <optgroup key={g.groupName} label={g.groupName}>
                  {g.items.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {svhError && (
              <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{svhError}</div>
            )}
          </Field>
        ) : (
          <Field label="Таможенный пост" error={errors.destinationCustomsPost}>
            <select
              value={form.destinationCustomsPost}
              onChange={(e) =>
                update("destinationCustomsPost", e.target.value as UvedDestinationCustomsPost | "")
              }
              style={{ ...inputCss, appearance: "none", background: C.white }}
            >
              <option value="">Выберите пост…</option>
              {CUSTOMS_POSTS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </>
  );
}

/* ───────── Step 3: success ───────── */
function Step3({
  created,
  destinationName,
  onOpen,
  onHome,
}: {
  created: CreateRouteSheetResponse;
  destinationName: string;
  onOpen: () => void;
  onHome: () => void;
}) {
  const code = created.lookupCode;
  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

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
    <div style={{ marginTop: 6 }}>
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 16,
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 30, marginBottom: 4 }}>✅</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.green, marginBottom: 8 }}>
          Маршрутный лист создан
        </div>
        <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.45, marginBottom: 16 }}>
          Покажите этот код пограничнику и сохраните его — он понадобится для
          отслеживания статуса.
        </div>

        <div
          style={{
            display: "inline-block",
            padding: 12,
            background: C.white,
            border: `1px solid ${C.grayBorder}`,
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <QRCodeCanvas value={code} size={200} level="M" ref={qrRef} />
        </div>

        <div
          style={{
            fontFamily: MONO,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 6,
            color: C.text,
            marginTop: 6,
          }}
        >
          {code}
        </div>
        <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>
          {destinationName}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button onClick={copyCode} style={secondaryBtn}>
          {copied ? "✓ Скопировано" : "Скопировать код"}
        </button>
        <button onClick={downloadPng} style={secondaryBtn}>
          Скачать QR
        </button>
      </div>
      <button onClick={onOpen} style={primaryBtn}>
        Открыть карточку МЛ
      </button>
      <button
        onClick={onHome}
        style={{
          ...secondaryBtn,
          marginTop: 8,
          border: "none",
          background: "transparent",
          color: C.textSec,
        }}
      >
        Вернуться в меню
      </button>

      <div
        style={{
          background: C.amberBg,
          color: C.amber,
          borderRadius: 10,
          padding: 10,
          fontSize: 11,
          marginTop: 12,
          lineHeight: 1.4,
        }}
      >
        Инспектор должен выписать МЛ — до этого статус «Черновик» и PDF недоступен.
      </div>
    </div>
  );
}

/* ───────── primitives ───────── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        color: C.gray,
        textTransform: "uppercase",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4, fontWeight: 600 }}>
        {label}
      </div>
      {children}
      {hint && !error && (
        <div style={{ fontSize: 10, color: C.gray, marginTop: 4 }}>{hint}</div>
      )}
      {error && (
        <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

function RouteChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: 10,
        background: active ? C.primary : C.white,
        color: active ? C.white : C.text,
        border: active ? "none" : `1px solid ${C.grayBorder}`,
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

const inputCss: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${C.grayBorder}`,
  borderRadius: 10,
  fontSize: 14,
  background: C.white,
  color: C.text,
  outline: "none",
  fontFamily: "inherit",
};

const lockedInputCss: React.CSSProperties = {
  background: C.grayLight,
  color: C.textSec,
  cursor: "not-allowed",
};

const primaryBtn: React.CSSProperties = {
  width: "100%",
  padding: 14,
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
  flex: 1,
  padding: 12,
  background: C.white,
  color: C.primary,
  border: `1px solid ${C.primaryLight}`,
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

/* ───────── server field → form key map ───────── */
function mapServerField(serverField: string): string {
  const f = serverField.toLowerCase();
  if (f.includes("iin") || f.includes("bin")) return "iinBin";
  if (f.includes("company")) return "companyName";
  if (f.includes("fullname") || f === "uved.fullname") return "fullName";
  if (f.includes("phone")) return "phone";
  if (f.includes("invoice")) return "invoiceInfo";
  if (f === "grnztrailer") return "grnzTrailer";
  if (f === "grnz") return "grnz";
  if (f.includes("vehiclecount")) return "vehicleCount";
  if (f.includes("vin")) return "vins";
  if (f.includes("svh")) return "destinationSvhCode";
  if (f.includes("customspost")) return "destinationCustomsPost";
  return serverField;
}
