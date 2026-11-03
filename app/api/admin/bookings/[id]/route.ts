import { confirmPayment } from "@/lib/booking";
import { query } from "@/lib/db";
import { fail, guardAdmin, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// PATCH { action: "notified" | "cancel" | "confirm" | "refunded" }
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ error: "Id inválido" }, 400);
    const { action } = await req.json().catch(() => ({}));
    if (action === "notified") {
      await query(`update bookings set notified_at = now() where id = $1`, [id]);
    } else if (action === "cancel") {
      await query(`update bookings set status = 'cancelled' where id = $1 and status in ('pending','confirmed')`, [id]);
    } else if (action === "refunded") {
      await query(`update bookings set needs_refund = false where id = $1`, [id]);
    } else if (action === "confirm") {
      // Sinal recebido por fora (ex.: Pix direto). Confirma mantendo a regra de horários.
      const rows = await query<{ code: string; deposit_cents: number }>(`select code, deposit_cents from bookings where id = $1`, [id]);
      if (!rows[0]) return json({ error: "Não encontrado" }, 404);
      const r = await confirmPayment(rows[0].code, { paidAmountCents: rows[0].deposit_cents, captureMethod: "manual" });
      if (!r.ok) return json({ error: "Esse horário já está ocupado por outro cliente." }, 409);
    } else {
      return json({ error: "Ação inválida" }, 400);
    }
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
