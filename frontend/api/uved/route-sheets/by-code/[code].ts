const DEFAULT_BASE = "https://test-routelist-sc.fly.dev";

export default async function handler(req: any, res: any) {
  const BASE = (process.env.SMARTML_API_BASE ?? DEFAULT_BASE).replace(/\/+$/, "");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const code = String(req.query?.code ?? "");
  if (!/^\d{6}$/.test(code)) {
    res.status(400).json({ error: "invalid_code", message: "Код должен состоять из 6 цифр" });
    return;
  }
  try {
    const r = await fetch(
      `${BASE}/api/v1/public/route-sheets/by-code/${encodeURIComponent(code)}`,
      { headers: { Accept: "application/json" } }
    );
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(text);
  } catch (e) {
    console.error("[uved-proxy] by-code GET failed", e);
    res.status(502).json({ error: "upstream_unreachable" });
  }
}
