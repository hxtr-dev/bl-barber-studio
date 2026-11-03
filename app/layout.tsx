import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

const site = (process.env.SITE_URL || "https://blbarberstudio.com.br").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "BL Barber Studio | Barbearia em Carapicuíba", template: "%s | BL Barber Studio" },
  description:
    "Corte masculino, barba e sobrancelha em Carapicuíba - SP. Veja os preços, o horário de atendimento e agende seu horário online com Pix.",
  openGraph: {
    title: "BL Barber Studio",
    description: "Mais que um corte. Sua identidade. Agende seu horário online.",
    images: ["/og.jpg"],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0b0b0c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
