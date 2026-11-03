import { confirmPayment, getBookingByCode } from "@/lib/booking";
import { fail, json } from "@/lib/http";
import { paymentMode } from "@/lib/infinitepay";

export const dynamic = "force-dynamic";

// Só funciona com PAYMENT_MODE="teste". Serve para testar o fluxo sem pagar.
export async function POST(req: Request) {
  if (paymentMode() !== "teste") return json({ error: "Indisponível" }, 404);
  try {
    const { order_nsu } = await req.json();
    const b = await getBookingByCode(String(order_nsu));
    if (!b) return json({ error: "Agendamento não encontrado" }, 404);
    await confirmPayment(b.code, { paidAmountCents: b.deposit_cents, captureMethod: "pix", transactionNsu: "TESTE", invoiceSlug: "teste" });
    return json({ booking: await getBookingByCode(b.code) });
  } catch (e) {
    return fail(e);
  }
}
