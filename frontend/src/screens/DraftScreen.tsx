import { C } from "../data/colors";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { SourceCard } from "../components/SourceCard";
import { QrButton } from "../components/QrButton";
import type { CPPCard } from "../types";

interface Props {
  card: CPPCard;
  onBack: () => void;
}

export function DraftScreen({ card, onBack }: Props) {
  const dd = card.draftData;
  const hasPis = card.scenario === "draft_entry_pi" && card.pis;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <Header title="ЦПП — Черновик" sub={card.scenarioLabel} onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}>
        <QrButton card={card} variant="draft" />
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
          <StatusBadge status="draft" />
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
        {hasPis && card.pis && (
          <div style={{ marginTop: 8 }}>
            {card.pis.map((pi, i) => (
              <div
                key={i}
                style={{
                  background: C.transitBg,
                  borderRadius: 8,
                  padding: "8px 10px",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: C.transit }}>{pi.id}</div>
                <div style={{ fontSize: 10, color: C.textSec }}>{pi.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {(dd?.queue || dd?.ibr || dd?.transit) && (
        <div
          style={{
            margin: "10px 12px 0",
            background: C.white,
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Сведения</div>
          {dd?.queue && <SourceCard {...dd.queue} />}
          {dd?.ibr && <SourceCard {...dd.ibr} />}
          {dd?.transit && (
            <SourceCard system="Транзит" number={dd.transit.number} status={dd.transit.status} />
          )}
        </div>
      )}
      <div
        style={{
          margin: "10px 12px",
          background: C.draftBg,
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: 12, color: C.draft, lineHeight: 1.5 }}>
          ℹ После въезда на пост ЦПП станет активным.
        </div>
      </div>
    </div>
  );
}
