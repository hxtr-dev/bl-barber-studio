"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  ["#sobre", "Sobre"],
  ["#servicos", "Serviços"],
  ["#precos", "Preços"],
  ["#horarios", "Horários"],
  ["#contato", "Contato"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        document.documentElement.style.setProperty("--scroll", String(max > 0 ? scrollY / max : 0));
        setScrolled(scrollY > 40);
      });
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="pole" aria-hidden />
      <header className={`header ${scrolled || open ? "scrolled" : ""}`}>
        <div className="container header-inner">
          <a href="#inicio" className="brand" onClick={() => setOpen(false)}>
            <img src="/logo-badge-160.png" alt="" width={44} height={44} />
            <span>
              BL Barber <b>Studio</b>
            </span>
          </a>
          <nav className={`nav ${open ? "open" : ""}`} aria-label="Menu">
            {links.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </a>
            ))}
            <Link href="/agendar" className="btn btn-sm">
              Agendar meu estilo
            </Link>
          </nav>
          <button className={`menu-btn ${open ? "open" : ""}`} aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(!open)}>
            <i />
            <i />
            <i />
          </button>
        </div>
      </header>
    </>
  );
}
