-- Migration: Create tables for dynamic game configuration
-- 20240108_game_config_tables.sql

-- 1. Game Upgrades
create table if not exists public.game_upgrades (
  id text primary key,
  name text not null,
  description text,
  base_price numeric not null,
  base_power numeric not null,
  type text not null, -- 'cps', 'click', 'multiplier'
  icon_name text, -- Store icon name as string (e.g. 'Activity')
  color text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.game_upgrades enable row level security;
create policy "Public read access" on public.game_upgrades for select using (true);
create policy "Admin write access" on public.game_upgrades for all using (
  auth.jwt() ->> 'role' = 'service_role' or
  (select rolname from pg_roles where oid = auth.uid()) = 'postgres' -- Fallback 
  -- Ideally use a custom claim or 'admin' table check
);

-- 2. Game Missions
create table if not exists public.game_missions (
  id text primary key,
  name text not null,
  description text,
  requirement_type text not null,
  requirement_value numeric not null,
  requirement_metadata jsonb, -- For extra fields like 'url' or 'upgradeId'
  reward_coins numeric default 0,
  reward_xp numeric default 0,
  reward_card_id text,
  icon_name text,
  category text,
  created_at timestamptz default now()
);

alter table public.game_missions enable row level security;
create policy "Public read access" on public.game_missions for select using (true);
create policy "Admin write access" on public.game_missions for all using (auth.jwt() ->> 'role' = 'service_role');

-- 3. Game Shop Items (Skins, Items, Consumables)
create table if not exists public.game_shop_items (
  id text primary key,
  name text not null,
  type text not null, -- 'skin', 'item', 'boost', 'consumable'
  description text,
  price_coins numeric default 0,
  price_croc numeric default 0,
  currency text default 'both',
  image_url text,
  rarity text, -- 'common', 'rare', 'legendary'
  required_level int default 1,
  effect_data jsonb, -- Stores the specific effect details
  created_at timestamptz default now()
);

alter table public.game_shop_items enable row level security;
create policy "Public read access" on public.game_shop_items for select using (true);
create policy "Admin write access" on public.game_shop_items for all using (auth.jwt() ->> 'role' = 'service_role');

-- 4. Game Cards
create table if not exists public.game_cards (
  id text primary key,
  name text not null,
  description text,
  rarity text,
  icon_name text,
  color text,
  effect_type text,
  effect_value numeric,
  created_at timestamptz default now()
);

alter table public.game_cards enable row level security;
create policy "Public read access" on public.game_cards for select using (true);
create policy "Admin write access" on public.game_cards for all using (auth.jwt() ->> 'role' = 'service_role');
