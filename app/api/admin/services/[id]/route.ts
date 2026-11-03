import { query } from "@/lib/db";
import { fail, guardAdmin, json } from "@/lib/http";
import { parseService } from "../parse";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const id = Number((await ctx.params).id);
    const s = parseService(await req.json().catch(() => ({})));
    if ("error" in s) return json(s, 400);
    const rows = await query(
      `update services set name=$2, description=$3, duration_min=$4, price_cents=$5, icon=$6, active=$7
        where id=$1 returning *`,
      [id, s.name, s.description, s.duration_min, s.price_cents, s.icon, s.active],
    );
    if (!rows[0]) return json({ error: "Serviço não encontrado" }, 404);
    return json({ service: rows[0] });
  } catch (e) {
    return fail(e);
  }
}

// Excluir mantém o histórico dos agendamentos antigos (o nome fica salvo no agendamento).
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const id = Number((await ctx.params).id);
    await query(`delete from services where id = $1`, [id]);
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
