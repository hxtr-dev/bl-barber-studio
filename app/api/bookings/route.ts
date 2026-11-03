import { BookingError, createBooking } from "@/lib/booking";
import { query } from "@/lib/db";
import { fail, json } from "@/lib/http";
import { createCheckoutLink, paymentMode } from "@/lib/infinitepay";
import { normalizePhone } from "@/lib/phone";
import { fmtDateBR, hourLabel } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 80) throw new BookingError("Informe seu nome");
    const phone = normalizePhone(String(body.phone ?? ""));
    if (!phone) throw new BookingError("Informe um WhatsApp válido com DDD");
    const hour = Number(body.hour);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) throw new BookingError("Horário inválido");
    if (!Array.isArray(body.serviceIds)) throw new BookingError("Escolha pelo menos um serviço");

    const b = await createBooking({ serviceIds: body.serviceIds, date: String(body.date), hour, name, phone });

    if (paymentMode() === "teste") {
      const url = `/agendar/confirmacao?order_nsu=${encodeURIComponent(b.code)}&teste=1`;
      await query(`update bookings set payment_url = $2 where id = $1`, [b.id, url]);
      return json({ code: b.code, paymentUrl: url });
    }

    try {
      const description = `Sinal 50% - ${b.services.map((s) => s.name).join(" + ")} - ${fmtDateBR(String(body.date))} ${hourLabel(hour)}`;
      const url = await createCheckoutLink({
        orderNsu: b.code,
        description: description.slice(0, 120),
        priceCents: b.deposit,
        customerName: name,
        customerPhone: phone,
      });
      await query(`update bookings set payment_url = $2 where id = $1`, [b.id, url]);
      return json({ code: b.code, paymentUrl: url });
    } catch (e) {
      // Sem link de pagamento, o horário não fica preso.
      await query(`update bookings set status = 'cancelled' where id = $1`, [b.id]);
      console.error(e);
      throw new BookingError("Não conseguimos gerar o Pix agora. Tente novamente em instantes.", 502);
    }
  } catch (e) {
    return fail(e);
  }
}
