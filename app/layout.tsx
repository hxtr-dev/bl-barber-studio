import type { Metadata, Viewport } from "next";
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";

const display = Playfair_Display({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans" });

// Endereço público do site, usado na prévia de links (WhatsApp, Instagram...).
// Sem SITE_URL, usa o endereço de produção que a própria Vercel informa.
const site = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

const ogImage = { url: "/og.jpg?v=2", width: 1200, height: 630, alt: "Logo da BL Barber Studio" };

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "BL Barber Studio | Barbearia em Carapicuíba", template: "%s | BL Barber Studio" },
  description:
    "Corte masculino, barba e sobrancelha em Carapicuíba - SP. Veja os preços, o horário de atendimento e agende seu horário online com Pix.",
  openGraph: {
    title: "BL Barber Studio | Agende seu horário",
    description: "Mais que um corte. Sua identidade. Corte, barba e sobrancelha em Carapicuíba. Agende online.",
    url: "/",
    siteName: "BL Barber Studio",
    images: [ogImage],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BL Barber Studio | Agende seu horário",
    description: "Mais que um corte. Sua identidade. Agende online.",
    images: [ogImage.url],
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
