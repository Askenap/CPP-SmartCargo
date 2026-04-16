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
import type { CPPCard } from "./types";

type Screen = "menu" | "create" | "detail";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [selId, setSelId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("cpp");
  const { cards, setCards, resetCards } = useCards();

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
  };
  const completeCard = (id: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "completed" } : c)));
  };
  const updateCard = (id: string, updates: Partial<CPPCard>) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

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
          onActivate={activateCard}
          onDelete={deleteCard}
          onReset={resetCards}
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
        <DraftScreen card={card} onBack={goMenu} />
      </div>
    );

  // Авто-ЦПП с неопределённым типом → AutoDetectScreen
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
    card.scenario === "entry_im_empty" ||
    card.scenario === "draft_entry_no_pi";

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {isExit ? (
        <ExitActiveScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
      ) : isIMorEmpty ? (
        <EntryIMScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
      ) : (
        <EntryPIScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
      )}
    </div>
  );
}
