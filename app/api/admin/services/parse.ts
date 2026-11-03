const ICONS = ["tesoura", "barba", "sobrancelha", "navalha", "estrela", "pente"];

export function parseService(b: Record<string, unknown>) {
  const name = String(b.name ?? "").trim();
  const description = String(b.description ?? "").trim().slice(0, 200);
  const duration_min = Math.round(Number(b.duration_min));
  const price_cents = Math.round(Number(b.price_cents));
  const icon = ICONS.includes(String(b.icon)) ? String(b.icon) : "tesoura";
  const active = b.active === undefined ? true : Boolean(b.active);
  if (name.length < 2 || name.length > 60) return { error: "Nome do serviço inválido" };
  if (!Number.isFinite(duration_min) || duration_min < 5 || duration_min > 600) return { error: "Duração deve ser entre 5 e 600 minutos" };
  if (!Number.isFinite(price_cents) || price_cents < 0 || price_cents > 10_000_00) return { error: "Valor inválido" };
  return { name, description, duration_min, price_cents, icon, active };
}
