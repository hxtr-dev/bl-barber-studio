-- BL Barber Studio: estrutura do banco (Neon / Postgres)
-- Pode rodar mais de uma vez sem perder dados.

create extension if not exists pgcrypto;

create table if not exists services (
  id          serial primary key,
  name        text not null,
  description text not null default '',
  duration_min integer not null check (duration_min between 5 and 600),
  price_cents integer not null check (price_cents >= 0),
  icon        text not null default 'tesoura',
  active      boolean not null default true,
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists settings (
  key   text primary key,
  value jsonb not null
);

create table if not exists bookings (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,          -- order_nsu enviado à InfinitePay
  customer_name    text not null,
  customer_phone   text not null,                 -- só dígitos, com DDD
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,          -- fim do bloco (arredondado para horas cheias)
  duration_min     integer not null,              -- soma real dos serviços
  total_cents      integer not null,
  deposit_cents    integer not null,
  status           text not null default 'pending'
                   check (status in ('pending','confirmed','cancelled','expired')),
  expires_at       timestamptz,                   -- prazo para pagar o sinal
  payment_url      text,
  paid_at          timestamptz,
  paid_amount_cents integer,
  capture_method   text,
  transaction_nsu  text,
  invoice_slug     text,
  receipt_url      text,
  needs_refund     boolean not null default false, -- pagou depois que o horário foi liberado
  notified_at      timestamptz,
  created_at       timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Regra principal: dois agendamentos ativos nunca ocupam a mesma hora.
  constraint bookings_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending','confirmed'))
);

create index if not exists bookings_starts_at_idx on bookings (starts_at);

create table if not exists booking_items (
  id           serial primary key,
  booking_id   uuid not null references bookings(id) on delete cascade,
  service_id   integer references services(id) on delete set null,
  name         text not null,
  duration_min integer not null,
  price_cents  integer not null
);

create index if not exists booking_items_booking_idx on booking_items (booking_id);

-- Serviços iniciais (só entram se a tabela estiver vazia)
insert into services (name, description, duration_min, price_cents, icon, sort)
select * from (values
  ('Corte Masculino', 'Técnica e estilo, do degradê ao social.', 60, 3000, 'tesoura', 1),
  ('Barba', 'Modelagem e acabamento com navalha.', 30, 2000, 'barba', 2),
  ('Sobrancelha', 'Alinhamento que deixa o visual ainda melhor.', 30, 1500, 'sobrancelha', 3)
) as v(name, description, duration_min, price_cents, icon, sort)
where not exists (select 1 from services);

-- Horário de atendimento padrão: segunda a sábado, 10h às 18h (0 = domingo)
insert into settings (key, value) values
  ('hours', '{"0":null,"1":{"open":10,"close":18},"2":{"open":10,"close":18},"3":{"open":10,"close":18},"4":{"open":10,"close":18},"5":{"open":10,"close":18},"6":{"open":10,"close":18}}'),
  ('booking', '{"daysAhead":30,"holdMinutes":20,"minNoticeMinutes":60}')
on conflict (key) do nothing;
