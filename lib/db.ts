import { Pool, type PoolClient } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __blPool: Pool | undefined;
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function pool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
  if (!globalThis.__blPool) {
    const url = process.env.DATABASE_URL;
    const local = /localhost|127\.0\.0\.1|host=\//.test(url);
    globalThis.__blPool = new Pool({
      connectionString: url,
      ssl: local ? undefined : { rejectUnauthorized: true },
      max: 5,
      idleTimeoutMillis: 10_000,
    });
  }
  return globalThis.__blPool;
}

export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []) {
  const res = await pool().query(text, params);
  return res.rows as T[];
}

export async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("begin");
    const out = await fn(c);
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Erro de violação da regra "sem horários sobrepostos". */
export function isOverlapError(e: unknown) {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23P01";
}
