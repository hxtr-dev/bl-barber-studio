export type Service = {
  id: number;
  name: string;
  description: string;
  duration_min: number;
  price_cents: number;
  icon: string;
  active: boolean;
  sort: number;
};

/** Horário por dia da semana (0 = domingo). null = fechado. Horas cheias. */
export type Hours = Record<string, { open: number; close: number } | null>;

export type BookingSettings = {
  daysAhead: number;
  holdMinutes: number;
  minNoticeMinutes: number;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";
