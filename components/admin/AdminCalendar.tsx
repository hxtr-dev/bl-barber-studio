"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { brl } from "@/lib/money";
import { fmtPhone, waLink } from "@/lib/phone";
import { dateSP, fmtDuration, fmtTimeSP, TZ, weekday } from "@/lib/time";
import type { Hours } from "@/lib/types";

type Booking = {
  id: string; code: string; customer_name: string; customer_phone: string; starts_at: string; ends_at: string;
  duration_min: number; total_cents: number; deposit_cents: number; status: "pending" | "confirmed" | "cancelled" | "expired";
  paid_at: string | null; needs_refund: boolean; notified_at: string | null; expires_at: string | null; claimed_at: string | null; services: string[];
};

const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TEMPLATES: { label: string; text: (b: Booking) => string }[] = [
  { label: "Estou te aguardando", text: (b) => `Olá, ${first(b)}! Aqui é o Biel, da BL Barber Studio. Já estou te aguardando para o seu horário das ${fmtTimeSP(b.starts_at)}. Até já! ✂️` },
  { label: "Lembrete do horário", text: (b) => `Olá, ${first(b)}! Passando para lembrar do seu horário na BL Barber Studio: ${dayLabel(b.starts_at)} às ${fmtTimeSP(b.starts_at)} (${b.services.join(" + ")}). Te espero! 💈` },
  { label: "Vou atrasar um pouco", text: (b) => `Olá, ${first(b)}! Aqui é o Biel, da BL Barber Studio. Estou com um pequeno atraso, peço que aguarde alguns minutinhos para o seu horário das ${fmtTimeSP(b.starts_at)}. Obrigado pela paciência!` },
];

