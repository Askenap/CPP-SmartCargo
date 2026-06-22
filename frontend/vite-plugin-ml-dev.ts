import type { Plugin } from "vite";
import { fetchRouteSheet, postBorderPass } from "./api/_lib/smartml";

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
        try {
          if (!sub) {
            if (req.method !== "GET") {
              res.setHeader("Allow", "GET");
              return sendJson(res, 405, { error: "method_not_allowed" });
            }
            const r = await fetchRouteSheet(code);
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
            const r = await postBorderPass(code, body);
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
