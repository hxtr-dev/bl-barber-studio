import { availability } from "@/lib/booking";
import { getBookingSettings, getHours } from "@/lib/data";
import { fail, json } from "@/lib/http";
import { todaySP } from "@/lib/time";

export const dynamic = "force-dynamic";

// GET /api/availability                 -> regras do calendário (dias de atendimento)
// GET /api/availability?date=...&minutes=90 -> horários do dia
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date");
    if (!date) {
      const [hours, settings] = await Promise.all([getHours(), getBookingSettings()]);
      return json({ hours, daysAhead: settings.daysAhead, today: todaySP() });
    }
    const minutes = Math.min(600, Math.max(5, Number(url.searchParams.get("minutes")) || 60));
    return json(await availability(date, minutes));
  } catch (e) {
    return fail(e);
  }
}
