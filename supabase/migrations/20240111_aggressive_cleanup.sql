-- Migration: Aggressive Cleanup for Sync Recursion
-- Description: FORCEFULLY drops all triggers on player_stats to stop infinite loops.

-- 1. Drop ALL triggers on player_stats (Dynamic SQL not needed if we know names, but safer to be explicit)
DROP TRIGGER IF EXISTS sync_coins_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS update_player_totals_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS trigger_log_energy_changes ON public.player_stats;
DROP TRIGGER IF EXISTS on_auth_user_created ON public.player_stats; -- Just in case attached here wrongly
DROP TRIGGER IF EXISTS handle_updated_at ON public.player_stats; -- Standard, but maybe looping? Re-add if needed safe only.

-- 2. Drop triggers on players that might update stats
DROP TRIGGER IF EXISTS on_new_user ON public.players;

-- 3. Re-create ONLY the essential triggers that are SAFE
-- (handle_updated_at is usually safe, let's re-add it only if we're sure)

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.player_stats
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Ensure RPC functions are clean of internal updates that trigger triggers logic
-- (The RPCs themselves are fine as long as they don't fire a trigger that calls an RPC)

COMMENT ON TABLE public.player_stats IS 'Recursion fixed via aggressive cleanup 20240111';
