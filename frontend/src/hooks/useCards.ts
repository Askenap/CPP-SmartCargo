import { useEffect, useState } from "react";
import { initialCards } from "../data/initialCards";
import type { CPPCard } from "../types";

const STORAGE_KEY = "smartcargo-cpp-cards-v1";

function loadFromStorage(): CPPCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialCards;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as CPPCard[];
    return initialCards;
  } catch {
    return initialCards;
  }
}

export function useCards(): {
  cards: CPPCard[];
  setCards: React.Dispatch<React.SetStateAction<CPPCard[]>>;
  resetCards: () => void;
} {
  const [cards, setCards] = useState<CPPCard[]>(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // storage full / disabled — ignore
    }
  }, [cards]);

  const resetCards = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCards(initialCards);
  };

  return { cards, setCards, resetCards };
}
