// "Pix copia e cola" estático (BR Code do Banco Central) com o valor do sinal.
// O banco não avisa o site quando o cliente paga: o Biel confirma no painel.
import QRCode from "qrcode";

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(str: string) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const clean = (s: string, max: number) =>
  String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .slice(0, max)
    .trim();

export function pixConfig() {
  let key = (process.env.PIX_KEY || "").trim();
  // CPF/CNPJ com pontos e traço: o Pix usa só os números.
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(key) || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(key)) key = key.replace(/\D/g, "");
  if (!key) return null;
  return {
    key,
    name: clean(process.env.PIX_NAME || "BL Barber Studio", 25) || "BL Barber Studio",
    city: clean(process.env.PIX_CITY || "Carapicuiba", 15) || "Carapicuiba",
  };
}

export function buildPix(p: { key: string; name: string; city: string; cents: number; txid: string }) {
  const body =
    field("00", "01") +
    field("26", field("00", "br.gov.bcb.pix") + field("01", p.key)) +
    field("52", "0000") +
    field("53", "986") +
    field("54", (p.cents / 100).toFixed(2)) +
    field("58", "BR") +
    field("59", p.name) +
    field("60", p.city) +
    field("62", field("05", clean(p.txid, 25) || "***")) +
    "6304";
  return body + crc16(body);
}

export async function pixForBooking(code: string, cents: number) {
  const cfg = pixConfig();
  if (!cfg) return null;
  const copiaECola = buildPix({ ...cfg, cents, txid: code.replace(/-/g, "") });
  const qr = await QRCode.toDataURL(copiaECola, { margin: 1, width: 520, errorCorrectionLevel: "M" });
  return { copiaECola, qr, name: cfg.name };
}
