-- Migration: Comprehensive Game State Sync RPC
-- 20240111_sync_game_state_rpc.sql

CREATE OR REPLACE FUNCTION public.sync_game_state(
  p_coins NUMERIC,
  p_total_coins NUMERIC,
  p_energy INT,
  p_max_energy INT,
  p_clicks INT,
  p_level INT,
  p_experience INT,
  p_upgrades JSONB,
  p_missions JSONB,
  p_owned_items JSONB,
  p_owned_cards JSONB,
  p_active_skin TEXT,
  p_achievements_unlocked JSONB,
  p_farming_milestones JSONB,
  p_daily_rewards JSONB,
  p_native_token_balance NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_player_id UUID;
BEGIN
  -- 1. Authentication Check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 2. Player Look-up
  SELECT id INTO v_player_id FROM public.players WHERE user_id = v_user_id;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Player not found');
  END IF;

  -- 3. Update Stats
  -- This overwrites the values with the latest authoritative state from the client
  -- In a production environment, you might want more validation on the server side
  -- to prevent cheating, but for now this ensures coordination.
  UPDATE public.player_stats
  SET
    coins = p_coins,
    total_coins = p_total_coins,
    energy = p_energy,
    max_energy = p_max_energy,
    clicks = p_clicks,
    level = p_level,
    experience = p_experience,
    upgrades = p_upgrades,
    missions = p_missions,
    owned_items = p_owned_items,
    owned_cards = p_owned_cards,
    active_skin = p_active_skin,
    achievements_unlocked = p_achievements_unlocked,
    farming_milestones = p_farming_milestones,
    daily_rewards = p_daily_rewards,
    native_token_balance = COALESCE(p_native_token_balance, native_token_balance),
    updated_at = NOW(),
    last_active = NOW()
  WHERE player_id = v_player_id;

  IF NOT FOUND THEN
    -- If no stats row somehow, create it (should not happen if using getOrCreate)
    INSERT INTO public.player_stats (
      player_id, coins, total_coins, energy, max_energy, clicks, level, experience,
      upgrades, missions, owned_items, owned_cards, active_skin, achievements_unlocked,
      farming_milestones, daily_rewards, native_token_balance
    ) VALUES (
      v_player_id, p_coins, p_total_coins, p_energy, p_max_energy, p_clicks, p_level, p_experience,
      p_upgrades, p_missions, p_owned_items, p_owned_cards, p_active_skin, p_achievements_unlocked,
      p_farming_milestones, p_daily_rewards, COALESCE(p_native_token_balance, 0)
    );
  END IF;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.sync_game_state TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_game_state TO anon;
GRANT EXECUTE ON FUNCTION public.sync_game_state TO service_role;
