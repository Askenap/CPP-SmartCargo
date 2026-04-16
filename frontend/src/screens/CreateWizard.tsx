import { useMemo, useState, type CSSProperties } from "react";
import { C } from "../data/colors";
import { Header } from "../components/Header";
import {
  mockDrivers,
  mockExportDTs,
  mockImportDTs,
  mockPIs,
  mockQueues,
  mockTransits,
  mockVehicles,
  type Driver,
  type Vehicle,
} from "../data/mockData";
import type { CPPCard, Direction, ExitType } from "../types";

type Sub =
  | "pi"
  | "import"
  | "empty_in"
  | "empty_out"
  | "export"
  | "transit_complete"
  | null;

interface Props {
  onDone: (card: CPPCard) => void;
  onBack: () => void;
}

type Mode = "manual" | "by_number" | "auto";

interface DetectedMeta {
  kind: "queue" | "pi" | "import" | "export" | "transit";
  direction: Direction;
  sub: Sub;
  label: string;
  ref?: string;
  data?: unknown;
}

function detectNumber(raw: string): DetectedMeta | null {
  const num = raw.trim().toUpperCase();
  if (!num) return null;

  // Очередь
  const q = mockQueues.find((x) => x.id.toUpperCase() === num);
  if (q) {
    return {
      kind: "queue",
      direction: "out",
      sub: "empty_out",
      label: "Выезд по электронной очереди",
      ref: q.id,
      data: q,
    };
  }
  if (num.startsWith("CRQ-")) {
    return {
      kind: "queue",
      direction: "out",
      sub: "empty_out",
      label: "Выезд по электронной очереди",
      ref: raw.trim(),
    };
  }

  // Рег. номер ПИ
  const pi = mockPIs.find((x) => x.id.toUpperCase() === num);
  if (pi) {
    return { kind: "pi", direction: "in", sub: "pi", label: "Въезд по ПИ", ref: pi.id, data: pi };
  }
  if (num.startsWith("PI-")) {
    return { kind: "pi", direction: "in", sub: "pi", label: "Въезд по ПИ", ref: raw.trim() };
  }

  // Импортная декларация
  const imDT = mockImportDTs.find((x) => x.id.toUpperCase() === num);
  if (imDT) {
    return {
      kind: "import",
      direction: "in",
      sub: "import",
      label: "Въезд по импортной ДТ",
      ref: imDT.id,
      data: imDT,
    };
  }
  if (num.startsWith("IM-")) {
    return {
      kind: "import",
      direction: "in",
      sub: "import",
      label: "Въезд по импортной ДТ",
      ref: raw.trim(),
    };
  }

  // Экспортная декларация
  const exDT = mockExportDTs.find((x) => x.id.toUpperCase() === num);
  if (exDT) {
    return {
      kind: "export",
      direction: "out",
      sub: "export",
      label: "Выезд по экспортной ДТ",
      ref: exDT.id,
      data: exDT,
    };
  }
  if (num.startsWith("EX-")) {
    return {
      kind: "export",
      direction: "out",
      sub: "export",
      label: "Выезд по экспортной ДТ",
      ref: raw.trim(),
    };
  }

  // Транзитная декларация (10101010/...)
  const tr = mockTransits.find((x) => x.id.toUpperCase() === num);
  if (tr) {
    return {
      kind: "transit",
      direction: "out",
      sub: "transit_complete",
      label: "Завершение транзита",
      ref: tr.id,
      data: tr,
    };
  }
  if (num.startsWith("10101010/")) {
    return {
      kind: "transit",
      direction: "out",
      sub: "transit_complete",
      label: "Завершение транзита",
      ref: raw.trim(),
    };
  }

  return null;
}

