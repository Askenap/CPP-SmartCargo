import { CB } from "../../data/borderColors";
import { StatusBadge } from "../../components/StatusBadge";
import { SourceCard } from "../../components/SourceCard";
import type { CPPCard } from "../../types";
import type { BorderRole } from "./BorderRoleSelect";

interface Props {
  card: CPPCard;
  role: BorderRole;
  onBack: () => void;
  onActivateCard: () => void;
  onUpdateCard: (updates: Partial<CPPCard>) => void;
  onAddScanRecord: (action: string) => void;
}

export function BorderCppView({
  card,
  role,
  onBack,
  onActivateCard,
  onUpdateCard,
  onAddScanRecord,
}: Props) {
  const isEntry = card.direction === "in";
  const isDraft = card.status === "draft";
  const isAutoUndetermined = card.scenario === "auto_undetermined";

  // Условия доступности кнопок по матрице ролей
  const canActivateEntry = role === "sentry" && isDraft;
  const canMarkExit =
    role === "sentry" && card.status === "active" && !isDraft;
  const canInspect =
    role === "inspection" && card.status === "active" && !isDraft;

  const handleActivate = () => {
    onActivateCard();
    onAddScanRecord("Активация ЦПП (въезд на территорию)");
  };

  const handleAllowExit = () => {
    onAddScanRecord(
      isEntry
        ? "Выезд с территории поста в сторону РК — разрешён"
        : "Выезд с территории поста из РК — разрешён"
    );
  };

  const handleDenyExit = () => {
    onAddScanRecord(
      isEntry
        ? "Выезд с территории поста в сторону РК — запрещён"
        : "Выезд с территории поста из РК — запрещён"
    );
  };

  const handleInspectPass = () => {
    onAddScanRecord("Досмотр ТС ПС — пройден");
  };

  const handleInspectExtra = () => {
    onAddScanRecord("Досмотр ТС ПС — отправлен на доп. контроль");
  };

  const handleMarkEmpty = () => {
    onUpdateCard({
      scenario: isEntry ? "draft_entry_no_pi" : "draft_exit_export",
      scenarioLabel: isEntry ? "Въезд (порожний)" : "Выезд (порожний)",
      exitType: isEntry ? undefined : "empty",
    });
    onAddScanRecord("Отметка: транспорт порожний");
  };

  const handleMarkLoaded = () => {
    onAddScanRecord("Отметка: транспорт груженый");
  };

  return (
    <div style={{ minHeight: "100vh", background: CB.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${CB.primary} 0%, ${CB.primaryDark} 100%)`,
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          onClick={onBack}
          style={{ color: CB.white, fontSize: 13, cursor: "pointer" }}
        >
          ← Назад
        </span>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: CB.white, fontSize: 14, fontWeight: 700 }}>
            Пограничный контроль
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Инфо-карточка */}
      <div
        style={{
          margin: "10px 12px 0",
          background: CB.white,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        {/* Направление бейджи */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 6,
              background: isEntry ? "#dbeafe" : "#fef3c7",
              color: isEntry ? "#2563eb" : "#d97706",
            }}
          >
            {isEntry ? "↓ Въезд" : "↑ Выезд"} · {card.from || "—"}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "3px 10px",
              borderRadius: 6,
              background: CB.grayLight,
              color: CB.text,
            }}
          >
            → {isEntry ? "Республика Казахстан" : card.to || "—"}
          </span>
        </div>

        {/* ПИ если есть */}
        {card.pis && card.pis.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                color: CB.gray,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              На основе ({card.pis.length} ПИ)
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {card.pis.map((pi, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 9,
                    fontFamily: "monospace",
                    background: CB.grayLight,
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  {pi.id}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Номер АТС и Водитель */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 14px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: CB.gray,
                textTransform: "uppercase",
              }}
            >
              Номер АТС
            </div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "monospace",
              }}
            >
              {card.plate}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: CB.gray,
                textTransform: "uppercase",
              }}
            >
              Водитель
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div>
          </div>
        </div>

        {card.scenarioLabel && (
          <div style={{ fontSize: 10, color: CB.textSec, marginTop: 6 }}>
            {card.scenarioLabel}
          </div>
        )}
      </div>

      {/* Статус */}
      <div
        style={{
          margin: "10px 12px 0",
          background: isDraft
            ? CB.amberBg
            : isAutoUndetermined
              ? CB.amberBg
              : CB.primaryLight,
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 20 }}>
          {isDraft ? "⏳" : isAutoUndetermined ? "🔍" : "⟳"}
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: isDraft ? CB.amber : CB.primary,
            }}
          >
            {isDraft
              ? "В ожидании проверки"
              : isAutoUndetermined
                ? "Тип не определён"
                : "В процессе прохождения"}
          </div>
          <div style={{ fontSize: 10, color: CB.textSec }}>
            <StatusBadge status={card.status} />
          </div>
        </div>
      </div>

      {/* Действия по роли */}
      <div style={{ padding: "10px 12px 20px" }}>
        {/* ЧАСОВОЙ: активация черновика */}
        {canActivateEntry && (
          <div
            style={{
              background: CB.white,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: CB.textSec,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              🛡 Въезд на территорию поста
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDenyExit}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: CB.red,
                  color: CB.white,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                ⊘ Запретить въезд
              </button>
              <button
                onClick={handleActivate}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: CB.green,
                  color: CB.white,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                ☑ Разрешить въезд
              </button>
            </div>
          </div>
        )}

        {/* ЧАСОВОЙ: выезд с территории */}
        {canMarkExit && !isDraft && (
          <div
            style={{
              background: CB.white,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: CB.textSec,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              🛡 Выезд с территории поста
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleDenyExit}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: CB.red,
                  color: CB.white,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ⊘ Запретить
              </button>
              <button
                onClick={handleAllowExit}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: CB.green,
                  color: CB.white,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ☑ Разрешить
              </button>
            </div>
          </div>
        )}

        {/* ДОСМОТР: осмотр ТС */}
        {canInspect && (
          <div
            style={{
              background: CB.white,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: CB.textSec,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              🔍 Досмотр ТС пограничной службой
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button
                onClick={handleInspectExtra}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: CB.amberBg,
                  color: CB.amber,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Доп. контроль
              </button>
              <button
                onClick={handleInspectPass}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: CB.green,
                  color: CB.white,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                ✓ Пройден
              </button>
            </div>

            {/* Отметка груженый/пустой для auto_undetermined */}
            {isAutoUndetermined && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: CB.textSec,
                    textTransform: "uppercase",
                    marginBottom: 8,
                    paddingTop: 8,
                    borderTop: `1px solid ${CB.grayLight}`,
                  }}
                >
                  Отметка о загруженности
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleMarkEmpty}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      border: `2px dashed ${CB.green}`,
                      background: CB.greenBg,
                      color: CB.green,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    📦 Пустой
                  </button>
                  <button
                    onClick={handleMarkLoaded}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      border: `2px dashed ${CB.amber}`,
                      background: CB.amberBg,
                      color: CB.amber,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    🚛 Груженый
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* АДМИН: просмотр */}
        {role === "admin" && (
          <div
            style={{
              background: CB.white,
              borderRadius: 14,
              padding: 14,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: CB.textSec,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              ⚙ Администрирование
            </div>
            <div style={{ fontSize: 11, color: CB.textSec, lineHeight: 1.4 }}>
              Просмотр данных ЦПП. Для проставления отметок войдите как Часовой или Досмотр.
            </div>
            {card.draftData?.queue && (
              <div style={{ marginTop: 8 }}>
                <SourceCard {...card.draftData.queue} />
              </div>
            )}
          </div>
        )}

        {/* Просмотр данных (все роли) */}
        <div style={{ background: CB.white, borderRadius: 14, padding: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: CB.textSec,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            👁 Просмотр данных ЦПП
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { l: "Направление", v: isEntry ? "Въезд в РК" : "Выезд из РК" },
              { l: "Тип", v: card.scenarioLabel || "Не определён" },
              { l: "Пост", v: card.customsPost },
              { l: "Статус", v: card.status === "draft" ? "Черновик" : card.status === "active" ? "Активный" : "Завершён" },
            ].map((f) => (
              <div key={f.l}>
                <div
                  style={{
                    fontSize: 9,
                    color: CB.gray,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {f.l}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: CB.text }}>{f.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
