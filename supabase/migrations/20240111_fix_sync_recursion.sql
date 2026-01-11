-- Migration: Fix Sync Recursion
-- Description: Drops triggers that cause 'stack depth limit exceeded' during updates

-- 1. Drop known recursive triggers
DROP TRIGGER IF EXISTS sync_coins_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS update_player_totals_trigger ON public.player_stats;
DROP TRIGGER IF EXISTS trigger_log_energy_changes ON public.player_stats;

-- 2. Drop potential function hooks if they are not used by anything else
-- (We keep the functions as they might be used by historical logs, but disable the automatic trigger)

COMMENT ON TABLE public.player_stats IS 'Triggers cleaned up to prevent recursion loop on sync';
