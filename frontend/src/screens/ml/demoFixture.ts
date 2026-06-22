import type { MLRouteSheet } from "./types";

export const DEMO_FIXTURE: MLRouteSheet = {
  lookupCode: "055131",
  serialNumber: "39857505/20260622/5",
  status: "ISSUED",
  statusDisplay: "Выписан",
  isValidForExit: true,
  validationMessage: null,
  isOverdue: false,
  issuedAt: "2026-06-22T10:15:00Z",
  expiresAt: "2026-06-22T11:15:00Z",
  arrivalDeadlineMinutes: 60,
  uved: {
    iinBin: "022041412441",
    companyName: "ТОО «Имя компании»",
    fullName: "Иванов И.И.",
  },
  invoiceInfo:
    "Invoice № INV-2026-0517 от 22.05.2026; Спецификация № SP-2026-0517-A. Груз: автомобильные комплектующие, 12 паллет, нетто 4 320 кг.",
  grnz: "412 ABC 02",
  grnzTrailer: "AB 123 CD",
  vins: ["WAUZZZ4H1JD012345"],
  vehicleCount: 1,
  routeType: "TO_SVH",
  destinationSvh: {
    code: "KZ60VSY00001615",
    name: "СВХ ТОО «Digital Silk Road Company»",
  },
  destinationCustomsPostName: null,
  borderPass: {
    status: "NOT_RECORDED",
    statusDisplay: "Ожидает выезда с поста",
    passedAt: null,
    post: null,
    comment: null,
    inspectorFullName: null,
  },
};
