-- ==========================================
-- 🛡️ MIGRATION: Security & Optimization
-- ==========================================

-- 1. 🛑 SECURE TOKEN PRICE (Read-Only for Public)
-- Allow anyone to READ
create policy "Allow public read access" 
on public.token_prices for select 
using (true);

-- Allow ONLY admins/service_role to UPDATE/INSERT
-- (Assuming you have a way to identify admins, or just restrict to service_role for now)
-- Drop existing policies if they exist (careful in production)
-- drop policy if exists "Allow public update" on public.token_prices;

create policy "Allow only service_role update" 
on public.token_prices for update 
using ( auth.jwt() ->> 'role' = 'service_role' );

create policy "Allow only service_role insert" 
on public.token_prices for insert 
with check ( auth.jwt() ->> 'role' = 'service_role' );


-- 2. 👥 RPC: SECURE REFERRAL PROCESSING
-- This replaces the client-side logic in processReferral
create or replace function process_new_referral(
  referral_code_input text
) 
returns json 
language plpgsql 
security definer -- Runs with high privileges to update other users
as $$
declare
  new_player_id uuid;
  referrer_record record;
  referrer_stats_record record;
  bonus_croc decimal := 10;
  bonus_coins int := 1000;
  referrer_bonus_croc decimal := 10;
  referrer_bonus_coins int := 1000;
begin
  -- Get current user ID
  new_player_id := auth.uid();
  
  if new_player_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Find referrer
  select * from public.players 
  into referrer_record
  where referral_code = upper(referral_code_input);

  if referrer_record is null then
    return json_build_object('success', false, 'error', 'Invalid referral code');
  end if;

  -- Prevent self-referral
  if referrer_record.user_id = new_player_id then
    return json_build_object('success', false, 'error', 'Cannot refer yourself');
  end if;

  -- Check if already referred
  if exists (select 1 from public.players where id = new_player_id and referred_by is not null) then
    return json_build_object('success', false, 'error', 'Already referred');
  end if;

  -- Update new player (Set referred_by)
  update public.players 
  set referred_by = referrer_record.id,
      updated_at = now()
  where id = new_player_id;

  -- Give bonuses to NEW PLAYER
  insert into public.player_stats (player_id, native_token_balance, coins, total_coins)
  values (new_player_id, bonus_croc, bonus_coins, bonus_coins)
  on conflict (player_id) do update set
    native_token_balance = player_stats.native_token_balance + excluded.native_token_balance,
    coins = player_stats.coins + excluded.coins,
    total_coins = player_stats.total_coins + excluded.total_coins;

  -- Give bonuses to REFERRER
  -- We start by updating their stats directly
  update public.player_stats
  set 
    referrals_count = referrals_count + 1,
    croc_from_refs = croc_from_refs + referrer_bonus_croc,
    coins_from_refs = coins_from_refs + referrer_bonus_coins,
    native_token_balance = native_token_balance + referrer_bonus_croc,
    coins = coins + referrer_bonus_coins,
    total_coins = total_coins + referrer_bonus_coins,
    updated_at = now()
  where player_id = referrer_record.id;
  
  -- If referrer has no stats yet (edge case), insert them
  if not found then
    insert into public.player_stats (
      player_id, referrals_count, croc_from_refs, coins_from_refs, 
      native_token_balance, coins, total_coins
    )
    values (
      referrer_record.id, 1, referrer_bonus_croc, referrer_bonus_coins, 
      referrer_bonus_croc, referrer_bonus_coins, referrer_bonus_coins
    );
  end if;

  return json_build_object(
    'success', true, 
    'referrer', referrer_record.username,
    'bonus_croc', bonus_croc,
    'bonus_coins', bonus_coins
  );
end;
$$;


-- 3. 💾 RPC: SYNC GAME PROGRESS
-- This replaces the insecure update of player_stats
-- It validates simplistic rules (e.g. max coins per sync) to prevent massive cheating
create or replace function sync_game_progress(
  p_coins_earned int,
  p_energy_spend int,
  p_clicks int,
  p_experience int default 0
) 
returns json 
language plpgsql 
security definer
as $$
declare
  player_id uuid;
  current_stats record;
  max_coins_allowed int := 10000; -- Simple cap per sync
begin
  player_id := auth.uid();
  
  if player_id is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;
  
  if p_coins_earned > max_coins_allowed then
     return json_build_object('success', false, 'error', 'Suspicious activity detected');
  end if;

  update public.player_stats
  set 
    coins = coins + p_coins_earned,
    total_coins = total_coins + p_coins_earned,
    energy = GREATEST(0, energy - p_energy_spend),
    clicks = clicks + p_clicks,
    experience = experience + p_experience,
    last_active = now(),
    updated_at = now()
  where player_id = player_id;

  return json_build_object('success', true);
end;
$$;
