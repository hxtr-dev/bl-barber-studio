import type { Metadata } from "next";
import { Suspense } from "react";
import { Confirmation } from "@/components/Confirmation";
import "../agendar.css";

export const metadata: Metadata = { title: "Confirmação do agendamento", robots: { index: false } };

export default function ConfirmacaoPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
