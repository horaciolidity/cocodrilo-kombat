-- =============================================
-- 🛠️ SCRIPT DE PAGO RETROACTIVO Y REPARACIÓN (Referidos)
-- =============================================
-- Este script recorre la base de datos, calcula cuántos referidos tiene realmente cada usuario,
-- calcula cuánto debió haber cobrado, y le deposita la diferencia (CROC y Monedas) automáticamente.
-- También repara los contadores visuales.

DO $$
DECLARE
    r RECORD;
    real_count INT;
    
    -- Configuración de premios (Debe coincidir con la lógica del juego)
    RATE_COINS_REFERRER INT := 25000;
    RATE_CROC_REFERRER INT := 10;
    
    expected_coins BIGINT;
    expected_croc NUMERIC;
    
    current_coins_refs BIGINT;
    current_croc_refs NUMERIC;
    
    diff_coins BIGINT;
    diff_croc NUMERIC;
    
    total_repaired INT := 0;
BEGIN
    RAISE NOTICE '🚀 Iniciando reparación masiva de referidos...';

    -- 1. CORREGIR IDs INCORRECTOS EN LA TABLA PLAYERS
    -- (Por si se guardó el Auth ID en lugar del Player ID)
    UPDATE players p
    SET referred_by = referrer.id
    FROM players referrer
    WHERE p.referred_by = referrer.user_id 
    AND p.referred_by != referrer.id;
    
    -- 2. BUCLE: RECALCULAR Y PAGAR A REFERIDORES
    FOR r IN 
        SELECT referred_by, COUNT(*) as actual_count 
        FROM players 
        WHERE referred_by IS NOT NULL 
        GROUP BY referred_by
    LOOP
        -- A. Asegurar existencia de billetera
        INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
        VALUES (r.referred_by, 0, 0, 0)
        ON CONFLICT (player_id) DO NOTHING;

        -- B. Calcular DEUDA (Lo que deberían tener vs Lo que tienen registrado como cobrado)
        expected_coins := r.actual_count * RATE_COINS_REFERRER;
        expected_croc := r.actual_count * RATE_CROC_REFERRER;

        -- Obtener cobros históricos
        SELECT 
            COALESCE(coins_from_refs, 0), 
            COALESCE(croc_from_refs, 0)
        INTO current_coins_refs, current_croc_refs
        FROM player_stats
        WHERE player_id = r.referred_by;

        -- Calcular Diferencia a Pagar
        diff_coins := GREATEST(0, expected_coins - current_coins_refs);
        diff_croc := GREATEST(0, expected_croc - current_croc_refs);

        -- C. PAGAR SI HAY DIFERENCIA
        IF diff_coins > 0 OR diff_croc > 0 THEN
            UPDATE player_stats
            SET 
                -- Depositar en balance disponible
                coins = COALESCE(coins, 0) + diff_coins,
                total_coins = COALESCE(total_coins, 0) + diff_coins,
                native_token_balance = COALESCE(native_token_balance, 0) + diff_croc,
                
                -- Actualizar historial de cobros para que no se pague doble en el futuro
                referrals_count = r.actual_count,
                coins_from_refs = expected_coins,
                croc_from_refs = expected_croc,
                
                updated_at = NOW()
            WHERE player_id = r.referred_by;
            
            total_repaired := total_repaired + 1;
            RAISE NOTICE '✅ ID %: Pagado +% Coins y +% CROC (Total Refs: %)', r.referred_by, diff_coins, diff_croc, r.actual_count;
        ELSE
            -- Solo corregir el contador visual si estaba desincronizado
            UPDATE player_stats
            SET referrals_count = r.actual_count
            WHERE player_id = r.referred_by AND (referrals_count IS NULL OR referrals_count != r.actual_count);
        END IF;
    END LOOP;

    RAISE NOTICE '✨ Completado. % cuentas recibieron pagos retroactivos.', total_repaired;
END $$;
