export type UvedStatus =
  | "DRAFT"
  | "ISSUED"
  | "REJECTED"
  | "ARRIVED"
  | "SVH_NUMBER_ASSIGNED"
  | "DXT_ASSIGNED"
  | "DT_TD_FILLED"
  | "COMPLETED"
  | "RELEASE_PARTIAL"
  | "RELEASE_REJECTED"
  | "ARRIVED_AT_POST"
  | string;

export type UvedRouteType = "TO_SVH" | "SVH_TO_SVH" | "TO_CUSTOMS_POST" | string;
export type UvedDestinationCustomsPost = "MCPS_KHORGOS" | "ALTYNKOL" | string;
export type UvedBorderPassStatus = "NOT_RECORDED" | "PASSED" | "NOT_PASSED" | string;

export interface UvedSvhEntry {
  code: string;
  name: string;
  active: boolean;
  groupId?: string | null;
  groupName?: string | null;
}

export interface UvedDestinationSvh {
  code: string | null;
  name: string | null;
}

export interface UvedBorderPass {
  status: UvedBorderPassStatus;
  statusDisplay: string | null;
  passedAt: string | null;
  post: string | null;
  comment: string | null;
  inspectorFullName: string | null;
}

export interface UvedDtTdEntry {
  number: string;
  status: string;
  statusDisplay: string;
}

export interface UvedContacts {
  iinBin: string;
  companyName: string;
  fullName: string;
  phone: string;
}

export interface UvedRouteSheet {
  lookupCode: string;
  serialNumber: string | null;

  status: UvedStatus;
  statusDisplay: string | null;
  rejectionReason: string | null;

  createdAt: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  arrivedAt: string | null;
  isOverdue: boolean;
  arrivalDeadlineMinutes: number | null;

  routeType: UvedRouteType;
  destinationSvh: UvedDestinationSvh | null;
  destinationCustomsPost: UvedDestinationCustomsPost | null;
  destinationCustomsPostName: string | null;

  invoiceInfo: string | null;
  grnz: string | null;
  grnzTrailer: string | null;
  vins: string[];
  vehicleCount: number | null;

  svhAccountingNumber: string | null;
  dxtNumber: string | null;
  dtTdEntries: UvedDtTdEntry[] | null;

  borderPass: UvedBorderPass;

  /** УВЭД-контакты могут вернуться публичным эндпоинтом не всегда (privacy). */
  uved?: UvedContacts | null;
}

export interface CreateRouteSheetRequest {
  uved: UvedContacts;
  invoiceInfo: string;
  grnz?: string | null;
  grnzTrailer?: string | null;
  vins: string[];
  vehicleCount: number;
  destinationSvhCode?: string | null;
  routeType: "TO_SVH" | "TO_CUSTOMS_POST";
  destinationCustomsPost?: UvedDestinationCustomsPost | null;
}

export interface CreateRouteSheetResponse {
  id: string;
  lookupCode: string;
  qrPayload: string;
  status: UvedStatus;
  createdAt: string;
}

/** Что храним в localStorage — только публичные поля, без PII. */
export interface UvedRouteSheetSlim {
  lookupCode: string;
  serialNumber: string | null;
  statusDisplay: string;
  status: UvedStatus;
  destinationName: string;
  createdAt: string;
  grnz: string | null;
  addedAt: string;
}
