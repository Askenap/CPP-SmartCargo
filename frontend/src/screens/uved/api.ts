import type {
  CreateRouteSheetRequest,
  CreateRouteSheetResponse,
  UvedRouteSheet,
  UvedSvhEntry,
} from "./types";

const DEFAULT_BASE = "https://test-routelist-sc.fly.dev";
const BASE = (
  (import.meta as any).env?.VITE_SMARTML_BASE ?? DEFAULT_BASE
).replace(/\/+$/, "");

export interface FieldError {
  field?: string;
  message: string;
}

export type UvedApiError =
  | { kind: "validation"; status: 400; message: string; fieldErrors: FieldError[] }
  | { kind: "rate_limited"; status: 429; message: string }
  | { kind: "not_found"; status: 404; message: string }
  | { kind: "conflict"; status: 409; message: string }
  | { kind: "network"; message: string }
  | { kind: "server"; status: number; message: string };

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
  const list = await call<UvedSvhEntry[]>("/api/v1/public/svh-dictionary");
  return list.filter((s) => s.active !== false);
}

export async function createRouteSheet(
  req: CreateRouteSheetRequest
): Promise<CreateRouteSheetResponse> {
  return await call<CreateRouteSheetResponse>("/api/v1/public/route-sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(req),
  });
}

export async function getRouteSheetByCode(code: string): Promise<UvedRouteSheet> {
  return await call<UvedRouteSheet>(
    `/api/v1/public/route-sheets/by-code/${encodeURIComponent(code)}`
  );
}

export function pdfUrl(code: string): string {
  return `${BASE}/api/v1/public/route-sheets/by-code/${encodeURIComponent(code)}/pdf`;
}
