-- =============================================
-- 🛠️ CORRECCIÓN DEFINITIVA DE REFERIDOS (V4)
-- =============================================
-- 1. Corrige la función para guardar el ID correcto (Player ID, no Auth ID).
-- 2. Repara los registros corruptos anteriores.
-- 3. Recalcula y paga las recompensas faltantes retroactivamente.

-- ---------------------------------------------------------
-- PASO 1: REPARAR DATOS CORRUPTOS (Si se guardó user_id en lugar de id)
-- ---------------------------------------------------------
DO $$
DECLARE
  repaired_count INT := 0;
BEGIN
  -- Intenta corregir referidos donde 'referred_by' coincide con un 'user_id' de otro jugador
  -- en lugar de su 'id' interno.
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'referred_by') THEN
    
    -- Actualizar players donde referred_by apunta a un user_id en lugar de un player_id
    WITH fixed_refs AS (
      UPDATE players p
      SET referred_by = r.id -- Corregir usando el ID interno del referidor
      FROM players r
      WHERE p.referred_by = r.user_id -- Donde erróneamente se usó el Auth ID
      AND p.referred_by != r.id       -- Solo si son diferentes
      RETURNING p.id
    )
    SELECT count(*) INTO repaired_count FROM fixed_refs;
    
    RAISE NOTICE '✅ Se repararon % registros de referidos corruptos.', repaired_count;
  END IF;
END $$;

-- ---------------------------------------------------------
-- PASO 2: CORREGIR FUNCIÓN RPC (Para futuros referidos)
-- ---------------------------------------------------------
DROP FUNCTION IF EXISTS process_new_referral(TEXT);

CREATE OR REPLACE FUNCTION process_new_referral(referral_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  referrer_record RECORD;
  current_player_id UUID;
  
  -- 💰 CONFIGURACIÓN DE RECOMPENSAS
  bonus_coins_referrer INT := 25000; 
  bonus_croc_referrer INT := 10;
  
  bonus_coins_referee INT := 10000; 
  bonus_croc_referee INT := 10;
BEGIN
  -- 1. Validar usuario actual
  new_user_id := auth.uid();
  IF new_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 2. Obtener ID del jugador actual
  SELECT id INTO current_player_id FROM players WHERE user_id = new_user_id;
  IF current_player_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jugador no encontrado. Crea tu cuenta primero.');
  END IF;

  -- 3. Validar que no haya sido referido antes
  IF EXISTS (SELECT 1 FROM players WHERE id = current_player_id AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya fuiste referido anteriormente');
  END IF;

  -- 4. Buscar al Referidor
  SELECT * INTO referrer_record FROM players WHERE referral_code = referral_code_input;
  
  IF referrer_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de referido inválido');
  END IF;

  IF referrer_record.id = current_player_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes referirte a ti mismo');
  END IF;

  -- 5. ASEGURAR BILLETERAS (Upsert seguro)
  INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
  VALUES (referrer_record.id, 0, 0, 0)
  ON CONFLICT (player_id) DO NOTHING;

  INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
  VALUES (current_player_id, 0, 0, 0)
  ON CONFLICT (player_id) DO NOTHING;

  -- 6. TRANSACCIONES
  
  -- 6a. Marcar referido (USANDO ID CORRECTO: referrer_record.id)
  UPDATE players 
  SET referred_by = referrer_record.id, -- [FIX V4] Usar ID de tabla players, NO user_id
      updated_at = NOW()
  WHERE id = current_player_id;

  -- 6b. Pagar al REFERIDOR
  UPDATE player_stats
  SET coins = COALESCE(coins, 0) + bonus_coins_referrer,
      total_coins = COALESCE(total_coins, 0) + bonus_coins_referrer,
      native_token_balance = COALESCE(native_token_balance, 0) + bonus_croc_referrer,
      referrals_count = COALESCE(referrals_count, 0) + 1,
      coins_from_refs = COALESCE(coins_from_refs, 0) + bonus_coins_referrer,
      croc_from_refs = COALESCE(croc_from_refs, 0) + bonus_croc_referrer
  WHERE player_id = referrer_record.id;

  -- 6c. Pagar al INVITADO (Coins + CROC)
  UPDATE player_stats
  SET coins = COALESCE(coins, 0) + bonus_coins_referee,
      total_coins = COALESCE(total_coins, 0) + bonus_coins_referee,
      native_token_balance = COALESCE(native_token_balance, 0) + bonus_croc_referee
  WHERE player_id = current_player_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer', referrer_record.username,
    'bonus_coins', bonus_coins_referee,
    'bonus_croc', bonus_croc_referee
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
