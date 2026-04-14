import { useState } from "react";
import { C } from "../data/colors";
import { getExitSteps } from "../data/exitSteps";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { SourceCard } from "../components/SourceCard";
import { Ring } from "../components/Ring";
import { ExitStepRow } from "../components/ExitStepRow";
import { ScanModal } from "../components/ScanModal";
import { TabBar, type TabKey } from "../components/TabBar";
import { DocsTabs } from "../components/DocsTabs";
import { stepSt } from "../components/stepStyles";
import type { CPPCard } from "../types";

interface Props {
  card: CPPCard;
  onBack: () => void;
  onComplete?: () => void;
}

export function ExitActiveScreen({ card, onBack, onComplete }: Props) {
  const et = card.exitType || "empty";
  const [hasExpDT, setHasExpDT] = useState(et === "export");
  const steps = getExitSteps(et === "transit" ? "transit" : hasExpDT ? "export" : "empty");
  const [cs, setCs] = useState(0);
  const [tab, setTab] = useState<TabKey>("status");
  const [vd, setVd] = useState<string | null>(null);
  const total = steps.length;
  const allDone = cs >= total;
  const getOv = () => {
    if (cs === 0) return { l: "Ожидание прибытия", bg: C.gray, i: "⏳" };
    if (allDone) return { l: "Завершён — выезд из РК", bg: C.green, i: "✓" };
    return { l: "В процессе прохождения границы", bg: C.amber, i: "⟳" };
  };
  const ov = getOv();
  const rev = [...steps].reverse();
  const bi: { system: string; number: string; status: string }[] = [];
  if (card.draftData?.queue) bi.push(card.draftData.queue);
  if (card.draftData?.ibr) bi.push(card.draftData.ibr);
  if (card.draftData?.transit)
    bi.push({
      system: `Транзит (${card.draftData.transit.origin})`,
      number: card.draftData.transit.number,
      status: card.draftData.transit.status,
    });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {vd && <ScanModal name={vd} onClose={() => setVd(null)} />}
      <Header title="ЦПП — Выезд из РК" sub={card.scenarioLabel} onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}>
        <button
          style={{
            width: "100%",
            padding: 14,
            background: C.white,
            border: `2px solid ${C.primary}`,
            borderRadius: 12,
            color: C.primary,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ⊞ QR рейса
        </button>
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
          <StatusBadge status={allDone ? "completed" : "active"} />
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
            {card.type}
          </span>
        </div>
        <div style={{ fontSize: 12, marginBottom: 6 }}>
          {card.from} → {card.to}
        </div>
        {bi.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                fontSize: 10,
                color: C.gray,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              На основе
            </div>
            {bi.map((b, i) => (
              <SourceCard key={i} {...b} />
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
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
      <div style={{ padding: "10px 12px 120px" }}>
        {tab === "status" && (
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
              <Ring passed={cs} total={total} size={46} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Прогресс выезда</div>
                <div style={{ fontSize: 11, color: C.gray }}>
                  {cs} из {total}
                </div>
              </div>
            </div>
            {et === "empty" && !hasExpDT && cs >= 5 && (
              <button
                onClick={() => setHasExpDT(true)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: C.amberBg,
                  border: `1px dashed ${C.amber}`,
                  borderRadius: 8,
                  color: C.amber,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  marginBottom: 12,
                }}
              >
                ⚡ Экспортная ДТ подтянулась из Кедена
              </button>
            )}
            {rev.map((step, i) => {
              const idx = total - 1 - i;
              return (
                <ExitStepRow
                  key={step.id}
                  step={step}
                  status={stepSt(idx, cs)}
                  isLast={i === rev.length - 1}
                />
              );
            })}
          </div>
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
          onClick={() => setCs(0)}
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
          onClick={() => {
            if (cs < total) {
              setCs((s) => s + 1);
              if (cs + 1 >= total) onComplete?.();
            }
          }}
          disabled={allDone}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 10,
            border: "none",
            background: allDone ? C.green : C.primary,
            color: C.white,
            fontSize: 12,
            fontWeight: 700,
            cursor: allDone ? "default" : "pointer",
            fontFamily: "inherit",
          }}
        >
          {allDone ? "✓ Завершён" : `→ ${steps[cs]?.label.slice(0, 26)}…`}
        </button>
      </div>
    </div>
  );
}
