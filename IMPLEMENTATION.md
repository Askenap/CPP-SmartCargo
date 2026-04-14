# SmartCargo ЦПП — Полная инструкция для реализации

## ЗАДАЧА
Воссоздать 1-в-1 работающий прототип ЦПП как fullstack React+TypeScript приложение. Ниже — полный исходный код прототипа + описание каждого экрана и логики. Твоя задача: разбить этот монолит на компоненты, добавить TypeScript типы, роутинг, и сделать production-ready.

---

## ЭКРАНЫ ПРИЛОЖЕНИЯ (7 штук)

### 1. MenuScreen — Главное меню
- Шапка: синий градиент, "SmartCargo / Цифровой паспорт перевозки"
- Кнопка "⟳ Активный · {plate}" — быстрый переход к активному ЦПП
- Кнопка "+ Создать ЦПП" — пунктирная рамка, открывает визард
- Список всех ЦПП-карточек: plate, driver, type, scenarioLabel, StatusBadge
- Левая полоса 4px: синий=active, фиолетовый=draft, зелёный=completed
- Каждая карточка: кнопка "▶ Активировать" (для draft) и "🗑 Удалить"

### 2. CreateWizard — Создание ЦПП (6 шагов)
- Точки прогресса вверху
- **Шаг 0:** ГРНЗ + чекбокс "Прицеп" + поле прицепа
- **Шаг 1:** ИИН/Паспорт переключатель + поле ввода
- **Шаг 2:** Направление: "Въезд в РК" / "Выезд из РК"
- **Шаг 3:** (только выезд) Выбор электронной очереди из Cargo Ruqsat (radio-список с id, dest, date, slot)
- **Шаг 4:** Тип: въезд=[Транзит ПИ, Импорт ДТ, Порожний], выезд=[Порожний, Экспорт ДТ, Завершение транзита]
- **Шаг 5:** (если pi) Выбор ПИ чекбоксами, (если transit_complete) Выбор ТД из списка radio
- Результат: создаёт карточку со status="draft" и возвращает в меню

### 3. DraftScreen — Черновик ЦПП
- Кнопка "⊞ QR Draft" с пунктирной фиолетовой рамкой
- Карточка: StatusBadge "Черновик", тип, ГРНЗ, водитель
- Если есть ПИ: фиолетовые карточки с id и desc
- Если есть queue/ibr/transit: SourceCard компоненты
- Если draft_entry_no_pi: жёлтое предупреждение "Тип определится после въезда"
- Фиолетовый блок "ℹ После въезда на пост ЦПП станет активным"

### 4. EntryPIScreen — Активный ЦПП въезда по ПИ
- QR кнопка + инфо-карточка
- Если 1 ПИ: нет переключателя, одна статусная схема
- Если несколько ПИ: горизонтальный скролл-переключатель, каждый показывает X/8
- Общий прогресс Ring: считает все ПИ + общие этапы
- Таймлайн снизу вверх (reversed array):
  - 4 общих этапа → 8 per-PI этапов → 1 общий финальный
- Демо-кнопка внизу: "→ {название следующего этапа}"
- Статус: ожидание(серый) → в процессе(жёлтый) → пропуск разрешён(зелёный)

### 5. EntryIMScreen — Активный ЦПП въезда (импорт/порожний)
- Бейдж "Тип не определён" / "Импорт (ДТ)" / "Порожний"
- Этапы трёх типов:
  - active (обычные, идут первыми)
  - mandatory (обязательные, всегда видны)
  - undetermined (пунктирный кружок с "?", надпись "Не определено")
- Демо-кнопки после 3 этапов: "🔔 СИК: Порожний" (удаляет условные) и "🔔 Кеден: ДТ Импорт" (делает условные обязательными)
- Таможенный контроль: подстатус "Декларация на товары (импорт)" строкой под названием

### 6. ExitActiveScreen — Активный ЦПП выезда из РК
- 15 этапов выезда (линейные, без мульти-ПИ)
- SourceCard'ы в разделе "На основе": очередь + ИБР + (опционально ТД)
- Таможенный контроль: переменный подстатус (строкой, НЕ в плашке)
  - empty: "Пройден / Не пройден"
  - export: "Экс. ДТ выпущена / Не выпущена"
  - transit: "ТД завершена / Отказано"
- Демо-кнопка "⚡ Экспортная ДТ подтянулась" (для empty, после 5 этапов)
- Плашка статуса этапа: только для "passed" (зелёная). "current" БЕЗ плашки.
- Статус: ожидание → в процессе → завершён

### 7. DocsTabs — Вкладки Груз/Документы (переиспользуемый)
- Таб "Груз": вес, мест, кол-во, стоимость
- Таб "Документы": две секции:
  - 🚛 Водитель и ТС: паспорт, права, спец.разрешение, ТТН/СМР, тахограф, карта, путевой, техпаспорт
  - 📦 Груз: декларации, сертификаты, МДП, инвойс, страховка
  - Кнопка 👁 открывает ScanModal

---

## UI КОМПОНЕНТЫ

### HScroll — Горизонтальный скролл с стрелками
- Кнопки ‹ › появляются когда есть скрытый контент
- Градиент справа как индикатор

### Ring — Круговой прогресс
- SVG кольцо, анимированный stroke-dashoffset
- Текст X/Y внутри

### EntryStepRow — Строка этапа въезда
- Кружок статуса + вертикальная линия
- Поддержка isDashed (пунктирный, "Не определено")
- Поддержка isCustoms (подстатус строкой)

### ExitStepRow — Строка этапа выезда
- Плашка ТОЛЬКО для passed, НЕ для current
- isCustoms: подстатус строкой под названием

### StatusBadge — draft/active/completed
### SourceCard — system + number + status
### Header — синий градиент с "← Назад"
### TabBar — 3 таба: Статусы/Груз/Документы

---

## ЦВЕТОВАЯ СХЕМА

```typescript
const colors = {
  primary: "#2563eb",
  primaryDark: "#1e40af",
  primaryLight: "#dbeafe",
  green: "#16a34a",
  greenBg: "#dcfce7",
  red: "#dc2626",
  redBg: "#fef2f2",
  amber: "#d97706",
  amberBg: "#fef3c7",
  gray: "#94a3b8",
  grayLight: "#f1f5f9",
  grayBorder: "#e2e8f0",
  text: "#0f172a",
  textSec: "#64748b",
  white: "#ffffff",
  bg: "#f0f4f8",
  draft: "#6366f1",
  draftBg: "#eef2ff",
  transit: "#7c3aed",
  transitBg: "#ede9fe",
};
```

---

## ТИПЫ ДАННЫХ

```typescript
type CPPStatus = "draft" | "active" | "completed";
type Direction = "in" | "out";
type ExitType = "empty" | "export" | "transit";
type DTStatus = "unknown" | "empty" | "import";
type StepStatus = "pending" | "current" | "passed";
type StepType = "active" | "mandatory" | "undetermined" | "hidden";

interface CPPCard {
  id: string;
  status: CPPStatus;
  plate: string;
  driver: string;
  type: string; // "Въезд в Республику Казахстан" | "Выезд из Республики Казахстан"
  customsPost: string;
  from: string;
  to: string;
  basis?: string;
  scenario: string;
  scenarioLabel?: string;
  direction: Direction;
  exitType?: ExitType;
  piCount?: number;
  pis?: PIItem[];
  draftData?: {
    queue?: SourceData;
    ibr?: SourceData;
    transit?: { number: string; origin: string; status: string };
  };
}

interface PIItem {
  id: string;
  desc: string;
  weight: string;
  from: string;
}

interface SourceData {
  system: string;
  number: string;
  status: string;
}

interface ExitStep {
  id: string;
  label: string;
  subs: [string, string]; // [passedText, failedText]
  isCustoms?: boolean;
}

interface EntryIMStep {
  id: string;
  label: string;
  type: StepType;
  subLabel?: string;
  isCustoms?: boolean;
}

interface Document {
  name: string;
  valid: boolean;
  scan: boolean;
}
```

