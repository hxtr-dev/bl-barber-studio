"use client";
import { useEffect, useState } from "react";
import { ICON_OPTIONS, Icon } from "@/components/Icon";
import type { Service } from "@/lib/types";

type Draft = { name: string; description: string; duration_min: number; price: string; icon: string; active: boolean };
const empty: Draft = { name: "", description: "", duration_min: 30, price: "", icon: "tesoura", active: true };
const DURATIONS = [15, 20, 30, 40, 45, 60, 75, 90, 105, 120, 150, 180];

const toDraft = (s: Service): Draft => ({ ...s, price: (s.price_cents / 100).toFixed(2).replace(".", ",") });
const toBody = (d: Draft) => ({ ...d, price_cents: Math.round(Number(d.price.replace(/\./g, "").replace(",", ".")) * 100) });

function Fields({ d, set }: { d: Draft; set: (d: Draft) => void }) {
  const durs = DURATIONS.includes(d.duration_min) ? DURATIONS : [...DURATIONS, d.duration_min].sort((a, b) => a - b);
  return (
    <div className="form-grid">
      <div className="inp name">
        <label>Nome</label>
        <input value={d.name} onChange={(e) => set({ ...d, name: e.target.value })} maxLength={60} placeholder="Ex.: Corte + Barba" />
      </div>
      <div className="inp">
        <label>Duração</label>
        <select value={d.duration_min} onChange={(e) => set({ ...d, duration_min: Number(e.target.value) })}>
          {durs.map((m) => <option key={m} value={m}>{m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}` : `${m} min`}</option>)}
        </select>
      </div>
      <div className="inp">
        <label>Valor (R$)</label>
        <input inputMode="decimal" value={d.price} onChange={(e) => set({ ...d, price: e.target.value.replace(/[^\d,.]/g, "") })} placeholder="30,00" />
      </div>
      <div className="inp">
        <label>Ícone</label>
        <select value={d.icon} onChange={(e) => set({ ...d, icon: e.target.value })}>
          {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="inp wide">
        <label>Descrição (aparece no site)</label>
        <input value={d.description} onChange={(e) => set({ ...d, description: e.target.value })} maxLength={200} />
      </div>
    </div>
  );
}

export function ServicesEditor() {
  const [list, setList] = useState<(Service & { draft: Draft })[] | null>(null);
  const [nova, setNova] = useState<Draft>(empty);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/services", { cache: "no-store" });
    if (res.status === 401) return (window.location.href = "/admin/login");
    const data = await res.json();
    setList((data.services as Service[]).map((s) => ({ ...s, draft: toDraft(s) })));
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function save(id: number | null, d: Draft) {
    const res = await fetch(id ? `/api/admin/services/${id}` : "/api/admin/services", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toBody(d)),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setToast(data.error || "Não foi possível salvar");
    setToast(id ? "Serviço atualizado" : "Serviço criado");
    if (!id) setNova(empty);
    load();
  }

  async function remove(s: Service) {
    if (!window.confirm(`Excluir "${s.name}"? Os agendamentos já feitos continuam com o nome salvo.`)) return;
    await fetch(`/api/admin/services/${s.id}`, { method: "DELETE" });
    setToast("Serviço excluído");
    load();
  }

  return (
    <>
      <h1>Serviços</h1>
      <p className="muted">O que você mudar aqui aparece no site e no agendamento na hora. Serviços desativados somem do site.</p>

      <div className="svc-edit" style={{ borderColor: "rgba(201,162,74,.5)" }}>
        <h3 style={{ fontSize: 18 }}>Novo serviço</h3>
        <Fields d={nova} set={setNova} />
        <div className="row-actions">
          <span className="sp" />
          <button className="btn btn-sm btn-gold" disabled={nova.name.trim().length < 2 || !nova.price} onClick={() => save(null, nova)}>Criar serviço</button>
        </div>
      </div>

      {list === null ? <div className="spinner" /> : list.map((s) => (
        <div key={s.id} className={`svc-edit ${s.draft.active ? "" : "off"}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Icon name={s.draft.icon} />
            <b style={{ fontSize: 18, color: "#fff" }}>{s.name}</b>
          </div>
          <Fields d={s.draft} set={(d) => setList(list.map((x) => (x.id === s.id ? { ...x, draft: d } : x)))} />
          <div className="row-actions">
            <label className="check">
              <input type="checkbox" checked={s.draft.active} onChange={(e) => setList(list.map((x) => (x.id === s.id ? { ...x, draft: { ...x.draft, active: e.target.checked } } : x)))} />
              Ativo no site
            </label>
            <span className="sp" />
            <button className="btn btn-sm btn-ghost" onClick={() => remove(s)}>Excluir</button>
            <button className="btn btn-sm btn-gold" onClick={() => save(s.id, s.draft)}>Salvar</button>
          </div>
        </div>
      ))}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