function first(b: Booking) {
  return b.customer_name.split(" ")[0];
}
function dayLabel(d: string) {
  return cap(new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "2-digit", month: "2-digit" }).format(new Date(d)));
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function AdminCalendar({ today, hours }: { today: string; hours: Hours }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [tpl, setTpl] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/bookings?month=${month}`, { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/admin/login");
    const data = await res.json();
    setBookings(data.bookings ?? []);
  }, [month]);

  useEffect(() => {
    setBookings(null);
    load();
    const t = setInterval(load, 30_000); // atualiza sozinho a cada 30s
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const byDay = useMemo(() => {
    const m: Record<string, Booking[]> = {};
    for (const b of bookings ?? []) (m[dateSP(b.starts_at)] ??= []).push(b);
    return m;
  }, [bookings]);

  const cells = useMemo(() => {
    const [y, mo] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y, mo - 1, 1));
    const start = new Date(first);
    start.setUTCDate(1 - first.getUTCDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [month]);

  const shift = (n: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    const next = d.toISOString().slice(0, 7);
    setMonth(next);
    setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
  };

  async function act(b: Booking, action: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    const res = await fetch(`/api/admin/bookings/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) setToast(data.error || "Não foi possível salvar");
    else if (action !== "notified") setToast("Salvo");
    load();
  }

  function notify(b: Booking) {
    const text = TEMPLATES[tpl[b.id] ?? 0].text(b);
    window.open(waLink(b.customer_phone, text), "_blank", "noopener");
    act(b, "notified");
  }

  const monthLabel = cap(new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`)));
  const dayList = (byDay[selected] ?? []).slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const dayOpen = hours[String(weekday(selected))];

  return (
    <>
      <div className="cal-head">
        <h1>{monthLabel}</h1>
        <div className="nav-btns">
          <button className="btn btn-sm btn-ghost" onClick={() => shift(-1)} aria-label="Mês anterior">←</button>
          <button className="btn btn-sm btn-ghost" onClick={() => { setMonth(today.slice(0, 7)); setSelected(today); }}>Hoje</button>
          <button className="btn btn-sm btn-ghost" onClick={() => shift(1)} aria-label="Próximo mês">→</button>
        </div>
      </div>

      <div className="cal">
        {WD.map((w) => <div key={w} className="wd">{w}</div>)}
        {cells.map((d) => {
          const list = byDay[d] ?? [];
          const conf = list.filter((b) => b.status === "confirmed").length;
          const pend = list.filter((b) => b.status === "pending").length;
          const ref = list.filter((b) => b.needs_refund).length;
          const closed = !hours[String(weekday(d))];
          return (
            <button key={d} className={`cell ${d.slice(0, 7) !== month ? "out" : ""} ${d === today ? "today" : ""} ${d === selected ? "sel" : ""} ${closed ? "closed" : ""}`}
              onClick={() => { setSelected(d); if (d.slice(0, 7) !== month) setMonth(d.slice(0, 7)); }}>
              <span className="n">{Number(d.slice(8))}</span>
              <span className="badges">
                {conf > 0 && <span className="bdg" title="Confirmados">{conf}</span>}
                {pend > 0 && <span className="bdg pend" title="Aguardando Pix">{pend}</span>}
                {ref > 0 && <span className="bdg ref" title="Reembolsar">!</span>}
              </span>
            </button>
          );
        })}
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        <span className="bdg" style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: "var(--gold)", color: "#141414", fontWeight: 700 }}>n</span> confirmados ·{" "}
        <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 999, background: "var(--btn)" }}>n</span> aguardando Pix
      </p>

      <section className="day-panel">
        <h2>{dayLabel(`${selected}T15:00:00Z`)}</h2>
        {bookings === null ? (
          <div className="spinner" />
        ) : dayList.length === 0 ? (
          <div className="empty">{dayOpen ? "Nenhum cliente agendado nesse dia." : "A barbearia não atende nesse dia."}</div>
        ) : (
          dayList.map((b) => (
            <article key={b.id} className="bk">
              <div className="time">
                {fmtTimeSP(b.starts_at)}
                <small>até {fmtTimeSP(b.ends_at)}</small>
              </div>
              <div>
                <div className="who">{b.customer_name}</div>
                <div className="svc">{b.services.join(" + ")} · {fmtDuration(b.duration_min)}</div>
                <div className="tags">
                  {b.status === "confirmed" && <span className="tag ok">Sinal pago {brl(b.deposit_cents)}</span>}
                  {b.status === "pending" && b.claimed_at && <span className="tag wait">Cliente disse que pagou às {fmtTimeSP(b.claimed_at)}: confira o banco</span>}
                  {b.status === "pending" && !b.claimed_at && <span className="tag wait">Aguardando Pix até {b.expires_at ? fmtTimeSP(b.expires_at) : "-"}</span>}
                  {b.needs_refund && <span className="tag bad">Pagou fora do prazo: devolver {brl(b.deposit_cents)}</span>}
                  <span className="tag">Total {brl(b.total_cents)} · falta {brl(b.total_cents - b.deposit_cents)}</span>
                  <span className="tag">{fmtPhone(b.customer_phone)}</span>
                  {b.notified_at && <span className="tag">Avisado às {fmtTimeSP(b.notified_at)}</span>}
                </div>
                <div className="actions">
                  {(b.status === "confirmed" || b.status === "pending") && (
                    <>
                      <select value={tpl[b.id] ?? 0} onChange={(e) => setTpl({ ...tpl, [b.id]: Number(e.target.value) })} aria-label="Mensagem">
                        {TEMPLATES.map((t, i) => <option key={t.label} value={i}>{t.label}</option>)}
                      </select>
                      <button className="btn btn-sm btn-wa" onClick={() => notify(b)}>Avisar pelo WhatsApp</button>
                    </>
                  )}
                  {b.status === "pending" && (
                    <button className="btn btn-sm" onClick={() => act(b, "confirm", "Confirmar que o sinal foi recebido?")}>Confirmar sinal</button>
                  )}
                  {(b.status === "confirmed" || b.status === "pending") && (
                    <button className="btn btn-sm btn-ghost" onClick={() => act(b, "cancel", `Cancelar o horário de ${b.customer_name}? O horário volta a ficar livre.`)}>Cancelar</button>
                  )}
                  {b.needs_refund && (
                    <button className="btn btn-sm btn-ghost" onClick={() => act(b, "refunded", "Marcar como reembolsado?")}>Já devolvi</button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
