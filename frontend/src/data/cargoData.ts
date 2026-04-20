import type { CPPCard, DocumentItem } from "../types";

export interface CargoBatch {
  id: string;          // TP-01 внутри ПИ
  sender: string;      // отправитель товарной партии
  receiver: string;    // получатель товарной партии
  weight: number;      // кг
  places: number;
  quantity: number;    // кол-во товарных позиций (до 999)
  valueUsd: number;
  docs: DocumentItem[];
}

export interface PICargo {
  piId: string;        // регистрационный номер ПИ (унифицированный)
  piLabel: string;     // "ПИ №1"
  description: string;
  batches: CargoBatch[];
}

export interface CargoSummary {
  totalWeight: number;
  totalPlaces: number;
  totalQuantity: number;
  totalValueUsd: number;
}

// ─── Отправители и получатели (пул для разных ТП) ───
const SENDERS = [
  'ООО "ShenZhen Electronics Co."',
  'Istanbul Textile Ltd.',
  'BMW Auto Parts GmbH',
  '"Ташкент Продукты" ОАО',
  'Samsung Trading Co.',
  'Jiangsu Industrial Group',
  'Hebei Chemical Corp.',
  'Guangzhou Export LLC',
  'Beijing Machinery Ltd.',
  'Shanghai Tools Co.',
];

const RECEIVERS = [
  'ТОО "КазЛогистик"',
  'ТОО "АлматыИмпорт"',
  'ООО "МосТорг"',
  'ТОО "Нұр Трейд"',
  'ООО "РусИмпорт"',
  'ТОО "ЦентрАзия"',
  'АО "КазПром"',
  'ТОО "Евразия Снаб"',
  'ООО "Северный Путь"',
  'ТОО "АстанаТорг"',
];

// Описания ТП (для docs templates)
const BATCH_DOC_TEMPLATES: string[][] = [
  ["Сертификат соответствия", "Инвойс", "Упаковочный лист"],
  ["Фитосанитарный сертификат", "Инвойс", "Сертификат происхождения"],
  ["Сертификат качества", "Инвойс"],
  ["Технический паспорт", "Инвойс", "Декларация"],
  ["Сертификат безопасности", "Инвойс", "MSDS"],
  ["Вет. сертификат", "Инвойс"],
  ["Сертификат соответствия", "Инвойс"],
  ["Инвойс", "Упаковочный лист"],
];

// Детерминированный хэш для стабильной генерации
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function genBatch(piSeed: string, batchIdx: number): CargoBatch {
  const seed = hash(piSeed + ":" + batchIdx);
  const sender = SENDERS[seed % SENDERS.length];
  const receiver = RECEIVERS[(seed >> 3) % RECEIVERS.length];
  const docTemplate = BATCH_DOC_TEMPLATES[seed % BATCH_DOC_TEMPLATES.length];
  const weight = 500 + (seed % 8500);
  const places = 3 + (seed % 45);
  const quantity = 5 + (seed % 995); // до 999 товарных позиций
  const valueUsd = 2000 + (seed % 28000);
  return {
    id: `ТП-${String(batchIdx + 1).padStart(2, "0")}`,
    sender,
    receiver,
    weight,
    places,
    quantity,
    valueUsd,
    docs: docTemplate.map((name, i) => ({
      name,
      valid: (seed + i) % 5 !== 0,
      scan: (seed + i) % 7 !== 0,
    })),
  };
}

/** Кол-во ТП в ПИ (детерминированно, 1-3) */
function batchCountForPi(piSeed: string): number {
  return 1 + (hash(piSeed) % 3);
}

/**
 * Возвращает иерархию ПИ → ТП для карточки.
 * Использует card.pis[i].id как канонический регистрационный номер ПИ.
 */
export function getCardCargo(card: CPPCard): {
  pis: PICargo[];
  summary: CargoSummary;
} {
  const pis: PICargo[] = [];

  if (card.pis && card.pis.length > 0) {
    card.pis.forEach((pi, pidx) => {
      const bCount = batchCountForPi(pi.id);
      const batches = Array.from({ length: bCount }, (_, bi) => genBatch(pi.id, bi));
      pis.push({
        piId: pi.id,
        piLabel: `ПИ №${pidx + 1}`,
        description: pi.desc,
        batches,
      });
    });
  } else if ((card.piCount || 0) > 0) {
    for (let i = 0; i < (card.piCount || 0); i++) {
      const piId = `PI-2026-${String(184 + i).padStart(5, "0")}`;
      const bCount = batchCountForPi(piId);
      const batches = Array.from({ length: bCount }, (_, bi) => genBatch(piId, bi));
      pis.push({
        piId,
        piLabel: `ПИ №${i + 1}`,
        description: "Груз",
        batches,
      });
    }
  } else {
    // Без ПИ (импорт/экспорт/порожний) — одна базовая запись по ДТ
    const piId = `DT-${card.id}`;
    const batches = [genBatch(piId, 0)];
    pis.push({
      piId,
      piLabel: "Груз по ДТ",
      description: card.scenarioLabel || "Основной груз",
      batches,
    });
  }

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
