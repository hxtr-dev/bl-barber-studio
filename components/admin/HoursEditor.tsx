"use client";
import { useEffect, useState } from "react";
import { WEEKDAYS } from "@/lib/content";
import type { BookingSettings, Hours } from "@/lib/types";

const H = Array.from({ length: 25 }, (_, i) => i);
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function HoursEditor() {
  const [hours, setHours] = useState<Hours | null>(null);
  const [booking, setBooking] = useState<BookingSettings | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" }).then(async (r) => {
      if (r.status === 401) return (window.location.href = "/admin/login");
      const d = await r.json();
      setHours(d.hours);
      setBooking(d.booking);
    });
  }, []);

  async function save() {
    const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hours, booking }) });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Horários salvos" : d.error || "Erro ao salvar");
    setTimeout(() => setMsg(null), 2500);
  }

  if (!hours || !booking) return <div className="spinner" />;

  return (
    <>
      <h1>Horário de atendimento</h1>
      <p className="muted">Os clientes só conseguem agendar nesses horários. Cada atendimento ocupa horas cheias (1h30 ocupa 2 horários).</p>
      <div className="hours-edit">
        {ORDER.map((d) => {
          const v = hours[String(d)];
          return (
            <div key={d} className="h-row">
              <b>{WEEKDAYS[d]}</b>
              <label className="check">
                <input type="checkbox" checked={Boolean(v)} onChange={(e) => setHours({ ...hours, [d]: e.target.checked ? { open: 10, close: 18 } : null })} />
                {v ? "Aberto" : "Fechado"}
              </label>
              {v && (
                <div className="times">
                  <select value={v.open} onChange={(e) => setHours({ ...hours, [d]: { ...v, open: Number(e.target.value) } })}>
                    {H.slice(0, 24).map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
                  </select>
                  às
                  <select value={v.close} onChange={(e) => setHours({ ...hours, [d]: { ...v, close: Number(e.target.value) } })}>
                    {H.slice(1).map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 22, marginTop: 36 }}>Regras do agendamento</h2>
      <div className="form-grid" style={{ maxWidth: 620, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="inp">
          <label>Dias à frente</label>
          <input type="number" min={1} max={120} value={booking.daysAhead} onChange={(e) => setBooking({ ...booking, daysAhead: Number(e.target.value) })} />
        </div>
        <div className="inp">
          <label>Prazo do Pix (min)</label>
          <input type="number" min={5} max={120} value={booking.holdMinutes} onChange={(e) => setBooking({ ...booking, holdMinutes: Number(e.target.value) })} />
        </div>
        <div className="inp">
          <label>Antecedência (min)</label>
          <input type="number" min={0} max={1440} value={booking.minNoticeMinutes} onChange={(e) => setBooking({ ...booking, minNoticeMinutes: Number(e.target.value) })} />
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <button className="btn btn-gold" onClick={save}>Salvar horários</button>
      </div>
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
