const DEFAULT_BASE = "https://test-routelist-smartcargo.codecraft.kz";

export default async function handler(req: any, res: any) {
  const BASE = (process.env.SMARTML_API_BASE ?? DEFAULT_BASE).replace(/\/+$/, "");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const code = String(req.query?.code ?? "");
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "invalid_code", message: "Код должен состоять из 6 цифр" });
    return;
  }

  const apiKey = (process.env.SMARTML_API_KEY ?? "").trim();
  if (!apiKey) {
    console.error("[ml-proxy] SMARTML_API_KEY is not set");
    res.status(500).json({ error: "config_missing", message: "Ключ доступа к Smart ML не настроен" });
    return;
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
      body: JSON.stringify(req.body ?? {}),
    });
  } catch (e) {
    console.error("[ml-proxy] upstream POST failed", e);
    res.status(502).json({ error: "upstream_unreachable", message: "Нет связи с системой Smart Cargo ML" });
    return;
  }

  if (r.status === 401) {
    console.error("[ml-proxy] upstream returned 401 — check SMARTML_API_KEY");
  }

  const text = await r.text();
  let body: unknown = null;
  if (text) {
    try { body = JSON.parse(text); }
    catch { body = { error: "invalid_upstream_json", raw: text.slice(0, 500) }; }
  }
  res.status(r.status).json(body);
}
