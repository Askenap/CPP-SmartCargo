import type { Plugin } from "vite";

const DEFAULT_BASE = "https://routelist-sc.fly.dev";
const ROUTE = /^\/api\/ml\/route-sheet\/(\d{6})(?:\/(border-pass))?\/?$/;

async function readJsonBody(req: any): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: any, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function proxyUpstream(
  url: string,
  init: RequestInit
): Promise<{ status: number; body: unknown }> {
  let r: Response;
  try {
    r = await fetch(url, init);
  } catch (e) {
    console.error("[ml-dev-proxy] upstream failed", e);
    return { status: 502, body: { error: "upstream_unreachable" } };
  }
  const text = await r.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: "invalid_upstream_json", raw: text.slice(0, 500) };
    }
  }
  return { status: r.status, body };
}

export function mlDevPlugin(): Plugin {
  return {
    name: "ml-dev-proxy",
    enforce: "pre",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        const path = url.split("?")[0];
        const m = ROUTE.exec(path);
        if (!m) return next();

        const [, code, sub] = m;
        const BASE = (process.env.SMARTML_API_BASE ?? DEFAULT_BASE).replace(/\/+$/, "");
        const apiKey = (process.env.SMARTML_API_KEY ?? "").trim();
        if (!apiKey) {
          console.error("[ml-dev-proxy] SMARTML_API_KEY is not set");
          return sendJson(res, 500, {
            error: "config_missing",
            message: "Ключ доступа к Smart ML не настроен",
          });
        }

        try {
          if (!sub) {
            if (req.method !== "GET") {
              res.setHeader("Allow", "GET");
              return sendJson(res, 405, { error: "method_not_allowed" });
            }
            const r = await proxyUpstream(
              `${BASE}/api/v1/external/route-sheets/by-code/${encodeURIComponent(code)}`,
              { method: "GET", headers: { "X-API-Key": apiKey, Accept: "application/json" } }
            );
            return sendJson(res, r.status, r.body);
          }
          if (sub === "border-pass") {
            if (req.method !== "POST") {
              res.setHeader("Allow", "POST");
              return sendJson(res, 405, { error: "method_not_allowed" });
            }
            let body: unknown = null;
            try {
              body = await readJsonBody(req);
            } catch {
              return sendJson(res, 400, { error: "invalid_json" });
            }
            const r = await proxyUpstream(
              `${BASE}/api/v1/external/route-sheets/${encodeURIComponent(code)}/border-pass`,
              {
                method: "POST",
                headers: {
                  "X-API-Key": apiKey,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
                body: JSON.stringify(body ?? {}),
              }
            );
            return sendJson(res, r.status, r.body);
          }
          return next();
        } catch (e) {
          console.error("[ml-dev-proxy] error", e);
          return sendJson(res, 500, { error: "dev_proxy_failed" });
        }
      });
    },
  };
}
