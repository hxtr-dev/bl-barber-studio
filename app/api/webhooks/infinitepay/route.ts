import { confirmPayment, getBookingByCode } from "@/lib/booking";
import { checkPayment } from "@/lib/infinitepay";

export const dynamic = "force-dynamic";

// A InfinitePay chama esta rota quando o sinal é pago.
export async function POST(req: Request) {
  try {
    const p = await req.json();
    const code = String(p.order_nsu ?? "");
    const booking = code ? await getBookingByCode(code) : null;
    if (!booking) return new Response("unknown order", { status: 400 });
    if (booking.status === "confirmed") return new Response("ok");

    const check = await checkPayment({ orderNsu: code, transactionNsu: String(p.transaction_nsu ?? ""), slug: String(p.invoice_slug ?? "") });
    if (!check.success || !check.paid || (check.amount ?? 0) < booking.deposit_cents) {
      return new Response("not paid", { status: 400 });
    }
    await confirmPayment(code, {
      paidAmountCents: check.paid_amount ?? p.paid_amount,
      captureMethod: check.capture_method ?? p.capture_method,
      transactionNsu: String(p.transaction_nsu),
      invoiceSlug: String(p.invoice_slug),
      receiptUrl: p.receipt_url ? String(p.receipt_url) : undefined,
    });
    return new Response("ok");
  } catch (e) {
    console.error("webhook infinitepay", e);
    return new Response("error", { status: 400 });
  }
}
