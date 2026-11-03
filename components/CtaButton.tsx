import Link from "next/link";

export function CtaButton({ label = "Agendar meu estilo" }: { label?: string }) {
  return (
    <div className="cta-row">
      <Link href="/agendar" className="btn">
        {label}
        <span aria-hidden>→</span>
      </Link>
    </div>
  );
}
