// Checkout Integrado InfinitePay: https://www.infinitepay.io/checkout-documentacao
const API = "https://api.checkout.infinitepay.io";

/**
 * PAYMENT_MODE:
 *  "pix"   -> QR code e copia e cola no próprio site (chave PIX_KEY); o Biel confirma no painel
 *  "real"  -> página de pagamento da InfinitePay, com confirmação automática
 *  "teste" -> botão de simular pagamento (nunca usar no ar)
 */
export function paymentMode(): "teste" | "real" | "pix" {
  const m = process.env.PAYMENT_MODE;
  return m === "teste" ? "teste" : m === "pix" ? "pix" : "real";
}

function headers() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.INFINITEPAY_API_KEY) h["X-Api-Key"] = process.env.INFINITEPAY_API_KEY;
  return h;
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function createCheckoutLink(p: {
  orderNsu: string;
  description: string;
  priceCents: number;
  customerName: string;
  customerPhone: string; // dígitos com DDD
}): Promise<string> {
  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle && !process.env.INFINITEPAY_API_KEY) throw new Error("INFINITEPAY_HANDLE não configurado");
  const body = {
    ...(handle ? { handle: handle.replace(/^\$/, "") } : {}),
    items: [{ quantity: 1, price: p.priceCents, description: p.description }],
    order_nsu: p.orderNsu,
    redirect_url: `${siteUrl()}/agendar/confirmacao`,
    webhook_url: `${siteUrl()}/api/webhooks/infinitepay`,
    customer: { name: p.customerName, phone_number: `+55${p.customerPhone}` },
  };
  const res = await fetch(`${API}/links`, { method: "POST", headers: headers(), body: JSON.stringify(body), cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    console.error("InfinitePay /links", res.status, data);
    throw new Error("Não foi possível gerar o pagamento");
  }
  return data.url as string;
}

export type PaymentCheck = { success: boolean; paid: boolean; amount?: number; paid_amount?: number; capture_method?: string };

/** O webhook não tem assinatura: sempre confirmamos aqui antes de aceitar. */
export async function checkPayment(p: { orderNsu: string; transactionNsu: string; slug: string }): Promise<PaymentCheck> {
  const handle = (process.env.INFINITEPAY_HANDLE || "").replace(/^\$/, "");
  const res = await fetch(`${API}/payment_check`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ handle, order_nsu: p.orderNsu, transaction_nsu: p.transactionNsu, slug: p.slug }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("InfinitePay /payment_check", res.status, data);
    return { success: false, paid: false };
  }
  return data as PaymentCheck;
}
