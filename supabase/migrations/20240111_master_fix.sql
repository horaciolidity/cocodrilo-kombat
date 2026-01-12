-- MASTER MIGRATION: Fix Admin, Missions, and Sync
-- Date: 2026-01-11
-- Description: Consolidates all essential functions and permissions to avoid dependency errors.

-- ============================================
-- 1. Helper Function: is_admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    auth.jwt() ->> 'email' IN (
      'admin@cocodrilo.com', 
      'horaciowalterortiz@gmail.com'
    )
    OR (auth.jwt() ->> 'role' = 'service_role');
$$;

GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;

-- ============================================
-- 2. Tables: game_config & daily_codes
-- ============================================
CREATE TABLE IF NOT EXISTS public.game_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

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

CREATE TABLE IF NOT EXISTS public.claimed_daily_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  code_id UUID NOT NULL REFERENCES public.daily_codes(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  reward_coins INT NOT NULL,
  reward_croc NUMERIC DEFAULT 0,
  UNIQUE(player_id, code_id)
);

-- ============================================
-- 3. RLS Policies
-- ============================================
ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read game_config" ON public.game_config;
CREATE POLICY "Public read game_config" ON public.game_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write game_config" ON public.game_config;
CREATE POLICY "Admin write game_config" ON public.game_config FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage codes" ON public.daily_codes;
CREATE POLICY "Admin manage codes" ON public.daily_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin manage prices" ON public.token_prices;
CREATE POLICY "Admin manage prices" ON public.token_prices FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- 4. RPC: claim_daily_code
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
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'No autenticado'); END IF;

  SELECT id INTO v_player_id FROM public.players WHERE user_id = v_user_id;
  
  SELECT * INTO v_code_record 
  FROM public.daily_codes 
  WHERE UPPER(TRIM(code)) = UPPER(TRIM(p_code))
    AND is_active = true
    AND active_date = CURRENT_DATE;

  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Código inválido o expirado'); END IF;

  SELECT EXISTS(SELECT 1 FROM public.claimed_daily_codes WHERE player_id = v_player_id AND code_id = v_code_record.id) INTO v_already_claimed;
  IF v_already_claimed THEN RETURN jsonb_build_object('success', false, 'error', 'Ya reclamaste este código'); END IF;

  INSERT INTO public.claimed_daily_codes (player_id, code_id, reward_coins, reward_croc)
  VALUES (v_player_id, v_code_record.id, v_code_record.reward_coins, COALESCE(v_code_record.reward_croc, 0));

  UPDATE public.player_stats
  SET coins = coins + v_code_record.reward_coins,
      total_coins = total_coins + v_code_record.reward_coins,
      native_token_balance = native_token_balance + COALESCE(v_code_record.reward_croc, 0),
      updated_at = NOW()
  WHERE player_id = v_player_id;

  RETURN jsonb_build_object('success', true, 'reward_coins', v_code_record.reward_coins, 'reward_croc', v_code_record.reward_croc);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_daily_code TO authenticated;

-- ============================================
-- 5. Final Fixes: Sequences & Recursion
-- ============================================
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

DROP TRIGGER IF EXISTS sync_coins_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS update_player_totals_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS trigger_log_energy_changes ON public.player_stats;

COMMENT ON SCHEMA public IS 'Master fix applied 20240111 to resolve Admin and Mission issues';
