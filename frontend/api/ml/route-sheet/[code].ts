import { fetchRouteSheet } from "../../_lib/smartml";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const code = String(req.query?.code ?? "");
  const result = await fetchRouteSheet(code);
  res.status(result.status).json(result.body);
}