export function CreateWizard({ onDone, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("manual");
  const [step, setStep] = useState(0);

  // Alt-flow
  const [numInput, setNumInput] = useState("");
  const detected = useMemo(() => detectNumber(numInput), [numInput]);

  // ТС / Водитель (общие)
  const [plate, setPlate] = useState("");
  const [hasT, setHasT] = useState(false);
  const [trailer, setTrailer] = useState("");
  const [dT, setDT] = useState<"iin" | "passport">("iin");
  const [dV, setDV] = useState("");
  const [dName, setDName] = useState("");
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showDriverPicker, setShowDriverPicker] = useState(false);

  // Manual flow
  const [dir, setDir] = useState<Direction | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [sP, setSP] = useState<number[]>([]);
  const [sTD, setSTD] = useState<number | null>(null);
  const [sQ, setSQ] = useState<number | null>(null);

  const pickVehicle = (v: Vehicle) => {
    setPlate(v.plate);
    setHasT(!!v.trailer);
    setTrailer(v.trailer || "");
    setShowVehiclePicker(false);
  };
  const pickDriver = (d: Driver) => {
    setDT("iin");
    setDV(d.iin);
    setDName(d.fullName);
    setShowDriverPicker(false);
  };

  function buildCard(
    directionFinal: Direction,
    subFinal: Sub,
    extra?: { queueIdx?: number; piIdxs?: number[]; transitIdx?: number; presetRef?: string }
  ): CPPCard {
    let sc = "";
    let sl = "";
    let ba: string | undefined;
    let dd: CPPCard["draftData"];
    let pis: CPPCard["pis"];
    let type = "";
    let to = "";
    let from = "";
    let eT: ExitType | undefined;
    let piCount: number | undefined;

    if (directionFinal === "in") {
      from = "Третья страна";
      to = "—";
      type = "Въезд в Республику Казахстан";
      if (subFinal === "pi") {
        sc = "draft_entry_pi";
        sl = "Въезд по ПИ";
        const idxs = extra?.piIdxs || [];
        pis = idxs.map((i) => mockPIs[i]);
        ba = `${pis.length} ПИ`;
        piCount = pis.length;
        if (pis.length === 0 && extra?.presetRef) {
          // Alt-flow: найдём в реестре или создадим заглушку
          const found = mockPIs.find((p) => p.id === extra.presetRef);
          pis = [
            found || {
              id: extra.presetRef,
              desc: "По регистрационному номеру",
              weight: "—",
              from: "—",
            },
          ];
          ba = "1 ПИ";
          piCount = 1;
        }
      } else if (subFinal === "import") {
        sc = "draft_entry_no_pi";
        sl = "Въезд (импорт)";
      } else {
        sc = "draft_entry_no_pi";
        sl = "Въезд (порожний)";
      }
    } else {
      from = "Казахстан";
      to = "—";
      type = "Выезд из Республики Казахстан";
      const qIdx = extra?.queueIdx ?? 0;
      const q = mockQueues[qIdx] || mockQueues[0];
      const qData = { system: "Cargo Ruqsat", number: q.id, status: "Подтверждено" };
      const ib = {
        system: "Cargo Alem",
        number: `IBR-${Math.floor(Math.random() * 99999)}`,
        status: "Выдан",
      };
      if (subFinal === "empty_out") {
        sc = "draft_exit_export";
        sl = "Выезд (порожний)";
        ba = "Очередь + ИБР";
        dd = { queue: qData, ibr: ib };
        eT = "empty";
      } else if (subFinal === "export") {
        sc = "draft_exit_export";
        sl = "Выезд (экспорт)";
        ba = "Очередь + ИБР";
        dd = { queue: qData, ibr: ib };
        eT = "export";
      } else {
        const td = mockTransits[extra?.transitIdx || 0];
        sc = "draft_exit_transit";
        sl = "Завершение транзита";
        ba = "Очередь + ИБР + ТД";
        dd = {
          queue: qData,
          ibr: ib,
          transit: { number: td?.id || "—", origin: "Кеден", status: td?.status || "В пути" },
        };
        eT = "transit";
      }
    }

    return {
      id: `n_${Date.now()}`,
      status: "draft",
      plate: plate.toUpperCase(),
      driver: dName || (dT === "iin" ? `ИИН: ${dV}` : `Пасп: ${dV}`),
      type,
      customsPost: "ТП «Нұр жолы»",
      from,
      to,
      basis: ba,
      scenario: sc,
      scenarioLabel: sl,
      draftData: dd,
      pis,
      direction: directionFinal,
      exitType: eT,
      piCount,
    };
  }

  function finishAlt() {
    if (!detected) return;
    const card = buildCard(detected.direction, detected.sub, { presetRef: detected.ref });
    onDone(card);
  }

  function finishManual(st?: Sub) {
    const s = st || sub;
    if (!dir || !s) return;
    const card = buildCard(dir, s, {
      queueIdx: sQ ?? undefined,
      piIdxs: s === "pi" ? sP : undefined,
      transitIdx: s === "transit_complete" ? sTD ?? undefined : undefined,
    });
    onDone(card);
  }

  const inp: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: `2px solid ${C.grayBorder}`,
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: "uppercase",
    outline: "none",
    fontFamily: "inherit",
  };

  // Step model (linear):
  // 0 — режим + стартовый ввод
  // 1 — ТС + Водитель
  // 2 — Направление (manual / auto)
  // 3 — Очередь (manual+out / auto+out)
  // 4 — Тип (manual)
  // 5 — ПИ/ТД (manual, if needed)
  const totalSteps = mode === "by_number" ? 2 : mode === "auto" ? (dir === "out" ? 4 : 3) : 5;
  const activeD = Math.min(step > 1 ? step - 1 : step, totalSteps - 1);

  function finishAuto(dirOverride?: Direction) {
    const d = dirOverride || dir!;
    const qIdx = sQ ?? 0;
    const q = mockQueues[qIdx] || mockQueues[0];
    const dd: CPPCard["draftData"] =
      d === "out"
        ? { queue: { system: "Cargo Ruqsat", number: q.id, status: "Подтверждено" } }
        : undefined;
    onDone({
      id: `auto_${Date.now()}`,
      status: "draft",
      plate: plate.toUpperCase(),
      driver: dName || (dT === "iin" ? `ИИН: ${dV}` : `Пасп: ${dV}`),
      type:
        d === "in"
          ? "Въезд в Республику Казахстан"
          : "Выезд из Республики Казахстан",
      customsPost: "ТП «Нұр жолы»",
      from: d === "in" ? "—" : "Казахстан",
      to: "—",
      scenario: "auto_undetermined",
      scenarioLabel: "Тип определится автоматически",
      direction: d,
      draftData: dd,
    });
  }

  const goBackStep = () => {
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  };

  const plateDriverValid = plate.trim().length > 0 && (dName.trim().length > 0 || dV.trim().length > 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <Header
        title="Создание ЦПП"
        sub={`Шаг ${activeD + 1} из ${totalSteps}`}
        onBack={goBackStep}
      />

      {/* Прогресс */}
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 0" }}>
        {Array.from({ length: totalSteps }).map((_, d) => (
          <div
            key={d}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: d < activeD ? C.green : d === activeD ? C.primary : C.grayBorder,
            }}
          />
        ))}
      </div>

      {/* Модалка: выбор ТС */}
      {showVehiclePicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowVehiclePicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 16,
              width: "100%",
              maxWidth: 380,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Реестр ТС</div>
            {mockVehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => pickVehicle(v)}
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${C.grayBorder}`,
                  borderRadius: 10,
                  background: C.white,
                  cursor: "pointer",
                  marginBottom: 6,
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{v.plate}</div>
                <div style={{ fontSize: 11, color: C.textSec }}>
                  {v.model} · {v.year}
                  {v.trailer ? ` · ${v.trailer}` : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Модалка: выбор водителя */}
      {showDriverPicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setShowDriverPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.white,
              borderRadius: 16,
              padding: 16,
              width: "100%",
              maxWidth: 380,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Реестр водителей</div>
            {mockDrivers.map((d) => (
              <button
                key={d.id}
                onClick={() => pickDriver(d)}
                style={{
                  width: "100%",
                  padding: 10,
                  border: `1px solid ${C.grayBorder}`,
                  borderRadius: 10,
                  background: C.white,
                  cursor: "pointer",
                  marginBottom: 6,
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{d.fullName}</div>
                <div style={{ fontSize: 11, color: C.textSec, fontFamily: "monospace" }}>
                  ИИН {d.iin} · {d.license}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 12px 32px" }}>
        {/* STEP 0 — выбор способа + стартовый ввод */}
        {step === 0 && (
          <div>
            {/* Переключатель режима */}
            <div
              style={{
                display: "flex",
                gap: 0,
                background: C.grayLight,
                borderRadius: 10,
                padding: 3,
                marginBottom: 14,
              }}
            >
              {(
                [
                  { k: "manual" as Mode, l: "Вручную" },
                  { k: "by_number" as Mode, l: "По номеру" },
                  { k: "auto" as Mode, l: "Авто" },
                ] as const
              ).map((m) => (
                <button
                  key={m.k}
                  onClick={() => setMode(m.k)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    background: mode === m.k ? C.white : "transparent",
                    color: mode === m.k ? C.text : C.textSec,
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: mode === m.k ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                  }}
                >
                  {m.l}
                </button>
              ))}
            </div>

            {mode === "manual" ? (
              <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSec,
                    marginBottom: 14,
                    lineHeight: 1.4,
                  }}
                >
                  Пошагово введите данные ТС, водителя, направление и тип ЦПП.
                </div>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    background: C.primary,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Начать →
                </button>
              </div>
            ) : mode === "auto" ? (
              <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.transit,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  🤖 Автоматическое создание
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.textSec,
                    marginBottom: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Укажите только ТС, водителя и направление. Тип ЦПП и схема этапности
                  определятся автоматически после обнаружения документов (ПИ, ДТ, ТД)
                  на пункте пропуска.
                </div>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    background: C.transit,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Начать →
                </button>
              </div>
            ) : (
              <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textSec,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Номер ЭО / ПИ / ДТ
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textSec,
                    marginBottom: 12,
                    lineHeight: 1.4,
                  }}
                >
                  Вставьте номер электронной очереди (CRQ-), ПИ (PI-), импортной (IM-) / экспортной (EX-) декларации или ТД (10101010/…). Система определит направление и тип ЦПП.
                </div>
                <input
                  value={numInput}
                  onChange={(e) => setNumInput(e.target.value)}
                  placeholder="CRQ-2026-04887"
                  style={{ ...inp, letterSpacing: 0, textTransform: "none", marginBottom: 10 }}
                />
                {numInput.trim() && !detected && (
                  <div
                    style={{
                      background: C.redBg,
                      color: C.red,
                      fontSize: 11,
                      padding: "8px 10px",
                      borderRadius: 8,
                      marginBottom: 10,
                    }}
                  >
                    Не удалось определить тип по номеру. Проверьте формат.
                  </div>
                )}
                {detected && (
                  <div
                    style={{
                      background: C.greenBg,
                      color: C.green,
                      fontSize: 11,
                      padding: "10px 12px",
                      borderRadius: 10,
                      marginBottom: 10,
                      fontWeight: 600,
                      lineHeight: 1.4,
                    }}
                  >
                    ✓ Определено: <b>{detected.label}</b>
                    <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                      Направление: {detected.direction === "in" ? "въезд в РК" : "выезд из РК"}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => detected && setStep(1)}
                  disabled={!detected}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    background: detected ? C.primary : C.grayBorder,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Далее →
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 1 — ТС + Водитель (единый) */}
        {step === 1 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.textSec,
                  textTransform: "uppercase",
                }}
              >
                🚛 ТС
              </div>
              <button
                onClick={() => setShowVehiclePicker(true)}
                style={{
                  fontSize: 11,
                  color: C.primary,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                ↓ Выбрать из реестра
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.textSec,
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                ГРНЗ
              </label>
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="123ABC02"
                maxLength={12}
                style={inp}
              />
            </div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              <input
                type="checkbox"
                checked={hasT}
                onChange={(e) => setHasT(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: C.primary }}
              />
              <span style={{ fontSize: 13 }}>Прицеп</span>
            </label>
            {hasT && (
              <div style={{ marginBottom: 14 }}>
                <input
                  value={trailer}
                  onChange={(e) => setTrailer(e.target.value)}
                  placeholder="ГРНЗ прицепа"
                  style={inp}
                />
              </div>
            )}

            <div style={{ height: 1, background: C.grayLight, margin: "14px 0" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.textSec,
                  textTransform: "uppercase",
                }}
              >
                👤 Водитель
              </div>
              <button
                onClick={() => setShowDriverPicker(true)}
                style={{
                  fontSize: 11,
                  color: C.primary,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 600,
                }}
              >
                ↓ Выбрать из реестра
              </button>
            </div>

            {dName && (
              <div
                style={{
                  background: C.primaryLight,
                  borderRadius: 10,
                  padding: "8px 12px",
                  marginBottom: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.primary,
                }}
              >
                {dName}
              </div>
            )}

            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {(["iin", "passport"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDT(t)}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 8,
                    border: "none",
                    background: dT === t ? C.primary : C.grayLight,
                    color: dT === t ? C.white : C.textSec,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t === "iin" ? "ИИН" : "Паспорт"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <input
                value={dV}
                onChange={(e) => setDV(e.target.value)}
                placeholder={dT === "iin" ? "12 цифр" : "Паспорт"}
                maxLength={20}
                style={{ ...inp, textTransform: "none" }}
              />
            </div>
            <button
              onClick={() => {
                if (!plateDriverValid) return;
                if (mode === "by_number") {
                  finishAlt();
                } else {
                  setStep(2); // both manual and auto go to Direction
                }
              }}
              disabled={!plateDriverValid}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: plateDriverValid
                  ? mode === "auto"
                    ? C.transit
                    : C.primary
                  : C.grayBorder,
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {mode === "by_number" ? "Создать ЦПП" : "Далее →"}
            </button>
          </div>
        )}

        {/* STEP 2 — Направление (manual) */}
        {step === 2 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.textSec,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Направление
            </div>
            {[
              { k: "in" as const, i: "🇰🇿 ←", t: "Въезд в РК" },
              { k: "out" as const, i: "🇰🇿 →", t: "Выезд из РК" },
            ].map((x) => (
              <button
                key={x.k}
                onClick={() => {
                  setDir(x.k);
                  if (mode === "auto") {
                    if (x.k === "out") setStep(3); // queue required for exit
                    else finishAuto(x.k); // entry → create immediately, pass dir directly
                  } else {
                    setStep(x.k === "out" ? 3 : 4);
                  }
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: 16,
                  border: `2px solid ${C.grayBorder}`,
                  borderRadius: 12,
                  background: C.white,
                  cursor: "pointer",
                  marginBottom: 10,
                  fontFamily: "inherit",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span style={{ fontSize: 24 }}>{x.i}</span>
                {x.t}
              </button>
            ))}
          </div>
        )}

        {/* STEP 3 — Очередь (manual, out) */}
        {step === 3 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.textSec,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Электронная очередь
            </div>
            <div style={{ fontSize: 12, color: C.textSec, marginBottom: 12 }}>
              Выберите очередь из Cargo Ruqsat:
            </div>
            {mockQueues.map((q, i) => (
              <button
                key={i}
                onClick={() => setSQ(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  border: `2px solid ${sQ === i ? C.primary : C.grayBorder}`,
                  borderRadius: 10,
                  background: sQ === i ? C.primaryLight : C.white,
                  cursor: "pointer",
                  marginBottom: 8,
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: `2px solid ${sQ === i ? C.primary : C.grayBorder}`,
                    background: sQ === i ? C.primary : "transparent",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                    {q.id}
                  </div>
                  <div style={{ fontSize: 11, color: C.textSec }}>
                    {q.dest} · {q.date} · {q.slot}
                  </div>
                </div>
              </button>
            ))}

            <button
              onClick={() => {
                window.open("https://cargo.ruqsat.kz/", "_blank", "noopener");
              }}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 10,
                border: `2px dashed ${C.primary}`,
                background: C.primaryLight,
                color: C.primary,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                marginTop: 6,
                marginBottom: 10,
              }}
            >
              ＋ Забронировать электронную очередь Cargo Ruqsat
            </button>

            <button
              onClick={() => {
                if (sQ === null) return;
                if (mode === "auto") finishAuto();
                else setStep(4);
              }}
              disabled={sQ === null}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: sQ !== null ? (mode === "auto" ? C.transit : C.primary) : C.grayBorder,
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {mode === "auto" ? "Создать ЦПП" : "Далее →"}
            </button>
          </div>
        )}

        {/* STEP 4 — Тип (manual) */}
        {step === 4 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.textSec,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              {dir === "in" ? "Тип въезда" : "Тип выезда"}
            </div>
            {(dir === "in"
              ? [
                  { k: "pi" as const, t: "Транзит (ПИ)", i: "📋" },
                  { k: "import" as const, t: "Импорт (ДТ)", i: "📥" },
                  { k: "empty_in" as const, t: "Порожний", i: "📦" },
                ]
              : [
                  { k: "empty_out" as const, t: "Порожний", i: "📦" },
                  { k: "export" as const, t: "Экспорт (ДТ)", i: "📤" },
                  { k: "transit_complete" as const, t: "Завершение транзита", i: "🔄" },
                ]
            ).map((x) => (
              <button
                key={x.k}
                onClick={() => {
                  setSub(x.k);
                  if (x.k === "pi" || x.k === "transit_complete") setStep(5);
                  else finishManual(x.k);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  border: `2px solid ${C.grayBorder}`,
                  borderRadius: 12,
                  background: C.white,
                  cursor: "pointer",
                  marginBottom: 8,
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span style={{ fontSize: 18 }}>{x.i}</span>
                {x.t}
              </button>
            ))}
          </div>
        )}

        {/* STEP 5 — ПИ / ТД (manual) */}
        {step === 5 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            {sub === "pi" ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textSec,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Выбор ПИ
                </div>
                {mockPIs.map((pi, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setSP((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))
                    }
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      border: `2px solid ${sP.includes(i) ? C.transit : C.grayBorder}`,
                      borderRadius: 10,
                      background: sP.includes(i) ? C.transitBg : C.white,
                      cursor: "pointer",
                      marginBottom: 8,
                      fontFamily: "inherit",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={sP.includes(i)}
                      readOnly
                      style={{ width: 16, height: 16, accentColor: C.transit }}
                    />
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, textAlign: "left" }}>
                      {pi.id} — {pi.desc}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => sP.length && finishManual("pi")}
                  disabled={!sP.length}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    background: sP.length ? C.transit : C.grayBorder,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Подтвердить ({sP.length})
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.textSec,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Транзитная декларация
                </div>
                {mockTransits.map((td, i) => (
                  <button
                    key={i}
                    onClick={() => setSTD(i)}
                    style={{
                      width: "100%",
                      padding: 12,
                      border: `2px solid ${sTD === i ? C.transit : C.grayBorder}`,
                      borderRadius: 10,
                      background: sTD === i ? C.transitBg : C.white,
                      cursor: "pointer",
                      marginBottom: 8,
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: "left",
                    }}
                  >
                    {td.id} — {td.desc}
                  </button>
                ))}
                <button
                  onClick={() => sTD !== null && finishManual("transit_complete")}
                  disabled={sTD === null}
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "none",
                    background: sTD !== null ? C.transit : C.grayBorder,
                    color: C.white,
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: "inherit",
                  }}
                >
                  Подтвердить
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
