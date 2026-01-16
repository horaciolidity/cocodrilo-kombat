-- =============================================
-- 🛠️ CORRECCIÓN FINAL: SISTEMA DE REFERIDOS (V3)
-- Ejecuta este script para asegurar pagos de CROC + MONEDAS a AMBOS.
-- =============================================

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
  
  -- 💰 CONFIGURACIÓN DE RECOMPENSAS 💰
  -- REFERIDOR (Quien invita):
  bonus_coins_referrer INT := 25000; 
  bonus_croc_referrer INT := 10;
  
  -- INVITADO (Quien entra):
  bonus_coins_referee INT := 10000; 
  bonus_croc_referee INT := 10;     -- AHORA SÍ RECIBE CROC
BEGIN
  -- 1. Identificar al usuario autencicado
  new_user_id := auth.uid();
  IF new_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autenticado');
  END IF;

  -- 2. Validar que no haya sido referido antes
  IF EXISTS (SELECT 1 FROM players WHERE user_id = new_user_id AND referred_by IS NOT NULL) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya fuiste referido');
  END IF;

  -- 3. Buscar al Referidor
  SELECT * INTO referrer_record FROM players WHERE referral_code = referral_code_input;
  IF referrer_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;

  IF referrer_record.user_id = new_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes referirte a ti mismo');
  END IF;

  -- 4. Obtener ID de Jugador del usuario actual
  SELECT id INTO current_player_id FROM players WHERE user_id = new_user_id;

  -- 5. ASEGURAR BILLETERAS (PLAYER_STATS)
  -- Crear stats para el referidor si no existen
  INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
  VALUES (referrer_record.id, 0, 0, 0)
  ON CONFLICT (player_id) DO NOTHING;

  -- Crear stats para el invitado si no existen
  INSERT INTO player_stats (player_id, coins, total_coins, native_token_balance)
  VALUES (current_player_id, 0, 0, 0)
  ON CONFLICT (player_id) DO NOTHING;

  -- 6. TRANSACCIÓN DE PAGO
  
  -- 6a. Marcar referido en tabla players
  UPDATE players 
  SET referred_by = referrer_record.user_id,
      updated_at = NOW()
  WHERE id = current_player_id;

  -- 6b. Pagar al REFERIDOR (Coins + CROC)
  UPDATE player_stats
  SET coins = coins + bonus_coins_referrer,
      total_coins = total_coins + bonus_coins_referrer,
      native_token_balance = native_token_balance + bonus_croc_referrer,
      referrals_count = COALESCE(referrals_count, 0) + 1,
      coins_from_refs = COALESCE(coins_from_refs, 0) + bonus_coins_referrer,
      croc_from_refs = COALESCE(croc_from_refs, 0) + bonus_croc_referrer
  WHERE player_id = referrer_record.id;

  -- 6c. Pagar al INVITADO (Coins + CROC)
  UPDATE player_stats
  SET coins = coins + bonus_coins_referee,
      total_coins = total_coins + bonus_coins_referee,
      native_token_balance = native_token_balance + bonus_croc_referee
  WHERE player_id = current_player_id;

  RETURN jsonb_build_object(
    'success', true,
    'referrer', referrer_record.username,
    'bonus_coins', bonus_coins_referrer,
    'bonus_croc', bonus_croc_referrer,
    'invitado_coins', bonus_coins_referee,
    'invitado_croc', bonus_croc_referee
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
