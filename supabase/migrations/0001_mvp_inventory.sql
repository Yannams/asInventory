create extension if not exists pgcrypto;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  reference text not null unique,
  unit text not null default 'piece',
  alert_threshold integer not null default 0 check (alert_threshold >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  type text not null check (type in ('entry', 'output')),
  quantity integer not null check (quantity > 0),
  actor text not null,
  source text,
  condition text check (condition in ('new', 'good', 'maintenance', 'used') or condition is null),
  note text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.articles
  add column if not exists brand_id uuid references public.brands(id) on delete set null,
  add column if not exists category_id uuid references public.categories(id) on delete set null;

alter table if exists public.articles
  drop column if exists location;

alter table if exists public.stock_movements
  drop column if exists location;

create index if not exists categories_brand_id_idx
  on public.categories(brand_id);

create index if not exists articles_brand_id_idx
  on public.articles(brand_id);

create index if not exists articles_category_id_idx
  on public.articles(category_id);

create index if not exists stock_movements_article_id_idx
  on public.stock_movements(article_id);

create index if not exists stock_movements_created_at_idx
  on public.stock_movements(created_at desc);

alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "Authenticated users can read brands" on public.brands;
drop policy if exists "Authenticated users can insert brands" on public.brands;
drop policy if exists "Authenticated users can update brands" on public.brands;
drop policy if exists "Authenticated users can delete brands" on public.brands;
drop policy if exists "Authenticated users can read categories" on public.categories;
drop policy if exists "Authenticated users can insert categories" on public.categories;
drop policy if exists "Authenticated users can update categories" on public.categories;
drop policy if exists "Authenticated users can delete categories" on public.categories;
drop policy if exists "Authenticated users can read articles" on public.articles;
drop policy if exists "Authenticated users can insert articles" on public.articles;
drop policy if exists "Authenticated users can update articles" on public.articles;
drop policy if exists "Authenticated users can read stock movements" on public.stock_movements;
drop policy if exists "Authenticated users can insert stock movements" on public.stock_movements;

create policy "Authenticated users can read brands"
  on public.brands
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert brands"
  on public.brands
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update brands"
  on public.brands
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete brands"
  on public.brands
  for delete
  to authenticated
  using (true);

create policy "Authenticated users can read categories"
  on public.categories
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert categories"
  on public.categories
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update categories"
  on public.categories
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete categories"
  on public.categories
  for delete
  to authenticated
  using (true);

create policy "Authenticated users can read articles"
  on public.articles
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert articles"
  on public.articles
  for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update articles"
  on public.articles
  for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read stock movements"
  on public.stock_movements
  for select
  to authenticated
  using (true);

create policy "Authenticated users can insert stock movements"
  on public.stock_movements
  for insert
  to authenticated
  with check (true);
