import type { MLBorderPassRequest, MLBorderPassResponse, MLRouteSheet } from "./types";

export type MLFetchError =
  | { kind: "not_found"; code: string }
  | { kind: "rate_limited" }
  | { kind: "config" }
  | { kind: "network" }
  | { kind: "upstream"; status: number; message?: string };

export async function getRouteSheet(code: string): Promise<MLRouteSheet> {
  let r: Response;
  try {
    r = await fetch(`/api/ml/route-sheet/${encodeURIComponent(code)}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw { kind: "network" } as MLFetchError;
  }
  if (r.ok) return (await r.json()) as MLRouteSheet;
  if (r.status === 404) throw { kind: "not_found", code } as MLFetchError;
  if (r.status === 429) throw { kind: "rate_limited" } as MLFetchError;
  if (r.status === 401 || r.status === 500) {
    const body = await safeJson(r);
    if ((body as any)?.error === "config_missing") throw { kind: "config" } as MLFetchError;
    throw { kind: "upstream", status: r.status, message: (body as any)?.message } as MLFetchError;
  }
  if (r.status >= 500) throw { kind: "upstream", status: r.status } as MLFetchError;
  const body = await safeJson(r);
  throw { kind: "upstream", status: r.status, message: (body as any)?.message } as MLFetchError;
}

export async function postBorderPass(
  code: string,
  payload: MLBorderPassRequest
): Promise<MLBorderPassResponse> {
  let r: Response;
  try {
    r = await fetch(`/api/ml/route-sheet/${encodeURIComponent(code)}/border-pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw { kind: "network" } as MLFetchError;
  }
  if (r.ok) return (await r.json()) as MLBorderPassResponse;
  if (r.status === 404) throw { kind: "not_found", code } as MLFetchError;
  if (r.status === 429) throw { kind: "rate_limited" } as MLFetchError;
  const body = await safeJson(r);
  if (r.status === 401 || (r.status === 500 && (body as any)?.error === "config_missing")) {
    throw { kind: "config" } as MLFetchError;
  }
  throw { kind: "upstream", status: r.status, message: (body as any)?.message } as MLFetchError;
}

async function safeJson(r: Response): Promise<unknown> {
  try {
    return await r.json();
  } catch {
    return null;
  }
}
