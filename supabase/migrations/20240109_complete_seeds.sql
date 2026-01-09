-- MIGRAÇIÓN COMPLETA: Tablas de Configuración y Datos Iniciales
-- Ejecuta esto en el Editor SQL de Supabase para arreglar los errores 404 y la pantalla en blanco.

-- 1. TABLA: game_upgrades
create table if not exists public.game_upgrades (
  id text primary key,
  name text not null,
  description text,
  base_price numeric not null,
  base_power numeric not null,
  type text not null,
  icon_name text,
  color text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABLA: game_missions
create table if not exists public.game_missions (
  id text primary key,
  name text not null,
  description text,
  requirement_type text not null,
  requirement_value int not null,
  requirement_metadata jsonb,
  reward_coins int not null,
  reward_xp int default 0,
  reward_card_id text,
  icon_name text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABLA: game_shop_items
create table if not exists public.game_shop_items (
  id text primary key,
  name text not null,
  type text not null,
  description text,
  price_coins numeric default 0,
  price_croc numeric default 0,
  currency text default 'coins',
  image_url text,
  rarity text,
  required_level int default 1,
  effect_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TABLA: game_cards
create table if not exists public.game_cards (
  id text primary key,
  name text not null,
  description text,
  rarity text,
  icon_name text,
  color text,
  effect_type text,
  effect_value numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SEGURIDAD (RLS)
alter table public.game_upgrades enable row level security;
alter table public.game_missions enable row level security;
alter table public.game_shop_items enable row level security;
alter table public.game_cards enable row level security;

-- Políticas de lectura pública (Crucial para que el juego cargue)
create policy "Allow public read access" on public.game_upgrades for select using (true);
create policy "Allow public read access" on public.game_missions for select using (true);
create policy "Allow public read access" on public.game_shop_items for select using (true);
create policy "Allow public read access" on public.game_cards for select using (true);

-- Políticas de escritura (Solo servicio/admin)
create policy "Allow service_role write access" on public.game_upgrades for all using (auth.jwt() ->> 'role' = 'service_role');
create policy "Allow service_role write access" on public.game_missions for all using (auth.jwt() ->> 'role' = 'service_role');
create policy "Allow service_role write access" on public.game_shop_items for all using (auth.jwt() ->> 'role' = 'service_role');
create policy "Allow service_role write access" on public.game_cards for all using (auth.jwt() ->> 'role' = 'service_role');

-- 6. SEMILLA DE DATOS (Initial Seed)
-- Insertar datos si las tablas están vacías

-- Token Prices (Asegurar que existe)
insert into public.token_prices (token_symbol, price, liquidity)
values ('CROC', 0.05, 50000)
on conflict (token_symbol) do nothing;

-- Upgrades
insert into public.game_upgrades (id, name, description, base_price, base_power, type, icon_name, color, image_url)
values 
('autoClick', 'Ciénaga Automática', 'Genera 1 moneda por segundo', 50, 1, 'cps', 'Activity', 'text-green-400', '/images/upgrades/swamp.jpeg'),
('mordiscoPoderoso', 'Mordisco Poderoso', 'Aumenta monedas por clic en +1', 100, 1, 'click', 'Target', 'text-red-500', '/images/upgrades/bite.jpeg'),
('cazadorSigiloso', 'Cazador Sigiloso', 'Genera 5 monedas por segundo', 500, 5, 'cps', 'Compass', 'text-teal-400', '/images/upgrades/hunter.jpeg'),
('superCocodrilo', 'Super Cocodrilo', 'Multiplica monedas por clic x1.5', 1000, 1.5, 'multiplier', 'Flame', 'text-orange-500', '/images/upgrades/super_croc.jpeg'),
('criaderoMasivo', 'Criadero Masivo', 'Genera 25 monedas por segundo', 5000, 25, 'cps', 'Users', 'text-lime-400', '/images/upgrades/breeding.jpeg'),
('escamasReforzadas', 'Escamas Reforzadas', 'Aumenta monedas por clic en +10', 2500, 10, 'click', 'Shield', 'text-gray-400', '/images/upgrades/scales.jpeg'),
('rey_del_pantano', 'Rey del Pantano', 'Genera 100 monedas por segundo', 20000, 100, 'cps', 'Crown', 'text-yellow-400', '/images/upgrades/swamp_king.jpeg')
on conflict (id) do nothing;

-- Missions
insert into public.game_missions (id, name, description, requirement_type, requirement_value, reward_coins, reward_xp, reward_card_id, icon_name, category)
values
('click_starter', 'Cazador Novato', 'Realiza 50 clics para demostrar tu instinto.', 'clicks', 50, 200, 50, 'card_agility_1', 'Target', 'Clics'),
('coin_collector', 'Recolector de Tesoros', 'Acumula 500 monedas en total.', 'coins', 500, 500, 100, 'card_fortune_1', 'DollarSign', 'Monedas'),
('level_up_rookie', 'Aprendiz de Depredador', 'Alcanza el nivel 2.', 'level', 2, 300, 70, null, 'Star', 'Nivel'),
('upgrade_enthusiast', 'Entusiasta de la Evolución', 'Mejora "Mordisco Poderoso" al nivel 3.', 'upgradeLevel', 3, 1000, 150, 'card_power_1', 'TrendingUp', 'Mejoras')
on conflict (id) do nothing;

-- Shop Items
insert into public.game_shop_items (id, name, type, description, price_coins, price_croc, currency, image_url, rarity, required_level, effect_data)
values
('skin_golden_croc', 'Cocodrilo Dorado', 'skin', 'Pura elegancia dorada. +15% poder de click', 100000, 1000, 'both', '/images/skins/golden_croc.jpg', 'legendary', 10, '{"clickMultiplier": 1.15, "cpsBoost": 10}'),
('skin_camo_croc', 'Cocodrilo Camuflaje', 'skin', 'Acecha en el pantano. +10% regeneración energía', 50000, 500, 'both', '/images/skins/camo_croc.jpg', 'rare', 5, '{"energyRegen": 1.1, "stealth": 25}'),
('auto_clicker_pro', 'Auto-Clicker Pro', 'item', '20 clics automáticos por segundo', 50000, 500, 'both', '/images/items/auto_clicker.jpg', 'epic', 1, '{"autoClicks": 20, "duration": "permanent"}'),
('energy_potion_xl', 'Poción Energía XL', 'consumable', 'Restaura 100 energía', 5000, 50, 'both', '/images/consumables/energy_potion.jpg', 'common', 1, '{"energy": 100}')
on conflict (id) do nothing;

-- Cards
insert into public.game_cards (id, name, description, rarity, icon_name, color, effect_type, effect_value)
values
('card_agility_1', 'Carta de Agilidad Menor', 'Aumenta la regeneración de energía en un 5%.', 'Común', 'Feather', 'text-gray-400', 'energy_regen_boost_percent', 5),
('card_fortune_1', 'Carta de Fortuna Menor', 'Aumenta las monedas por clic en +2.', 'Común', 'Star', 'text-green-400', 'click_power_flat', 2),
('card_power_1', 'Carta de Poder Bruto Menor', 'Aumenta el poder de clic base en +5.', 'Poco Común', 'Zap', 'text-blue-400', 'click_power_flat', 5)
on conflict (id) do nothing;
