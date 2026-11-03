import { hasDatabase, query } from "./db";
import { DEFAULT_BOOKING, DEFAULT_HOURS, DEFAULT_SERVICES } from "./defaults";
import type { BookingSettings, Hours, Service } from "./types";

export async function getServices(includeInactive = false): Promise<Service[]> {
  if (!hasDatabase()) return DEFAULT_SERVICES;
  try {
    return await query<Service>(
      `select id, name, description, duration_min, price_cents, icon, active, sort
         from services ${includeInactive ? "" : "where active"} order by sort, id`,
    );
  } catch (e) {
    console.error("getServices", e);
    if (includeInactive) throw e;
    return DEFAULT_SERVICES;
  }
}

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!hasDatabase()) return fallback;
  try {
    const rows = await query<{ value: T }>("select value from settings where key = $1", [key]);
    return rows[0] ? { ...fallback, ...rows[0].value } : fallback;
  } catch (e) {
    console.error("getSetting", key, e);
    return fallback;
  }
}

export const getHours = () => getSetting<Hours>("hours", DEFAULT_HOURS);
export const getBookingSettings = () => getSetting<BookingSettings>("booking", DEFAULT_BOOKING);
