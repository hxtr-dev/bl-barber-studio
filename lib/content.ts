// Dados fixos do cliente. Altere aqui para mudar textos de contato.
export const BUSINESS = {
  name: "BL Barber Studio",
  city: "Carapicuíba - SP",
  whatsapp: "5511937065020", // com DDI 55
  whatsappLabel: "(11) 93706-5020",
  instagram: "biel_____barber",
  instagramUrl: "https://www.instagram.com/biel_____barber/",
  slogan: "Seu estilo, nosso compromisso",
  tagline: ["Estilo", "Respeito", "Confiança"],
};

/**
 * Animação principal (corte no scroll).
 * Quando o Biel gravar o vídeo, gere os quadros (veja o README) em public/hero/
 * e coloque aqui a quantidade. Com 0, o site usa a animação com a foto do corte.
 */
export const HERO_FRAMES = {
  count: 0,
  pattern: (i: number) => `/hero/frame-${String(i + 1).padStart(3, "0")}.webp`,
};

/**
 * Pares de fotos antes/depois para o slider. Coloque as imagens em public/galeria/.
 * Enquanto a lista estiver vazia, o slider não aparece.
 */
export const BEFORE_AFTER: { before: string; after: string; label: string }[] = [];

export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
