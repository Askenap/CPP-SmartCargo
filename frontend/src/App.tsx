import { useState } from "react";
import { useCards } from "./hooks/useCards";
import { BottomNav, type MainTab } from "./components/BottomNav";
import { MenuScreen } from "./screens/MenuScreen";
import { CreateWizard } from "./screens/CreateWizard";
import { DraftScreen } from "./screens/DraftScreen";
import { EntryPIScreen } from "./screens/EntryPIScreen";
import { EntryIMScreen } from "./screens/EntryIMScreen";
import { ExitActiveScreen } from "./screens/ExitActiveScreen";
import { AutoDetectScreen } from "./screens/AutoDetectScreen";
import { VehiclesScreen } from "./screens/VehiclesScreen";
import { DriversScreen } from "./screens/DriversScreen";
import { BorderRoleSelect, type BorderRole } from "./screens/border/BorderRoleSelect";
import { BorderMainScreen } from "./screens/border/BorderMainScreen";
import { BorderScanModal } from "./screens/border/BorderScanModal";
import { BorderCppView } from "./screens/border/BorderCppView";
import type { CPPCard } from "./types";

type Screen = "menu" | "create" | "detail";
type AppMode = "driver" | "border";
type BorderScreen = "role_select" | "main" | "cpp_view";
interface ScanRecord {
  cppId: string;
  plate: string;
  time: string;
  action: string;
}

export default function App() {
  // ─── Driver mode ───
  const [screen, setScreen] = useState<Screen>("menu");
  const [selId, setSelId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("cpp");
  const { cards, setCards, resetCards } = useCards();

  // ─── App mode ───
  const [appMode, setAppMode] = useState<AppMode>("driver");

  // ─── Border mode ───
  const [borderScreen, setBorderScreen] = useState<BorderScreen>("role_select");
  const [borderRole, setBorderRole] = useState<BorderRole>("sentry");
  const [borderSelId, setBorderSelId] = useState<string | null>(null);
  const [showBorderScan, setShowBorderScan] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

  // ─── Shared handlers ───
  const openCard = (id: string) => {
    setSelId(id);
    setScreen("detail");
  };
  const goMenu = () => {
    setScreen("menu");
    setSelId(null);
  };
  const activateCard = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "active" } : c)));
  };
  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    goMenu();
  };
  const completeCard = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "completed" } : c)));
  };
  const updateCard = (id: string, updates: Partial<CPPCard>) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const addScanRecord = (cppId: string, plate: string, action: string) => {
    setScanHistory((prev) => [
      {
        cppId,
        plate,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
        action,
      },
      ...prev,
    ]);
  };

  // ════════════ BORDER MODE ════════════
  if (appMode === "border") {
    if (borderScreen === "role_select") {
      return (
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <BorderRoleSelect
            onSelect={(r) => {
              setBorderRole(r);
              setBorderScreen("main");
            }}
            onBack={() => setAppMode("driver")}
          />
        </div>
      );
    }

    const borderCard = borderSelId ? cards.find((c) => c.id === borderSelId) : null;

    if (borderScreen === "cpp_view" && borderCard) {
      return (
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <BorderCppView
            card={borderCard}
            role={borderRole}
            onBack={() => {
              setBorderSelId(null);
              setBorderScreen("main");
            }}
            onActivateCard={() => {
              activateCard(borderCard.id);
              addScanRecord(borderCard.id, borderCard.plate, "Въезд на территорию — разрешён");
            }}
            onUpdateCard={(updates) => updateCard(borderCard.id, updates)}
            onAddScanRecord={(action) =>
              addScanRecord(borderCard.id, borderCard.plate, action)
            }
          />
        </div>
      );
    }

    return (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        {showBorderScan && (
          <BorderScanModal
            cards={cards}
            onSelect={(id) => {
              setBorderSelId(id);
              setBorderScreen("cpp_view");
              setShowBorderScan(false);
            }}
            onClose={() => setShowBorderScan(false)}
          />
        )}
        <BorderMainScreen
          role={borderRole}
          cards={cards}
          scanHistory={scanHistory}
          onScan={() => setShowBorderScan(true)}
          onLogout={() => setBorderScreen("role_select")}
          onSelectCpp={(id) => {
            setBorderSelId(id);
            setBorderScreen("cpp_view");
          }}
        />
      </div>
    );
  }

  // ════════════ DRIVER MODE ════════════
  if (screen === "create")
    return (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <CreateWizard
          onDone={(c) => {
            setCards((p) => [...p, c]);
            goMenu();
          }}
          onBack={goMenu}
        />
      </div>
    );

  if (screen === "menu") {
    let content = null;
    if (mainTab === "cpp")
      content = (
        <MenuScreen
          cards={cards}
          onSelect={openCard}
          onCreate={() => setScreen("create")}
          onReset={resetCards}
          onBorderMode={() => setAppMode("border")}
        />
      );
    else if (mainTab === "vehicles") content = <VehiclesScreen />;
    else content = <DriversScreen />;

    return (
      <div style={{ maxWidth: 420, margin: "0 auto", paddingBottom: 64 }}>
        {content}
        <BottomNav active={mainTab} onChange={setMainTab} />
      </div>
    );
  }

  const card = cards.find((c) => c.id === selId);
  if (!card) {
    goMenu();
    return null;
  }

  if (card.status === "draft")
    return (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <DraftScreen
          card={card}
          onBack={goMenu}
          onActivate={() => {
            activateCard(card.id);
            goMenu();
          }}
          onDelete={() => deleteCard(card.id)}
        />
      </div>
    );

  if (card.scenario === "auto_undetermined")
    return (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <AutoDetectScreen
          card={card}
          onBack={goMenu}
          onUpdateCard={(updates) => updateCard(card.id, updates)}
        />
      </div>
    );

  const isExit = card.direction === "out" || card.scenario?.includes("exit");
  const isIMorEmpty =
    card.scenario === "entry_im_empty" || card.scenario === "draft_entry_no_pi";

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {isExit ? (
        <ExitActiveScreen
          card={card}
          onBack={goMenu}
          onComplete={() => completeCard(card.id)}
        />
      ) : isIMorEmpty ? (
        <EntryIMScreen
          card={card}
          onBack={goMenu}
          onComplete={() => completeCard(card.id)}
        />
      ) : (
        <EntryPIScreen
          card={card}
          onBack={goMenu}
          onComplete={() => completeCard(card.id)}
        />
      )}
    </div>
  );
}
