import type { DTStatus, EntryIMStep, StepType } from "../types";

export const ENTRY_SHARED_BEFORE = [
  { id: "s1", label: "Предварительная подготовка ЦПП" },
  { id: "s2", label: "Въезд в территорию пограничного поста в сторону РК" },
  { id: "s3", label: "Паспортный контроль" },
  { id: "s3b", label: "Регистрация прибытия ТС в зону таможенного контроля" },
  { id: "s4", label: "Досмотр ТС пограничной службой" },
];

export const ENTRY_PER_PI = [
  { id: "p2", label: "ИДК и контроль снимка" },
  { id: "p1", label: "Таможенный осмотр" },
  { id: "p3", label: "Транспортный контроль" },
  { id: "p4", label: "Ветеринарный контроль" },
  { id: "p5", label: "Фито-санитарный контроль" },
  { id: "p6", label: "Санитарный контроль" },
  { id: "p7", label: "Транзитная декларация" },
];

export const ENTRY_SHARED_AFTER = [
  { id: "s5", label: "Выезд с территории пограничного поста в сторону РК" },
];

export const TOTAL_SHARED = ENTRY_SHARED_BEFORE.length + ENTRY_SHARED_AFTER.length;
export const TOTAL_PER = ENTRY_PER_PI.length;

export function getEntryIMSteps(dtStatus: DTStatus): EntryIMStep[] {
  const cond: StepType =
    dtStatus === "import" ? "mandatory" : dtStatus === "empty" ? "hidden" : "undetermined";
  const base: EntryIMStep[] = [
    { id: "im1", label: "Предварительная подготовка ЦПП", type: "active" },
    { id: "im2", label: "Въезд в территорию пограничного поста в сторону РК", type: "active" },
    { id: "im3", label: "Регистрация АТС в СИК", type: "active" },
    { id: "im4", label: "Паспортный контроль", type: "mandatory" },
    { id: "im4b", label: "Регистрация прибытия ТС в зону таможенного контроля", type: "mandatory" },
    { id: "im5", label: "Досмотр ТС пограничной службой", type: "mandatory" },
  ];
  const conditional: EntryIMStep[] =
    cond !== "hidden"
      ? [
          { id: "im7", label: "ИДК и контроль снимка", type: "mandatory" },
          { id: "im6", label: "Таможенный осмотр", type: cond },
          { id: "im8", label: "Транспортный контроль", type: cond },
          { id: "im9", label: "Ветеринарный контроль", type: cond },
          { id: "im10", label: "Фито-санитарный контроль", type: cond },
          { id: "im11", label: "Санитарный контроль", type: cond },
          {
            id: "im12",
            label: "Таможенный контроль",
            type: cond,
            subLabel: "Декларация на товары (импорт)",
            isCustoms: true,
          },
        ]
      : [{ id: "im7", label: "ИДК и контроль снимка", type: "mandatory" }];
  const final: EntryIMStep[] = [
    { id: "im13", label: "Выезд с территории пограничного поста в сторону РК", type: "mandatory" },
  ];
  return [...base, ...conditional, ...final];
}
