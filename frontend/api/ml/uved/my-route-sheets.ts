const DEFAULT_BASE = "https://test-routelist-smartcargo.codecraft.kz";

/**
 * Дефолтный мок-профиль до появления реальной авторизации в ЦПП.
 * Реальный тестовый ИИН Asia Transit Flow, у которого на тест-стенде
 * Smart ML есть маршрутные листы. Переопределяется env MOCK_UVED_IIN
 * / MOCK_UVED_PHONE — когда подключим auth, эти строки заменит чтение
 * из session/JWT.
 */
const DEFAULT_MOCK_IIN = "020921500360";
const DEFAULT_MOCK_PHONE = "";
const PAGE_SIZE = 10;

export default async function handler(req: any, res: any) {
  const BASE = (process.env.SMARTML_API_BASE ?? DEFAULT_BASE).replace(/\/+$/, "");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const apiKey = (process.env.SMARTML_API_KEY ?? "").trim();
  if (!apiKey) {
    console.error("[ml-proxy] SMARTML_API_KEY is not set");
    res.status(500).json({ error: "config_missing", message: "Ключ доступа к Smart ML не настроен" });
    return;
  }

  // ─── Профиль берётся ТОЛЬКО на сервере ───
  const iinBin = (process.env.MOCK_UVED_IIN ?? DEFAULT_MOCK_IIN).replace(/\D/g, "");
  const phone = (process.env.MOCK_UVED_PHONE ?? DEFAULT_MOCK_PHONE).trim();
  if (!iinBin && !phone) {
    res.status(422).json({
      error: "profile_incomplete",
      message: "Заполните ИИН/БИН или телефон в профиле",
    });
    return;
  }

  const pageRaw = parseInt(String(req.query?.page ?? "0"), 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 0 ? pageRaw : 0;

  const url = new URL(`${BASE}/api/v1/external/route-sheets/my`);
  if (iinBin) url.searchParams.set("iinBin", iinBin);
  if (phone) url.searchParams.set("phone", phone);
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(PAGE_SIZE));

  let r: Response;
  try {
    r = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
        "User-Agent": "SmartCargo-CPP-Proxy/1.0 (Mozilla/5.0 compatible)",
      },
    });
  } catch (e) {
    console.error("[ml-proxy] /my upstream failed", e);
    res.status(502).json({ error: "upstream_unreachable", message: "Нет связи с системой Smart Cargo ML" });
    return;
  }

  if (r.status === 401) {
    console.error("[ml-proxy] upstream 401 on /my — check SMARTML_API_KEY");
    res.status(502).json({ error: "config_bad_key", message: "Отказ upstream (401). Проверьте SMARTML_API_KEY." });
    return;
  }

  const text = await r.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {
        error: "invalid_upstream_json",
        message: "Внешний сервис ответил не-JSON (возможно, сетевой фильтр).",
        raw: text.slice(0, 500),
      };
    }
  }
  res.status(r.status).json(body);
}
