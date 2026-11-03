import { getServices } from "@/lib/data";
import { query } from "@/lib/db";
import { fail, guardAdmin, json } from "@/lib/http";
import { parseService } from "./parse";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    return json({ services: await getServices(true) });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const s = parseService(await req.json().catch(() => ({})));
    if ("error" in s) return json(s, 400);
    const rows = await query(
      `insert into services (name, description, duration_min, price_cents, icon, active, sort)
       values ($1,$2,$3,$4,$5,$6, coalesce((select max(sort) from services), 0) + 1) returning *`,
      [s.name, s.description, s.duration_min, s.price_cents, s.icon, s.active],
    );
    return json({ service: rows[0] }, 201);
  } catch (e) {
    return fail(e);
  }
}
