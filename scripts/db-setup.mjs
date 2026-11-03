// Cria as tabelas no banco apontado por DATABASE_URL.
// Uso: DATABASE_URL="..." npm run db:setup   (ou com o .env.local preenchido)
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.DATABASE_URL) {
  console.error("Defina DATABASE_URL (veja .env.example).");
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
const { rows } = await client.query("select count(*)::int as n from services");
console.log(`Banco pronto. Serviços cadastrados: ${rows[0].n}`);
await client.end();
