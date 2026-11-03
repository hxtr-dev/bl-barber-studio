# BL Barber Studio

Site de agendamento da BL Barber Studio (Carapicuíba - SP).

- **Site do cliente** (`/`): apresentação, serviços, tabela de preços, horário de atendimento, contato e o botão
  "Agendar meu estilo" depois de cada parte.
- **Agendamento** (`/agendar`): 3 etapas (✂ serviços, dia e horário → 👤 nome e WhatsApp → Pix), com a barra dourada
  "carregando" até a etapa atual. O cliente paga **50% de sinal** pela InfinitePay para confirmar.
- **Painel do ADM** (`/admin` ou `admin.blbarberstudio.com.br`): calendário do mês, clientes de cada dia,
  botão "Avisar pelo WhatsApp", confirmar/cancelar, cadastro de serviços e horário de atendimento.

Feito com Next.js (Vercel) e Postgres (Neon).

## Regra dos horários

Cada atendimento ocupa **horas cheias, arredondando para cima**. Exemplo: Vitor marca corte (1h) + sobrancelha (30 min)
às 14:00 = 1h30, então ele ocupa 14:00 e 15:00 e o próximo cliente só consegue 16:00.

A regra é garantida pelo próprio banco (`exclude using gist` em `db/schema.sql`): mesmo que duas pessoas cliquem no
mesmo horário ao mesmo tempo, só uma consegue. O horário fica reservado por 20 minutos enquanto o cliente paga o Pix
(dá para mudar no painel). Se ele pagar depois disso e outra pessoa já tiver pego o horário, o painel mostra
"Pagou fora do prazo: devolver" para o Biel fazer o estorno pelo app da InfinitePay.

## Colocar no ar (uma vez só)

### 1. Banco Neon
1. Crie uma conta em https://neon.tech e um projeto (região **São Paulo / sa-east-1**).
2. Em **Connect**, copie a connection string com **Pooled connection** ligado.
3. Crie as tabelas: abra o **SQL Editor** do Neon, cole todo o conteúdo de `db/schema.sql` e clique em **Run**.
   (Ou, no computador: `DATABASE_URL="..." npm run db:setup`.)

### 2. InfinitePay
1. No app ou site da InfinitePay, vá em **Configurações do Checkout** e ligue **Habilitar checkout integrado**.
2. Anote a sua **InfiniteTag** (sem o `$`).
3. Observação: a InfinitePay sempre deixa o cartão ligado junto com o Pix; não dá para aceitar só Pix pela API.

### 3. Vercel
1. Em https://vercel.com → **Add New → Project**, importe o repositório `bl-barber-studio`.
2. Em **Environment Variables**, preencha (modelo em `.env.example`):

| Variável | O que é |
|---|---|
| `DATABASE_URL` | connection string do Neon |
| `SITE_URL` | `https://blbarberstudio.com.br` (ou o endereço `.vercel.app` enquanto o domínio não estiver pronto) |
| `ADMIN_PASSWORD` | senha do painel do Biel |
| `ADMIN_SECRET` | texto aleatório longo (ex.: gere em https://www.uuidgenerator.net e junte dois) |
| `INFINITEPAY_HANDLE` | InfiniteTag sem o `$` |
| `PAYMENT_MODE` | `real` (use `teste` só para testar sem pagar) |

3. Clique em **Deploy**.
4. Domínio: em **Settings → Domains**, adicione `blbarberstudio.com.br` e `admin.blbarberstudio.com.br`
   e siga as instruções de DNS que a Vercel mostrar (no Registro.br, em **DNS**).

### Testar sem pagar
Com `PAYMENT_MODE="teste"`, o último passo mostra um botão **Simular pagamento do sinal**. Nunca deixe assim no ar.

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # e preencha
npm run db:setup
npm run dev                  # http://localhost:3000
```

## Animação "corte no scroll"

Hoje a animação usa a foto do degradê (`public/corte.webp`). Quando o Biel gravar um vídeo curto de um corte
(de costas, câmera parada, 5 a 10 segundos), gere os quadros e troque a animação:

```bash
mkdir -p public/hero
ffmpeg -i corte.mp4 -vf "fps=15,scale=720:-2" -q:v 70 public/hero/frame-%03d.webp
ls public/hero | wc -l   # quantidade de quadros
```

Depois coloque essa quantidade em `HERO_FRAMES.count`, no arquivo `lib/content.ts`.

## Fotos de antes e depois

Coloque as fotos em `public/galeria/` e adicione os pares em `BEFORE_AFTER` (`lib/content.ts`).
A seção com o slider de arrastar aparece sozinha quando houver pelo menos um par.

## Onde mudar cada coisa

- Textos de contato, Instagram e WhatsApp: `lib/content.ts`
- Textos do site: `app/page.tsx`
- Cores: topo de `app/globals.css`
- Serviços, preços, duração e horário de atendimento: pelo painel do ADM
