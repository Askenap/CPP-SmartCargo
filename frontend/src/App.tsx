import { useState } from "react";
import { useCards } from "./hooks/useCards";
import { MenuScreen } from "./screens/MenuScreen";
import { CreateWizard } from "./screens/CreateWizard";
import { DraftScreen } from "./screens/DraftScreen";
import { EntryPIScreen } from "./screens/EntryPIScreen";
import { EntryIMScreen } from "./screens/EntryIMScreen";
import { ExitActiveScreen } from "./screens/ExitActiveScreen";

type Screen = "menu" | "create" | "detail";

export default function App() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [selId, setSelId] = useState<string | null>(null);
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

  if (screen === "menu")
    return (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <MenuScreen
          cards={cards}
          onSelect={openCard}
          onCreate={() => setScreen("create")}
          onActivate={activateCard}
          onDelete={deleteCard}
          onReset={resetCards}
        />
      </div>
    );

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

  const isExit = card.direction === "out" || card.scenario?.includes("exit");
  const isIMEmpty = card.scenario === "entry_im_empty";

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {isExit ? (
        <ExitActiveScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
      ) : isIMEmpty ? (
        <EntryIMScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
      ) : (
        <EntryPIScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
      )}
    </div>
  );
}
