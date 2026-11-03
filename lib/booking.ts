import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { isOverlapError, query, tx } from "./db";
import { getBookingSettings, getHours, getServices } from "./data";
import { depositOf } from "./money";
import { addDays, blocksFor, isValidDate, spInstant, todaySP, weekday } from "./time";
import type { Service } from "./types";

export class BookingError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Libera horários de quem não pagou o sinal dentro do prazo. */
export async function expireStale(c?: PoolClient) {
  const sql = `update bookings set status = 'expired'
                where status = 'pending' and expires_at is not null and expires_at < now()`;
  if (c) await c.query(sql);
  else await query(sql);
}

export type Slot = { time: string; hour: number; available: boolean };

/** Horários de um dia para um atendimento de `minutes` minutos. */
export async function availability(date: string, minutes: number): Promise<{ open: boolean; slots: Slot[] }> {
  if (!isValidDate(date)) throw new BookingError("Data inválida");
  const [hours, settings] = await Promise.all([getHours(), getBookingSettings()]);
  const today = todaySP();
  if (date < today || date > addDays(today, settings.daysAhead)) return { open: false, slots: [] };
  const day = hours[String(weekday(date))];
  if (!day) return { open: false, slots: [] };

  await expireStale();
  const dayStart = spInstant(date, 0);
  const dayEnd = spInstant(addDays(date, 1), 0);
  const busy = await query<{ starts_at: Date; ends_at: Date }>(
    `select starts_at, ends_at from bookings
      where status in ('pending','confirmed') and starts_at < $2 and ends_at > $1`,
    [dayStart, dayEnd],
  );

  const blocks = blocksFor(minutes);
  const earliest = Date.now() + settings.minNoticeMinutes * 60_000;
  const slots: Slot[] = [];
  for (let h = day.open; h + blocks <= day.close; h++) {
    const s = spInstant(date, h).getTime();
    const e = s + blocks * 3_600_000;
    const taken = busy.some((b) => new Date(b.starts_at).getTime() < e && new Date(b.ends_at).getTime() > s);
    slots.push({ time: `${String(h).padStart(2, "0")}:00`, hour: h, available: !taken && s >= earliest });
  }
  return { open: true, slots };
}

export type NewBooking = {
  serviceIds: number[];
  date: string;
  hour: number;
  name: string;
  phone: string; // já normalizado
};

export async function createBooking(input: NewBooking) {
  const ids = [...new Set(input.serviceIds.map(Number))].filter(Number.isInteger);
  if (!ids.length) throw new BookingError("Escolha pelo menos um serviço");
  const all = await getServices();
  const chosen: Service[] = ids.map((id) => all.find((s) => s.id === id)).filter(Boolean) as Service[];
  if (chosen.length !== ids.length) throw new BookingError("Serviço indisponível. Atualize a página.");

  const minutes = chosen.reduce((a, s) => a + s.duration_min, 0);
  const total = chosen.reduce((a, s) => a + s.price_cents, 0);
  const deposit = depositOf(total);
  if (deposit < 100) throw new BookingError("O valor mínimo do sinal é R$ 1,00");

  const { slots, open } = await availability(input.date, minutes);
  if (!open) throw new BookingError("A barbearia não atende nesse dia");
  const slot = slots.find((s) => s.hour === input.hour);
  if (!slot) throw new BookingError("Horário fora do expediente para esses serviços");
  if (!slot.available) throw new BookingError("Esse horário acabou de ser reservado. Escolha outro.", 409);

  const settings = await getBookingSettings();
  const startsAt = spInstant(input.date, input.hour);
  const endsAt = new Date(startsAt.getTime() + blocksFor(minutes) * 3_600_000);
  const code = `BL-${input.date.replace(/-/g, "").slice(2)}-${randomBytes(4).toString("hex").toUpperCase()}`;

  try {
    return await tx(async (c) => {
      await expireStale(c);
      const { rows } = await c.query(
        `insert into bookings (code, customer_name, customer_phone, starts_at, ends_at, duration_min,
                               total_cents, deposit_cents, status, expires_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'pending', now() + ($9 || ' minutes')::interval)
         returning id, code`,
        [code, input.name, input.phone, startsAt, endsAt, minutes, total, deposit, String(settings.holdMinutes)],
      );
      for (const s of chosen) {
        await c.query(
          `insert into booking_items (booking_id, service_id, name, duration_min, price_cents) values ($1,$2,$3,$4,$5)`,
          [rows[0].id, s.id, s.name, s.duration_min, s.price_cents],
        );
      }
      return { id: rows[0].id as string, code: rows[0].code as string, startsAt, endsAt, minutes, total, deposit, services: chosen };
    });
  } catch (e) {
    if (isOverlapError(e)) throw new BookingError("Esse horário acabou de ser reservado. Escolha outro.", 409);
    throw e;
  }
}

