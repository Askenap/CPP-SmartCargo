const BASE = "https://routelist-sc.fly.dev";

export type ProxyResult = {
  status: number;
  body: unknown;
};

function getApiKey(): string | null {
  const key = process.env.SMARTML_API_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

async function readBody(r: Response): Promise<unknown> {
  const text = await r.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: "invalid_upstream_json", raw: text.slice(0, 500) };
  }
}

export async function fetchRouteSheet(code: string): Promise<ProxyResult> {
  if (!/^\d{6}$/.test(code)) {
    return { status: 400, body: { error: "invalid_code", message: "Код должен состоять из 6 цифр" } };
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[ml-proxy] SMARTML_API_KEY is not set");
    return { status: 500, body: { error: "config_missing", message: "Ключ доступа к Smart ML не настроен" } };
  }

  let r: Response;
  try {
    r = await fetch(`${BASE}/api/v1/external/route-sheets/by-code/${encodeURIComponent(code)}`, {
      method: "GET",
      headers: { "X-API-Key": apiKey, Accept: "application/json" },
    });
  } catch (e) {
    console.error("[ml-proxy] upstream GET failed", e);
    return { status: 502, body: { error: "upstream_unreachable", message: "Нет связи с системой Smart Cargo ML" } };
  }

  if (r.status === 401) {
    console.error("[ml-proxy] upstream returned 401 — check SMARTML_API_KEY");
  }

  return { status: r.status, body: await readBody(r) };
}

export async function postBorderPass(code: string, payload: unknown): Promise<ProxyResult> {
  if (!/^\d{6}$/.test(code)) {
    return { status: 400, body: { error: "invalid_code", message: "Код должен состоять из 6 цифр" } };
  }
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[ml-proxy] SMARTML_API_KEY is not set");
    return { status: 500, body: { error: "config_missing", message: "Ключ доступа к Smart ML не настроен" } };
  }

  let r: Response;
  try {
    r = await fetch(`${BASE}/api/v1/external/route-sheets/${encodeURIComponent(code)}/border-pass`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload ?? {}),
    });
  } catch (e) {
    console.error("[ml-proxy] upstream POST failed", e);
    return { status: 502, body: { error: "upstream_unreachable", message: "Нет связи с системой Smart Cargo ML" } };
  }

  if (r.status === 401) {
    console.error("[ml-proxy] upstream returned 401 — check SMARTML_API_KEY");
  }

  return { status: r.status, body: await readBody(r) };
}
