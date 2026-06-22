import { postBorderPass } from "../../../_lib/smartml";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  const code = String(req.query?.code ?? "");
  const result = await postBorderPass(code, req.body);
  res.status(result.status).json(result.body);
}
