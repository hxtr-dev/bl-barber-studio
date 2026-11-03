export function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Sinal de 50%, arredondado para cima no centavo. */
export function depositOf(totalCents: number) {
  return Math.ceil(totalCents / 2);
}
