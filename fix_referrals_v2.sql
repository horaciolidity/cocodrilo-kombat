-- =============================================
-- 🛠️ CORRECCIÓN SISTEMA DE REFERIDOS (ATÓMICO)
-- Ejecuta este script en el SQL Editor de Supabase
-- =============================================

-- 1. Eliminar función anterior para evitar conflictos de firma
DROP FUNCTION IF EXISTS process_new_referral(TEXT);

-- 2. Crear nueva función robusta con Logs y Transacción
CREATE OR REPLACE FUNCTION process_new_referral(referral_code_input TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Ejecutar como admin para saltar RLS si es necesario
AS $$
DECLARE
  new_user_id UUID;
  referrer_record RECORD;
  new_user_stats RECORD; -- Para verificar stats del usuario nuevo
  bonus_coins_referrer INT := 25000; -- Monedas para el que invitó
  bonus_coins_referee INT := 10000; -- Monedas para el nuevo
  bonus_croc_referrer INT := 10;    -- CROC para el que invitó
  bonus_croc_referee INT := 0;      -- CROC para el nuevo
BEGIN
  -- 1. Identificar al usuario que llama (el nuevo usuario)
  new_user_id := auth.uid();
  
  IF new_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 2. Verificar que el usuario no tenga ya un referido procesado
  IF EXISTS (SELECT 1 FROM players WHERE user_id = new_user_id AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya fuiste referido');
  END IF;

  -- 3. Buscar al Referrer (Dueño del código)
  SELECT * INTO referrer_record FROM players WHERE referral_code = referral_code_input;
  
  IF referrer_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;

  IF referrer_record.user_id = new_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes referirte a ti mismo');
  END IF;

  -- 4. Asegurar que AMBOS tengan fila en player_stats
  -- 4a. Verificar/Crear stats del Referrer (Quien invitó)
  INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
  VALUES (referrer_record.id, 0, 0, 0)
  ON CONFLICT (player_id) DO NOTHING;

  -- 4b. Verificar/Crear stats del Referee (El Nuevo)
  -- Buscamos el ID del player actual
  DECLARE
      current_player_id UUID;
  BEGIN
      SELECT id INTO current_player_id FROM players WHERE user_id = new_user_id;
      
      INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
      VALUES (current_player_id, 0, 0, 0)
      ON CONFLICT (player_id) DO NOTHING;
      
      -- 5. TRANSACCIÓN PRINCIPAL
      -- 5a. Marcar "referred_by" en el usuario nuevo
      UPDATE players 
      SET referred_by = referrer_record.user_id,
          updated_at = NOW()
      WHERE user_id = new_user_id;

      -- 5b. Pagar al Referrer (Quien invitó)
      UPDATE player_stats
      SET coins = coins + bonus_coins_referrer,
          total_coins = total_coins + bonus_coins_referrer,
          native_token_balance = native_token_balance + bonus_croc_referrer,
          referrals_count = COALESCE(referrals_count, 0) + 1,
          coins_from_refs = COALESCE(coins_from_refs, 0) + bonus_coins_referrer,
          croc_from_refs = COALESCE(croc_from_refs, 0) + bonus_croc_referrer
      WHERE player_id = referrer_record.id;

      -- 5c. Pagar al Referee (El Nuevo)
      UPDATE player_stats
      SET coins = coins + bonus_coins_referee,
          total_coins = total_coins + bonus_coins_referee,
          native_token_balance = native_token_balance + bonus_croc_referee
      WHERE player_id = current_player_id;

      -- 6. Retornar éxito con detalles para el frontend
      RETURN jsonb_build_object(
        'success', true,
        'referrer', referrer_record.username,
        'bonus_coins', bonus_coins_referrer, -- Info para quien llamó (aunque sea del otro)
        'bonus_croc', bonus_croc_referrer,
        'new_user_bonus', bonus_coins_referee
      );
  END;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
