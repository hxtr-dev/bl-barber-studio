import type { BookingSettings, Hours, Service } from "./types";

export const DEFAULT_SERVICES: Service[] = [
  { id: 1, name: "Corte Masculino", description: "Técnica e estilo, do degradê ao social.", duration_min: 60, price_cents: 3000, icon: "tesoura", active: true, sort: 1 },
  { id: 2, name: "Barba", description: "Modelagem e acabamento com navalha.", duration_min: 30, price_cents: 2000, icon: "barba", active: true, sort: 2 },
  { id: 3, name: "Sobrancelha", description: "Alinhamento que deixa o visual ainda melhor.", duration_min: 30, price_cents: 1500, icon: "sobrancelha", active: true, sort: 3 },
];

export const DEFAULT_HOURS: Hours = {
  "0": null,
  "1": { open: 10, close: 18 },
  "2": { open: 10, close: 18 },
  "3": { open: 10, close: 18 },
  "4": { open: 10, close: 18 },
  "5": { open: 10, close: 18 },
  "6": { open: 10, close: 18 },
};

export const DEFAULT_BOOKING: BookingSettings = { daysAhead: 30, holdMinutes: 20, minNoticeMinutes: 60 };
