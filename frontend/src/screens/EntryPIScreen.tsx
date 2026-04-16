import { useState } from "react";
import { C } from "../data/colors";
import {
  ENTRY_PER_PI,
  ENTRY_SHARED_AFTER,
  ENTRY_SHARED_BEFORE,
  TOTAL_PER,
  TOTAL_SHARED,
} from "../data/entrySteps";
import { mockQueues } from "../data/mockData";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { SourceCard } from "../components/SourceCard";
import { Ring } from "../components/Ring";
import { HScroll } from "../components/HScroll";
import { EntryStepRow } from "../components/EntryStepRow";
import { ScanModal } from "../components/ScanModal";
import { QrButton } from "../components/QrButton";
import { TabBar, type TabKey } from "../components/TabBar";
import { DocsTabs } from "../components/DocsTabs";
import { stepSt } from "../components/stepStyles";
import type { CPPCard, CPPProgress, QueueItem, StepStatus } from "../types";

interface Props {
  card: CPPCard;
  onBack: () => void;
  onComplete?: () => void;
  onSaveProgress?: (p: CPPProgress) => void;
}

export function EntryPIScreen({ card, onBack, onComplete, onSaveProgress }: Props) {
  const piCount = card.piCount || 7;
  const tonType = card.tonType || "border";
  const tonName = card.tonName || (tonType === "border" ? "ТП на границе" : "ТП назначения в РК");
  const PIS = Array.from({ length: piCount }, (_, i) => ({
    id: i,
    regNumber: `KZ/060426/${String(1265 + i).padStart(9, "0")}`,
    label: `ПИ №${i + 1}`,
  }));
  const TOTAL_ALL = TOTAL_SHARED + TOTAL_PER * PIS.length;
  const initPi: Record<number, number> = {};
  PIS.forEach((p) => {
    initPi[p.id] = 0;
  });

  // ─── Прохождение поста (с persist) ───
  const savedPiSteps = card.progress?.piSteps;
  const restoredPi: Record<number, number> = {};
  PIS.forEach((p) => { restoredPi[p.id] = savedPiSteps ? (Number(savedPiSteps[String(p.id)]) || 0) : 0; });

  const [sh, setShRaw] = useState(card.progress?.shared ?? 0);
  const [piS, setPiSRaw] = useState<Record<number, number>>(restoredPi);
  const [selPi, setSelPi] = useState(card.progress?.selectedPi ?? 0);
  const [tab, setTab] = useState<TabKey>("status");
  const [vd, setVd] = useState<string | null>(null);

  // ─── После поста: транзит до ТОН ───
  const savedQ = card.progress?.attachedQueueId
    ? mockQueues.find((q) => q.id === card.progress?.attachedQueueId) || null
    : null;
  const [attachedQueue, setAttachedQueueRaw] = useState<QueueItem | null>(savedQ);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [transitDeclared, setTransitDeclaredRaw] = useState(card.progress?.transitDeclared ?? false);

  // Persist helper
  const persist = (overrides?: Partial<CPPProgress>) => {
    const piStepsObj: Record<string, number> = {};
    PIS.forEach((p) => { piStepsObj[String(p.id)] = piS[p.id] || 0; });
    onSaveProgress?.({
      shared: sh,
      piSteps: piStepsObj,
      selectedPi: selPi,
      attachedQueueId: attachedQueue?.id || undefined,
      transitDeclared,
      ...overrides,
    });
  };
  const setSh = (v: number | ((p: number) => number)) => {
    setShRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      setTimeout(() => persist({ shared: next }), 0);
      return next;
    });
  };
  const setPiS = (v: Record<number, number> | ((p: Record<number, number>) => Record<number, number>)) => {
    setPiSRaw((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      const piStepsObj: Record<string, number> = {};
      PIS.forEach((p) => { piStepsObj[String(p.id)] = next[p.id] || 0; });
      setTimeout(() => onSaveProgress?.({ piSteps: piStepsObj }), 0);
      return next;
    });
  };
  const setAttachedQueue = (q: QueueItem | null) => {
    setAttachedQueueRaw(q);
    setTimeout(() => onSaveProgress?.({ attachedQueueId: q?.id || undefined }), 0);
  };
  const setTransitDeclared = (v: boolean) => {
    setTransitDeclaredRaw(v);
    setTimeout(() => onSaveProgress?.({ transitDeclared: v }), 0);
  };

  const pp = piS[selPi] || 0;
  const cntP = () => {
    let c = Math.min(sh, TOTAL_SHARED);
    PIS.forEach((p) => {
      c += Math.min(piS[p.id] || 0, TOTAL_PER);
    });
    return c;
  };
  const tp = cntP();
  const borderDone = tp >= TOTAL_ALL;
  const queueReady = tonType === "inland" || !!attachedQueue;
  const cppCompleted = borderDone && queueReady && transitDeclared;

  const getOv = () => {
    if (sh === 0) return { l: "Ожидание прибытия", bg: C.gray, i: "⏳" };
    if (cppCompleted) return { l: "Транзит завершён", bg: C.green, i: "✓" };
    if (borderDone && !queueReady)
      return { l: "Требуется прикрепить электронную очередь", bg: C.amber, i: "⚠" };
    if (borderDone) return { l: `В пути к ${tonName}`, bg: C.transit, i: "🚚" };
    return { l: "В процессе прохождения границы", bg: C.amber, i: "⟳" };
  };
  const ov = getOv();
  const multiPi = piCount > 1;

  const allSt: { l: string; sh: boolean; gs: () => StepStatus }[] = [];
  ENTRY_SHARED_BEFORE.forEach((s, i) =>
    allSt.push({ l: s.label, sh: true, gs: () => stepSt(i, sh) })
  );
  ENTRY_PER_PI.forEach((s, i) => {
    const can = sh >= ENTRY_SHARED_BEFORE.length;
    allSt.push({ l: s.label, sh: false, gs: () => (can ? stepSt(i, pp) : "pending") });
  });
  ENTRY_SHARED_AFTER.forEach((s, i) => {
    const ap = PIS.every((p) => piS[p.id] >= TOTAL_PER);
    const bd = sh >= ENTRY_SHARED_BEFORE.length;
    allSt.push({
      l: s.label,
      sh: true,
      gs: () => (!bd || !ap ? "pending" : stepSt(ENTRY_SHARED_BEFORE.length + i, sh)),
    });
  });
  const rev = [...allSt].reverse();

  const adv = () => {
    if (sh < ENTRY_SHARED_BEFORE.length) {
      setSh((s) => s + 1);
      return;
    }
    if (pp < TOTAL_PER) {
      setPiS((p) => ({ ...p, [selPi]: p[selPi] + 1 }));
      return;
    }
    if (PIS.every((p) => piS[p.id] >= TOTAL_PER) && sh < TOTAL_SHARED) {
      setSh((s) => s + 1);
    }
  };
  const nl = () => {
    if (sh < ENTRY_SHARED_BEFORE.length) return ENTRY_SHARED_BEFORE[sh].label;
    if (pp < TOTAL_PER)
      return `${multiPi ? `[${PIS[selPi].label}] ` : ""}${ENTRY_PER_PI[pp].label}`;
    if (PIS.every((p) => piS[p.id] >= TOTAL_PER) && sh < TOTAL_SHARED)
      return ENTRY_SHARED_AFTER[0].label;
    return null;
  };

  const footerLabel = () => {
    if (cppCompleted) return "✓ Транзит завершён";
    if (borderDone && !queueReady) return "Прикрепите очередь ↑";
    if (borderDone && queueReady && !transitDeclared) return "Ожидание ТД от Кедена";
    return `→ ${(nl() || "").slice(0, 26)}…`;
  };

  const declareTransit = () => {
    setTransitDeclared(true);
    onComplete?.();
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {vd && <ScanModal name={vd} onClose={() => setVd(null)} />}

      {/* Модалка выбора очереди */}
      {showQueueModal && (
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
          onClick={() => setShowQueueModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.white, borderRadius: 16, padding: 18, width: "100%", maxWidth: 380 }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
              Прикрепить электронную очередь
            </div>
            <div style={{ fontSize: 11, color: C.textSec, marginBottom: 12 }}>
              Очередь на выезд с {tonName} из Cargo Ruqsat:
            </div>
            {mockQueues.map((q) => (
              <button
                key={q.id}
                onClick={() => {
                  setAttachedQueue(q);
                  setShowQueueModal(false);
                }}
                style={{
                  width: "100%",
                  padding: 10,
                  border: `2px solid ${C.grayBorder}`,
                  borderRadius: 10,
                  background: C.white,
                  cursor: "pointer",
                  marginBottom: 6,
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{q.id}</div>
                <div style={{ fontSize: 10, color: C.textSec }}>
                  {q.dest} · {q.date} · {q.slot}
                </div>
              </button>
            ))}

            <button
              onClick={() => window.open("https://cargo.ruqsat.kz/", "_blank", "noopener")}
              style={{
                width: "100%",
                padding: 10,
                marginTop: 6,
                borderRadius: 10,
                border: `2px dashed ${C.primary}`,
                background: C.primaryLight,
                color: C.primary,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ＋ Забронировать электронную очередь Cargo Ruqsat
            </button>
          </div>
        </div>
      )}

      <Header title="ЦПП — Въезд в РК" sub={`${piCount} ПИ · ${tonName}`} onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}>
        <QrButton card={card} />
      </div>
      <div
        style={{
          margin: "10px 12px 0",
          background: C.white,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <StatusBadge status={cppCompleted ? "completed" : "active"} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.primary,
              background: C.primaryLight,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            Въезд по ПИ
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.transit,
              background: C.transitBg,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {tonType === "inland" ? "ТОН внутри РК" : "ТОН на границе"}
          </span>
        </div>
        <div style={{ fontSize: 12, marginBottom: 6 }}>
          {card.from} → {card.to}
        </div>
        {multiPi && (
          <HScroll>
            {PIS.map((pi) => (
              <span
                key={pi.id}
                style={{
                  fontSize: 10,
                  color: C.textSec,
                  background: C.grayLight,
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {pi.regNumber}
              </span>
            ))}
          </HScroll>
        )}
        {!multiPi && (
          <div style={{ fontSize: 11, color: C.textSec, fontFamily: "monospace" }}>
            {PIS[0].regNumber}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 14px",
            marginTop: 8,
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>ГРНЗ</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
              {card.plate}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>Водитель</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div>
          </div>
        </div>
      </div>
      <div
        style={{
          margin: "10px 12px 0",
          background: ov.bg,
          color: C.white,
          borderRadius: 12,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(255,255,255,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {ov.i}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{ov.l}</div>
      </div>
      <TabBar tab={tab} setTab={setTab} />
      <div style={{ padding: "10px 12px 110px" }}>
        {tab === "status" && (
          <>
            {/* Блок пост-транзита: появляется после выезда с поста */}
            {borderDone && (
              <div
                style={{
                  background: C.white,
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  border: `2px solid ${cppCompleted ? C.green : C.transit}`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: cppCompleted ? C.green : C.transit,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {cppCompleted ? "✓" : "🚚"} Завершение транзита
                </div>
                <div style={{ fontSize: 11, color: C.textSec, marginBottom: 10, lineHeight: 1.4 }}>
                  Машина выехала с поста и следует к{" "}
                  <b style={{ color: C.text }}>{tonName}</b>
                  {tonType === "border"
                    ? " для пересечения границы и продолжения транзита."
                    : " — таможенный орган назначения внутри РК."}
                </div>

                {/* border: требуется очередь */}
                {tonType === "border" && !attachedQueue && (
                  <>
                    <div
                      style={{
                        background: C.amberBg,
                        border: `1px dashed ${C.amber}`,
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ fontSize: 11, color: C.amber, fontWeight: 600, lineHeight: 1.4 }}>
                        ⚠ АТС не может завершить транзит, не встав в электронную очередь на границе
                        назначения. Прикрепите очередь Cargo Ruqsat.
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQueueModal(true)}
                      style={{
                        width: "100%",
                        padding: 12,
                        background: C.primaryLight,
                        border: `2px dashed ${C.primary}`,
                        borderRadius: 10,
                        color: C.primary,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      ＋ Прикрепить электронную очередь
                    </button>
                  </>
                )}

                {/* border: очередь прикреплена */}
                {tonType === "border" && attachedQueue && (
                  <div style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        fontSize: 10,
                        color: C.gray,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Прикреплённая очередь
                    </div>
                    <SourceCard
                      system="Cargo Ruqsat"
                      number={attachedQueue.id}
                      status="Подтверждено"
                    />
                    <div style={{ fontSize: 10, color: C.textSec }}>
                      {attachedQueue.dest} · {attachedQueue.date} · {attachedQueue.slot}
                    </div>
                  </div>
                )}

                {/* Demo: сигнал от Кедена о завершении ТД */}
                {queueReady && !transitDeclared && (
                  <button
                    onClick={declareTransit}
                    style={{
                      width: "100%",
                      padding: 10,
                      background: C.greenBg,
                      border: `1px dashed ${C.green}`,
                      borderRadius: 8,
                      color: C.green,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    🔔 Кеден: ТД завершена в {tonName}
                  </button>
                )}

                {/* Итоговая статусная строка */}
                {transitDeclared && (
                  <div
                    style={{
                      background: C.greenBg,
                      borderRadius: 10,
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, color: C.green }}>✓</span>
                    <div style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>
                      Транзитная декларация завершена в таможенном органе назначения
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.grayLight}`,
                }}
              >
                <Ring passed={tp} total={TOTAL_ALL} size={46} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Прогресс на посту</div>
                  <div style={{ fontSize: 11, color: C.gray }}>
                    {tp} из {TOTAL_ALL}
                    {multiPi ? ` · ${piCount} ПИ` : ""}
                  </div>
                </div>
              </div>
              {multiPi && (
                <>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.gray,
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    ПИ
                  </div>
                  <HScroll>
                    {PIS.map((pi) => (
                      <button
                        key={pi.id}
                        onClick={() => setSelPi(pi.id)}
                        style={{
                          padding: "7px 12px",
                          borderRadius: 8,
                          border: "none",
                          cursor: "pointer",
                          background: selPi === pi.id ? C.primary : C.grayLight,
                          color: selPi === pi.id ? C.white : C.textSec,
                          fontFamily: "inherit",
                          fontSize: 11,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          flexShrink: 0,
                        }}
                      >
                        {pi.label}
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 6,
                            background:
                              piS[pi.id] >= TOTAL_PER
                                ? selPi === pi.id
                                  ? "rgba(255,255,255,.25)"
                                  : C.greenBg
                                : selPi === pi.id
                                  ? "rgba(255,255,255,.15)"
                                  : C.grayBorder,
                            color:
                              piS[pi.id] >= TOTAL_PER
                                ? selPi === pi.id
                                  ? C.white
                                  : C.green
                                : selPi === pi.id
                                  ? "rgba(255,255,255,.7)"
                                  : C.gray,
                          }}
                        >
                          {piS[pi.id]}/{TOTAL_PER}
                        </span>
                      </button>
                    ))}
                  </HScroll>
                </>
              )}
              <div style={{ marginTop: 14 }}>
                {rev.map((s, i) => (
                  <EntryStepRow
                    key={i}
                    label={s.l}
                    status={s.gs()}
                    isLast={i === rev.length - 1}
                    sub={s.sh && multiPi ? "Общий этап" : null}
                  />
                ))}
              </div>
            </div>
          </>
        )}
        <DocsTabs tab={tab} setTab={setTab} setVd={setVd} />
      </div>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 420,
          background: C.white,
          borderTop: `1px solid ${C.grayBorder}`,
          padding: "10px 12px",
          display: "flex",
          gap: 8,
          boxShadow: "0 -2px 10px rgba(0,0,0,.06)",
        }}
      >
        <button
          onClick={() => {
            setSh(0);
            const r: Record<number, number> = {};
            PIS.forEach((p) => {
              r[p.id] = 0;
            });
            setPiS(r);
            setAttachedQueue(null);
            setTransitDeclared(false);
          }}
          style={{
            padding: "9px 12px",
            borderRadius: 10,
            border: `1px solid ${C.grayBorder}`,
            background: C.white,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            color: C.textSec,
          }}
        >
          ⟲
        </button>
        <button
          onClick={borderDone ? undefined : adv}
          disabled={borderDone}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 10,
            border: "none",
            background: cppCompleted ? C.green : borderDone ? C.grayBorder : C.primary,
            color: C.white,
            fontSize: 12,
            fontWeight: 700,
            cursor: borderDone ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {footerLabel()}
        </button>
      </div>
    </div>
  );
}
