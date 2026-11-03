import { confirmPayment, getBookingByCode } from "@/lib/booking";
import { fail, json } from "@/lib/http";
import { checkPayment, paymentMode } from "@/lib/infinitepay";
import { pixForBooking } from "@/lib/pix";

export const dynamic = "force-dynamic";

// Chamado pela página de confirmação com os dados que a InfinitePay devolve no redirect.
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.order_nsu ?? "");
    const booking = code ? await getBookingByCode(code) : null;
    if (!booking) return json({ error: "Agendamento não encontrado" }, 404);

    if (booking.status !== "confirmed" && body.transaction_nsu && body.slug) {
      const check = await checkPayment({ orderNsu: code, transactionNsu: String(body.transaction_nsu), slug: String(body.slug) });
      if (check.success && check.paid && (check.amount ?? 0) >= booking.deposit_cents) {
        await confirmPayment(code, {
          paidAmountCents: check.paid_amount,
          captureMethod: check.capture_method,
          transactionNsu: String(body.transaction_nsu),
          invoiceSlug: String(body.slug),
          receiptUrl: body.receipt_url ? String(body.receipt_url) : undefined,
        });
      }
    }
    const fresh = await getBookingByCode(code);
    const pix = paymentMode() === "pix" && fresh?.status === "pending" ? await pixForBooking(code, fresh.deposit_cents) : null;
    return json({ booking: fresh, mode: paymentMode(), pix });
  } catch (e) {
    return fail(e);
  }
}
