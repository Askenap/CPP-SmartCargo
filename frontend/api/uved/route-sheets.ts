const DEFAULT_BASE = "https://test-routelist-smartcargo.codecraft.kz";

export default async function handler(req: any, res: any) {
  const BASE = (process.env.SMARTML_API_BASE ?? DEFAULT_BASE).replace(/\/+$/, "");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  try {
    const r = await fetch(`${BASE}/api/v1/public/route-sheets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(req.body ?? {}),
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(text);
  } catch (e) {
    console.error("[uved-proxy] route-sheets POST failed", e);
    res.status(502).json({ error: "upstream_unreachable" });
  }
}
