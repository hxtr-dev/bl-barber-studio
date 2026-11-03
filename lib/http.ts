import { NextResponse } from "next/server";
import { isAdmin } from "./auth";
import { BookingError } from "./booking";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export function fail(e: unknown) {
  if (e instanceof BookingError) return json({ error: e.message }, e.status);
  console.error(e);
  return json({ error: "Algo deu errado. Tente de novo em instantes." }, 500);
}

export async function guardAdmin() {
  if (!(await isAdmin())) return json({ error: "Não autorizado" }, 401);
  return null;
}
