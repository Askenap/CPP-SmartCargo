export type MLStatus = "ISSUED" | "USED" | "EXPIRED" | "CANCELLED" | string;
export type MLRouteType = "TO_SVH" | "SVH_TO_SVH" | "TO_CUSTOMS_POST" | string;
export type MLBorderPassStatus = "NOT_RECORDED" | "PASSED" | "NOT_PASSED" | string;

export interface MLUved {
  iinBin: string | null;
  companyName: string | null;
  fullName: string | null;
}

export interface MLSvh {
  code: string | null;
  name: string | null;
}

export interface MLBorderPass {
  status: MLBorderPassStatus;
  statusDisplay: string | null;
  passedAt: string | null;
  post: string | null;
  comment: string | null;
  inspectorFullName: string | null;
}

export interface MLRouteSheet {
  lookupCode: string;
  serialNumber: string | null;
  status: MLStatus;
  statusDisplay: string | null;
  isValidForExit: boolean;
  validationMessage: string | null;
  isOverdue: boolean;
  issuedAt: string | null;
  expiresAt: string | null;
  arrivalDeadlineMinutes: number | null;
  uved: MLUved | null;
  invoiceInfo: string | null;
  grnz: string | null;
  grnzTrailer: string | null;
  vins: string[];
  vehicleCount: number | null;
  routeType: MLRouteType;
  destinationSvh: MLSvh | null;
  destinationCustomsPostName: string | null;
  borderPass: MLBorderPass;
}

export interface MLBorderPassRequest {
  passed: boolean;
  inspectorFullName?: string | null;
  comment?: string | null;
  passedAt?: string | null;
}

export interface MLBorderPassResponse {
  ok: boolean;
  eventId?: string | number | null;
  borderPass: MLBorderPass;
}
