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

// Импортные / экспортные декларации — для alt-способа создания ЦПП
export const mockImportDTs = [
  { id: "IM-10101010-060426-DT-118874", desc: "Импорт: бытовая техника", from: "КНР" },
  { id: "IM-10101010-070426-DT-119103", desc: "Импорт: текстильные изделия", from: "Турция" },
];

export const mockExportDTs = [
  { id: "EX-10101010-060426-DT-094571", desc: "Экспорт: зерно пшеницы", to: "КНР" },
  { id: "EX-10101010-070426-DT-094902", desc: "Экспорт: нефтепродукты", to: "РФ" },
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

// ─── Реестр ТС ───
export interface Vehicle {
  id: string;
  plate: string;
  trailer?: string;
  model: string;
  year: number;
  tech: string; // техпаспорт
  company: string;
}

export const mockVehicles: Vehicle[] = [
  {
    id: "v1",
    plate: "898UJY01",
    trailer: "A123ABC01",
    model: "Volvo FH 460",
    year: 2022,
    tech: "ТП 01 №1234567",
    company: 'ТОО "КазТранс Логистик"',
  },
  {
    id: "v2",
    plate: "771ABC02",
    model: "Mercedes-Benz Actros",
    year: 2021,
    tech: "ТП 02 №1234891",
    company: 'ТОО "АлматыТрансСервис"',
  },
  {
    id: "v3",
    plate: "220GHK04",
    trailer: "B456DEF04",
    model: "MAN TGX 18.480",
    year: 2023,
    tech: "ТП 04 №1235102",
    company: 'ТОО "КазТранс Логистик"',
  },
  {
    id: "v4",
    plate: "445RTY06",
    model: "Scania R500",
    year: 2020,
    tech: "ТП 06 №1235441",
    company: 'ИП "Жумабеков"',
  },
  {
    id: "v5",
    plate: "012BKR07",
    trailer: "C789GHI07",
    model: "DAF XF 480",
    year: 2022,
    tech: "ТП 07 №1236108",
    company: 'ТОО "ҚазЭкспортТранс"',
  },
  {
    id: "v6",
    plate: "331NKZ05",
    trailer: "D012JKL05",
    model: "Volvo FH 500",
    year: 2023,
    tech: "ТП 05 №1236774",
    company: 'ТОО "НұрТранс"',
  },
];

// ─── Реестр водителей ───
export interface Driver {
  id: string;
  fullName: string;
  iin: string;
  license: string;
  phone: string;
  company: string;
}

export const mockDrivers: Driver[] = [
  {
    id: "d1",
    fullName: "Аппаков Т.Б.",
    iin: "820504301234",
    license: "AA 1234567",
    phone: "+7 701 234 5678",
    company: 'ТОО "КазТранс Логистик"',
  },
  {
    id: "d2",
    fullName: "Оспанов М.К.",
    iin: "780312300987",
    license: "AB 2345678",
    phone: "+7 702 345 6789",
    company: 'ТОО "АлматыТрансСервис"',
  },
  {
    id: "d3",
    fullName: "Нурланов А.Б.",
    iin: "851119300456",
    license: "AC 3456789",
    phone: "+7 705 456 7890",
    company: 'ТОО "КазТранс Логистик"',
  },
  {
    id: "d4",
    fullName: "Жумабеков С.Е.",
    iin: "750802300321",
    license: "AD 4567890",
    phone: "+7 707 567 8901",
    company: 'ИП "Жумабеков"',
  },
  {
    id: "d5",
    fullName: "Қасымов Е.Т.",
    iin: "890615300654",
    license: "AE 5678901",
    phone: "+7 708 678 9012",
    company: 'ТОО "ҚазЭкспортТранс"',
  },
  {
    id: "d6",
    fullName: "Ибрагимов Р.Д.",
    iin: "830227300789",
    license: "AF 6789012",
    phone: "+7 747 789 0123",
    company: 'ТОО "НұрТранс"',
  },
];
