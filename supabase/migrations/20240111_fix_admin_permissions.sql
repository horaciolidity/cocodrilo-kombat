-- Migration: Fix Admin Permissions and Sequence Access
-- Date: 2026-01-11
-- Description: Fixes 403 Forbidden errors when admins try to update token_prices and sequences.

-- 1. Ensure game_config table exists (redundant but safe)
CREATE TABLE IF NOT EXISTS public.game_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Fix token_prices RLS for Admins
ALTER TABLE public.token_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow only service_role update" ON public.token_prices;
DROP POLICY IF EXISTS "Allow only service_role insert" ON public.token_prices;
DROP POLICY IF EXISTS "Admin manage prices" ON public.token_prices;

CREATE POLICY "Admin manage prices" ON public.token_prices
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. FIX: Sequence Permissions
-- This is a common cause of 403 errors even when RLS is fine.
-- Authenticated users need permission to use sequences for auto-incrementing IDs.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. Ensure Admin can write to game_config
DROP POLICY IF EXISTS "Admin write game_config" ON public.game_config;
CREATE POLICY "Admin write game_config" ON public.game_config
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Grant execute on is_admin if not already granted
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO anon;

COMMENT ON TABLE public.token_prices IS 'Permissions fixed for Admin access 20240111';
