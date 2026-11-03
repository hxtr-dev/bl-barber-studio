import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bl_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 dias

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SECRET não configurado (mínimo 16 caracteres)");
  return s;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkPassword(pw: string) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) return false;
  const h = (v: string) => createHmac("sha256", "bl-pw").update(v).digest("hex");
  return safeEqual(h(pw), h(real));
}

export function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return { value: `${exp}.${sign(exp)}`, maxAge: MAX_AGE };
}

export function verifyToken(token?: string) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  try {
    return safeEqual(sig, sign(exp)) && Number(exp) > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyToken(jar.get(ADMIN_COOKIE)?.value);
}
