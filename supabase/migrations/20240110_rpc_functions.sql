-- MIGRAÇIÓN: Funciones RPC para Lógica de Servidor
-- Ejecuta esto en el Editor SQL de Supabase para arreglar los errores 404 en sync_game_progress y referrals.

-- 1. FUNCIÓN: Sincronizar Progreso (sync_game_progress)
-- Esta función recibe los DELTAS (ganancias) del cliente y actualiza los stats de forma segura.
create or replace function public.sync_game_progress(
  p_coins_earned int,
  p_energy_spend int,
  p_clicks int,
  p_experience int
)
returns jsonb
language plpgsql
security definer -- Se ejecuta con permisos de admin para bypass RLS si es necesario
as $$
declare
  v_user_id uuid;
  v_player_id uuid;
  v_current_stats record;
  v_new_coins numeric;
  v_new_total_coins numeric;
  v_new_energy int;
  v_new_clicks int;
  v_new_xp int;
begin
  -- 1. Obtener usuario autenticado
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No autenticado');
  end if;

  -- 2. Obtener ID de jugador
  select id into v_player_id from public.players where user_id = v_user_id;
  if v_player_id is null then
    return jsonb_build_object('success', false, 'error', 'Jugador no encontrado');
  end if;

  -- 3. Obtener stats actuales (bloqueando fila para consistencia)
  select * into v_current_stats from public.player_stats where player_id = v_player_id for update;
  if not found then
    -- Si no existe, podría ser la primera carga, intentar crear?
    -- Por simplicidad, retornamos error, el cliente debería haber hecho getOrCreate
    return jsonb_build_object('success', false, 'error', 'Stats no encontrados');
  end if;

  -- 4. Validaciones simples (anti-cheat básico)
  if p_coins_earned < 0 or p_energy_spend < 0 or p_clicks < 0 then
     return jsonb_build_object('success', false, 'error', 'Valores negativos no permitidos');
  end if;

  -- 5. Calcular nuevos valores
  v_new_coins := (v_current_stats.coins + p_coins_earned);
  v_new_total_coins := (v_current_stats.total_coins + p_coins_earned);
  v_new_energy := GREATEST(0, v_current_stats.energy - p_energy_spend); 
  v_new_clicks := (v_current_stats.clicks + p_clicks);
  v_new_xp := (v_current_stats.experience + p_experience);

  -- 6. Actualizar DB
  update public.player_stats
  set 
    coins = v_new_coins,
    total_coins = v_new_total_coins,
    energy = v_new_energy,
    clicks = v_new_clicks,
    experience = v_new_xp,
    updated_at = now(),
    last_active = now()
  where player_id = v_player_id;

  return jsonb_build_object('success', true, 'new_coins', v_new_coins);

exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;

-- 2. FUNCIÓN: Procesar Referido (process_new_referral)
-- Valida un código de referido y otorga bonificaciones.
create or replace function public.process_new_referral(
  referral_code_input text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_player_id uuid;
  v_referrer_record record;
  v_is_already_referred uuid;
  v_bonus_croc numeric := 10;
  v_bonus_coins int := 1000;
begin
  -- 1. Obtener usuario
  v_user_id := auth.uid();
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No autenticado');
  end if;

  select id into v_player_id from public.players where user_id = v_user_id;

  -- 2. Validar que no tenga ya un referido
  select referred_by into v_is_already_referred from public.players where id = v_player_id;
  if v_is_already_referred is not null then
    return jsonb_build_object('success', false, 'error', 'Ya fuiste referido');
  end if;

  -- 3. Buscar al referidor
  -- Normalizamos input a mayúsculas
  select * into v_referrer_record from public.players where upper(referral_code) = upper(referral_code_input);
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Código inválido');
  end if;

  if v_referrer_record.id = v_player_id then
    return jsonb_build_object('success', false, 'error', 'No puedes referirte a ti mismo');
  end if;

  -- 4. Registrar la relación
  update public.players
  set referred_by = v_referrer_record.id,
      updated_at = now()
  where id = v_player_id;

  -- 5. Dar bonificación al REFERIDOR (si tiene stats)
  -- Primero intentamos update, si no existe row, asumimos que getOrCreate la creará luego,
  -- pero para seguridad, intentamos upsert o update simple.
  update public.player_stats
  set 
    native_token_balance = native_token_balance + v_bonus_croc,
    coins = coins + v_bonus_coins,
    total_coins = total_coins + v_bonus_coins,
    croc_from_refs = coalesce(croc_from_refs, 0) + v_bonus_croc,
    coins_from_refs = coalesce(coins_from_refs, 0) + v_bonus_coins,
    referrals_count = coalesce(referrals_count, 0) + 1
  where player_id = v_referrer_record.id;
  
  -- Nota: El referido recibe su bono base al iniciar, o podríamos dárselo aquí también.
  -- Vamos a darle bono al referido también para motivar.
  update public.player_stats
  set 
    coins = coins + v_bonus_coins, -- Start bonus
    native_token_balance = native_token_balance + (v_bonus_croc / 2) -- Mitad para el referido
  where player_id = v_player_id;

  return jsonb_build_object(
    'success', true, 
    'referrer', v_referrer_record.username,
    'bonus_croc', v_bonus_croc,
    'bonus_coins', v_bonus_coins
  );

exception when others then
  return jsonb_build_object('success', false, 'error', SQLERRM);
end;
$$;
