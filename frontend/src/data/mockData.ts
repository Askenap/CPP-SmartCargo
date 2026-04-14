import type { DocumentItem, PIItem, QueueItem, TransitItem } from "../types";

export const mockPIs: PIItem[] = [
  { id: "PI-2026-00184", desc: "Электроника", weight: "12 400 кг", from: "Китай" },
  { id: "PI-2026-00197", desc: "Текстиль", weight: "8 200 кг", from: "Турция" },
  { id: "PI-2026-00203", desc: "Запчасти", weight: "5 600 кг", from: "Германия" },
  { id: "PI-2026-00218", desc: "Продукты", weight: "15 000 кг", from: "Узбекистан" },
];

export const mockTransits: TransitItem[] = [
  { id: "10101010/060426/ТТ-0003891", desc: "Электроника → Россия", status: "В пути" },
  { id: "10101010/050426/ТТ-0003785", desc: "Текстиль → Кыргызстан", status: "В пути" },
];

export const mockQueues: QueueItem[] = [
  { id: "CRQ-2026-04887", dest: "КНР (Қорғас)", date: "15.04.2026", slot: "09:00–12:00" },
  { id: "CRQ-2026-04901", dest: "КНР (Нұр жолы)", date: "16.04.2026", slot: "14:00–17:00" },
  { id: "CRQ-2026-04920", dest: "Узбекистан (Жібек жолы)", date: "17.04.2026", slot: "08:00–11:00" },
  { id: "CRQ-2026-04935", dest: "РФ (Сырым)", date: "18.04.2026", slot: "10:00–13:00" },
];

export const PIS7 = Array.from({ length: 7 }, (_, i) => ({
  id: i,
  regNumber: `KZ/060426/${String(1265 + i).padStart(9, "0")}`,
  label: `ПИ №${i + 1}`,
}));

export const driverDocs: DocumentItem[] = [
  { name: "Удостоверение личности / Паспорт", valid: true, scan: true },
  { name: "Водительские права", valid: true, scan: true },
  { name: "Спец. разрешение", valid: false, scan: false },
  { name: "ТТН / СМР", valid: true, scan: true },
  { name: "Сертификат тахографа", valid: true, scan: true },
  { name: "Карта водителя", valid: true, scan: false },
  { name: "Путевой лист", valid: true, scan: true },
  { name: "Техпаспорт", valid: true, scan: true },
];

export const cargoDocs: DocumentItem[] = [
  { name: "Транзитная декларация", valid: true, scan: true },
  { name: "Ветеринарный сертификат", valid: true, scan: true },
  { name: "Фитосанитарный сертификат", valid: true, scan: true },
  { name: "Книжка МДП", valid: true, scan: true },
  { name: "Инвойс к договору", valid: false, scan: false },
  { name: "Страховой полис", valid: false, scan: false },
];
