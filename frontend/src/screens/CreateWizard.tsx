import { useState, type CSSProperties } from "react";
import { C } from "../data/colors";
import { Header } from "../components/Header";
import { mockPIs, mockQueues, mockTransits } from "../data/mockData";
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

export function CreateWizard({ onDone, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [plate, setPlate] = useState("");
  const [hasT, setHasT] = useState(false);
  const [trailer, setTrailer] = useState("");
  const [dT, setDT] = useState<"iin" | "passport">("iin");
  const [dV, setDV] = useState("");
  const [dir, setDir] = useState<Direction | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [sP, setSP] = useState<number[]>([]);
  const [sTD, setSTD] = useState<number | null>(null);
  const [sQ, setSQ] = useState<number | null>(null);

  function finish(st?: Sub) {
    const s = st || sub;
    let sc = "";
    let sl = "";
    let ba: string | undefined;
    let dd: CPPCard["draftData"];
    let pis: CPPCard["pis"];
    let type = "";
    let to = "";
    let from = "";
    let eT: ExitType | undefined;
    if (dir === "in") {
      from = "Третья страна";
      to = "—";
      type = "Въезд в Республику Казахстан";
      if (s === "pi") {
        sc = "draft_entry_pi";
        sl = "Въезд по ПИ";
        ba = `${sP.length} ПИ`;
        pis = sP.map((i) => mockPIs[i]);
      } else if (s === "import") {
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
      const q = mockQueues[sQ ?? 0] || mockQueues[0];
      const qData = { system: "Cargo Ruqsat", number: q.id, status: "Подтверждено" };
      const ib = {
        system: "Cargo Alem",
        number: `IBR-${Math.floor(Math.random() * 99999)}`,
        status: "Выдан",
      };
      if (s === "empty_out") {
        sc = "draft_exit_export";
        sl = "Выезд (порожний)";
        ba = "Очередь + ИБР";
        dd = { queue: qData, ibr: ib };
        eT = "empty";
      } else if (s === "export") {
        sc = "draft_exit_export";
        sl = "Выезд (экспорт)";
        ba = "Очередь + ИБР";
        dd = { queue: qData, ibr: ib };
        eT = "export";
      } else {
        const td = mockTransits[sTD || 0];
        sc = "draft_exit_transit";
        sl = "Завершение транзита";
        ba = "Очередь + ИБР + ТД";
        dd = {
          queue: qData,
          ibr: ib,
          transit: { number: td.id, origin: "Кеден", status: td.status },
        };
        eT = "transit";
      }
    }
    onDone({
      id: `n_${Date.now()}`,
      status: "draft",
      plate: plate.toUpperCase(),
      driver: dT === "iin" ? `ИИН: ${dV}` : `Пасп: ${dV}`,
      type,
      customsPost: "ТП «Нұр жолы»",
      from,
      to,
      basis: ba,
      scenario: sc,
      scenarioLabel: sl,
      draftData: dd,
      pis,
      direction: dir!,
      exitType: eT,
    });
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
  const dots = [0, 1, 2, 3, 4, 5];
  const activeD = Math.min(step, 5);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <Header
        title="Создание ЦПП"
        sub={`Шаг ${activeD + 1}`}
        onBack={step === 0 ? onBack : () => setStep((s) => s - 1)}
      />
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 0" }}>
        {dots.map((d) => (
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
      <div style={{ padding: "0 12px 32px" }}>
        {step === 0 && (
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
              🚛 ТС
            </div>
            <div style={{ marginBottom: 14 }}>
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
              <span>Прицеп</span>
            </label>
            {hasT && (
              <div style={{ marginBottom: 8 }}>
                <input
                  value={trailer}
                  onChange={(e) => setTrailer(e.target.value)}
                  placeholder="ГРНЗ прицепа"
                  style={inp}
                />
              </div>
            )}
            <button
              onClick={() => plate.trim() && setStep(1)}
              disabled={!plate.trim()}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: plate.trim() ? C.primary : C.grayBorder,
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
        {step === 1 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
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
                style={inp}
              />
            </div>
            <button
              onClick={() => dV.trim() && setStep(2)}
              disabled={!dV.trim()}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: dV.trim() ? C.primary : C.grayBorder,
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
                  setStep(x.k === "out" ? 3 : 4);
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
              onClick={() => sQ !== null && setStep(4)}
              disabled={sQ === null}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: sQ !== null ? C.primary : C.grayBorder,
                color: C.white,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                marginTop: 4,
              }}
            >
              Далее →
            </button>
          </div>
        )}
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
                  else finish(x.k);
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
        {step === 5 && (
          <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
            {sub === "pi" ? (
              <>
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
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>
                      {pi.id} — {pi.desc}
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => sP.length && finish("pi")}
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
                    }}
                  >
                    {td.id} — {td.desc}
                  </button>
                ))}
                <button
                  onClick={() => sTD !== null && finish("transit_complete")}
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
