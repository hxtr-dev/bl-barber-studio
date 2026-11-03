import { getBookingSettings, getHours } from "@/lib/data";
import { query } from "@/lib/db";
import { fail, guardAdmin, json } from "@/lib/http";
import type { Hours } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  const [hours, booking] = await Promise.all([getHours(), getBookingSettings()]);
  return json({ hours, booking });
}

export async function PUT(req: Request) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json().catch(() => ({}));
    const hours: Hours = {};
    for (let d = 0; d < 7; d++) {
      const v = body.hours?.[String(d)];
      if (!v) { hours[String(d)] = null; continue; }
      const open = Math.round(Number(v.open));
      const close = Math.round(Number(v.close));
      if (!(open >= 0 && close <= 24 && open < close)) return json({ error: "Horário inválido" }, 400);
      hours[String(d)] = { open, close };
    }
    const daysAhead = Math.min(120, Math.max(1, Math.round(Number(body.booking?.daysAhead) || 30)));
    const holdMinutes = Math.min(120, Math.max(5, Math.round(Number(body.booking?.holdMinutes) || 20)));
    const minNoticeMinutes = Math.min(1440, Math.max(0, Math.round(Number(body.booking?.minNoticeMinutes ?? 60))));
    await query(
      `insert into settings (key, value) values ('hours', $1), ('booking', $2)
       on conflict (key) do update set value = excluded.value`,
      [JSON.stringify(hours), JSON.stringify({ daysAhead, holdMinutes, minNoticeMinutes })],
    );
    return json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
