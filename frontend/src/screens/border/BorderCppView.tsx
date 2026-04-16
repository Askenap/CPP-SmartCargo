import { useState } from "react";
import { C } from "../../data/colors";
import { CB } from "../../data/borderColors";
import {
  ENTRY_PER_PI,
  ENTRY_SHARED_AFTER,
  ENTRY_SHARED_BEFORE,
  TOTAL_PER,
  TOTAL_SHARED,
  getEntryIMSteps,
} from "../../data/entrySteps";
import { getExitSteps } from "../../data/exitSteps";
import { StatusBadge } from "../../components/StatusBadge";
import { SourceCard } from "../../components/SourceCard";
import { Ring } from "../../components/Ring";
import { EntryStepRow } from "../../components/EntryStepRow";
import { ExitStepRow } from "../../components/ExitStepRow";
import { TabBar, type TabKey } from "../../components/TabBar";
import { DocsTabs } from "../../components/DocsTabs";
import { ScanModal } from "../../components/ScanModal";
import { stepSt } from "../../components/stepStyles";
import type { CPPCard, StepStatus } from "../../types";
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
  const isPI =
    card.scenario === "transit_entry" || card.scenario === "draft_entry_pi";
  const isIMorEmpty =
    card.scenario === "entry_im_empty" || card.scenario === "draft_entry_no_pi";
  const isExit =
    card.direction === "out" || (card.scenario || "").includes("exit");

  const [tab, setTab] = useState<TabKey>("status");
  const [vd, setVd] = useState<string | null>(null);

  // ─── ИДК / Паспорт модалки ───
  const [showIDK, setShowIDK] = useState(false);
  const [showPassport, setShowPassport] = useState(false);

  // ─── Multi-PI dropdown state for inspector ───
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // ─── PI progress (simulated — view only, reflecting current demo step) ───
  const piCount = card.piCount || 1;
  const PIS = (card.pis || []).length > 0
    ? card.pis!.map((p, i) => ({ id: i, label: `ПИ №${i + 1}`, regNumber: p.id }))
    : Array.from({ length: piCount }, (_, i) => ({
        id: i,
        regNumber: `PI-${i + 1}`,
        label: `ПИ №${i + 1}`,
      }));
  const multiPi = PIS.length > 1;

  // Читаем реальный прогресс из card.progress (общая БД с водителем)
  const demoShared = card.progress?.shared ?? 0;
  const demoPiProgress: Record<number, number> = {};
  PIS.forEach((p) => {
    demoPiProgress[p.id] = card.progress?.piSteps
      ? (Number(card.progress.piSteps[String(p.id)]) || 0)
      : 0;
  });

  // ─── Determine which type of timeline to show ───
  const canShowTimeline = card.status === "active" && !isAutoUndetermined;

  // ─── Role permissions ───
  const canActivateEntry = role === "sentry" && isDraft;
  const canMarkExit = role === "sentry" && card.status === "active" && !isDraft;
  const canInspect = role === "inspection" && card.status === "active" && !isDraft;

  // ─── Action handlers ───
  const handleActivate = () => {
    onActivateCard();
    onAddScanRecord("Въезд на территорию — разрешён");
  };
  const handleAllowExit = () => {
    onAddScanRecord(isEntry ? "Выезд в сторону РК — разрешён" : "Выезд из РК — разрешён");
  };
  const handleDenyExit = () => {
    onAddScanRecord(isEntry ? "Выезд в сторону РК — запрещён" : "Выезд из РК — запрещён");
  };
  const handleInspectPass = () => {
    onAddScanRecord("Досмотр ТС ПС — пройден");
  };
  const handleInspectExtra = () => {
    onAddScanRecord("Досмотр ТС ПС — доп. контроль");
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

  // ─── Build timeline for PI entry ───
  function renderPITimeline() {
    // Build unified step list
    const allSteps: {
      id: string;
      label: string;
      isShared: boolean;
      isPerPI: boolean;
      status: StepStatus;
      piCountPassed?: number;
    }[] = [];

    ENTRY_SHARED_BEFORE.forEach((s, i) => {
      allSteps.push({
        id: s.id,
        label: s.label,
        isShared: true,
        isPerPI: false,
        status: stepSt(i, demoShared),
      });
    });

    ENTRY_PER_PI.forEach((s) => {
      const passed = PIS.filter((p) => (demoPiProgress[p.id] || 0) > ENTRY_PER_PI.indexOf(s)).length;
      allSteps.push({
        id: s.id,
        label: s.label,
        isShared: false,
        isPerPI: true,
        status: passed === PIS.length ? "passed" : passed > 0 ? "current" : "pending",
        piCountPassed: passed,
      });
    });

    ENTRY_SHARED_AFTER.forEach((s) => {
      allSteps.push({
        id: s.id,
        label: s.label,
        isShared: true,
        isPerPI: false,
        status: "pending",
      });
    });

    const total = TOTAL_SHARED + TOTAL_PER * PIS.length;
    let passed = Math.min(demoShared, TOTAL_SHARED);
    PIS.forEach((p) => { passed += Math.min(demoPiProgress[p.id] || 0, TOTAL_PER); });

    const rev = [...allSteps].reverse();
    const isIDK = (id: string) => id === "p2" || id === "im7";
    const isPassport = (id: string) => id === "s3" || id === "im4";

    return (
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
          <Ring passed={passed} total={total} size={46} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Общий прогресс</div>
            <div style={{ fontSize: 11, color: C.gray }}>
              {passed} из {total}{multiPi ? ` · ${PIS.length} ПИ` : ""}
            </div>
          </div>
        </div>

        {rev.map((s, i) => (
          <div key={s.id}>
            <div
              style={{ cursor: s.isPerPI && multiPi ? "pointer" : "default" }}
              onClick={() => {
                if (s.isPerPI && multiPi)
                  setExpandedStep((prev) => (prev === s.id ? null : s.id));
              }}
            >
              <EntryStepRow
                label={s.label}
                status={s.status}
                isLast={i === rev.length - 1}
                sub={
                  s.isShared && multiPi
                    ? "Общий этап"
                    : s.isPerPI && multiPi
                      ? undefined
                      : undefined
                }
              />
              {/* Per-PI counter badge */}
              {s.isPerPI && multiPi && (
                <div
                  style={{
                    marginTop: -8,
                    marginBottom: 8,
                    marginLeft: 32,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background:
                        s.piCountPassed === PIS.length ? C.greenBg : C.grayLight,
                      color:
                        s.piCountPassed === PIS.length ? C.green : C.gray,
                    }}
                  >
                    {s.piCountPassed}/{PIS.length} ПИ
                  </span>
                  <span style={{ fontSize: 9, color: C.gray }}>
                    {expandedStep === s.id ? "▲" : "▼"}
                  </span>
                </div>
              )}
              {/* IDK / Passport view buttons */}
              {isIDK(s.id) && s.status === "passed" && (
                <div style={{ marginTop: -6, marginBottom: 8, marginLeft: 32 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowIDK(true); }}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: CB.primary,
                      background: CB.primaryLight,
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    👁 Просмотр снимка ИДК
                  </button>
                </div>
              )}
              {isPassport(s.id) && s.status === "passed" && (
                <div style={{ marginTop: -6, marginBottom: 8, marginLeft: 32 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowPassport(true); }}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: CB.primary,
                      background: CB.primaryLight,
                      border: "none",
                      borderRadius: 6,
                      padding: "4px 10px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    👁 Сведения паспортного контроля
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown: per-PI detail */}
            {s.isPerPI && multiPi && expandedStep === s.id && (
              <div
                style={{
                  marginLeft: 32,
                  marginBottom: 10,
                  background: C.grayLight,
                  borderRadius: 10,
                  padding: "8px 10px",
                }}
              >
                {PIS.map((pi) => {
                  const piIdx = ENTRY_PER_PI.findIndex((p) => p.id === s.id);
                  const piProgress = demoPiProgress[pi.id] || 0;
                  const piStatus: StepStatus =
                    piProgress > piIdx ? "passed" : piProgress === piIdx ? "current" : "pending";
                  const icon = piStatus === "passed" ? "✓" : piStatus === "current" ? "●" : "·";
                  const color =
                    piStatus === "passed" ? C.green : piStatus === "current" ? C.amber : C.gray;
                  return (
                    <div
                      key={pi.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "5px 0",
                        borderBottom:
                          pi.id < PIS.length - 1 ? `1px solid ${C.grayBorder}` : "none",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{pi.label}</span>
                        <span
                          style={{
                            fontSize: 9,
                            color: C.gray,
                            fontFamily: "monospace",
                            marginLeft: 6,
                          }}
                        >
                          {pi.regNumber}
                        </span>
                      </div>
                      <span
                        style={{ fontSize: 12, fontWeight: 700, color }}
                      >
                        {icon}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // ─── IM/Empty timeline ───
  function renderIMTimeline() {
    const isImport = (card.scenarioLabel || "").toLowerCase().includes("импорт");
    const steps = getEntryIMSteps(isImport ? "import" : "empty");
    const total = steps.length;
    const imProgress = card.progress?.currentStep ?? 0;
    const rev = [...steps].reverse();

    return (
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
          <Ring passed={imProgress} total={total} size={46} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>
              {isImport ? "Прогресс (импорт)" : "Прогресс (порожний)"}
            </div>
            <div style={{ fontSize: 11, color: C.gray }}>{imProgress} из {total}</div>
          </div>
        </div>
        {rev.map((step, i) => {
          const idx = total - 1 - i;
          const isIDK = step.id === "im7";
          const isPassport = step.id === "im4";
          const status = stepSt(idx, imProgress);
          return (
            <div key={step.id}>
              <EntryStepRow
                label={step.label}
                status={status}
                isLast={i === rev.length - 1}
                subLabel={step.subLabel}
                isCustoms={step.isCustoms}
              />
              {isIDK && status === "passed" && (
                <div style={{ marginTop: -6, marginBottom: 8, marginLeft: 32 }}>
                  <button
                    onClick={() => setShowIDK(true)}
                    style={{ fontSize: 10, fontWeight: 600, color: CB.primary, background: CB.primaryLight, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    👁 Просмотр снимка ИДК
                  </button>
                </div>
              )}
              {isPassport && status === "passed" && (
                <div style={{ marginTop: -6, marginBottom: 8, marginLeft: 32 }}>
                  <button
                    onClick={() => setShowPassport(true)}
                    style={{ fontSize: 10, fontWeight: 600, color: CB.primary, background: CB.primaryLight, border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    👁 Сведения паспортного контроля
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Exit timeline ───
  function renderExitTimeline() {
    const et = card.exitType || "empty";
    const hasExp = card.progress?.hasExpDT ?? et === "export";
    const steps = getExitSteps(et === "transit" ? "transit" : hasExp ? "export" : "empty");
    const total = steps.length;
    const exitProgress = card.progress?.currentStep ?? 0;
    const rev = [...steps].reverse();

    return (
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
          <Ring passed={exitProgress} total={total} size={46} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>Прогресс выезда</div>
            <div style={{ fontSize: 11, color: C.gray }}>{exitProgress} из {total}</div>
          </div>
        </div>
        {rev.map((step, i) => {
          const idx = total - 1 - i;
          return (
            <ExitStepRow
              key={step.id}
              step={step}
              status={stepSt(idx, exitProgress)}
              isLast={i === rev.length - 1}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: CB.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Модалки */}
      {vd && <ScanModal name={vd} onClose={() => setVd(null)} />}

      {showIDK && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowIDK(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: CB.white, borderRadius: 16, padding: 20, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Снимок ИДК</div>
              <button onClick={() => setShowIDK(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: CB.grayLight, cursor: "pointer", fontSize: 14, color: CB.textSec }}>✕</button>
            </div>
            <div style={{ background: CB.grayLight, borderRadius: 12, height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: CB.gray, flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 48 }}>🔬</span>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Снимок ИДК</div>
              <div style={{ fontSize: 10, color: CB.gray }}>Рентгеноскопический снимок ТС</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: CB.textSec }}>
              ГРНЗ: <b>{card.plate}</b> · {new Date().toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>
      )}

      {showPassport && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setShowPassport(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: CB.white, borderRadius: 16, padding: 20, width: "100%", maxWidth: 380 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Паспортный контроль</div>
              <button onClick={() => setShowPassport(false)} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: CB.grayLight, cursor: "pointer", fontSize: 14, color: CB.textSec }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { l: "ФИО", v: card.driver },
                { l: "Документ", v: "Паспорт N1234567" },
                { l: "Гражданство", v: card.from || "—" },
                { l: "Дата проверки", v: new Date().toLocaleDateString("ru-RU") },
                { l: "Результат", v: "✓ Проверен" },
                { l: "ТС", v: card.plate },
              ].map((f) => (
                <div key={f.l}>
                  <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase", marginBottom: 2 }}>{f.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: CB.text }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
        <span onClick={onBack} style={{ color: CB.white, fontSize: 13, cursor: "pointer" }}>
          ← Назад
        </span>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: CB.white, fontSize: 14, fontWeight: 700 }}>Пограничный контроль</div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Инфо-карточка */}
      <div style={{ margin: "10px 12px 0", background: CB.white, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: isEntry ? "#dbeafe" : "#fef3c7", color: isEntry ? "#2563eb" : "#d97706" }}>
            {isEntry ? "↓ Въезд" : "↑ Выезд"} · {card.from || "—"}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: CB.grayLight, color: CB.text }}>
            → {isEntry ? "Республика Казахстан" : card.to || "—"}
          </span>
        </div>
        {card.pis && card.pis.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase", marginBottom: 4 }}>
              На основе ({card.pis.length} ПИ)
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {card.pis.map((pi, i) => (
                <span key={i} style={{ fontSize: 9, fontFamily: "monospace", background: CB.grayLight, padding: "3px 8px", borderRadius: 6 }}>{pi.id}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
          <div>
            <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase" }}>Номер АТС</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace" }}>{card.plate}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: CB.gray, textTransform: "uppercase" }}>Водитель</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div>
          </div>
        </div>
        {card.draftData?.queue && (
          <div style={{ marginTop: 8 }}>
            <SourceCard {...card.draftData.queue} />
          </div>
        )}
      </div>

      {/* Статус */}
      <div style={{ margin: "10px 12px 0", background: isDraft ? CB.amberBg : isAutoUndetermined ? CB.amberBg : CB.primaryLight, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 20 }}>{isDraft ? "⏳" : isAutoUndetermined ? "🔍" : "⟳"}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: isDraft ? CB.amber : CB.primary }}>
            {isDraft ? "В ожидании проверки" : isAutoUndetermined ? "Тип не определён" : "В процессе прохождения"}
          </div>
          <div style={{ fontSize: 10, color: CB.textSec, marginTop: 2 }}>
            <StatusBadge status={card.status} />
            {card.scenarioLabel && <span style={{ marginLeft: 6, fontSize: 10, color: CB.textSec }}>{card.scenarioLabel}</span>}
          </div>
        </div>
      </div>

      {/* Действия по роли */}
      <div style={{ padding: "10px 12px 0" }}>
        {canActivateEntry && (
          <div style={{ background: CB.white, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CB.textSec, textTransform: "uppercase", marginBottom: 10 }}>
              🛡 Въезд на территорию поста
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDenyExit} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: CB.red, color: CB.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ⊘ Запретить
              </button>
              <button onClick={handleActivate} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: CB.green, color: CB.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ☑ Разрешить
              </button>
            </div>
          </div>
        )}
        {canMarkExit && !isDraft && (
          <div style={{ background: CB.white, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CB.textSec, textTransform: "uppercase", marginBottom: 10 }}>🛡 Выезд с территории поста</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDenyExit} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: CB.red, color: CB.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⊘ Запретить</button>
              <button onClick={handleAllowExit} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: CB.green, color: CB.white, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>☑ Разрешить</button>
            </div>
          </div>
        )}
        {canInspect && (
          <div style={{ background: CB.white, borderRadius: 14, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: CB.textSec, textTransform: "uppercase", marginBottom: 10 }}>🔍 Досмотр ТС пограничной службой</div>
            <div style={{ display: "flex", gap: 8, marginBottom: isAutoUndetermined ? 10 : 0 }}>
              <button onClick={handleInspectExtra} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: CB.amberBg, color: CB.amber, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Доп. контроль</button>
              <button onClick={handleInspectPass} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: CB.green, color: CB.white, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✓ Пройден</button>
            </div>
            {isAutoUndetermined && (
              <>
                <div style={{ fontSize: 10, fontWeight: 600, color: CB.textSec, textTransform: "uppercase", marginBottom: 8, paddingTop: 8, borderTop: `1px solid ${CB.grayLight}` }}>Отметка о загруженности</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleMarkEmpty} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px dashed ${CB.green}`, background: CB.greenBg, color: CB.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📦 Пустой</button>
                  <button onClick={handleMarkLoaded} style={{ flex: 1, padding: 10, borderRadius: 10, border: `2px dashed ${CB.amber}`, background: CB.amberBg, color: CB.amber, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🚛 Груженый</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* TabBar + Timeline + Docs (for active, non-undetermined CPPs) */}
      {canShowTimeline && (
        <>
          <TabBar tab={tab} setTab={setTab} />
          <div style={{ padding: "10px 12px 20px" }}>
            {tab === "status" && (
              <>
                {isPI && renderPITimeline()}
                {isIMorEmpty && renderIMTimeline()}
                {isExit && renderExitTimeline()}
              </>
            )}
            <DocsTabs tab={tab} setTab={setTab} setVd={setVd} />
          </div>
        </>
      )}
    </div>
  );
}