export type PaymentInfo = {
  paidAmountCents?: number;
  captureMethod?: string;
  transactionNsu?: string;
  invoiceSlug?: string;
  receiptUrl?: string;
};

/**
 * Confirma o agendamento depois do pagamento do sinal.
 * Se o prazo tinha vencido e outra pessoa pegou o horário, marca para reembolso.
 */
export async function confirmPayment(code: string, info: PaymentInfo) {
  return tx(async (c) => {
    const { rows } = await c.query(`select id, status from bookings where code = $1 for update`, [code]);
    const b = rows[0];
    if (!b) return { ok: false as const, reason: "not_found" };
    if (b.status === "confirmed") return { ok: true as const, status: "confirmed" };

    await c.query(
      `update bookings set paid_at = coalesce(paid_at, now()), paid_amount_cents = $2, capture_method = $3,
              transaction_nsu = $4, invoice_slug = $5, receipt_url = $6 where id = $1`,
      [b.id, info.paidAmountCents ?? null, info.captureMethod ?? null, info.transactionNsu ?? null, info.invoiceSlug ?? null, info.receiptUrl ?? null],
    );
    if (b.status === "cancelled") {
      await c.query(`update bookings set needs_refund = true where id = $1`, [b.id]);
      return { ok: false as const, reason: "cancelled" };
    }
    await c.query("savepoint confirm");
    try {
      await c.query(`update bookings set status = 'confirmed', expires_at = null, needs_refund = false where id = $1`, [b.id]);
      await c.query("release savepoint confirm");
      return { ok: true as const, status: "confirmed" };
    } catch (e) {
      if (!isOverlapError(e)) throw e;
      await c.query("rollback to savepoint confirm");
      await c.query(`update bookings set needs_refund = true where id = $1`, [b.id]);
      return { ok: false as const, reason: "slot_taken" };
    }
  });
}

export async function getBookingByCode(code: string) {
  const rows = await query<{
    id: string; code: string; customer_name: string; starts_at: Date; ends_at: Date; duration_min: number;
    total_cents: number; deposit_cents: number; status: string; needs_refund: boolean; payment_url: string | null;
    expires_at: Date | null; claimed_at: Date | null; services: string[];
  }>(
    `select b.id, b.code, b.customer_name, b.starts_at, b.ends_at, b.duration_min, b.total_cents, b.deposit_cents,
            b.status, b.needs_refund, b.payment_url, b.expires_at, b.claimed_at,
            coalesce(array_agg(i.name order by i.id) filter (where i.id is not null), '{}') as services
       from bookings b left join booking_items i on i.booking_id = b.id
      where b.code = $1 group by b.id`,
    [code],
  );
  return rows[0] ?? null;
}

/**
 * Pix no site: o cliente avisa que pagou. O horário fica segurado por mais tempo
 * (até o Biel conferir o banco e confirmar no painel).
 */
export async function claimPayment(code: string) {
  await expireStale();
  const rows = await query<{ id: string }>(
    `update bookings set claimed_at = coalesce(claimed_at, now()),
            expires_at = greatest(expires_at, now() + interval '12 hours')
      where code = $1 and status = 'pending' returning id`,
    [code],
  );
  return rows.length > 0;
}
