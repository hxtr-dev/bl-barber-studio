// Ícones em traço (desenhados com animação nas seções)
const paths: Record<string, React.ReactNode> = {
  tesoura: (
    <>
      <circle cx="16" cy="44" r="7" />
      <circle cx="16" cy="20" r="7" />
      <path d="M22 24 L52 40" />
      <path d="M22 40 L52 24" />
      <circle cx="33" cy="32" r="1.4" />
    </>
  ),
  barba: (
    <>
      <path d="M14 18 C14 34 18 48 32 54 C46 48 50 34 50 18" />
      <path d="M22 36 C26 33 30 33 32 35 C34 33 38 33 42 36" />
      <path d="M26 44 C30 46 34 46 38 44" />
      <path d="M14 18 C20 22 24 22 26 20" />
      <path d="M50 18 C44 22 40 22 38 20" />
    </>
  ),
  sobrancelha: (
    <>
      <path d="M8 26 C16 18 26 17 30 22" />
      <path d="M56 26 C48 18 38 17 34 22" />
      <path d="M10 38 C16 32 24 32 28 38 C24 43 16 43 10 38 Z" />
      <path d="M54 38 C48 32 40 32 36 38 C40 43 48 43 54 38 Z" />
      <circle cx="19" cy="38" r="2.5" />
      <circle cx="45" cy="38" r="2.5" />
    </>
  ),
  navalha: (
    <>
      <path d="M10 40 L40 14 L50 20 L22 46 Z" />
      <path d="M22 46 L30 54 L36 50" />
      <path d="M36 50 L54 38" />
    </>
  ),
  pente: (
    <>
      <rect x="8" y="22" width="48" height="10" rx="3" />
      <path d="M12 32 V46 M18 32 V46 M24 32 V46 M30 32 V46 M36 32 V46 M42 32 V46 M48 32 V46 M52 32 V42" />
    </>
  ),
  estrela: <path d="M32 8 L39 24 L56 25 L43 36 L47 53 L32 44 L17 53 L21 36 L8 25 L25 24 Z" />,
  user: (
    <>
      <circle cx="32" cy="22" r="10" />
      <path d="M12 54 C14 42 22 36 32 36 C42 36 50 42 52 54" />
    </>
  ),
  pix: (
    <>
      <path d="M32 6 L58 32 L32 58 L6 32 Z" />
      <path d="M20 26 L28 26 L32 30 L36 26 L44 26" />
      <path d="M20 38 L28 38 L32 34 L36 38 L44 38" />
    </>
  ),
  calendario: (
    <>
      <rect x="8" y="14" width="48" height="42" rx="5" />
      <path d="M8 26 H56 M20 8 V18 M44 8 V18" />
      <path d="M18 36 H24 M30 36 H36 M42 36 H46 M18 46 H24 M30 46 H36" />
    </>
  ),
  relogio: (
    <>
      <circle cx="32" cy="32" r="24" />
      <path d="M32 18 V32 L42 38" />
    </>
  ),
  instagram: (
    <>
      <rect x="10" y="10" width="44" height="44" rx="13" />
      <circle cx="32" cy="32" r="10" />
      <circle cx="45" cy="19" r="1.6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 52 L15 41 C9 31 12 18 23 12 C34 6 48 10 54 21 C60 32 55 46 44 51 C36 55 27 54 21 50 Z" />
      <path d="M25 24 C25 33 31 40 40 41 L43 37 L38 34 L35 36 C32 35 29 32 28 29 L30 26 L27 21 Z" />
    </>
  ),
  local: (
    <>
      <path d="M32 56 C20 42 14 33 14 25 C14 15 22 8 32 8 C42 8 50 15 50 25 C50 33 44 42 32 56 Z" />
      <circle cx="32" cy="25" r="7" />
    </>
  ),
  check: <path d="M14 33 L27 46 L51 20" />,
};

export function Icon({ name, className = "icon" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {paths[name] ?? paths.tesoura}
    </svg>
  );
}

export const ICON_OPTIONS = [
  { value: "tesoura", label: "Tesoura" },
  { value: "barba", label: "Barba" },
  { value: "sobrancelha", label: "Sobrancelha" },
  { value: "navalha", label: "Navalha" },
  { value: "pente", label: "Pente" },
  { value: "estrela", label: "Estrela" },
];
