"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin", "Agenda"],
  ["/admin/servicos", "Serviços"],
  ["/admin/horarios", "Horários"],
];

export function AdminNav() {
  const path = usePathname();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return (
    <header className="adm-top">
      <div className="container">
        <Link href="/admin" className="brand">
          <img src="/logo-badge-160.png" alt="" />
          <span>Painel <b>BL</b></span>
        </Link>
        <nav>
          {items.map(([href, label]) => (
            <Link key={href} href={href} className={path === href || path === href.replace("/admin", "") || (href === "/admin" && path === "/") ? "on" : ""}>
              {label}
            </Link>
          ))}
          <button onClick={logout}>Sair</button>
        </nav>
      </div>
    </header>
  );
}
