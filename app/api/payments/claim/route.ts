import { claimPayment, getBookingByCode } from "@/lib/booking";
import { fail, json } from "@/lib/http";

export const dynamic = "force-dynamic";

// Pix no site: o cliente toca em "Já paguei".
export async function POST(req: Request) {
  try {
    const { order_nsu } = await req.json().catch(() => ({}));
    const code = String(order_nsu ?? "");
    const ok = code ? await claimPayment(code) : false;
    if (!ok) return json({ error: "Esse agendamento não está mais aguardando pagamento." }, 409);
    return json({ booking: await getBookingByCode(code) });
  } catch (e) {
    return fail(e);
  }
}
