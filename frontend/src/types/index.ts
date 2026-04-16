export type CPPStatus = "draft" | "active" | "completed";
export type Direction = "in" | "out";
export type ExitType = "empty" | "export" | "transit";
export type DTStatus = "empty" | "import";
export type StepStatus = "pending" | "current" | "passed";
export type StepType = "active" | "mandatory" | "hidden";

// ТОН (таможенный орган назначения) для транзита по ПИ:
//  - "inland" — ТОН внутри Казахстана (груз едет до внутренней точки)
//  - "border" — ТОН на приграничном пункте пропуска (груз продолжит транзит за границу)
export type TonType = "inland" | "border";

export interface PIItem {
  id: string;
  desc: string;
  weight: string;
  from: string;
}

export interface SourceData {
  system: string;
  number: string;
  status: string;
}

export interface CPPProgress {
  // Entry PI
  shared?: number;
  piSteps?: Record<string, number>;
  selectedPi?: number;
  attachedQueueId?: string;
  transitDeclared?: boolean;
  // Entry IM / Exit
  currentStep?: number;
  // Exit-specific
  hasExpDT?: boolean;
}

export interface CPPCard {
  id: string;
  status: CPPStatus;
  plate: string;
  driver: string;
  type: string;
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
  // Для сценариев въезда по ПИ:
  tonType?: TonType;
  tonName?: string; // напр. "ТП «Алматы-ЦТО»" или "ТП «Қорғас-авто»"
  draftData?: {
    queue?: SourceData;
    ibr?: SourceData;
    transit?: { number: string; origin: string; status: string };
  };
  progress?: CPPProgress;
}

export interface ExitStep {
  id: string;
  label: string;
  subs: [string, string];
  isCustoms?: boolean;
}

export interface EntryIMStep {
  id: string;
  label: string;
  type: StepType;
  subLabel?: string;
  isCustoms?: boolean;
}

export interface DocumentItem {
  name: string;
  valid: boolean;
  scan: boolean;
}

export interface QueueItem {
  id: string;
  dest: string;
  date: string;
  slot: string;
}

export interface TransitItem {
  id: string;
  desc: string;
  status: string;
}
