"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { brl, depositOf } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";
import { addDays, blocksFor, fmtDateBR, fmtDuration, hourLabel, weekday } from "@/lib/time";
import type { Hours, Service } from "@/lib/types";
import { Icon } from "./Icon";
import { Stepper } from "./Stepper";

type Slot = { time: string; hour: number; available: boolean };
const WD = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const KEY = "bl-agendamento";

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
}

export function BookingFlow(props: { services: Service[]; hours: Hours; daysAhead: number; holdMinutes: number; today: string }) {
  const { services, hours, daysAhead, holdMinutes, today } = props;
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<number[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reload, setReload] = useState(0);

  // Mantém o que a pessoa escolheu se ela voltar do pagamento
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) || "null");
      if (s) {
        setSelected((s.selected || []).filter((id: number) => services.some((x) => x.id === id)));
        setName(s.name || "");
        setPhone(s.phone || "");
      }
    } catch {}
  }, [services]);
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ selected, name, phone }));
    } catch {}
  }, [selected, name, phone]);

  const chosen = useMemo(() => services.filter((s) => selected.includes(s.id)), [services, selected]);
  const minutes = chosen.reduce((a, s) => a + s.duration_min, 0);
  const total = chosen.reduce((a, s) => a + s.price_cents, 0);
  const deposit = depositOf(total);
  const blocks = blocksFor(minutes || 60);

  const days = useMemo(
    () => Array.from({ length: daysAhead + 1 }, (_, i) => addDays(today, i)).map((d) => ({ date: d, open: Boolean(hours[String(weekday(d))]) })),
    [today, daysAhead, hours],
  );

  // Carrega horários livres sempre que muda o dia ou a duração
  useEffect(() => {
    if (!date || !minutes) {
      setSlots(null);
      return;
    }
    let alive = true;
    setSlots(null);
    fetch(`/api/availability?date=${date}&minutes=${minutes}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setSlots(d.slots ?? []);
        if (hour !== null && !(d.slots ?? []).some((s: Slot) => s.hour === hour && s.available)) setHour(null);
      })
      .catch(() => alive && setSlots([]));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, minutes, reload]);

  const toggle = (id: number) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const phoneOk = Boolean(normalizePhone(phone));
  const nameOk = name.trim().length >= 2;
  const canNext = step === 1 ? chosen.length > 0 && date && hour !== null : step === 2 ? phoneOk && nameOk : true;

  const go = (n: 1 | 2 | 3) => {
    setError(null);
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function pay() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceIds: selected, date, hour, name, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível agendar.");
        if (res.status === 409) {
          setHour(null);
          setReload((r) => r + 1); // recarrega horários
          setTimeout(() => go(1), 1800);
        }
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      setError("Sem conexão. Tente novamente.");
    } finally {
      setSending(false);
    }
  }

  const next = () => {
    if (step === 1) go(2);
    else if (step === 2) {
      setTouched(true);
      if (phoneOk && nameOk) go(3);
    } else pay();
  };

  return (
    <div className="book-wrap">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="book-top">
          {step === 1 ? (
            <Link href="/" className="back">← Voltar ao site</Link>
          ) : (
            <button className="back btn-link" onClick={() => go((step - 1) as 1 | 2)} style={{ background: "none", border: 0, color: "var(--grey)", cursor: "pointer", padding: 0 }}>
              ← Voltar
            </button>
          )}
          <Link href="/" aria-label="BL Barber Studio">
            <img src="/logo-badge-160.png" alt="BL Barber Studio" width={52} height={52} />
          </Link>
        </div>

        <Stepper step={step} />

        {step === 1 && (
          <>
            <h1 className="book-title shimmer">Agendar meu estilo</h1>
            <p className="book-sub">Escolha os serviços, o dia e o horário.</p>

            <div className="panel">
              <h3><span className="num">1</span> Serviços</h3>
              <div className="svc-list">
                {services.map((s) => (
                  <button key={s.id} type="button" className={`svc ${selected.includes(s.id) ? "on" : ""}`} onClick={() => toggle(s.id)} aria-pressed={selected.includes(s.id)}>
                    <Icon name={selected.includes(s.id) ? "check" : s.icon} />
                    <span>
                      <b>{s.name}</b>
                      <small>{fmtDuration(s.duration_min)}</small>
                    </span>
                    <span className="price">{brl(s.price_cents)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel" style={{ opacity: chosen.length ? 1 : 0.5 }}>
              <h3><span className="num">2</span> Dia</h3>
              <div className="days">
                {days.map((d) => {
                  const [, m, dd] = d.date.split("-");
                  return (
                    <button key={d.date} type="button" className={`day ${date === d.date ? "on" : ""}`} disabled={!d.open || !chosen.length}
                      onClick={() => { setDate(d.date); setHour(null); }}>
                      <small>{d.date === today ? "Hoje" : WD[weekday(d.date)]}</small>
                      <b>{Number(dd)}</b>
                      <span>{MONTHS[Number(m) - 1]}</span>
                    </button>
                  );
                })}
              </div>
              {!chosen.length && <p className="muted">Escolha pelo menos um serviço para ver os dias.</p>}
            </div>

            {date && chosen.length > 0 && (
              <div className="panel">
                <h3><span className="num">3</span> Horário</h3>
                <p className="muted">
                  Seu atendimento dura {fmtDuration(minutes)} e reserva {blocks} {blocks > 1 ? "horários seguidos" : "horário"}.
                </p>
                {slots === null ? (
                  <div className="slots">{Array.from({ length: 8 }, (_, i) => <div key={i} className="skeleton" />)}</div>
                ) : slots.length === 0 ? (
                  <p className="muted">Não há horários para esse dia. Escolha outro.</p>
                ) : !slots.some((s) => s.available) ? (
                  <p className="muted">Esse dia está lotado. Escolha outro dia.</p>
                ) : (
                  <div className="slots">
                    {slots.map((s) => (
                      <button key={s.time} type="button" disabled={!s.available}
                        className={`slot ${hour === s.hour ? "on" : ""} ${hour !== null && s.hour > hour && s.hour < hour + blocks ? "in-range" : ""}`}
                        onClick={() => setHour(s.hour)}>
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="book-title shimmer">Seus dados</h1>
            <p className="book-sub">Usamos seu WhatsApp só para falar sobre o seu horário.</p>
            <div className="panel">
              <form onSubmit={(e) => { e.preventDefault(); next(); }}>
                <div className="field">
                  <label htmlFor="nome">Nome</label>
                  <input id="nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você quer ser chamado" maxLength={80} />
                  {touched && !nameOk && <span className="err">Informe seu nome.</span>}
                </div>
                <div className="field">
                  <label htmlFor="whats">WhatsApp com DDD</label>
                  <input id="whats" type="tel" inputMode="numeric" autoComplete="tel-national" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(11) 90000-0000" />
                  {touched && !phoneOk && <span className="err">Informe um número de WhatsApp válido com DDD.</span>}
                </div>
                <button type="submit" hidden />
              </form>
            </div>
          </>
        )}

        {step === 3 && date && hour !== null && (
          <>
            <h1 className="book-title shimmer">Pagamento</h1>
            <p className="book-sub">Pague 50% no Pix para confirmar o seu horário.</p>
            {error && <div className="alert">{error}</div>}
            <div className="panel">
              <div className="summary">
                <div className="row"><span>Serviços</span><span>{chosen.map((s) => s.name).join(" + ")}</span></div>
                <div className="row"><span>Dia</span><span>{fmtDateBR(date)} ({WD[weekday(date)]})</span></div>
                <div className="row"><span>Horário</span><span>{hourLabel(hour)} às {hourLabel(hour + blocks)}</span></div>
                <div className="row"><span>Cliente</span><span>{name.trim()} · {phone}</span></div>
                <div className="row"><span>Valor total</span><span>{brl(total)}</span></div>
                <div className="row big"><span>Sinal agora (50%)</span><span>{brl(deposit)}</span></div>
                <div className="row"><span>Pagar na barbearia</span><span>{brl(total - deposit)}</span></div>
              </div>
            </div>
            <div className="info">
              Você será levado para a página segura da InfinitePay para pagar com Pix. O horário fica reservado por {holdMinutes} minutos
              enquanto você paga. Depois disso, ele volta a ficar livre.
            </div>
          </>
        )}
      </div>

      <div className="bottom-bar">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="tot">
            {chosen.length ? (
              <>
                {fmtDuration(minutes)} · {chosen.length} {chosen.length > 1 ? "serviços" : "serviço"}
                <b>{brl(total)} <em>· sinal {brl(deposit)}</em></b>
              </>
            ) : (
              <>Nenhum serviço escolhido<b>R$ 0,00</b></>
            )}
          </div>
          <button className={`btn ${step === 3 ? "btn-gold" : ""}`} disabled={!canNext || sending} onClick={next}>
            {step === 3 ? (sending ? "Gerando Pix..." : `Pagar ${brl(deposit)} no Pix`) : "Continuar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
