import { useState } from "react";
import { C } from "../data/colors";
import { driverDocs } from "../data/mockData";
import { getCardCargo, formatNumber, formatMoney, type CargoBatch, type PICargo, type CargoSummary } from "../data/cargoData";
import { DocRow } from "./DocRow";
import type { TabKey } from "./TabBar";
import type { CPPCard } from "../types";

interface Props {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  setVd: (name: string | null) => void;
  card?: CPPCard;
}

// ─── Груз: общая сводка + ПИ + ТП ───
function CargoSummaryBlock({ summary, totalPis, totalBatches }: { summary: CargoSummary; totalPis: number; totalBatches: number }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`,
      borderRadius: 14, padding: 16, marginBottom: 10, color: C.white,
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: "uppercase", marginBottom: 8 }}>
        Общая сводка · {totalPis} ПИ · {totalBatches} ТП
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { l: "Вес", v: `${formatNumber(summary.totalWeight)} кг` },
          { l: "Мест", v: formatNumber(summary.totalPlaces) },
          { l: "Кол-во", v: formatNumber(summary.totalQuantity) },
          { l: "Стоимость", v: formatMoney(summary.totalValueUsd) },
        ].map((f) => (
          <div key={f.l}>
            <div style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase", marginBottom: 2 }}>{f.l}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{f.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CargoBatchRow({ batch }: { batch: CargoBatch }) {
  return (
    <div style={{
      marginTop: 6, paddingLeft: 14, borderLeft: `2px solid ${C.primaryLight}`, paddingTop: 10, paddingBottom: 10, paddingRight: 10,
      background: C.grayLight, borderRadius: "0 10px 10px 0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.primary, fontFamily: "monospace" }}>{batch.id}</span>
        <span style={{ fontSize: 9, color: C.gray }}>{batch.quantity} поз.</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 4, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 8, color: C.gray, textTransform: "uppercase", marginBottom: 1 }}>Отправитель</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{batch.sender}</div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: C.gray, textTransform: "uppercase", marginBottom: 1 }}>Получатель</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{batch.receiver}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, paddingTop: 6, borderTop: `1px solid ${C.grayBorder}` }}>
        {[
          { l: "Вес", v: `${formatNumber(batch.weight)} кг` },
          { l: "Мест", v: formatNumber(batch.places) },
          { l: "Поз.", v: formatNumber(batch.quantity) },
          { l: "$", v: formatMoney(batch.valueUsd) },
        ].map((f) => (
          <div key={f.l}>
            <div style={{ fontSize: 8, color: C.gray, textTransform: "uppercase" }}>{f.l}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{f.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PICargoCard({ pi }: { pi: PICargo }) {
  const [expanded, setExpanded] = useState(false);
  const piWeight = pi.batches.reduce((s, b) => s + b.weight, 0);
  const piPlaces = pi.batches.reduce((s, b) => s + b.places, 0);
  const piQuantity = pi.batches.reduce((s, b) => s + b.quantity, 0);
  const piValue = pi.batches.reduce((s, b) => s + b.valueUsd, 0);
  return (
    <div style={{ background: C.white, borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${C.grayBorder}` }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
          textAlign: "left", padding: 0, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{pi.piLabel}</span>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: C.gray }}>{pi.piId}</span>
          </div>
          <div style={{ fontSize: 10, color: C.textSec }}>{pi.description} · {pi.batches.length} ТП</div>
        </div>
        <span style={{ fontSize: 11, color: C.gray }}>{expanded ? "▲" : "▼"}</span>
      </button>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.grayLight}` }}>
        {[
          { l: "Вес", v: `${formatNumber(piWeight)} кг` },
          { l: "Мест", v: formatNumber(piPlaces) },
          { l: "Кол-во", v: formatNumber(piQuantity) },
          { l: "$", v: formatMoney(piValue) },
        ].map((f) => (
          <div key={f.l}>
            <div style={{ fontSize: 8, color: C.gray, textTransform: "uppercase" }}>{f.l}</div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>{f.v}</div>
          </div>
        ))}
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 9, color: C.gray, textTransform: "uppercase", marginBottom: 4 }}>Товарные партии</div>
          {pi.batches.map((b) => <CargoBatchRow key={b.id} batch={b} />)}
        </div>
      )}
    </div>
  );
}

// ─── Документы: водитель (фикс) + груз (иерархия) ───
function PIDocsCard({ pi, onView }: { pi: PICargo; onView: (name: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const totalDocs = pi.batches.reduce((s, b) => s + b.docs.length, 0);
  const invalid = pi.batches.reduce((s, b) => s + b.docs.filter((d) => !d.valid).length, 0);
  return (
    <div style={{ background: C.white, borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${C.grayBorder}` }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit",
          textAlign: "left", padding: 0, display: "flex", justifyContent: "space-between", alignItems: "center",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{pi.piLabel}</span>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: C.gray }}>{pi.piId}</span>
          </div>
          <div style={{ fontSize: 10, color: C.textSec, marginTop: 2 }}>
            {totalDocs} док · {pi.batches.length} ТП
            {invalid > 0 && <span style={{ color: C.red, marginLeft: 6, fontWeight: 600 }}>· {invalid} недейств.</span>}
          </div>
        </div>
        <span style={{ fontSize: 11, color: C.gray }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {pi.batches.map((b) => (
            <div key={b.id} style={{ marginBottom: 10, paddingLeft: 10, borderLeft: `2px solid ${C.primaryLight}` }}>
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, fontFamily: "monospace", marginBottom: 3 }}>{b.id}</div>
                <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.3 }}>
                  <span style={{ color: C.gray }}>От:</span> {b.sender}
                </div>
                <div style={{ fontSize: 10, color: C.textSec, lineHeight: 1.3 }}>
                  <span style={{ color: C.gray }}>Для:</span> {b.receiver}
                </div>
              </div>
              {b.docs.map((d, i) => <DocRow key={i} doc={d} onView={onView} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DocsTabs({ tab, setVd, card }: Props) {
  // Fallback: без card показываем старую плоскую модель
  if (!card) {
    if (tab === "cargo") {
      return (
        <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Груз</div>
          <div style={{ fontSize: 11, color: C.gray }}>Данные недоступны</div>
        </div>
      );
    }
    if (tab === "docs") return null;
    return null;
  }

  const { pis, summary } = getCardCargo(card);
  const totalBatches = pis.reduce((s, p) => s + p.batches.length, 0);

  if (tab === "cargo") {
    return (
      <>
        <CargoSummaryBlock summary={summary} totalPis={pis.length} totalBatches={totalBatches} />
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textSec, textTransform: "uppercase", marginBottom: 6, marginLeft: 4 }}>
          В разрезе ПИ
        </div>
        {pis.map((pi) => <PICargoCard key={pi.piId} pi={pi} />)}
      </>
    );
  }

  if (tab === "docs") {
    return (
      <>
        {/* Водитель и ТС — фиксированно */}
        <div style={{ background: C.white, borderRadius: 14, padding: 14, marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>🚛 Водитель и ТС</div>
          <div style={{ fontSize: 10, color: C.gray, marginBottom: 6 }}>Универсальные для всей перевозки</div>
          {driverDocs.map((d, i) => <DocRow key={i} doc={d} onView={setVd} />)}
        </div>

        {/* Документы груза — в разрезе ПИ */}
        <div style={{ fontSize: 10, fontWeight: 600, color: C.textSec, textTransform: "uppercase", marginBottom: 6, marginLeft: 4 }}>
          📦 Документы груза (в разрезе ПИ и ТП)
        </div>
        {pis.map((pi) => <PIDocsCard key={pi.piId} pi={pi} onView={setVd} />)}
      </>
    );
  }

  return null;
}
