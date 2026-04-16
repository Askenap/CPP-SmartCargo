import { C } from "../data/colors";
import { Header } from "../components/Header";
import { StatusBadge } from "../components/StatusBadge";
import { QrButton } from "../components/QrButton";
import { SourceCard } from "../components/SourceCard";
import type { CPPCard } from "../types";

interface Props {
  card: CPPCard;
  onBack: () => void;
  onUpdateCard: (updates: Partial<CPPCard>) => void;
}

export function AutoDetectScreen({ card, onBack, onUpdateCard }: Props) {
  const isEntry = card.direction === "in";

  const detectPI = () => {
    onUpdateCard({
      scenario: "transit_entry",
      scenarioLabel: "Транзит ПИ → ТОН на границе",
      basis: "3 ПИ",
      piCount: 3,
      tonType: "border",
      tonName: "ТП «Сырым» (РФ)",
      to: "РФ",
      pis: [
        { id: "PI-2026-00341", desc: "Электроника", weight: "12 400 кг", from: "Китай" },
        { id: "PI-2026-00342", desc: "Текстиль", weight: "8 200 кг", from: "Турция" },
        { id: "PI-2026-00343", desc: "Запчасти", weight: "5 600 кг", from: "Германия" },
      ],
    });
  };

  const detectImportDT = () => {
    onUpdateCard({
      scenario: "draft_entry_no_pi",
      scenarioLabel: "Въезд (импорт)",
    });
  };

  const detectEmptyEntry = () => {
    onUpdateCard({
      scenario: "draft_entry_no_pi",
      scenarioLabel: "Въезд (порожний)",
    });
  };

  const detectExportDT = () => {
    onUpdateCard({
      scenario: "draft_exit_export",
      scenarioLabel: "Выезд (экспорт)",
      exitType: "export",
      draftData: {
        ...card.draftData,
        ibr: { system: "Cargo Alem", number: "IBR-KZ-CN-00521", status: "Выдан" },
      },
    });
  };

  const detectTransitDT = () => {
    onUpdateCard({
      scenario: "draft_exit_transit",
      scenarioLabel: "Завершение транзита",
      exitType: "transit",
      draftData: {
        ...card.draftData,
        ibr: { system: "ИАС ТБД", number: "IBR-KZ-RU-02101", status: "Выдан" },
        transit: {
          number: "10101010/060426/ТТ-0004102",
          origin: "Кеден (ЕАЭС)",
          status: "В пути",
        },
      },
    });
  };

  const detectEmptyExit = () => {
    onUpdateCard({
      scenario: "draft_exit_export",
      scenarioLabel: "Выезд (порожний)",
      exitType: "empty",
      draftData: {
        ...card.draftData,
        ibr: { system: "Cargo Alem", number: "IBR-KZ-00612", status: "Выдан" },
      },
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <Header
        title={isEntry ? "ЦПП — Въезд в РК" : "ЦПП — Выезд из РК"}
        sub="Авто-определение типа"
        onBack={onBack}
      />

      <div style={{ padding: "8px 12px 0" }}>
        <QrButton card={card} />
      </div>

      {/* Инфо-карточка */}
      <div
        style={{
          margin: "10px 12px 0",
          background: C.white,
          borderRadius: 14,
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <StatusBadge status="active" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.amber,
              background: C.amberBg,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            Тип не определён
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
        {card.draftData?.queue && (
          <div style={{ marginTop: 8 }}>
            <SourceCard {...card.draftData.queue} />
          </div>
        )}
      </div>

      {/* Статус ожидания */}
      <div
        style={{
          margin: "10px 12px 0",
          background: C.amber,
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
          🔍
        </div>
        <div style={{ lineHeight: 1.4 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Ожидание определения типа</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            Система ищет подтверждающие документы для данного АТС
          </div>
        </div>
      </div>

      {/* Демо-кнопки обнаружения */}
      <div style={{ padding: "10px 12px 20px" }}>
        <div
          style={{
            background: C.white,
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.textSec,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Симуляция системных событий
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.gray,
              marginBottom: 14,
              lineHeight: 1.4,
            }}
          >
            Нажмите для симуляции обнаружения документа системой. В реальности это произойдёт
            автоматически.
          </div>

          {isEntry ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={detectPI}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.transitBg,
                  border: `1px dashed ${C.transit}`,
                  borderRadius: 10,
                  color: C.transit,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700 }}>🔔 Обнаружен ПИ (статус: прибыл)</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  → ЦПП станет «Транзит ПИ», определится ТОН и схема этапности
                </div>
              </button>

              <button
                onClick={detectImportDT}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.amberBg,
                  border: `1px dashed ${C.amber}`,
                  borderRadius: 10,
                  color: C.amber,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  🔔 Обнаружена импортная ДТ (зарегистрировано)
                </div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  → ЦПП станет «Импорт», появится схема этапности импорта
                </div>
              </button>

              <button
                onClick={detectEmptyEntry}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.greenBg,
                  border: `1px dashed ${C.green}`,
                  borderRadius: 10,
                  color: C.green,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700 }}>🔔 Пограничник: Транспорт порожний</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  → ЦПП станет «Порожний», упрощённая схема этапности
                </div>
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={detectExportDT}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.amberBg,
                  border: `1px dashed ${C.amber}`,
                  borderRadius: 10,
                  color: C.amber,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  🔔 Обнаружена экспортная ДТ (зарегистрировано)
                </div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  → ЦПП станет «Экспорт», полная схема этапности выезда
                </div>
              </button>

              <button
                onClick={detectTransitDT}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.transitBg,
                  border: `1px dashed ${C.transit}`,
                  borderRadius: 10,
                  color: C.transit,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  🔔 Обнаружена ТД (выпущен, не завершён)
                </div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  → ЦПП станет «Завершение транзита», ТД + очередь + ИБР
                </div>
              </button>

              <button
                onClick={detectEmptyExit}
                style={{
                  width: "100%",
                  padding: 12,
                  background: C.greenBg,
                  border: `1px dashed ${C.green}`,
                  borderRadius: 10,
                  color: C.green,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  lineHeight: 1.4,
                }}
              >
                <div style={{ fontWeight: 700 }}>🔔 Пограничник: Транспорт порожний</div>
                <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>
                  → ЦПП станет «Выезд (порожний)»
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
