const DEFAULT_BASE = "https://test-routelist-smartcargo.codecraft.kz";

export default async function handler(req: any, res: any) {
  const BASE = (process.env.SMARTML_API_BASE ?? DEFAULT_BASE).replace(/\/+$/, "");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  try {
    const r = await fetch(`${BASE}/api/v1/public/svh-dictionary`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SmartCargo-CPP-Proxy/1.0 (Mozilla/5.0 compatible)",
      },
    });
    const text = await r.text();
    res.status(r.status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(text);
  } catch (e) {
    console.error("[uved-proxy] svh-dictionary failed", e);
    res.status(502).json({ error: "upstream_unreachable" });
  }
}