---

## МАРШРУТИЗАЦИЯ (в App)

```
screen === "menu"    → MenuScreen
screen === "create"  → CreateWizard
screen === "detail"  → по card:
  card.status === "draft"          → DraftScreen
  card.direction === "out"         → ExitActiveScreen
  card.scenario === "entry_im_empty" → EntryIMScreen
  иначе                            → EntryPIScreen
```

---

## НАЧАЛЬНЫЕ ДАННЫЕ (для seed/demo)

5 карточек:
1. active1: Въезд по ПИ, 7 ПИ, plate=898UJY01 (active)
2. active_1pi: Въезд по ПИ, 1 ПИ, plate=220GHK04 (active)
3. active_im: Въезд ИМ/порожний, plate=445RTY06 (active)
4. draft2: Выезд порожний/экспорт, plate=012BKR07 (draft)
5. draft3: Выезд завершение транзита, plate=331NKZ05 (draft)

---

## СТРУКТУРА ПРОЕКТА

```
src/
  components/
    HScroll.tsx
    Ring.tsx
    EntryStepRow.tsx
    ExitStepRow.tsx
    StatusBadge.tsx
    SourceCard.tsx
    Header.tsx
    TabBar.tsx
    DocRow.tsx
    ScanModal.tsx
    DocsTabs.tsx
  screens/
    MenuScreen.tsx
    CreateWizard.tsx
    DraftScreen.tsx
    EntryPIScreen.tsx
    EntryIMScreen.tsx
    ExitActiveScreen.tsx
  data/
    colors.ts
    exitSteps.ts
    entrySteps.ts
    mockData.ts
    initialCards.ts
  types/
    index.ts
  App.tsx
```

---

## ПОЛНЫЙ ИСХОДНЫЙ КОД ПРОТОТИПА

Это рабочий монолит. Разбей его на компоненты выше, сохранив ВСЮ логику и визуал 1-в-1.

