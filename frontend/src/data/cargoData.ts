import type { CPPCard, DocumentItem } from "../types";

export interface CargoBatch {
  id: string;
  name: string;
  weight: number; // кг
  places: number;
  quantity: number;
  valueUsd: number;
  docs: DocumentItem[];
}

export interface PICargo {
  piId: string;
  piLabel: string;
  description: string;
  batches: CargoBatch[];
}

export interface CargoSummary {
  totalWeight: number;
  totalPlaces: number;
  totalQuantity: number;
  totalValueUsd: number;
}

// ─── Моки товарных партий ───
const BATCH_TEMPLATES: { name: string; docs: string[] }[][] = [
  // Для первой ПИ
  [
    { name: "Смартфоны iPhone", docs: ["Сертификат соответствия", "Инвойс", "Упаковочный лист"] },
    { name: "Планшеты iPad", docs: ["Сертификат соответствия", "Инвойс"] },
  ],
  // Для второй ПИ
  [
    { name: "Текстиль — ткани", docs: ["Фитосанитарный сертификат", "Инвойс", "Сертификат происхождения"] },
    { name: "Текстиль — готовая одежда", docs: ["Сертификат соответствия", "Инвойс"] },
    { name: "Аксессуары", docs: ["Инвойс", "Упаковочный лист"] },
  ],
  // Для третьей
  [
    { name: "Запчасти двигателя", docs: ["Технический паспорт", "Инвойс"] },
    { name: "Электроника АТС", docs: ["Сертификат соответствия", "Инвойс", "Декларация"] },
  ],
  // Для четвёртой
  [
    { name: "Бытовая техника", docs: ["Сертификат соответствия", "Инвойс"] },
  ],
  // Для пятой
  [
    { name: "Продукты питания", docs: ["Вет. сертификат", "Фитосанитарный", "Инвойс"] },
    { name: "Напитки", docs: ["Сертификат качества", "Инвойс"] },
  ],
  // Для шестой
  [
    { name: "Строительные материалы", docs: ["Сертификат качества", "Инвойс"] },
    { name: "Инструменты", docs: ["Инвойс", "Упаковочный лист"] },
  ],
  // Для седьмой
  [
    { name: "Химическая продукция", docs: ["Сертификат безопасности", "Инвойс", "MSDS"] },
  ],
];

// Детерминированная генерация чисел по идентификатору
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function genBatch(piSeed: string, batchIdx: number, template: { name: string; docs: string[] }): CargoBatch {
  const seed = hash(piSeed + batchIdx);
  const weight = 500 + (seed % 8500);
  const places = 3 + (seed % 45);
  const quantity = 10 + (seed % 490);
  const valueUsd = 2000 + (seed % 28000);
  return {
    id: `${piSeed}-TP${batchIdx + 1}`,
    name: template.name,
    weight,
    places,
    quantity,
    valueUsd,
    docs: template.docs.map((name, i) => ({
      name,
      valid: (seed + i) % 5 !== 0, // ~80% валидны
      scan: (seed + i) % 7 !== 0,
    })),
  };
}

/**
 * Генерирует структуру ПИ+ТП для карточки.
 * Основа — card.pis (если есть) или piCount.
 * Для ЦПП без ПИ (import/empty/exit) — одна «виртуальная» партия.
 */
export function getCardCargo(card: CPPCard): {
  pis: PICargo[];
  summary: CargoSummary;
} {
  const pis: PICargo[] = [];

  if (card.pis && card.pis.length > 0) {
    card.pis.forEach((pi, pidx) => {
      const template = BATCH_TEMPLATES[pidx % BATCH_TEMPLATES.length];
      const batches = template.map((t, bi) => genBatch(pi.id, bi, t));
      pis.push({
        piId: pi.id,
        piLabel: `ПИ №${pidx + 1}`,
        description: pi.desc,
        batches,
      });
    });
  } else if ((card.piCount || 0) > 0) {
    for (let i = 0; i < (card.piCount || 0); i++) {
      const piId = `PI-${card.id}-${i + 1}`;
      const template = BATCH_TEMPLATES[i % BATCH_TEMPLATES.length];
      const batches = template.map((t, bi) => genBatch(piId, bi, t));
      pis.push({
        piId,
        piLabel: `ПИ №${i + 1}`,
        description: "Груз",
        batches,
      });
    }
  } else {
    // Без ПИ — одна общая «партия» как базовая инфо
    const template = BATCH_TEMPLATES[0];
    const batches = template.slice(0, 1).map((t, bi) => genBatch(card.id, bi, t));
    pis.push({
      piId: card.id,
      piLabel: "Груз",
      description: card.scenarioLabel || "Основной груз",
      batches,
    });
  }

  // Свод по всем
  let totalWeight = 0, totalPlaces = 0, totalQuantity = 0, totalValueUsd = 0;
  pis.forEach((pi) => {
    pi.batches.forEach((b) => {
      totalWeight += b.weight;
      totalPlaces += b.places;
      totalQuantity += b.quantity;
      totalValueUsd += b.valueUsd;
    });
  });

  return {
    pis,
    summary: { totalWeight, totalPlaces, totalQuantity, totalValueUsd },
  };
}

export function formatNumber(n: number): string {
  return n.toLocaleString("ru-RU");
}

export function formatMoney(usd: number): string {
  return `$${formatNumber(usd)}`;
}
