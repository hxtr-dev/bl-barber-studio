import { ADMIN_COOKIE, checkPassword, makeToken } from "@/lib/auth";
import { json } from "@/lib/http";

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now() && a.n >= 5) return json({ error: "Muitas tentativas. Aguarde alguns minutos." }, 429);

  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!checkPassword(String(password ?? ""))) {
    const cur = a && a.until > Date.now() ? a : { n: 0, until: Date.now() + 10 * 60_000 };
    attempts.set(ip, { n: cur.n + 1, until: cur.until });
    return json({ error: "Senha incorreta" }, 401);
  }
  attempts.delete(ip);
  const t = makeToken();
  const res = json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, t.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: t.maxAge });
  return res;
}
