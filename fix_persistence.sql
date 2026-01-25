-- =============================================
-- 🛠️ FIX PERSISTENCE & SCHEMA (Critical Fix)
-- =============================================

-- 1. ENSURE ALL COLUMNS EXIST IN player_stats
-- This handles cases where columns might be missing or named differently
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS upgrades JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS missions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS owned_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS owned_cards JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS active_skin TEXT DEFAULT NULL;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS achievements_unlocked JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS farming_milestones JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS daily_rewards JSONB DEFAULT '{"streak": 0, "lastClaim": null, "available": true}'::jsonb;
ALTER TABLE public.player_stats ADD COLUMN IF NOT EXISTS native_token_balance NUMERIC DEFAULT 0;

-- 2. REFRESH THE SYNC RPC
-- We drop and recreate it to ensure it uses the correct columns and types
DROP FUNCTION IF EXISTS public.sync_game_state;

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

  -- 3. Update Stats (Upsert logic via UPDATE)
  UPDATE public.player_stats
  SET
    coins = p_coins,
    total_coins = p_total_coins,
    energy = p_energy,
    max_energy = p_max_energy,
    clicks = p_clicks,
    level = p_level,
    experience = p_experience,
    upgrades = COALESCE(p_upgrades, upgrades, '{}'::jsonb), -- Protect against NULL nulling out DB
    missions = COALESCE(p_missions, missions, '{}'::jsonb),
    owned_items = COALESCE(p_owned_items, owned_items, '[]'::jsonb),
    owned_cards = COALESCE(p_owned_cards, owned_cards, '[]'::jsonb),
    active_skin = COALESCE(p_active_skin, active_skin),
    achievements_unlocked = COALESCE(p_achievements_unlocked, achievements_unlocked, '[]'::jsonb),
    farming_milestones = COALESCE(p_farming_milestones, farming_milestones, '{}'::jsonb),
    daily_rewards = COALESCE(p_daily_rewards, daily_rewards),
    native_token_balance = COALESCE(p_native_token_balance, native_token_balance),
    updated_at = NOW(),
    last_active = NOW()
  WHERE player_id = v_player_id;

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_game_state TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_game_state TO service_role;