```jsx
import { useState, useRef, useEffect, useCallback } from "react";

// ═══ COLORS ═══
const C = {
  primary: "#2563eb", primaryDark: "#1e40af", primaryLight: "#dbeafe",
  green: "#16a34a", greenBg: "#dcfce7", red: "#dc2626", redBg: "#fef2f2",
  amber: "#d97706", amberBg: "#fef3c7", gray: "#94a3b8", grayLight: "#f1f5f9",
  grayBorder: "#e2e8f0", text: "#0f172a", textSec: "#64748b", white: "#fff", bg: "#f0f4f8",
  draft: "#6366f1", draftBg: "#eef2ff", transit: "#7c3aed", transitBg: "#ede9fe",
};

// ═══ EXIT STEPS ═══
function getExitSteps(t) {
  let cl, cs;
  if (t === "transit") { cl = "Таможенный контроль"; cs = ["ТД завершена", "Отказано"]; }
  else if (t === "export") { cl = "Таможенный контроль"; cs = ["Экс. ДТ выпущена", "Не выпущена"]; }
  else { cl = "Таможенный контроль"; cs = ["Пройден", "Не пройден"]; }
  return [
    { id: "ex1", label: "Предварительная подготовка ЦПП", subs: ["Создан", "—"] },
    { id: "ex2", label: "Въезд в территорию пограничного поста из РК", subs: ["Пройдено", "Не пройдено"] },
    { id: "ex3", label: "Регистрация АТС в системе СИК", subs: ["Пройдено", "Не пройдено"] },
    { id: "ex4", label: "Подтверждение прибытия по электронной очереди", subs: ["Подтверждено", "—"] },
    { id: "ex5", label: "Весогабаритное измерение", subs: ["Пройдено", "Не пройдено"] },
    { id: "ex6", label: "Снимок ИДК", subs: ["Снимок сделан", "Не пройден"] },
    { id: "ex6b", label: "Контроль снимка ИДК", subs: ["Пройден", "Не пройден"] },
    { id: "ex7", label: "Транспортный контроль", subs: ["Пройден", "Не пройден"] },
    { id: "ex8", label: "Ветеринарный контроль", subs: ["Пройден", "Не пройден"] },
    { id: "ex9", label: "Фитосанитарный контроль", subs: ["Пройден", "Не пройден"] },
    { id: "ex10", label: "Проверка ИБР", subs: ["Выдан", "Не выдан"] },
    { id: "ex11", label: "Санитарно-карантинный контроль", subs: ["Пройден", "Не пройден"] },
    { id: "ex12", label: cl, subs: cs, isCustoms: true },
    { id: "ex13", label: "Досмотр ТС пограничной службой", subs: ["Пройден", "Не пройден"] },
    { id: "ex14", label: "Выезд с территории пограничного поста из РК", subs: ["Пройдено", "Не пройдено"] },
  ];
}

// ═══ ENTRY STEPS (PI) — updated: split ИДК ═══
const ENTRY_SHARED_BEFORE = [
  { id: "s1", label: "Предварительная подготовка ЦПП" },
  { id: "s2", label: "Въезд в территорию пограничного поста в сторону РК" },
  { id: "s3", label: "Паспортный контроль" },
  { id: "s4", label: "Пограничный досмотр" },
];
const ENTRY_PER_PI = [
  { id: "p1", label: "Таможенный осмотр" },
  { id: "p2a", label: "Снимок ИДК" },
  { id: "p2b", label: "Контроль снимка ИДК" },
  { id: "p3", label: "Транспортный контроль" },
  { id: "p4", label: "Ветеринарный контроль" },
  { id: "p5", label: "Фито-санитарный контроль" },
  { id: "p6", label: "Санитарный контроль" },
  { id: "p7", label: "Транзитная декларация" },
];
const ENTRY_SHARED_AFTER = [{ id: "s5", label: "Выезд с территории пограничного поста в сторону РК" }];
const TOTAL_SHARED = ENTRY_SHARED_BEFORE.length + ENTRY_SHARED_AFTER.length;
const TOTAL_PER = ENTRY_PER_PI.length;

// ═══ ENTRY STEPS (IM/Empty) — same order, conditional middle ═══
function getEntryIMSteps(dtStatus) {
  // dtStatus: "unknown" | "empty" | "import"
  const cond = dtStatus === "import" ? "mandatory" : dtStatus === "empty" ? "hidden" : "undetermined";
  const base = [
    { id: "im1", label: "Предварительная подготовка ЦПП", type: "active" },
    { id: "im2", label: "Въезд в территорию пограничного поста в сторону РК", type: "active" },
    { id: "im3", label: "Регистрация АТС в СИК", type: "active" },
    { id: "im4", label: "Паспортный контроль", type: "mandatory" },
    { id: "im5", label: "Пограничный досмотр", type: "mandatory" },
  ];
  const conditional = cond !== "hidden" ? [
    { id: "im6", label: "Таможенный осмотр", type: cond },
    { id: "im7a", label: "Снимок ИДК", type: "mandatory" },
    { id: "im7b", label: "Контроль снимка ИДК", type: "mandatory" },
    { id: "im8", label: "Транспортный контроль", type: cond },
    { id: "im9", label: "Ветеринарный контроль", type: cond },
    { id: "im10", label: "Фито-санитарный контроль", type: cond },
    { id: "im11", label: "Санитарный контроль", type: cond },
    { id: "im12", label: "Таможенный контроль", type: cond, subLabel: "Декларация на товары (импорт)", isCustoms: true },
  ] : [
    { id: "im7a", label: "Снимок ИДК", type: "mandatory" },
    { id: "im7b", label: "Контроль снимка ИДК", type: "mandatory" },
  ];
  const final = [
    { id: "im13", label: "Выезд с территории пограничного поста в сторону РК", type: "mandatory" },
  ];
  return [...base, ...conditional, ...final];
}

// ═══ MOCK DATA ═══
const mockPIs = [
  { id: "PI-2026-00184", desc: "Электроника", weight: "12 400 кг", from: "Китай" },
  { id: "PI-2026-00197", desc: "Текстиль", weight: "8 200 кг", from: "Турция" },
  { id: "PI-2026-00203", desc: "Запчасти", weight: "5 600 кг", from: "Германия" },
  { id: "PI-2026-00218", desc: "Продукты", weight: "15 000 кг", from: "Узбекистан" },
];
const mockTransits = [
  { id: "10101010/060426/ТТ-0003891", desc: "Электроника → Россия", status: "В пути" },
  { id: "10101010/050426/ТТ-0003785", desc: "Текстиль → Кыргызстан", status: "В пути" },
];
const mockQueues = [
  { id: "CRQ-2026-04887", dest: "КНР (Қорғас)", date: "15.04.2026", slot: "09:00–12:00" },
  { id: "CRQ-2026-04901", dest: "КНР (Нұр жолы)", date: "16.04.2026", slot: "14:00–17:00" },
  { id: "CRQ-2026-04920", dest: "Узбекистан (Жібек жолы)", date: "17.04.2026", slot: "08:00–11:00" },
  { id: "CRQ-2026-04935", dest: "РФ (Сырым)", date: "18.04.2026", slot: "10:00–13:00" },
];
const PIS7 = Array.from({ length: 7 }, (_, i) => ({ id: i, regNumber: `KZ/060426/${String(1265 + i).padStart(9, "0")}`, label: `ПИ №${i + 1}` }));

const driverDocs = [
  { name: "Удостоверение личности / Паспорт", valid: true, scan: true },
  { name: "Водительские права", valid: true, scan: true },
  { name: "Спец. разрешение", valid: false, scan: false },
  { name: "ТТН / СМР", valid: true, scan: true },
  { name: "Сертификат тахографа", valid: true, scan: true },
  { name: "Карта водителя", valid: true, scan: false },
  { name: "Путевой лист", valid: true, scan: true },
  { name: "Техпаспорт", valid: true, scan: true },
];
const cargoDocs = [
  { name: "Транзитная декларация", valid: true, scan: true },
  { name: "Ветеринарный сертификат", valid: true, scan: true },
  { name: "Фитосанитарный сертификат", valid: true, scan: true },
  { name: "Книжка МДП", valid: true, scan: true },
  { name: "Инвойс к договору", valid: false, scan: false },
  { name: "Страховой полис", valid: false, scan: false },
];

// ═══ INITIAL CARDS ═══
const initialCards = [
  { id: "active1", status: "active", plate: "898UJY01", driver: "Аппаков Т.Б.", type: "Въезд в Республику Казахстан", customsPost: "ТП «Нұр жолы»", from: "КНР", to: "РФ", basis: "7 ПИ", scenario: "transit_entry", direction: "in", piCount: 7 },
  { id: "active_1pi", status: "active", plate: "220GHK04", driver: "Нурланов А.Б.", type: "Въезд в Республику Казахстан", customsPost: "ТП «Нұр жолы»", from: "КНР", to: "РФ", basis: "1 ПИ", scenario: "transit_entry", direction: "in", piCount: 1 },
  { id: "active_im", status: "active", plate: "445RTY06", driver: "Жумабеков С.", type: "Въезд в Республику Казахстан", customsPost: "ТП «Нұр жолы»", from: "КНР", to: "—", scenario: "entry_im_empty", scenarioLabel: "Въезд (ИМ/порожний)", direction: "in" },
  { id: "draft2", status: "draft", plate: "012BKR07", driver: "Қасымов Е.Т.", type: "Выезд из Республики Казахстан", customsPost: "ТП «Қорғас-авто»", from: "Казахстан", to: "КНР", basis: "Очередь + ИБР", scenario: "draft_exit_export", scenarioLabel: "Выезд (порожний/экспорт)", direction: "out", exitType: "empty", draftData: { queue: { system: "Cargo Ruqsat", number: "CRQ-2026-04887", status: "Подтверждено" }, ibr: { system: "Cargo Alem", number: "IBR-KZ-CN-00412", status: "Выдан" } } },
  { id: "draft3", status: "draft", plate: "331NKZ05", driver: "Ибрагимов Р.Д.", type: "Выезд из Республики Казахстан", customsPost: "ТП «Нұр жолы»", from: "Казахстан", to: "РФ", basis: "Очередь + ИБР + ТД", scenario: "draft_exit_transit", scenarioLabel: "Завершение транзита", direction: "out", exitType: "transit", draftData: { queue: { system: "Cargo Ruqsat", number: "CRQ-2026-05102", status: "Подтверждено" }, ibr: { system: "ИАС ТБД", number: "IBR-KZ-RU-01933", status: "Выдан" }, transit: { number: "10101010/060426/ТТ-0003891", origin: "Кеден (ЕАЭС)", status: "В пути" } } },
];

// ═══ UI COMPONENTS ═══
function HScroll({ children }) {
  const ref = useRef(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(false);
  const check = useCallback(() => {
    const el = ref.current; if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);
  useEffect(() => { check(); });
  const scroll = (d) => { ref.current?.scrollBy({ left: d * 120, behavior: "smooth" }); setTimeout(check, 300); };
  const Arr = ({ dir, show }) => show ? (
    <button onClick={() => scroll(dir)} style={{ position: "absolute", top: "50%", [dir < 0 ? "left" : "right"]: -2, transform: "translateY(-50%)", zIndex: 2, width: 24, height: 24, borderRadius: "50%", border: `1px solid ${C.grayBorder}`, background: C.white, cursor: "pointer", fontSize: 12, color: C.textSec, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}>{dir < 0 ? "‹" : "›"}</button>
  ) : null;
  return (
    <div style={{ position: "relative" }}>
      <Arr dir={-1} show={canL} />
      <div ref={ref} onScroll={check} style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>{children}</div>
      <Arr dir={1} show={canR} />
      {canR && <div style={{ position: "absolute", top: 0, right: 0, bottom: 4, width: 28, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.9))", pointerEvents: "none", zIndex: 1 }} />}
    </div>
  );
}

const styCfg = {
  passed: { color: C.green, bg: C.greenBg, ring: C.green, icon: "✓" },
  current: { color: C.amber, bg: C.amberBg, ring: C.amber, icon: "●" },
  pending: { color: C.gray, bg: C.grayLight, ring: C.grayBorder, icon: "·" },
  undetermined: { color: C.gray, bg: "transparent", ring: C.grayBorder, icon: "?" },
};
function stepSt(i, p) { return i < p ? "passed" : i === p ? "current" : "pending"; }

function Ring({ passed, total, size = 46 }) {
  const sw = 4, r = (size - sw * 2) / 2, ci = 2 * Math.PI * r;
  const pct = total > 0 ? (passed / total) * 100 : 0;
  const col = passed === total && total > 0 ? C.green : C.primary;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.grayBorder} strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={sw}
          strokeDasharray={ci} strokeDashoffset={ci - (ci * pct / 100)}
          strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .3s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * .24, fontWeight: 700, color: C.text }}>{passed}<span style={{ color: C.gray, fontWeight: 500, fontSize: size * .18 }}>/{total}</span></span>
      </div>
    </div>
  );
}

function ExitStepRow({ step, status, isLast }) {
  const s = styCfg[status];
  const subText = status === "passed" ? step.subs[0] : "";
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${s.ring}`, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.icon}</div>
        {!isLast && <div style={{ width: 2, flex: 1, background: C.grayBorder, minHeight: 12 }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 10, flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: status === "pending" ? C.gray : C.text, lineHeight: 1.3 }}>{step.label}</div>
          {step.isCustoms && status === "passed" && <div style={{ fontSize: 10, color: C.green, marginTop: 2, fontWeight: 600 }}>{step.subs[0]}</div>}
          {step.isCustoms && status === "pending" && <div style={{ fontSize: 10, color: C.gray, marginTop: 2, fontStyle: "italic" }}>{step.subs.join(" / ")}</div>}
        </div>
        {!step.isCustoms && subText && <span style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20, flexShrink: 0, background: C.greenBg, color: C.green, whiteSpace: "nowrap" }}>({subText})</span>}
      </div>
    </div>
  );
}

