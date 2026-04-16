import { CB } from "../../data/borderColors";
import type { CPPCard } from "../../types";
import type { BorderRole } from "./BorderRoleSelect";

interface ScanRecord {
  cppId: string;
  plate: string;
  time: string;
  action: string;
}

interface Props {
  role: BorderRole;
  cards: CPPCard[];
  scanHistory: ScanRecord[];
  onScan: () => void;
  onLogout: () => void;
  onSelectCpp: (id: string) => void;
}

const ROLE_LABELS: Record<BorderRole, { title: string; icon: string }> = {
  sentry: { title: "Часовой шлагбаума", icon: "🛡" },
  inspection: { title: "Наряд досмотра ТС", icon: "🔍" },
  admin: { title: "Администратор ПС", icon: "⚙" },
};

export function BorderMainScreen({
  role,
  cards,
  scanHistory,
  onScan,
  onLogout,
  onSelectCpp,
}: Props) {
  const rl = ROLE_LABELS[role];

  // Ожидаемые: draft-ЦПП (ожидают прибытия) + active auto_undetermined
  const expected = cards.filter(
    (c) => c.status === "draft" || c.scenario === "auto_undetermined"
  );

  // Активные на посту
  const onPost = cards.filter(
    (c) => c.status === "active" && c.scenario !== "auto_undetermined"
  );

  return (
    <div style={{ minHeight: "100vh", background: CB.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div
        style={{
          background: `linear-gradient(135deg, ${CB.primary} 0%, ${CB.primaryDark} 100%)`,
          padding: 16,
          color: CB.white,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(255,255,255,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {rl.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Инспектор</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{rl.title}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: "rgba(255,255,255,.15)",
              border: "none",
              borderRadius: 8,
              padding: "6px 10px",
              color: CB.white,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>

      <div style={{ padding: "10px 12px 120px" }}>
        {/* Ожидаемые ЦПП */}
        {expected.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: CB.textSec,
                textTransform: "uppercase",
                marginBottom: 6,
                marginTop: 4,
              }}
            >
              Ожидаемые ЦПП ({expected.length})
            </div>
            {expected.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCpp(c.id)}
                style={{
                  width: "100%",
                  background: CB.white,
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 6,
                  border: `1px solid ${CB.grayBorder}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                    {c.plate}
                  </div>
                  <div style={{ fontSize: 10, color: CB.textSec }}>{c.driver}</div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: CB.amberBg,
                    color: CB.amber,
                  }}
                >
                  Ожидается
                </span>
              </button>
            ))}
          </>
        )}

        {/* На посту */}
        {onPost.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: CB.textSec,
                textTransform: "uppercase",
                marginBottom: 6,
                marginTop: 10,
              }}
            >
              На посту ({onPost.length})
            </div>
            {onPost.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCpp(c.id)}
                style={{
                  width: "100%",
                  background: CB.white,
                  borderRadius: 12,
                  padding: "10px 12px",
                  marginBottom: 6,
                  border: `1px solid ${CB.grayBorder}`,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>
                    {c.plate}
                  </div>
                  <div style={{ fontSize: 10, color: CB.textSec }}>
                    {c.driver} · {c.scenarioLabel || c.type}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: CB.primaryLight,
                    color: CB.primary,
                  }}
                >
                  Активный
                </span>
              </button>
            ))}
          </>
        )}

        {/* История сканирований */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: CB.textSec,
            textTransform: "uppercase",
            marginBottom: 6,
            marginTop: 10,
          }}
        >
          История сканирований
        </div>
        {scanHistory.length === 0 ? (
          <div
            style={{
              background: CB.white,
              borderRadius: 14,
              padding: "40px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>📋</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: CB.gray }}>Нет истории</div>
            <div style={{ fontSize: 11, color: CB.gray, marginTop: 4, opacity: 0.7 }}>
              Отсканируйте QR-код перевозки чтобы начать работу
            </div>
          </div>
        ) : (
          scanHistory.map((h, i) => (
            <div
              key={i}
              style={{
                background: CB.white,
                borderRadius: 10,
                padding: "8px 12px",
                marginBottom: 4,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                  {h.plate}
                </span>
                <span
                  style={{ fontSize: 10, color: CB.textSec, marginLeft: 8 }}
                >
                  {h.action}
                </span>
              </div>
              <span style={{ fontSize: 10, color: CB.gray }}>{h.time}</span>
            </div>
          ))
        )}
      </div>

      {/* Кнопка сканирования */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 420,
          padding: "12px",
          background: CB.white,
          borderTop: `1px solid ${CB.grayBorder}`,
          boxShadow: "0 -2px 10px rgba(0,0,0,.06)",
        }}
      >
        <button
          onClick={onScan}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: CB.primary,
            color: CB.white,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 16 }}>📲</span> Сканировать QR
        </button>
      </div>
    </div>
  );
}
