import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";
import { getBookingSettings, getHours, getServices } from "@/lib/data";
import { paymentMode } from "@/lib/infinitepay";
import { todaySP } from "@/lib/time";
import "./agendar.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Agendar meu estilo" };

export default async function AgendarPage() {
  const [services, hours, settings] = await Promise.all([getServices(), getHours(), getBookingSettings()]);
  return <BookingFlow services={services} hours={hours} daysAhead={settings.daysAhead} holdMinutes={settings.holdMinutes} today={todaySP()} mode={paymentMode()} />;
}
