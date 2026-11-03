import { getServices } from "@/lib/data";
import { fail, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json({ services: await getServices() });
  } catch (e) {
    return fail(e);
  }
}