function EntryStepRow({ label, status, isLast, sub, isDashed, subLabel, isCustoms }) {
  const s = styCfg[status];
  const tm = { passed: "Пройден", current: "В процессе", pending: "" };
  const dashed = isDashed && status === "pending";
  return (
    <div style={{ display: "flex", gap: 10, opacity: dashed ? 0.5 : 1 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 22 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px ${dashed ? "dashed" : "solid"} ${s.ring}`, background: dashed ? "transparent" : s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: s.color, flexShrink: 0 }}>{dashed ? "?" : s.icon}</div>
        {!isLast && <div style={{ width: 2, flex: 1, background: C.grayBorder, minHeight: 12, borderLeft: dashed ? `1px dashed ${C.grayBorder}` : "none", borderRight: dashed ? "none" : "none" }} />}
      </div>
      <div style={{ paddingBottom: isLast ? 0 : 10, flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: status === "pending" ? C.gray : C.text, lineHeight: 1.3 }}>{label}</div>
          {sub && <div style={{ fontSize: 9, color: C.gray, marginTop: 1 }}>{sub}</div>}
          {isCustoms && subLabel && <div style={{ fontSize: 10, color: status === "passed" ? C.green : C.gray, marginTop: 2, fontStyle: status === "pending" ? "italic" : "normal", fontWeight: 600 }}>{subLabel}</div>}
          {dashed && <div style={{ fontSize: 9, color: C.amber, fontStyle: "italic", marginTop: 1 }}>Не определено</div>}
        </div>
        {!isCustoms && tm[status] && !dashed && <span style={{ fontSize: 9.5, fontWeight: 600, padding: "2px 7px", borderRadius: 20, flexShrink: 0, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>{tm[status]}</span>}
      </div>
    </div>
  );
}

function DocRow({ doc, onView }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.grayLight}` }}>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</div></div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: doc.valid ? C.greenBg : C.redBg, color: doc.valid ? C.green : C.red }}>{doc.valid ? "✓" : "✕"}</span>
        {doc.scan && <button onClick={() => onView(doc.name)} style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${C.grayBorder}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.primary }}>👁</button>}
      </div>
    </div>
  );
}

function ScanModal({ name, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 16, padding: 20, width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div><button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: C.grayLight, cursor: "pointer", fontSize: 14, color: C.textSec }}>✕</button></div>
        <div style={{ background: C.grayLight, borderRadius: 12, height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray, flexDirection: "column", gap: 8 }}><span style={{ fontSize: 40 }}>📄</span>Скан документа</div>
      </div>
    </div>
  );
}

function Header({ title, sub, onBack }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span onClick={onBack} style={{ color: C.white, fontSize: 13, cursor: "pointer" }}>← Назад</span>
      <div style={{ textAlign: "center" }}><div style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{title}</div>{sub && <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11 }}>{sub}</div>}</div>
      <div style={{ width: 40 }} />
    </div>
  );
}

function StatusBadge({ status }) {
  const m = { draft: { l: "Черновик", bg: C.draftBg, c: C.draft }, active: { l: "Активный", bg: C.amberBg, c: C.amber }, completed: { l: "Завершён", bg: C.greenBg, c: C.green } };
  const s = m[status]; return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: s.bg, color: s.c }}>{s.l}</span>;
}

function SourceCard({ system, number, status }) {
  const ok = ["Подтверждено", "Выдан", "В пути"].includes(status);
  return (
    <div style={{ background: C.grayLight, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontSize: 12, fontWeight: 600 }}>{system}</div><span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 12, background: ok ? C.greenBg : C.amberBg, color: ok ? C.green : C.amber }}>{status}</span></div>
      <div style={{ fontSize: 11, color: C.textSec, fontFamily: "monospace", marginTop: 3 }}>{number}</div>
    </div>
  );
}

function DocsTabs({ tab, setTab, setVd }) {
  const md = [...driverDocs, ...cargoDocs].filter(x => !x.valid).length;
  if (tab === "cargo") return (
    <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Груз</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[{ l: "Вес", v: "18 500 кг" }, { l: "Мест", v: 43 }, { l: "Кол-во", v: 1 }, { l: "Стоимость", v: "$98 000" }].map(c => (
          <div key={c.l}><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase", marginBottom: 2 }}>{c.l}</div><div style={{ fontSize: 16, fontWeight: 700 }}>{c.v}</div></div>
        ))}
      </div>
    </div>
  );
  if (tab === "docs") return (
    <>
      <div style={{ background: C.white, borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>🚛 Водитель и ТС</div>
        {driverDocs.map((d, i) => <DocRow key={i} doc={d} onView={setVd} />)}
      </div>
      <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📦 Груз</div>
        {cargoDocs.map((d, i) => <DocRow key={i} doc={d} onView={setVd} />)}
      </div>
    </>
  );
  return null;
}

function TabBar({ tab, setTab }) {
  const md = [...driverDocs, ...cargoDocs].filter(x => !x.valid).length;
  return (
    <div style={{ display: "flex", margin: "10px 12px 0", borderRadius: 10, overflow: "hidden", border: `1px solid ${C.grayBorder}`, background: C.white }}>
      {[{ k: "status", l: "Статусы" }, { k: "cargo", l: "Груз" }, { k: "docs", l: "Документы", b: md }].map(t => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{ flex: 1, padding: "9px 0", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: tab === t.k ? C.primary : C.white, color: tab === t.k ? C.white : C.textSec, fontFamily: "inherit" }}>
          {t.l}{t.b > 0 && <span style={{ marginLeft: 3, fontSize: 9, fontWeight: 700, background: tab === t.k ? C.red : C.redBg, color: tab === t.k ? C.white : C.red, borderRadius: 10, padding: "1px 5px" }}>{t.b}</span>}
        </button>
      ))}
    </div>
  );
}

