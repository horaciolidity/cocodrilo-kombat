-- MIGRAÇIÓN DE EMERGENCIA: Eliminar Triggers Recursivos
-- El error "stack depth limit exceeded" ocurre porque hay triggers que se llaman a sí mismos infinitamente.

-- 1. Eliminar triggers sospechosos de causar loops en player_stats
drop trigger if exists sync_coins_trigger on public.player_stats;
drop trigger if exists update_player_totals_trigger on public.player_stats;
drop trigger if exists trigger_log_energy_changes on public.player_stats;

-- (Opcional) Si existen las funciones asociadas y ya no se usan, se podrían borrar, 
-- pero por seguridad solo borramos los triggers que causan la ejecución automática.

-- 2. Asegurar que sync_game_progress funciona (ya fue creada, pero revalidamos permisos)
grant execute on function public.sync_game_progress to authenticated;
grant execute on function public.process_new_referral to authenticated;

-- 3. Limpiar datos corruptos de prueba si es necesario (opcional)
-- (No borramos nada por ahora para no perder progreso real)
