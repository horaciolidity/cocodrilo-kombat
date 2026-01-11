-- Migration: Fix Admin Panel Errors and Add New Mission Types
-- Date: 2026-01-11
-- Description: 
--   1. Fix game_config RLS policy for admin writes
--   2. Add YouTube mission fields (youtube_url, video_actions)
--   3. Create daily_codes table for secret code missions
--   4. Create RPC for claiming daily codes
--   5. Verify recursion triggers are removed

-- ============================================
-- 1. FIX: game_config RLS Policy
-- ============================================
-- Ensure game_config table exists
CREATE TABLE IF NOT EXISTS public.game_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public read access" ON public.game_config;
DROP POLICY IF EXISTS "Allow public read game_config" ON public.game_config;
DROP POLICY IF EXISTS "Admin write access" ON public.game_config;
DROP POLICY IF EXISTS "Allow service_role write game_config" ON public.game_config;
DROP POLICY IF EXISTS "Admin write game_config" ON public.game_config;

-- Create clean policies
CREATE POLICY "Public read game_config" ON public.game_config
  FOR SELECT USING (true);

CREATE POLICY "Admin write game_config" ON public.game_config
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 2. ADD: YouTube Mission Fields
-- ============================================
ALTER TABLE public.game_missions 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS video_actions JSONB DEFAULT '{"subscribe": false, "like": false, "comment": false, "follow": false}'::jsonb;

-- Update validation_type options comment
COMMENT ON COLUMN public.game_missions.validation_type IS 
  'Validation type: click, code, video_watch, social_share, daily_code, youtube_actions';

-- ============================================
-- 3. CREATE: Daily Codes Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  reward_coins INT NOT NULL DEFAULT 5000,
  reward_croc NUMERIC DEFAULT 0,
  active_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_codes_code ON public.daily_codes(code);
CREATE INDEX IF NOT EXISTS idx_daily_codes_active_date ON public.daily_codes(active_date, is_active);

-- RLS Policies
ALTER TABLE public.daily_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active codes" ON public.daily_codes
  FOR SELECT USING (is_active = true AND active_date = CURRENT_DATE);

CREATE POLICY "Admin manage codes" ON public.daily_codes
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 4. CREATE: Track Claimed Daily Codes
-- ============================================
CREATE TABLE IF NOT EXISTS public.claimed_daily_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES public.daily_codes(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  reward_coins INT NOT NULL,
  reward_croc NUMERIC DEFAULT 0,
  UNIQUE(player_id, code_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_claimed_codes_player ON public.claimed_daily_codes(player_id);

-- RLS Policies
ALTER TABLE public.claimed_daily_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own claimed codes" ON public.claimed_daily_codes
  FOR SELECT USING (
    player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
  );

CREATE POLICY "Users insert own claims" ON public.claimed_daily_codes
  FOR INSERT WITH CHECK (
    player_id IN (SELECT id FROM public.players WHERE user_id = auth.uid())
  );

-- ============================================
-- 5. RPC: Claim Daily Code
-- ============================================
CREATE OR REPLACE FUNCTION public.claim_daily_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_player_id UUID;
  v_code_record RECORD;
  v_already_claimed BOOLEAN;
  v_reward_coins INT;
  v_reward_croc NUMERIC;
BEGIN
  -- 1. Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 2. Get player ID
  SELECT id INTO v_player_id FROM public.players WHERE user_id = v_user_id;
  IF v_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jugador no encontrado');
  END IF;

  -- 3. Find the code (case-insensitive, trim whitespace)
  SELECT * INTO v_code_record 
  FROM public.daily_codes 
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code))
    AND is_active = true
    AND active_date = CURRENT_DATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido o expirado');
  END IF;

  -- 4. Check if already claimed by this player
  SELECT EXISTS(
    SELECT 1 FROM public.claimed_daily_codes 
    WHERE player_id = v_player_id AND code_id = v_code_record.id
  ) INTO v_already_claimed;

  IF v_already_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya reclamaste este código');
  END IF;

  -- 5. Get rewards
  v_reward_coins := v_code_record.reward_coins;
  v_reward_croc := COALESCE(v_code_record.reward_croc, 0);

  -- 6. Record the claim
  INSERT INTO public.claimed_daily_codes (player_id, code_id, reward_coins, reward_croc)
  VALUES (v_player_id, v_code_record.id, v_reward_coins, v_reward_croc);

  -- 7. Update player stats
  UPDATE public.player_stats
  SET 
    coins = coins + v_reward_coins,
    total_coins = total_coins + v_reward_coins,
    native_token_balance = native_token_balance + v_reward_croc,
    updated_at = NOW()
  WHERE player_id = v_player_id;

  -- 8. Return success
  RETURN jsonb_build_object(
    'success', true,
    'reward_coins', v_reward_coins,
    'reward_croc', v_reward_croc,
    'message', 'Código reclamado exitosamente'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.claim_daily_code TO authenticated;

-- ============================================
-- 6. VERIFY: Remove Recursive Triggers
-- ============================================
-- These should already be removed, but let's ensure
DROP TRIGGER IF EXISTS sync_coins_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS update_player_totals_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS trigger_log_energy_changes ON public.player_stats;

-- ============================================
-- 7. GRANT: Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION public.sync_game_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_new_referral TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_reward TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_mission_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_code TO authenticated;

-- ============================================
-- 8. INSERT: Sample Daily Code (for testing)
-- ============================================
-- Admins can create codes from the Admin Panel
-- This is just an example
INSERT INTO public.daily_codes (code, reward_coins, reward_croc, description, active_date)
VALUES ('CROC2024', 10000, 5, 'Código de bienvenida', CURRENT_DATE)
ON CONFLICT (code) DO NOTHING;
