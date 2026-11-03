// Todo horário da barbearia é de São Paulo (UTC-3, sem horário de verão desde 2019).
export const TZ = "America/Sao_Paulo";
export const OFFSET = "-03:00";

/** "2026-11-03" de hoje em São Paulo. */
export function todaySP(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

/** Instante de início de um horário em São Paulo. */
export function spInstant(date: string, hour: number): Date {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:00:00${OFFSET}`);
}

/** Quantas horas cheias um atendimento ocupa (1h30 ocupa 2 horários). */
export function blocksFor(minutes: number): number {
  return Math.max(1, Math.ceil(minutes / 60));
}

export function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime());
}

export function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function fmtDateBR(date: string) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

export function fmtTimeSP(d: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function dateSP(d: Date | string) {
  return todaySP(new Date(d));
}

export function fmtDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
