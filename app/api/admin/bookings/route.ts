import { expireStale } from "@/lib/booking";
import { query } from "@/lib/db";
import { fail, guardAdmin, json } from "@/lib/http";
import { spInstant } from "@/lib/time";

export const dynamic = "force-dynamic";

// GET /api/admin/bookings?month=2026-11
export async function GET(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const month = new URL(req.url).searchParams.get("month") ?? "";
    if (!/^\d{4}-\d{2}$/.test(month)) return json({ error: "Mês inválido" }, 400);
    const [y, m] = month.split("-").map(Number);
    const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
    await expireStale();
    const rows = await query(
      `select b.id, b.code, b.customer_name, b.customer_phone, b.starts_at, b.ends_at, b.duration_min,
              b.total_cents, b.deposit_cents, b.status, b.paid_at, b.paid_amount_cents, b.needs_refund,
              b.notified_at, b.expires_at, b.receipt_url,
              coalesce(array_agg(i.name order by i.id) filter (where i.id is not null), '{}') as services
         from bookings b left join booking_items i on i.booking_id = b.id
        where b.starts_at >= $1 and b.starts_at < $2
          and (b.status in ('pending','confirmed') or b.needs_refund)
        group by b.id order by b.starts_at`,
      [spInstant(`${month}-01`, 0), spInstant(`${next}-01`, 0)],
    );
    return json({ bookings: rows });
  } catch (e) {
    return fail(e);
  }
}
