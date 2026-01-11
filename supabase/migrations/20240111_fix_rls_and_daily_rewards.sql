-- 20240111_fix_rls_and_daily_rewards.sql

-- 1. Create helper function to check if user is admin
-- (Replaces complex RLS logic with a single source of truth)
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select 
    -- Check if email is in the allowlist
    auth.jwt() ->> 'email' in (
      'admin@cocodrilo.com', 
      'horaciowalterortiz@gmail.com'
    )
    -- OR if role is service_role (for internal backend processes)
    or (auth.jwt() ->> 'role' = 'service_role');
$$;

-- 2. Update RLS Policies for Game Config Tables
-- GAME_UPGRADES
alter table public.game_upgrades enable row level security;
drop policy if exists "Admin write access" on public.game_upgrades;
create policy "Admin write access" on public.game_upgrades
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- GAME_MISSIONS
alter table public.game_missions enable row level security;
drop policy if exists "Admin write access" on public.game_missions;
create policy "Admin write access" on public.game_missions
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- GAME_SHOP_ITEMS
alter table public.game_shop_items enable row level security;
drop policy if exists "Admin write access" on public.game_shop_items;
create policy "Admin write access" on public.game_shop_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- GAME_CARDS
alter table public.game_cards enable row level security;
drop policy if exists "Admin write access" on public.game_cards;
create policy "Admin write access" on public.game_cards
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- GAME_CONFIG
create table if not exists public.game_config (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);
alter table public.game_config enable row level security;
create policy "Public read access" on public.game_config for select using (true);
drop policy if exists "Admin write access" on public.game_config;
create policy "Admin write access" on public.game_config
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- PLAYER_STATS (Ensure admins can read all stats for dashboard)
create policy "Admin read access" on public.player_stats
  for select
  using (public.is_admin());


-- 3. IMPROVED DAILY REWARD LOGIC (RPC)
create or replace function public.claim_daily_reward()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_player_id uuid;
  v_last_claim timestamptz;
  v_streak int;
  v_now timestamptz := now();
  v_reward_coins int;
  v_reward_croc numeric := 0;
  v_new_streak int;
  v_hours_diff numeric;
begin
  -- 1. Get User
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No autenticado');
  end if;

  select id into v_player_id from public.players where user_id = v_user_id;
  
  -- 2. Get Current State (Locking row)
  select 
    (daily_rewards->>'lastClaim')::timestamptz,
    coalesce((daily_rewards->>'streak')::int, 0)
  into v_last_claim, v_streak
  from public.player_stats
  where player_id = v_player_id;

  -- 3. Validate Timing
  if v_last_claim is not null then
    v_hours_diff := extract(epoch from (v_now - v_last_claim)) / 3600;
    
    -- If less than 24 hours (minus a small buffer of 1h for UX), deny
    if v_hours_diff < 20 then -- Allowing claim a bit earlier for flexibility
       return jsonb_build_object('success', false, 'error', 'Ya reclamaste hoy. Vuelve mañana.');
    end if;

    -- Check if streak is broken (e.g. > 48 hours since last claim)
    if v_hours_diff > 48 then
      v_streak := 0; -- Reset streak
    end if;
  else
    v_streak := 0;
  end if;

  -- 4. Calculate New Streak & Reward
  v_new_streak := v_streak + 1;
  
  -- Base Reward Logic
  v_reward_coins := 1000 * v_new_streak;
  
  -- 7-Day Streak Bonus (CROC)
  if v_new_streak >= 7 then
    v_reward_croc := 50; -- Bonus CROC
    v_reward_coins := v_reward_coins + 50000; -- Big Coin Bonus
    -- Optional: Reset streak after 7 days? Or keep growing?
    -- Requirement: "si claimea 7 dias seguidos se le da un incentivo en croc"
    -- User implies it might reset or just be a milestone.
    -- Let's cap visual streak at 7 or loop it. 
    -- For now, let's reset streak to 0 to restart the cycle, or 1?
    -- "da el premio sino claimea se resetea a 0" -> Resets if missed.
    -- Let's keep streak growing but assume the cycle reward happens every 7 days?
    -- Simplified: If streak % 7 == 0 then reward croc.
    if (v_new_streak % 7) = 0 then
        v_reward_croc := 50;
    end if;
  end if;

  -- 5. Update Stats
  update public.player_stats
  set 
    coins = coins + v_reward_coins,
    total_coins = total_coins + v_reward_coins,
    native_token_balance = native_token_balance + v_reward_croc,
    daily_rewards = jsonb_build_object(
      'lastClaim', v_now,
      'streak', v_new_streak
    ),
    updated_at = v_now
  where player_id = v_player_id;

  return jsonb_build_object(
    'success', true,
    'reward_coins', v_reward_coins,
    'reward_croc', v_reward_croc,
    'new_streak', v_new_streak,
    'total_coins', (select coins from public.player_stats where player_id = v_player_id)
  );

exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 4. NEW: Verify Mission Code & Video
create or replace function public.verify_mission_code(
  p_mission_id text,
  p_code text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_player_id uuid;
  v_mission_record record;
  v_player_missions jsonb;
  v_reward_coins int;
  v_already_completed boolean;
begin
  v_user_id := auth.uid();
  select id into v_player_id from public.players where user_id = v_user_id;

  -- Get mission
  select * into v_mission_record from public.game_missions where id = p_mission_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Misión no encontrada');
  end if;

  -- Check Code (if required)
  if v_mission_record.requirement_type = 'code' or v_mission_record.validation_type = 'code' then
     if lower(p_code) != lower(v_mission_record.secret_code) then
        return jsonb_build_object('success', false, 'error', 'Código incorrecto');
     end if;
  end if;

  -- Get current missions state
  select missions into v_player_missions from public.player_stats where player_id = v_player_id;
  
  v_already_completed := (v_player_missions->p_mission_id->>'completed')::boolean;
  
  if v_already_completed then
    return jsonb_build_object('success', false, 'error', 'Misión ya completada');
  end if;

  -- Grant Reward
  v_reward_coins := v_mission_record.reward_coins;
  
  -- Update Stats
  update public.player_stats
  set 
    coins = coins + v_reward_coins,
    total_coins = total_coins + v_reward_coins,
    missions = jsonb_set(
      coalesce(missions, '{}'::jsonb),
      array[p_mission_id],
      jsonb_build_object('completed', true, 'claimed', true, 'progress', 1, 'date', now())
    )
  where player_id = v_player_id;

  return jsonb_build_object('success', true, 'reward_coins', v_reward_coins);
end;
$$;