// ═══ EXIT ACTIVE ═══
function ExitActiveScreen({ card, onBack, onComplete }) {
  const et = card.exitType || "empty";
  const [hasExpDT, setHasExpDT] = useState(et === "export");
  const steps = getExitSteps(et === "transit" ? "transit" : hasExpDT ? "export" : "empty");
  const [cs, setCs] = useState(0);
  const [tab, setTab] = useState("status");
  const [vd, setVd] = useState(null);
  const total = steps.length, allDone = cs >= total;
  const getOv = () => { if (cs === 0) return { l: "Ожидание прибытия", bg: C.gray, i: "⏳" }; if (allDone) return { l: "Завершён — выезд из РК", bg: C.green, i: "✓" }; return { l: "В процессе прохождения границы", bg: C.amber, i: "⟳" }; };
  const ov = getOv();
  const rev = [...steps].reverse();
  const bi = [];
  if (card.draftData?.queue) bi.push(card.draftData.queue);
  if (card.draftData?.ibr) bi.push(card.draftData.ibr);
  if (card.draftData?.transit) bi.push({ system: `Транзит (${card.draftData.transit.origin})`, number: card.draftData.transit.number, status: card.draftData.transit.status });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {vd && <ScanModal name={vd} onClose={() => setVd(null)} />}
      <Header title="ЦПП — Выезд из РК" sub={card.scenarioLabel} onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}><button style={{ width: "100%", padding: 14, background: C.white, border: `2px solid ${C.primary}`, borderRadius: 12, color: C.primary, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⊞ QR рейса</button></div>
      <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}><StatusBadge status={allDone ? "completed" : "active"} /><span style={{ fontSize: 10, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: "2px 8px", borderRadius: 6 }}>{card.type}</span></div>
        <div style={{ fontSize: 12, marginBottom: 6 }}>{card.from} → {card.to}</div>
        {bi.length > 0 && <div style={{ marginBottom: 6 }}><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase", marginBottom: 4 }}>На основе</div>{bi.map((b, i) => <SourceCard key={i} {...b} />)}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>ГРНЗ</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{card.plate}</div></div>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>Водитель</div><div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div></div>
        </div>
      </div>
      <div style={{ margin: "10px 12px 0", background: ov.bg, color: C.white, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{ov.i}</div><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{ov.l}</div></div>
      <TabBar tab={tab} setTab={setTab} />
      <div style={{ padding: "10px 12px 120px" }}>
        {tab === "status" && (
          <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.grayLight}` }}>
              <Ring passed={cs} total={total} size={46} /><div><div style={{ fontSize: 12, fontWeight: 700 }}>Прогресс выезда</div><div style={{ fontSize: 11, color: C.gray }}>{cs} из {total}</div></div>
            </div>
            {et === "empty" && !hasExpDT && cs >= 5 && <button onClick={() => setHasExpDT(true)} style={{ width: "100%", padding: "8px", background: C.amberBg, border: `1px dashed ${C.amber}`, borderRadius: 8, color: C.amber, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>⚡ Экспортная ДТ подтянулась из Кедена</button>}
            {rev.map((step, i) => { const idx = total - 1 - i; return <ExitStepRow key={step.id} step={step} status={stepSt(idx, cs)} isLast={i === rev.length - 1} />; })}
          </div>
        )}
        <DocsTabs tab={tab} setTab={setTab} setVd={setVd} />
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: C.white, borderTop: `1px solid ${C.grayBorder}`, padding: "10px 12px", display: "flex", gap: 8, boxShadow: "0 -2px 10px rgba(0,0,0,.06)" }}>
        <button onClick={() => setCs(0)} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.grayBorder}`, background: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: C.textSec }}>⟲</button>
        <button onClick={() => { if (cs < total) { setCs(s => s + 1); if (cs + 1 >= total) onComplete?.(); } }} disabled={allDone} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: allDone ? C.green : C.primary, color: C.white, fontSize: 12, fontWeight: 700, cursor: allDone ? "default" : "pointer", fontFamily: "inherit" }}>{allDone ? "✓ Завершён" : `→ ${steps[cs]?.label.slice(0, 26)}…`}</button>
      </div>
    </div>
  );
}

// ═══ ENTRY PI ACTIVE ═══
function EntryPIScreen({ card, onBack, onComplete }) {
  const piCount = card.piCount || 7;
  const PIS = Array.from({ length: piCount }, (_, i) => ({ id: i, regNumber: `KZ/060426/${String(1265 + i).padStart(9, "0")}`, label: `ПИ №${i + 1}` }));
  const TOTAL_ALL = TOTAL_SHARED + TOTAL_PER * PIS.length;
  const initPi = {}; PIS.forEach(p => { initPi[p.id] = 0; });
  const [sh, setSh] = useState(0), [piS, setPiS] = useState(initPi), [selPi, setSelPi] = useState(0), [tab, setTab] = useState("status"), [vd, setVd] = useState(null);
  const pp = piS[selPi] || 0;
  const cntP = () => { let c = Math.min(sh, TOTAL_SHARED); PIS.forEach(p => { c += Math.min(piS[p.id] || 0, TOTAL_PER); }); return c; };
  const tp = cntP(), allDone = tp >= TOTAL_ALL;
  const getOv = () => { if (sh === 0) return { l: "Ожидание прибытия", bg: C.gray, i: "⏳" }; if (allDone) return { l: "Пропуск разрешён", bg: C.green, i: "✓" }; return { l: "В процессе прохождения границы", bg: C.amber, i: "⟳" }; };
  const ov = getOv();
  const multiPi = piCount > 1;

  const allSt = [];
  ENTRY_SHARED_BEFORE.forEach((s, i) => allSt.push({ l: s.label, sh: true, gs: () => stepSt(i, sh) }));
  ENTRY_PER_PI.forEach((s, i) => { const can = sh >= ENTRY_SHARED_BEFORE.length; allSt.push({ l: s.label, sh: false, gs: () => can ? stepSt(i, pp) : "pending" }); });
  ENTRY_SHARED_AFTER.forEach((s, i) => { const ap = PIS.every(p => piS[p.id] >= TOTAL_PER), bd = sh >= ENTRY_SHARED_BEFORE.length; allSt.push({ l: s.label, sh: true, gs: () => (!bd || !ap) ? "pending" : stepSt(ENTRY_SHARED_BEFORE.length + i, sh) }); });
  const rev = [...allSt].reverse();

  const adv = () => {
    if (sh < ENTRY_SHARED_BEFORE.length) { setSh(s => s + 1); return; }
    if (pp < TOTAL_PER) { setPiS(p => ({ ...p, [selPi]: p[selPi] + 1 })); return; }
    if (PIS.every(p => piS[p.id] >= TOTAL_PER) && sh < TOTAL_SHARED) { setSh(s => s + 1); if (sh + 1 >= TOTAL_SHARED) onComplete?.(); }
  };
  const nl = () => { if (sh < ENTRY_SHARED_BEFORE.length) return ENTRY_SHARED_BEFORE[sh].label; if (pp < TOTAL_PER) return `${multiPi ? `[${PIS[selPi].label}] ` : ""}${ENTRY_PER_PI[pp].label}`; if (PIS.every(p => piS[p.id] >= TOTAL_PER) && sh < TOTAL_SHARED) return ENTRY_SHARED_AFTER[0].label; return null; };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {vd && <ScanModal name={vd} onClose={() => setVd(null)} />}
      <Header title="ЦПП — Въезд в РК" sub={`${piCount} ПИ`} onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}><button style={{ width: "100%", padding: 14, background: C.white, border: `2px solid ${C.primary}`, borderRadius: 12, color: C.primary, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⊞ QR рейса</button></div>
      <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}><StatusBadge status={allDone ? "completed" : "active"} /><span style={{ fontSize: 10, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: "2px 8px", borderRadius: 6 }}>Въезд по ПИ</span></div>
        <div style={{ fontSize: 12, marginBottom: 6 }}>{card.from} → {card.to}</div>
        {multiPi && <HScroll>{PIS.map(pi => <span key={pi.id} style={{ fontSize: 10, color: C.textSec, background: C.grayLight, padding: "3px 8px", borderRadius: 6, fontFamily: "monospace", whiteSpace: "nowrap", flexShrink: 0 }}>{pi.regNumber}</span>)}</HScroll>}
        {!multiPi && <div style={{ fontSize: 11, color: C.textSec, fontFamily: "monospace" }}>{PIS[0].regNumber}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", marginTop: 8 }}>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>ГРНЗ</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{card.plate}</div></div>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>Водитель</div><div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div></div>
        </div>
      </div>
      <div style={{ margin: "10px 12px 0", background: ov.bg, color: C.white, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{ov.i}</div><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{ov.l}</div></div>
      <TabBar tab={tab} setTab={setTab} />
      <div style={{ padding: "10px 12px 110px" }}>
        {tab === "status" && (
          <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.grayLight}` }}>
              <Ring passed={tp} total={TOTAL_ALL} size={46} /><div><div style={{ fontSize: 12, fontWeight: 700 }}>Общий прогресс</div><div style={{ fontSize: 11, color: C.gray }}>{tp} из {TOTAL_ALL}{multiPi ? ` · ${piCount} ПИ` : ""}</div></div>
            </div>
            {multiPi && <>
              <div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase", marginBottom: 6 }}>ПИ</div>
              <HScroll>{PIS.map(pi => <button key={pi.id} onClick={() => setSelPi(pi.id)} style={{ padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: selPi === pi.id ? C.primary : C.grayLight, color: selPi === pi.id ? C.white : C.textSec, fontFamily: "inherit", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>{pi.label}<span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 6, background: piS[pi.id] >= TOTAL_PER ? (selPi === pi.id ? "rgba(255,255,255,.25)" : C.greenBg) : (selPi === pi.id ? "rgba(255,255,255,.15)" : C.grayBorder), color: piS[pi.id] >= TOTAL_PER ? (selPi === pi.id ? C.white : C.green) : (selPi === pi.id ? "rgba(255,255,255,.7)" : C.gray) }}>{piS[pi.id]}/{TOTAL_PER}</span></button>)}</HScroll>
            </>}
            <div style={{ marginTop: 14 }}>{rev.map((s, i) => <EntryStepRow key={i} label={s.l} status={s.gs()} isLast={i === rev.length - 1} sub={s.sh && multiPi ? "Общий этап" : null} />)}</div>
          </div>
        )}
        <DocsTabs tab={tab} setTab={setTab} setVd={setVd} />
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: C.white, borderTop: `1px solid ${C.grayBorder}`, padding: "10px 12px", display: "flex", gap: 8, boxShadow: "0 -2px 10px rgba(0,0,0,.06)" }}>
        <button onClick={() => { setSh(0); const r = {}; PIS.forEach(p => { r[p.id] = 0; }); setPiS(r); }} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.grayBorder}`, background: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: C.textSec }}>⟲</button>
        <button onClick={adv} disabled={allDone} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: allDone ? C.green : C.primary, color: C.white, fontSize: 12, fontWeight: 700, cursor: allDone ? "default" : "pointer", fontFamily: "inherit" }}>{allDone ? "✓ Пропуск разрешён" : `→ ${(nl() || "").slice(0, 26)}…`}</button>
      </div>
    </div>
  );
}

