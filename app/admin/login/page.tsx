"use client";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return setError(data.error || "Não foi possível entrar");
    window.location.href = "/admin";
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <img src="/logo-badge.webp" alt="BL Barber Studio" />
        <h1 style={{ fontSize: 26 }}>Painel do barbeiro</h1>
        <div className="inp" style={{ textAlign: "left", marginBottom: 14 }}>
          <label htmlFor="pw">Senha</label>
          <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </div>
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        <button className="btn btn-gold" style={{ width: "100%" }} disabled={!password || loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
