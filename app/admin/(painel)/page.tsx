import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { getHours } from "@/lib/data";
import { todaySP } from "@/lib/time";

export default async function AgendaPage() {
  return <AdminCalendar today={todaySP()} hours={await getHours()} />;
}
