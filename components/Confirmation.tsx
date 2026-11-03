"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BUSINESS } from "@/lib/content";
import { brl } from "@/lib/money";
import { fmtTimeSP, TZ } from "@/lib/time";
import { Icon } from "./Icon";
import { Stepper } from "./Stepper";

type Booking = {
  code: string; customer_name: string; starts_at: string; ends_at: string; total_cents: number; deposit_cents: number;
  status: string; needs_refund: boolean; payment_url: string | null; services: string[];
  expires_at: string | null; claimed_at: string | null;
};
type Pix = { copiaECola: string; qr: string; name: string };

const fmtDay = (d: string) => cap(
  new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "long" }).format(new Date(d)));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Confirmation() {
  const q = useSearchParams();
  const code = q.get("order_nsu") ?? "";
  const isTest = q.get("teste") === "1";
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [mode, setMode] = useState<string>("real");
  const [pix, setPix] = useState<Pix | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_nsu: code,
        transaction_nsu: q.get("transaction_nsu"),
        slug: q.get("slug"),
        receipt_url: q.get("receipt_url"),
      }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Não encontramos esse agendamento.");
    else {
      setBooking(data.booking);
      if (data.mode) setMode(data.mode);
      if (data.pix) setPix(data.pix);
    }
  }, [code, q]);

  useEffect(() => {
    if (!code) {
      setError("Link de confirmação incompleto.");
      return;
    }
    load();
  }, [code, load]);

  // Pix no site: confere a cada 8s se o Biel já confirmou no painel.
  useEffect(() => {
    if (mode !== "pix" || !booking || booking.status !== "pending") return;
    const t = setInterval(load, 8000);
    const c = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, [mode, booking, load]);

  // A confirmação da InfinitePay pode levar alguns segundos: tenta de novo por até ~1 minuto.
  useEffect(() => {
    if (!booking || booking.status !== "pending" || isTest || mode === "pix" || tries >= 20) return;
    const t = setTimeout(() => {
      setTries((n) => n + 1);
      load();
    }, 3000);
    return () => clearTimeout(t);
  }, [booking, tries, isTest, mode, load]);

  useEffect(() => {
    if (booking?.status === "confirmed") {
      try { sessionStorage.removeItem("bl-agendamento"); } catch {}
    }
  }, [booking]);

  async function simulate() {
    const res = await fetch("/api/payments/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_nsu: code }) });
    const data = await res.json();
    if (res.ok) setBooking(data.booking);
    else setError(data.error);
  }

  async function copy() {
    if (!pix) return;
    try {
      await navigator.clipboard.writeText(pix.copiaECola);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = pix.copiaECola;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function claim() {
    if (!booking) return;
    const msg =
      `Olá, Biel! Paguei o sinal de ${brl(booking.deposit_cents)} do agendamento ${booking.code} ` +
      `(${fmtDay(booking.starts_at)}, ${fmtTimeSP(booking.starts_at)}). Segue o comprovante do Pix:`;
    // Abre o WhatsApp já na hora do clique (celulares bloqueiam janelas abertas depois de um await).
    window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    setClaiming(true);
    const res = await fetch("/api/payments/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_nsu: code }) });
    const data = await res.json().catch(() => ({}));
    setClaiming(false);
    if (res.ok) setBooking(data.booking);
    else setError(data.error || "Não foi possível registrar o pagamento.");
  }

  const left = booking?.expires_at ? Math.max(0, new Date(booking.expires_at).getTime() - now) : 0;
  const mmss = `${String(Math.floor(left / 60000)).padStart(2, "0")}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
  const confirmed = booking?.status === "confirmed";
  const wa = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(`Olá! Fiz o agendamento ${code} pelo site.`)}`;

  return (
    <div className="book-wrap">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="book-top">
          <Link href="/" className="back">← Voltar ao site</Link>
          <img src="/logo-badge-160.png" alt="BL Barber Studio" width={52} height={52} />
        </div>
        <Stepper step={3} done={confirmed} />

        {error && <div className="alert">{error}</div>}
        {!booking && !error && <div className="spinner" aria-label="Carregando" />}

        {booking && confirmed && (
          <div style={{ textAlign: "center" }}>
            <div className="done-check"><Icon name="check" /></div>
            <h1 className="book-title shimmer-gold">Horário confirmado!</h1>
            <p className="book-sub">Até lá, {booking.customer_name.split(" ")[0]}. Seu estilo é aqui.</p>
          </div>
        )}

        {booking && booking.status === "pending" && (
          <div style={{ textAlign: "center" }}>
            {mode === "pix" && booking.claimed_at ? (
              <>
                <div className="spinner" />
                <h1 className="book-title">Pagamento enviado!</h1>
                <p className="book-sub">
                  Agora é só aguardar o Biel conferir o Pix. Esta página confirma sozinha. Se o WhatsApp não abriu, toque abaixo e envie o comprovante.
                </p>
                <button className="btn" onClick={claim}>Enviar comprovante no WhatsApp</button>
              </>
            ) : mode === "pix" && pix ? (
              <>
                <h1 className="book-title shimmer">Pague o sinal no Pix</h1>
                <p className="book-sub">
                  Valor: <b style={{ color: "var(--gold)" }}>{brl(booking.deposit_cents)}</b> · para <b>{pix.name}</b>
                  <br />
                  Seu horário fica reservado por <b style={{ color: "#fff" }}>{mmss}</b>
                </p>
                <div className="pix-box">
                  <img src={pix.qr} alt="QR code do Pix" width={260} height={260} />
                  <p className="muted">Abra o app do seu banco, escolha Pix e leia o QR code. Ou copie o código abaixo.</p>
                  <div className="pix-code">{pix.copiaECola}</div>
                  <button className="btn btn-gold" onClick={copy} style={{ width: "100%" }}>
                    {copied ? "Código copiado ✓" : "Copiar Pix copia e cola"}
                  </button>
                  <button className="btn" onClick={claim} disabled={claiming} style={{ width: "100%" }}>
                    {claiming ? "Enviando..." : "Já paguei: enviar comprovante"}
                  </button>
                </div>
              </>
            ) : isTest ? (
              <>
                <h1 className="book-title">Modo de teste</h1>
                <p className="book-sub">O pagamento real está desligado. Use o botão para simular o Pix.</p>
                <button className="btn btn-gold" onClick={simulate}>Simular pagamento do sinal</button>
              </>
            ) : (
              <>
                <div className="spinner" />
                <h1 className="book-title">Aguardando o Pix...</h1>
                <p className="book-sub">Assim que o pagamento cair, esta página confirma sozinha.</p>
                {booking.payment_url && tries >= 20 && <a className="btn" href={booking.payment_url}>Abrir o pagamento de novo</a>}
              </>
            )}
          </div>
        )}

        {booking && (booking.status === "expired" || booking.status === "cancelled") && (
          <div style={{ textAlign: "center" }}>
            <h1 className="book-title">{booking.needs_refund ? "Pagamento recebido, mas o horário foi liberado" : "Esse agendamento expirou"}</h1>
            <p className="book-sub">
              {booking.needs_refund
                ? "O prazo para pagar passou e outra pessoa reservou o horário. Fale com a gente no WhatsApp para remarcar ou receber o valor de volta."
                : "O sinal não foi pago a tempo e o horário voltou a ficar livre."}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {booking.needs_refund ? <a className="btn" href={wa}>Falar no WhatsApp</a> : <Link className="btn" href="/agendar">Agendar de novo</Link>}
            </div>
          </div>
        )}

        {booking && (
          <div className="panel" style={{ marginTop: 28 }}>
            <div className="summary">
              <div className="row"><span>Código</span><span>{booking.code}</span></div>
              <div className="row"><span>Serviços</span><span>{booking.services.join(" + ")}</span></div>
              <div className="row"><span>Dia</span><span>{fmtDay(booking.starts_at)}</span></div>
              <div className="row"><span>Horário</span><span>{fmtTimeSP(booking.starts_at)} às {fmtTimeSP(booking.ends_at)}</span></div>
              <div className="row"><span>Sinal {confirmed ? "pago" : "a pagar"}</span><span>{brl(booking.deposit_cents)}</span></div>
              <div className="row big"><span>Pagar na barbearia</span><span>{brl(booking.total_cents - booking.deposit_cents)}</span></div>
            </div>
          </div>
        )}

        {confirmed && (
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
            <a className="btn" href={wa} target="_blank" rel="noopener">Falar com o Biel</a>
            <Link className="btn btn-ghost" href="/">Voltar ao site</Link>
          </div>
        )}
      </div>
    </div>
  );
}