// ═══ ENTRY IM/EMPTY ACTIVE ═══
function EntryIMScreen({ card, onBack, onComplete }) {
  const [dtStatus, setDtStatus] = useState("unknown"); // "unknown" | "empty" | "import"
  const steps = getEntryIMSteps(dtStatus);
  const [cs, setCs] = useState(0);
  const [tab, setTab] = useState("status");
  const [vd, setVd] = useState(null);
  const total = steps.length, allDone = cs >= total;
  const getOv = () => { if (cs === 0) return { l: "Ожидание прибытия", bg: C.gray, i: "⏳" }; if (allDone) return { l: "Пропуск разрешён", bg: C.green, i: "✓" }; return { l: "В процессе прохождения границы", bg: C.amber, i: "⟳" }; };
  const ov = getOv();
  const rev = [...steps].reverse();

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      {vd && <ScanModal name={vd} onClose={() => setVd(null)} />}
      <Header title="ЦПП — Въезд в РК" sub="ИМ / Порожний" onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}><button style={{ width: "100%", padding: 14, background: C.white, border: `2px solid ${C.primary}`, borderRadius: 12, color: C.primary, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⊞ QR рейса</button></div>
      <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}><StatusBadge status={allDone ? "completed" : "active"} /><span style={{ fontSize: 10, fontWeight: 600, color: C.amber, background: C.amberBg, padding: "2px 8px", borderRadius: 6 }}>{dtStatus === "import" ? "Импорт (ДТ)" : dtStatus === "empty" ? "Порожний" : "Тип не определён"}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>ГРНЗ</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{card.plate}</div></div>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>Водитель</div><div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div></div>
        </div>
      </div>
      <div style={{ margin: "10px 12px 0", background: ov.bg, color: C.white, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{ov.i}</div><div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{ov.l}</div></div>
      <TabBar tab={tab} setTab={setTab} />
      <div style={{ padding: "10px 12px 120px" }}>
        {tab === "status" && (
          <div style={{ background: C.white, borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.grayLight}` }}>
              <Ring passed={cs} total={total} size={46} /><div><div style={{ fontSize: 12, fontWeight: 700 }}>Прогресс</div><div style={{ fontSize: 11, color: C.gray }}>{cs} из {total}</div></div>
            </div>
            {/* Demo triggers */}
            {dtStatus === "unknown" && cs >= 3 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button onClick={() => setDtStatus("empty")} style={{ flex: 1, padding: "8px", background: C.greenBg, border: `1px dashed ${C.green}`, borderRadius: 8, color: C.green, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🔔 СИК: Порожний</button>
                <button onClick={() => setDtStatus("import")} style={{ flex: 1, padding: "8px", background: C.amberBg, border: `1px dashed ${C.amber}`, borderRadius: 8, color: C.amber, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>🔔 Кеден: ДТ Импорт</button>
              </div>
            )}
            {rev.map((step, i) => {
              const idx = total - 1 - i;
              const isDashed = step.type === "undetermined";
              return <EntryStepRow key={step.id} label={step.label} status={stepSt(idx, cs)} isLast={i === rev.length - 1} isDashed={isDashed} subLabel={step.subLabel} isCustoms={step.isCustoms} />;
            })}
          </div>
        )}
        <DocsTabs tab={tab} setTab={setTab} setVd={setVd} />
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: C.white, borderTop: `1px solid ${C.grayBorder}`, padding: "10px 12px", display: "flex", gap: 8, boxShadow: "0 -2px 10px rgba(0,0,0,.06)" }}>
        <button onClick={() => { setCs(0); setDtStatus("unknown"); }} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.grayBorder}`, background: C.white, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", color: C.textSec }}>⟲</button>
        <button onClick={() => { if (cs < total) { setCs(s => s + 1); if (cs + 1 >= total) onComplete?.(); } }} disabled={allDone} style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", background: allDone ? C.green : C.primary, color: C.white, fontSize: 12, fontWeight: 700, cursor: allDone ? "default" : "pointer", fontFamily: "inherit" }}>{allDone ? "✓ Пропуск разрешён" : `→ ${steps[cs]?.label.slice(0, 26)}…`}</button>
      </div>
    </div>
  );
}

// ═══ DRAFT ═══
function DraftScreen({ card, onBack }) {
  const dd = card.draftData, hasPis = card.scenario === "draft_entry_pi" && card.pis;
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header title="ЦПП — Черновик" sub={card.scenarioLabel} onBack={onBack} />
      <div style={{ padding: "8px 12px 0" }}><button style={{ width: "100%", padding: 14, background: C.white, border: `2px dashed ${C.draft}`, borderRadius: 12, color: C.draft, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⊞ QR Draft</button></div>
      <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}><StatusBadge status="draft" /><span style={{ fontSize: 10, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: "2px 8px", borderRadius: 6 }}>{card.type}</span></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px" }}>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>ГРНЗ</div><div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{card.plate}</div></div>
          <div><div style={{ fontSize: 10, color: C.gray, textTransform: "uppercase" }}>Водитель</div><div style={{ fontSize: 14, fontWeight: 700 }}>{card.driver}</div></div>
        </div>
        {hasPis && <div style={{ marginTop: 8 }}>{card.pis.map((pi, i) => <div key={i} style={{ background: C.transitBg, borderRadius: 8, padding: "8px 10px", marginBottom: 4 }}><div style={{ fontSize: 12, fontWeight: 700, color: C.transit }}>{pi.id}</div><div style={{ fontSize: 10, color: C.textSec }}>{pi.desc}</div></div>)}</div>}
      </div>
      {(dd?.queue || dd?.ibr || dd?.transit) && <div style={{ margin: "10px 12px 0", background: C.white, borderRadius: 14, padding: "14px 16px" }}><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Сведения</div>{dd?.queue && <SourceCard {...dd.queue} />}{dd?.ibr && <SourceCard {...dd.ibr} />}{dd?.transit && <SourceCard system="Транзит" number={dd.transit.number} status={dd.transit.status} />}</div>}
      <div style={{ margin: "10px 12px", background: C.draftBg, borderRadius: 12, padding: "12px 16px" }}><div style={{ fontSize: 12, color: C.draft, lineHeight: 1.5 }}>ℹ После въезда на пост ЦПП станет активным.</div></div>
    </div>
  );
}

// ═══ WIZARD ═══
function CreateWizard({ onDone, onBack }) {
  const [step, setStep] = useState(0);
  const [plate, setPlate] = useState(""), [hasT, setHasT] = useState(false), [trailer, setTrailer] = useState("");
  const [dT, setDT] = useState("iin"), [dV, setDV] = useState("");
  const [dir, setDir] = useState(null), [sub, setSub] = useState(null);
  const [sP, setSP] = useState([]), [sTD, setSTD] = useState(null), [sQ, setSQ] = useState(null);

  function finish(st) {
    const s = st || sub;
    let sc, sl, ba, dd, pis, type, to, from, eT;
    if (dir === "in") {
      from = "Третья страна"; to = "—"; type = "Въезд в Республику Казахстан";
      if (s === "pi") { sc = "draft_entry_pi"; sl = "Въезд по ПИ"; ba = `${sP.length} ПИ`; pis = sP.map(i => mockPIs[i]); }
      else if (s === "import") { sc = "draft_entry_no_pi"; sl = "Въезд (импорт)"; }
      else { sc = "draft_entry_no_pi"; sl = "Въезд (порожний)"; }
    } else {
      from = "Казахстан"; to = "—"; type = "Выезд из Республики Казахстан";
      const q = mockQueues[sQ] || mockQueues[0];
      const qData = { system: "Cargo Ruqsat", number: q.id, status: "Подтверждено" };
      const ib = { system: "Cargo Alem", number: `IBR-${Math.floor(Math.random() * 99999)}`, status: "Выдан" };
      if (s === "empty_out") { sc = "draft_exit_export"; sl = "Выезд (порожний)"; ba = "Очередь + ИБР"; dd = { queue: qData, ibr: ib }; eT = "empty"; }
      else if (s === "export") { sc = "draft_exit_export"; sl = "Выезд (экспорт)"; ba = "Очередь + ИБР"; dd = { queue: qData, ibr: ib }; eT = "export"; }
      else { const td = mockTransits[sTD || 0]; sc = "draft_exit_transit"; sl = "Завершение транзита"; ba = "Очередь + ИБР + ТД"; dd = { queue: qData, ibr: ib, transit: { number: td.id, origin: "Кеден", status: td.status } }; eT = "transit"; }
    }
    onDone({ id: `n_${Date.now()}`, status: "draft", plate: plate.toUpperCase(), driver: dT === "iin" ? `ИИН: ${dV}` : `Пасп: ${dV}`, type, customsPost: "ТП «Нұр жолы»", from, to, basis: ba, scenario: sc, scenarioLabel: sl, draftData: dd, pis, direction: dir, exitType: eT });
  }

  const inp = { width: "100%", padding: "10px 14px", border: `2px solid ${C.grayBorder}`, borderRadius: 10, fontSize: 15, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", outline: "none", fontFamily: "inherit" };
  const dots = [0, 1, 2, 3, 4, 5]; const activeD = Math.min(step, 5);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header title="Создание ЦПП" sub={`Шаг ${activeD + 1}`} onBack={step === 0 ? onBack : () => setStep(s => s - 1)} />
      <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 0" }}>{dots.map(d => <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: d < activeD ? C.green : d === activeD ? C.primary : C.grayBorder }} />)}</div>
      <div style={{ padding: "0 12px 32px" }}>
        {/* Step 0: Vehicle */}
        {step === 0 && <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>🚛 ТС</div>
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: "uppercase", display: "block", marginBottom: 4 }}>ГРНЗ</label><input value={plate} onChange={e => setPlate(e.target.value)} placeholder="123ABC02" maxLength={12} style={inp} /></div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}><input type="checkbox" checked={hasT} onChange={e => setHasT(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.primary }} /><span>Прицеп</span></label>
          {hasT && <div style={{ marginBottom: 8 }}><input value={trailer} onChange={e => setTrailer(e.target.value)} placeholder="ГРНЗ прицепа" style={inp} /></div>}
          <button onClick={() => plate.trim() && setStep(1)} disabled={!plate.trim()} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: plate.trim() ? C.primary : C.grayBorder, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Далее →</button>
        </div>}
        {/* Step 1: Driver */}
        {step === 1 && <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>{["iin", "passport"].map(t => <button key={t} onClick={() => setDT(t)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", background: dT === t ? C.primary : C.grayLight, color: dT === t ? C.white : C.textSec, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{t === "iin" ? "ИИН" : "Паспорт"}</button>)}</div>
          <div style={{ marginBottom: 14 }}><input value={dV} onChange={e => setDV(e.target.value)} placeholder={dT === "iin" ? "12 цифр" : "Паспорт"} maxLength={20} style={inp} /></div>
          <button onClick={() => dV.trim() && setStep(2)} disabled={!dV.trim()} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: dV.trim() ? C.primary : C.grayBorder, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Далее →</button>
        </div>}
        {/* Step 2: Direction */}
        {step === 2 && <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>Направление</div>
          {[{ k: "in", i: "🇰🇿 ←", t: "Въезд в РК" }, { k: "out", i: "🇰🇿 →", t: "Выезд из РК" }].map(x => <button key={x.k} onClick={() => { setDir(x.k); setStep(x.k === "out" ? 3 : 4); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: 16, border: `2px solid ${C.grayBorder}`, borderRadius: 12, background: C.white, cursor: "pointer", marginBottom: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 700 }}><span style={{ fontSize: 24 }}>{x.i}</span>{x.t}</button>)}
        </div>}
        {/* Step 3: Queue selection (exit only) */}
        {step === 3 && <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 6 }}>Электронная очередь</div>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 12 }}>Выберите очередь из Cargo Ruqsat:</div>
          {mockQueues.map((q, i) => <button key={i} onClick={() => setSQ(i)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: 12, border: `2px solid ${sQ === i ? C.primary : C.grayBorder}`, borderRadius: 10, background: sQ === i ? C.primaryLight : C.white, cursor: "pointer", marginBottom: 8, fontFamily: "inherit", textAlign: "left" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${sQ === i ? C.primary : C.grayBorder}`, background: sQ === i ? C.primary : "transparent", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>{q.id}</div>
              <div style={{ fontSize: 11, color: C.textSec }}>{q.dest} · {q.date} · {q.slot}</div>
            </div>
          </button>)}
          <button onClick={() => sQ !== null && setStep(4)} disabled={sQ === null} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: sQ !== null ? C.primary : C.grayBorder, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "inherit", marginTop: 4 }}>Далее →</button>
        </div>}
        {/* Step 4: Subtype */}
        {step === 4 && <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: "uppercase", marginBottom: 14 }}>{dir === "in" ? "Тип въезда" : "Тип выезда"}</div>
          {(dir === "in" ? [
            { k: "pi", t: "Транзит (ПИ)", i: "📋" }, { k: "import", t: "Импорт (ДТ)", i: "📥" }, { k: "empty_in", t: "Порожний", i: "📦" },
          ] : [
            { k: "empty_out", t: "Порожний", i: "📦" }, { k: "export", t: "Экспорт (ДТ)", i: "📤" }, { k: "transit_complete", t: "Завершение транзита", i: "🔄" },
          ]).map(x => <button key={x.k} onClick={() => { setSub(x.k); if (x.k === "pi" || x.k === "transit_complete") setStep(5); else finish(x.k); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: 14, border: `2px solid ${C.grayBorder}`, borderRadius: 12, background: C.white, cursor: "pointer", marginBottom: 8, fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}><span style={{ fontSize: 18 }}>{x.i}</span>{x.t}</button>)}
        </div>}
        {/* Step 5: PI or TD selection */}
        {step === 5 && <div style={{ background: C.white, borderRadius: 14, padding: 18 }}>
          {sub === "pi" ? <>
            {mockPIs.map((pi, i) => <button key={i} onClick={() => setSP(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i])} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: 12, border: `2px solid ${sP.includes(i) ? C.transit : C.grayBorder}`, borderRadius: 10, background: sP.includes(i) ? C.transitBg : C.white, cursor: "pointer", marginBottom: 8, fontFamily: "inherit" }}><input type="checkbox" checked={sP.includes(i)} readOnly style={{ width: 16, height: 16, accentColor: C.transit }} /><div style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{pi.id} — {pi.desc}</div></button>)}
            <button onClick={() => sP.length && finish("pi")} disabled={!sP.length} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: sP.length ? C.transit : C.grayBorder, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Подтвердить ({sP.length})</button>
          </> : <>
            {mockTransits.map((td, i) => <button key={i} onClick={() => setSTD(i)} style={{ width: "100%", padding: 12, border: `2px solid ${sTD === i ? C.transit : C.grayBorder}`, borderRadius: 10, background: sTD === i ? C.transitBg : C.white, cursor: "pointer", marginBottom: 8, fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{td.id} — {td.desc}</button>)}
            <button onClick={() => sTD !== null && finish("transit_complete")} disabled={sTD === null} style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: sTD !== null ? C.transit : C.grayBorder, color: C.white, fontSize: 14, fontWeight: 700, fontFamily: "inherit" }}>Подтвердить</button>
          </>}
        </div>}
      </div>
    </div>
  );
}

// ═══ MENU ═══
function MenuScreen({ cards, onSelect, onCreate, onActivate, onDelete }) {
  const active = cards.find(c => c.status === "active");
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)`, padding: 16, color: C.white }}><div style={{ fontSize: 16, fontWeight: 700 }}>SmartCargo</div><div style={{ fontSize: 12, opacity: .7 }}>Цифровой паспорт перевозки</div></div>
      <div style={{ padding: "10px 12px" }}>
        {active && <button onClick={() => onSelect(active.id)} style={{ width: "100%", padding: 12, background: C.primary, border: "none", borderRadius: 12, color: C.white, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10 }}>⟳ Активный · {active.plate}</button>}
        <button onClick={onCreate} style={{ width: "100%", padding: 12, background: C.white, border: `2px dashed ${C.primary}`, borderRadius: 12, color: C.primary, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12 }}>＋ Создать ЦПП</button>
        <div style={{ fontSize: 11, color: C.textSec, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Все ЦПП ({cards.length})</div>
        {cards.map(c => (
          <div key={c.id} style={{ background: C.white, borderRadius: 14, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,.04)", borderLeft: `4px solid ${c.status === "active" ? C.primary : c.status === "draft" ? C.draft : C.green}` }}>
            <div onClick={() => onSelect(c.id)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 15, fontWeight: 700 }}>{c.plate}</span><StatusBadge status={c.status} /></div>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>{c.driver}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: C.primary, background: C.primaryLight, padding: "1px 5px", borderRadius: 4, display: "inline-block" }}>{c.type}</div>
              {c.scenarioLabel && <div style={{ fontSize: 10, color: C.draft, marginTop: 2, fontWeight: 600 }}>{c.scenarioLabel}</div>}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, borderTop: `1px solid ${C.grayLight}`, paddingTop: 8 }}>
              {c.status === "draft" && <button onClick={() => onActivate(c.id)} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", background: C.greenBg, color: C.green, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>▶ Активировать</button>}
              <button onClick={() => onDelete(c.id)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: C.redBg, color: C.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", ...(c.status !== "draft" ? { flex: 1 } : {}) }}>🗑 Удалить</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ MAIN ═══
export default function App() {
  const [screen, setScreen] = useState("menu");
  const [selId, setSelId] = useState(null);
  const [cards, setCards] = useState(initialCards);

  const openCard = (id) => { setSelId(id); setScreen("detail"); };
  const goMenu = () => { setScreen("menu"); setSelId(null); };
  const activateCard = (id) => { setCards(prev => prev.map(c => c.id === id ? { ...c, status: "active" } : c)); };
  const deleteCard = (id) => { setCards(prev => prev.filter(c => c.id !== id)); };
  const completeCard = (id) => { setCards(prev => prev.map(c => c.id === id ? { ...c, status: "completed" } : c)); };

  if (screen === "create") return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <CreateWizard onDone={(c) => { setCards(p => [...p, c]); goMenu(); }} onBack={goMenu} />
    </div>
  );

  if (screen === "menu") return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <MenuScreen cards={cards} onSelect={openCard} onCreate={() => setScreen("create")} onActivate={activateCard} onDelete={deleteCard} />
    </div>
  );

  const card = cards.find(c => c.id === selId);
  if (!card) { goMenu(); return null; }

  if (card.status === "draft") return <div style={{ maxWidth: 420, margin: "0 auto" }}><DraftScreen card={card} onBack={goMenu} /></div>;

  const isExit = card.direction === "out" || card.scenario?.includes("exit");
  const isIMEmpty = card.scenario === "entry_im_empty";

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {isExit ? <ExitActiveScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
        : isIMEmpty ? <EntryIMScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />
        : <EntryPIScreen card={card} onBack={goMenu} onComplete={() => completeCard(card.id)} />}
    </div>
  );
}
```
