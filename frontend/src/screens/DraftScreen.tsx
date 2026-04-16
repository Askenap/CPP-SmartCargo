import { C } from "../data/colors";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { SourceCard } from "../components/SourceCard";
import { QrButton } from "../components/QrButton";
import type { CPPCard } from "../types";

interface Props {
  card: CPPCard;
  onBack: () => void;
  onActivate?: () => void;
  onDelete?: () => void;
}

export function DraftScreen({ card, onBack, onActivate, onDelete }: Props) {
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
      {card.scenario === "auto_undetermined" ? (
        <div
          style={{
            margin: "10px 12px",
            background: C.amberBg,
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <div style={{ fontSize: 12, color: C.amber, lineHeight: 1.5, fontWeight: 600 }}>
            🤖 ЦПП ожидает активации пограничником.
          </div>
          <div style={{ fontSize: 11, color: C.amber, lineHeight: 1.5, marginTop: 4, opacity: 0.8 }}>
            Тип и схема этапности определятся автоматически после обнаружения подтверждающих
            документов (ПИ, ДТ, ТД) при прохождении поста.
          </div>
        </div>
      ) : (
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
      )}

      {/* Кнопки действий */}
      {(onActivate || onDelete) && (
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
          {onActivate && (
            <button
              onClick={onActivate}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                border: "none",
                background: C.green,
                color: C.white,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ▶ Активировать
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: "11px 16px",
                borderRadius: 10,
                border: "none",
                background: C.redBg,
                color: C.red,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              🗑
            </button>
          )}
        </div>
      )}
    </div>
  );
}
