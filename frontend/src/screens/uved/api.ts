import type {
  CreateRouteSheetRequest,
  CreateRouteSheetResponse,
  UvedRouteSheet,
  UvedSvhEntry,
} from "./types";

/**
 * UVED-эндпоинты публичные на стороне Smart ML, но их CORS закрыт для
 * нашего прод-домена. Поэтому фронт ходит через наш серверный прокси
 * на /api/uved/*, а тот форвардит на test-routelist-smartcargo.codecraft.kz.
 */
const BASE = "/api/uved";

export interface FieldError {
  field?: string;
  message: string;
}

export type UvedApiError =
  | { kind: "validation"; status: 400; message: string; fieldErrors: FieldError[] }
  | { kind: "rate_limited"; status: 429; message: string }
  | { kind: "not_found"; status: 404; message: string }
  | { kind: "conflict"; status: 409; message: string }
  | { kind: "profile_incomplete"; status: 422; message: string }
  | { kind: "network"; message: string }
  | { kind: "server"; status: number; message: string };

export interface MyRouteSheetsPage {
  content: UvedRouteSheet[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

async function readBody(r: Response): Promise<any> {
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function classifyError(status: number, body: any): UvedApiError {
  const message =
    (body && typeof body === "object" && (body.message || body.error)) ||
    "Ошибка сервера";
  if (status === 400) {
    const fieldErrors: FieldError[] = Array.isArray(body?.fieldErrors)
      ? body.fieldErrors.map((fe: any) => ({
          field: fe.field || fe.path,
          message: fe.message || fe.defaultMessage || String(fe),
        }))
      : [];
    return { kind: "validation", status: 400, message, fieldErrors };
  }
  if (status === 404) return { kind: "not_found", status: 404, message };
  if (status === 409) return { kind: "conflict", status: 409, message };
  if (status === 422) return { kind: "profile_incomplete", status: 422, message };
  if (status === 429) return { kind: "rate_limited", status: 429, message };
  return { kind: "server", status, message };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, init);
  } catch {
    throw { kind: "network", message: "Нет связи с системой Smart Cargo ML" } satisfies UvedApiError;
  }
  if (!r.ok) {
    const body = await readBody(r);
    throw classifyError(r.status, body);
  }
  return (await readBody(r)) as T;
}

export async function fetchSvhDictionary(): Promise<UvedSvhEntry[]> {
  const list = await call<UvedSvhEntry[]>("/svh-dictionary");
  return list.filter((s) => s.active !== false);
}

export async function createRouteSheet(
  req: CreateRouteSheetRequest
): Promise<CreateRouteSheetResponse> {
  return await call<CreateRouteSheetResponse>("/route-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(req),
  });
}

export async function getRouteSheetByCode(code: string): Promise<UvedRouteSheet> {
  return await call<UvedRouteSheet>(
    `/route-sheets/by-code/${encodeURIComponent(code)}`
  );
}

/**
 * Список «Мои МЛ» для авторизованного пользователя ЦПП.
 * Идентификация УВЭДа (ИИН/БИН, телефон) берётся на серверном прокси
 * из мок-профиля / сессии — фронт НИЧЕГО про профиль не передаёт.
 */
export async function fetchMyRouteSheets(page = 0): Promise<MyRouteSheetsPage> {
  let r: Response;
  try {
    r = await fetch(`/api/ml/uved/my-route-sheets?page=${encodeURIComponent(String(page))}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw { kind: "network", message: "Нет связи с системой Smart Cargo ML" } satisfies UvedApiError;
  }
  if (!r.ok) {
    const body = await readBody(r);
    throw classifyError(r.status, body);
  }
  return (await readBody(r)) as MyRouteSheetsPage;
}

/**
 * PDF открывается через top-level navigation (window.open) — для navigation
 * браузер не применяет CORS, так что можно идти на тест-стенд напрямую.
 */
export function pdfUrl(code: string): string {
  const upstream =
    (import.meta as any).env?.VITE_SMARTML_BASE ?? "https://test-routelist-smartcargo.codecraft.kz";
  return `${String(upstream).replace(/\/+$/, "")}/api/v1/public/route-sheets/by-code/${encodeURIComponent(code)}/pdf`;
}
