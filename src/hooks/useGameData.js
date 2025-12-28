import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  INITIAL_GAME_STATE, 
  INITIAL_UPGRADES_STATE, 
  INITIAL_MISSIONS_STATE,
  INITIAL_FARMING_MILESTONES_STATE,
  CARDS_DATA,
  SHOP_ITEMS
} from '@/config/gameConfig';

export function useGameData(user) {
  // 🎯 ESTADO UNIFICADO DEL JUEGO
  const [gameData, setGameData] = useState({
    gameState: INITIAL_GAME_STATE,
    upgrades: INITIAL_UPGRADES_STATE,
    missions: INITIAL_MISSIONS_STATE,
    ownedCards: [],
    ownedItems: [],
    activeSkin: null,
    achievementsUnlocked: [],
    dailyRewards: { lastClaim: null, streak: 0, available: true },
    farmingMilestones: INITIAL_FARMING_MILESTONES_STATE,
    player: null,
    referralStats: { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 },
    allCards: CARDS_DATA,
    allShopItems: SHOP_ITEMS,
    statsForRanking: null,
    loading: true,
    error: null,
    lastSync: null,
    syncInProgress: false
  });

  // 🎯 REFERENCIAS PARA OPTIMIZACIÓN
  const lastSyncRef = useRef(0);
  const pendingSyncRef = useRef({});
  const syncTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  const rankingCacheRef = useRef({
    global: { data: null, timestamp: 0 },
    weekly: { data: null, timestamp: 0 },
    monthly: { data: null, timestamp: 0 }
  });

  // ============ 🎯 FUNCIONES PRINCIPALES ============

 // 🎯 CARGAR DATOS DEL JUEGO - VERSIÓN OPTIMIZADA
const loadGameData = useCallback(async () => {
  if (!user) {
    console.log('👤 No hay usuario, usando datos iniciales');
    setGameData(prev => ({ 
      ...prev, 
      loading: false,
      player: null,
      gameState: INITIAL_GAME_STATE
    }));
    return;
  }

  // Evitar llamadas duplicadas mientras ya se está cargando
  if (gameData.loading) {
    console.log('⏳ Ya se están cargando datos...');
    return;
  }

  try {
    console.log('🎮 Cargando datos para usuario:', user.id);
    setGameData(prev => ({ ...prev, loading: true, error: null }));
    
    // 1. Obtener o crear jugador (con debounce)
    const player = await getOrCreatePlayer(user);
    if (!player) throw new Error('No se pudo crear/obtener jugador');
    
    // 2. Obtener estadísticas
    const stats = await getOrCreatePlayerStats(player.id);
    
    // 3. Obtener estadísticas de referidos
    const referralStats = await getReferralStats(player.id);
    
    // 4. Actualizar estado UNA SOLA VEZ
    setGameData(prev => ({
      ...prev,
      player,
      gameState: mapStatsToGameState(stats),
      upgrades: stats.upgrades || INITIAL_UPGRADES_STATE,
      missions: stats.missions || INITIAL_MISSIONS_STATE,
      ownedCards: stats.owned_cards || [],
      ownedItems: stats.owned_items || [],
      activeSkin: stats.active_skin || null,
      achievementsUnlocked: stats.achievements_unlocked || [],
      dailyRewards: stats.daily_rewards || { lastClaim: null, streak: 0, available: true },
      farmingMilestones: stats.farming_milestones || INITIAL_FARMING_MILESTONES_STATE,
      referralStats,
      statsForRanking: stats,
      loading: false,
      lastSync: new Date().toISOString()
    }));
    
    console.log('✅ Datos cargados exitosamente');
    
  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    setGameData(prev => ({ 
      ...prev, 
      error: error.message, 
      loading: false 
    }));
  }
}, [user, gameData.loading]); // Agregar gameData.loading como dependencia


  // 🎯 OBTENER O CREAR JUGADOR - VERSIÓN CORREGIDA
  const getOrCreatePlayer = async (user) => {
    console.log('🎯 =========== INICIO getOrCreatePlayer ===========');
    console.log('🎯 Usuario:', user.id, 'Email:', user.email);
    
    // 1. Buscar jugador existente
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPlayer) {
      console.log('✅ Jugador existente:', existingPlayer.username);
      console.log('🎯 =========== FIN getOrCreatePlayer ===========');
      return existingPlayer;
    }

    // 2. OBTENER CÓDIGO DE REFERIDO (SI EXISTE)
    let referralCodeToProcess = null;
    const storedRefCode = localStorage.getItem('referral_code_to_process');
    
    if (storedRefCode && /^[A-Z0-9]{8}$/.test(storedRefCode)) {
      referralCodeToProcess = storedRefCode;
      console.log('🎯 Código de referencia para procesar:', referralCodeToProcess);
      localStorage.removeItem('referral_code_to_process');
    }

    // 3. GENERAR USERNAME Y CÓDIGO PROPIO (SIEMPRE MAYÚSCULAS)
    const emailUsername = user.email ? user.email.split('@')[0] : '';
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const username = emailUsername 
      ? `${emailUsername}${randomSuffix}` 
      : `croc${randomSuffix}`;
    
    const ownReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 4. CREAR JUGADOR (INICIALMENTE SIN referred_by)
    const newPlayerData = {
      user_id: user.id,
      username: username,
      avatar_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`,
      referral_code: ownReferralCode,
      referred_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    console.log('📝 Creando jugador:', newPlayerData);

    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert([newPlayerData])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando jugador:', error);
      
      // Si hay duplicado en username, intentar con otro
      if (error.code === '23505' && error.message.includes('username')) {
        const altUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
        console.log('🔄 Intentando con username alternativo:', altUsername);
        
        const { data: altPlayer, error: altError } = await supabase
          .from('players')
          .insert([{
            ...newPlayerData,
            username: altUsername
          }])
          .select()
          .single();
        
        if (altError) {
          console.error('❌ Error creando jugador alternativo:', altError);
          throw altError;
        }
        
        // PROCESAR REFERIDO SI EXISTE
        if (referralCodeToProcess) {
          console.log('💰 Procesando referido para jugador alternativo...');
          await processReferral(altPlayer.id, referralCodeToProcess);
        }
        
        console.log('🎯 =========== FIN getOrCreatePlayer ===========');
        return altPlayer;
      }
      
      throw error;
    }

    console.log('✅ Jugador creado:', newPlayer.username);

    // 5. PROCESAR REFERIDO SI HAY CÓDIGO
    if (referralCodeToProcess) {
      console.log('💰 Procesando referido para nuevo jugador...');
      await processReferral(newPlayer.id, referralCodeToProcess);
    }

    console.log('🎯 =========== FIN getOrCreatePlayer ===========');
    return newPlayer;
  };

  // 🎯 PROCESAR REFERIDO - VERSIÓN CORREGIDA Y SIMPLIFICADA
  const processReferral = async (newPlayerId, referralCode) => {
    try {
      console.log('💰 =========== INICIO processReferral ===========');
      console.log('💰 Nuevo jugador:', newPlayerId, 'Código:', referralCode);
      
      // 1. BUSCAR REFERIDOR (CONVERTIR A MAYÚSCULAS)
      const { data: referrer } = await supabase
        .from('players')
        .select('id, username, referral_code')
        .eq('referral_code', referralCode.toUpperCase())
        .single();
      
      if (!referrer) {
        console.error('❌ Referidor no encontrado:', referralCode);
        console.log('💰 =========== FIN processReferral ===========');
        return;
      }
      
      console.log('✅ Referidor encontrado:', referrer.username, 'ID:', referrer.id);
      
      // 2. ACTUALIZAR NUEVO JUGADOR CON referred_by
      await supabase
        .from('players')
        .update({ 
          referred_by: referrer.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', newPlayerId);
      
      console.log('✅ Nuevo jugador actualizado con referred_by');
      
      // 3. CONTAR REFERIDOS ACTUALES (INCLUYENDO EL NUEVO)
      const { data: referrals } = await supabase
        .from('players')
        .select('id')
        .eq('referred_by', referrer.id);
      
      const totalReferrals = referrals?.length || 0;
      console.log(`📊 Referidor ${referrer.username} tiene ${totalReferrals} referidos`);
      
      // 4. APLICAR BONOS AL REFERIDOR - ESTO ES LO QUE NO ESTABA FUNCIONANDO
      // Primero, obtenemos las estadísticas actuales del referidor
      const { data: referrerStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', referrer.id)
        .maybeSingle();
      
      // Calcular las recompensas que el referidor debería tener ahora
      const expectedCrocFromRefs = totalReferrals * 10;
      const expectedCoinsFromRefs = totalReferrals * 1000;
      
      // Calcular cuánto se debe agregar (solo lo nuevo)
      let crocToAdd = 0;
      let coinsToAdd = 0;
      
      if (referrerStats) {
        // Si ya tiene estadísticas, calculamos la diferencia
        const currentCrocRefs = Number(referrerStats.croc_from_refs) || 0;
        const currentCoinsRefs = Number(referrerStats.coins_from_refs) || 0;
        
        crocToAdd = Math.max(0, expectedCrocFromRefs - currentCrocRefs);
        coinsToAdd = Math.max(0, expectedCoinsFromRefs - currentCoinsRefs);
      } else {
        // Si no tiene estadísticas, se le da todo
        crocToAdd = expectedCrocFromRefs;
        coinsToAdd = expectedCoinsFromRefs;
      }
      
      console.log('🎯 Recompensas a aplicar al referidor:', {
        crocToAdd,
        coinsToAdd,
        expectedCrocFromRefs,
        expectedCoinsFromRefs
      });
      
      // 5. ACTUALIZAR PLAYER_STATS DEL REFERIDOR
      if (referrerStats) {
        // Actualizar estadísticas existentes
        const updatedStats = {
          ...referrerStats,
          referrals_count: totalReferrals,
          croc_from_refs: expectedCrocFromRefs,
          coins_from_refs: expectedCoinsFromRefs,
          native_token_balance: Number(referrerStats.native_token_balance || 0) + crocToAdd,
          coins: Number(referrerStats.coins || 0) + coinsToAdd,
          total_coins: Number(referrerStats.total_coins || 0) + coinsToAdd,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        };
        
        const { error: updateReferrerError } = await supabase
          .from('player_stats')
          .upsert(updatedStats, { onConflict: 'player_id' });
        
        if (updateReferrerError) {
          console.error('❌ Error actualizando referidor:', updateReferrerError);
          throw updateReferrerError;
        }
      } else {
        // Crear nuevas estadísticas si no existen
        const newStats = {
          player_id: referrer.id,
          referrals_count: totalReferrals,
          croc_from_refs: expectedCrocFromRefs,
          coins_from_refs: expectedCoinsFromRefs,
          native_token_balance: crocToAdd,
          coins: coinsToAdd,
          total_coins: coinsToAdd,
          level: 1,
          energy: 100,
          max_energy: 100,
          click_power: 1,
          coins_per_second: 0,
          experience: 0,
          clicks: 0,
          upgrades: INITIAL_UPGRADES_STATE,
          missions: INITIAL_MISSIONS_STATE,
          owned_cards: [],
          owned_items: [],
          active_skin: null,
          achievements_unlocked: [],
          daily_rewards: { lastClaim: null, streak: 0, available: true },
          farming_milestones: INITIAL_FARMING_MILESTONES_STATE,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        };
        
        const { error: createReferrerError } = await supabase
          .from('player_stats')
          .insert([newStats]);
        
        if (createReferrerError) {
          console.error('❌ Error creando stats para referidor:', createReferrerError);
          throw createReferrerError;
        }
      }
      
      // 6. ACTUALIZAR TABLA players DEL REFERIDOR
      await supabase
        .from('players')
        .update({
          total_earned_croc: expectedCrocFromRefs,
          total_earned_coins: expectedCoinsFromRefs,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrer.id);
      
      console.log('✅ Recompensas aplicadas al referidor:', {
        referidor: referrer.username,
        referidosTotales: totalReferrals,
        crocAgregados: crocToAdd,
        monedasAgregadas: coinsToAdd
      });
      
      // 7. DAR BONOS AL NUEVO JUGADOR (REFERIDO)
      console.log('🎁 Dando bonos al nuevo jugador (referido)...');
      
      const { data: newPlayerStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', newPlayerId)
        .maybeSingle();
      
      const welcomeCroc = 10;
      const welcomeCoins = 1000;
      
      if (newPlayerStats) {
        // Si YA tiene stats, SUMAR bonos
        const updatedNewPlayerStats = {
          ...newPlayerStats,
          native_token_balance: Number(newPlayerStats.native_token_balance || 0) + welcomeCroc,
          coins: Number(newPlayerStats.coins || 0) + welcomeCoins,
          total_coins: Number(newPlayerStats.total_coins || 0) + welcomeCoins,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        };
        
        await supabase
          .from('player_stats')
          .upsert(updatedNewPlayerStats, { onConflict: 'player_id' });
      } else {
        // Si NO tiene stats, crear nuevas CON bonos
        const newPlayerStatsData = {
          player_id: newPlayerId,
          native_token_balance: welcomeCroc,
          coins: welcomeCoins,
          total_coins: welcomeCoins,
          level: 1,
          energy: 100,
          max_energy: 100,
          click_power: 1,
          coins_per_second: 0,
          experience: 0,
          clicks: 0,
          upgrades: INITIAL_UPGRADES_STATE,
          missions: INITIAL_MISSIONS_STATE,
          owned_cards: [],
          owned_items: [],
          active_skin: null,
          achievements_unlocked: [],
          daily_rewards: { lastClaim: null, streak: 0, available: true },
          farming_milestones: INITIAL_FARMING_MILESTONES_STATE,
          croc_from_refs: 0,
          coins_from_refs: 0,
          referrals_count: 0,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        };
        
        await supabase
          .from('player_stats')
          .insert([newPlayerStatsData]);
      }
      
      console.log('✅ BONOS APLICADOS EXITOSAMENTE!', {
        referidor: referrer.username,
        referidosTotales: totalReferrals,
        crocParaReferidor: crocToAdd,
        monedasParaReferidor: coinsToAdd,
        crocParaNuevo: welcomeCroc,
        monedasParaNuevo: welcomeCoins
      });
      
      // 8. ACTUALIZAR ESTADO LOCAL DEL REFERIDOR SI ESTÁ EN LÍNEA
      if (gameData.player?.id === referrer.id) {
        console.log('🔄 Actualizando estado local del referidor...');
        await refreshReferralStats();
      }
      
      return {
        success: true,
        referrer: referrer.username,
        newPlayerId,
        crocAddedToReferrer: crocToAdd,
        coinsAddedToReferrer: coinsToAdd
      };
      
    } catch (error) {
      console.error('❌ ERROR en processReferral:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      console.log('💰 =========== FIN processReferral ===========');
    }
  };

  // 🎯 OBTENER O CREAR ESTADÍSTICAS DEL JUGADOR
const getOrCreatePlayerStats = async (playerId) => {
  console.log('📊 Buscando player_stats para player_id:', playerId);
  
  try {
    // Primero, obtener estadísticas existentes
    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();
    
    if (existingStats) {
      console.log('✅ Player_stats encontradas:', { 
        dailyRewards: existingStats.daily_rewards,
        lastClaim: existingStats.daily_rewards?.lastClaim
      });
      
      // Verificar si la recompensa diaria debe estar disponible
      const now = new Date();
      const lastClaimDate = existingStats.daily_rewards?.lastClaim 
        ? new Date(existingStats.daily_rewards.lastClaim) 
        : null;
      
      let dailyRewardsAvailable = true;
      
      if (lastClaimDate) {
        const diffTime = Math.abs(now - lastClaimDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        dailyRewardsAvailable = diffDays >= 1;
      }
      
      // Asegurarse de que el objeto daily_rewards tenga la estructura correcta
      const updatedDailyRewards = {
        lastClaim: existingStats.daily_rewards?.lastClaim || null,
        streak: existingStats.daily_rewards?.streak || 0,
        available: dailyRewardsAvailable
      };
      
      // Actualizar en BD si es necesario
      if (JSON.stringify(existingStats.daily_rewards) !== JSON.stringify(updatedDailyRewards)) {
        await supabase
          .from('player_stats')
          .update({
            daily_rewards: updatedDailyRewards,
            updated_at: new Date().toISOString()
          })
          .eq('player_id', playerId);
        
        console.log('✅ Daily rewards actualizado en BD');
        existingStats.daily_rewards = updatedDailyRewards;
      }
      
      return existingStats;
    }
    
    // Si no existen, crear nuevas
    return await createNewPlayerStats(playerId);
    
  } catch (error) {
    console.error('❌ Error en getOrCreatePlayerStats:', error);
    throw error;
  }
};

  // 🎯 OBTENER ESTADÍSTICAS DE REFERIDOS
  const getReferralStats = async (playerId) => {
    try {
      console.log('📈 Obteniendo stats de referidos para:', playerId);
      
      // 1. Contar referidos REALES
      const { data: referrals } = await supabase
        .from('players')
        .select('id, username, created_at')
        .eq('referred_by', playerId);

      if (!referrals) {
        return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
      }
      
      const realReferralsCount = referrals?.length || 0;
      
      // 2. Obtener stats actuales del jugador
      const { data: playerStats } = await supabase
        .from('player_stats')
        .select('croc_from_refs, coins_from_refs, referrals_count, native_token_balance, coins')
        .eq('player_id', playerId)
        .maybeSingle();

      const currentCrocRefs = Number(playerStats?.croc_from_refs) || 0;
      const currentCoinsRefs = Number(playerStats?.coins_from_refs) || 0;
      const currentBalance = Number(playerStats?.native_token_balance) || 0;
      const currentCoins = Number(playerStats?.coins) || 0;
      
      console.log(`📊 Referral stats para ${playerId}:`, {
        referidosReales: realReferralsCount,
        crocActual: currentCrocRefs,
        monedasActuales: currentCoinsRefs,
        balanceActual: currentBalance,
        coinsActuales: currentCoins
      });
      
      return { 
        referralsCount: realReferralsCount, 
        crocFromRefs: currentCrocRefs, 
        coinsFromRefs: currentCoinsRefs,
        currentBalance,
        currentCoins
      };
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas de referidos:", error);
      return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0, currentBalance: 0, currentCoins: 0 };
    }
  };

  // 🎯 MAPEAR ESTADÍSTICAS AL ESTADO DEL JUEGO
  const mapStatsToGameState = (stats) => ({
    coins: Number(stats.coins) || 0,
    totalCoins: Number(stats.total_coins) || 0,
    level: Number(stats.level) || 1,
    totalClicks: Number(stats.clicks) || 0,
    energy: Number(stats.energy) || 100,
    maxEnergy: Number(stats.max_energy) || 100,
    clickPower: Number(stats.click_power) || 1,
    coinsPerSecond: Number(stats.coins_per_second) || 0,
    experience: Number(stats.experience) || 0,
    nativeTokenBalance: Number(stats.native_token_balance) || 0,
    referralsCount: Number(stats.referrals_count) || 0,
    crocFromRefs: Number(stats.croc_from_refs) || 0,
    coinsFromRefs: Number(stats.coins_from_refs) || 0,
    playerId: stats.player_id
  });

  // 🔄 SINCRONIZACIÓN OPTIMIZADA
  const syncGameData = useCallback(async (updates = {}) => {
    if (!gameData.player?.id || gameData.syncInProgress) {
      pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
      return;
    }

    const now = Date.now();
    
    if (now - lastSyncRef.current < 2000) {
      pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
      
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (Object.keys(pendingSyncRef.current).length > 0) {
          syncGameData(pendingSyncRef.current);
          pendingSyncRef.current = {};
        }
      }, 2000 - (now - lastSyncRef.current));
      return;
    }

    try {
      setGameData(prev => ({ ...prev, syncInProgress: true }));
      
      const allUpdates = { ...pendingSyncRef.current, ...updates };
      pendingSyncRef.current = {};
      
      const payload = {
        player_id: gameData.player.id,
        coins: Math.floor(allUpdates.coins ?? gameData.gameState.coins),
        native_token_balance: Math.floor(allUpdates.nativeTokenBalance ?? gameData.gameState.nativeTokenBalance),
        level: allUpdates.level ?? gameData.gameState.level,
        clicks: allUpdates.totalClicks ?? gameData.gameState.totalClicks,
        energy: allUpdates.energy ?? gameData.gameState.energy,
        max_energy: allUpdates.maxEnergy ?? gameData.gameState.maxEnergy,
        click_power: allUpdates.clickPower ?? gameData.gameState.clickPower,
        coins_per_second: allUpdates.coinsPerSecond ?? gameData.gameState.coinsPerSecond,
        experience: allUpdates.experience ?? gameData.gameState.experience,
        total_coins: allUpdates.totalCoins ?? gameData.gameState.totalCoins,
        croc_from_refs: allUpdates.crocFromRefs ?? gameData.gameState.crocFromRefs,
        coins_from_refs: allUpdates.coinsFromRefs ?? gameData.gameState.coinsFromRefs,
        referrals_count: allUpdates.referralsCount ?? gameData.gameState.referralsCount,
        upgrades: allUpdates.upgrades ?? gameData.upgrades,
        missions: allUpdates.missions ?? gameData.missions,
        owned_cards: allUpdates.ownedCards ?? gameData.ownedCards,
        owned_items: allUpdates.ownedItems ?? gameData.ownedItems,
        active_skin: allUpdates.activeSkin ?? gameData.activeSkin,
        achievements_unlocked: allUpdates.achievementsUnlocked ?? gameData.achievementsUnlocked,
        daily_rewards: allUpdates.dailyRewards ?? gameData.dailyRewards,
        farming_milestones: allUpdates.farmingMilestones ?? gameData.farmingMilestones,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('player_stats')
        .upsert(payload, { onConflict: 'player_id' });

      if (error) throw error;

      lastSyncRef.current = Date.now();
      setGameData(prev => ({ 
        ...prev, 
        lastSync: new Date().toISOString(),
        syncInProgress: false
      }));
      
      // Actualizar también players.last_active
      await supabase
        .from('players')
        .update({ 
          last_active: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', gameData.player.id);
        
    return { success: true }; // Retornar resultado
    } catch (error) {
      console.error('❌ Error en sync:', error);
      setGameData(prev => ({ ...prev, syncInProgress: false }));
      
      setTimeout(() => {
        if (Object.keys(pendingSyncRef.current).length > 0) {
          syncGameData(pendingSyncRef.current);
        }
      }, 5000);
    }
  }, [gameData]);

  // 🏆 CARGAR RANKING
  const loadRanking = useCallback(async (scope = "global") => {
    const cacheKey = scope;
    const now = Date.now();
    const CACHE_DURATION = 30000;

    if (rankingCacheRef.current[cacheKey]?.data && 
        now - rankingCacheRef.current[cacheKey].timestamp < CACHE_DURATION) {
      return rankingCacheRef.current[cacheKey].data;
    }

    try {
      let query = supabase
        .from("player_stats")
        .select(`
          player_id,
          coins,
          level,
          clicks,
          native_token_balance,
          total_coins,
          experience,
          max_energy,
          energy,
          updated_at,
          players!inner (
            id,
            username,
            avatar_url,
            user_id,
            referral_code,
            created_at
          )
        `)
        .order("coins", { ascending: false })
        .limit(100);

      if (scope === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("updated_at", weekAgo.toISOString());
      } else if (scope === "monthly") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte("updated_at", monthAgo.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const processedData = (data || []).map(row => ({
        id: row.player_id,
        name: row.players.username || `Jugador_${row.player_id.slice(0, 6)}`,
        avatar: row.players.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.players.username || "anon"}`,
        coins: Number(row.coins) || 0,
        level: Number(row.level) || 1,
        tokens: Number(row.native_token_balance) || 0,
        totalCoins: Number(row.total_coins) || 0,
        clicks: Number(row.clicks) || 0,
        experience: Number(row.experience) || 0,
        energy: Number(row.energy) || 100,
        maxEnergy: Number(row.max_energy) || 100,
        isCurrentUser: row.players.user_id === user?.id,
        lastActive: row.updated_at,
        user_id: row.players.user_id,
        joinedDate: row.players.created_at
      }));

      rankingCacheRef.current[cacheKey] = {
        data: processedData,
        timestamp: now
      };

      return processedData;
    } catch (error) {
      console.error(`❌ Error cargando ranking (${scope}):`, error);
      return rankingCacheRef.current[cacheKey]?.data || [];
    }
  }, [user]);

  // 🔄 REFRESCAR RANKING
  const refreshRanking = useCallback(async (scope = "global") => {
    rankingCacheRef.current[scope] = null;
    return loadRanking(scope);
  }, [loadRanking]);

  // 🎯 REFRESCAR ESTADÍSTICAS DE REFERIDOS - VERSIÓN MEJORADA
  const refreshReferralStats = useCallback(async () => {
    if (!gameData.player?.id) return;
    
    try {
      console.log('🔄 Refrescando estadísticas de referidos...');
      
      // 1. Contar referidos REALES
      const { data: referrals } = await supabase
        .from('players')
        .select('id, username')
        .eq('referred_by', gameData.player.id);
      
      const realCount = referrals?.length || 0;
      
      // 2. Obtener estadísticas actuales
      const { data: currentStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', gameData.player.id)
        .maybeSingle();
      
      // Calcular lo que debería tener según los referidos actuales
      const expectedCrocFromRefs = realCount * 10;
      const expectedCoinsFromRefs = realCount * 1000;
      
      let newCrocBalance = 0;
      let newCoinsBalance = 0;
      let newTotalCoins = 0;
      
      if (currentStats) {
        // Calcular la diferencia entre lo que tiene y lo que debería tener
        const currentCrocRefs = Number(currentStats.croc_from_refs) || 0;
        const currentCoinsRefs = Number(currentStats.coins_from_refs) || 0;
        
        const missingCroc = Math.max(0, expectedCrocFromRefs - currentCrocRefs);
        const missingCoins = Math.max(0, expectedCoinsFromRefs - currentCoinsRefs);
        
        if (missingCroc > 0 || missingCoins > 0) {
          console.log(`🔧 Hay recompensas faltantes: ${missingCroc} CROC, ${missingCoins} monedas`);
          
          // Actualizar balances
          newCrocBalance = (Number(currentStats.native_token_balance) || 0) + missingCroc;
          newCoinsBalance = (Number(currentStats.coins) || 0) + missingCoins;
          newTotalCoins = (Number(currentStats.total_coins) || 0) + missingCoins;
          
          // Actualizar en la base de datos
          const updateData = {
            player_id: gameData.player.id,
            native_token_balance: newCrocBalance,
            coins: newCoinsBalance,
            total_coins: newTotalCoins,
            croc_from_refs: expectedCrocFromRefs,
            coins_from_refs: expectedCoinsFromRefs,
            referrals_count: realCount,
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          };
          
          // Mantener otros campos
          Object.keys(currentStats).forEach(key => {
            if (!updateData[key] && key !== 'player_id' && key !== 'id') {
              updateData[key] = currentStats[key];
            }
          });
          
          await supabase
            .from('player_stats')
            .upsert(updateData, { onConflict: 'player_id' });
          
          console.log('✅ Balances actualizados para el referidor');
        } else {
          // Si no hay nada faltante, solo actualizar el conteo
          newCrocBalance = Number(currentStats.native_token_balance) || 0;
          newCoinsBalance = Number(currentStats.coins) || 0;
          newTotalCoins = Number(currentStats.total_coins) || 0;
          
          await supabase
            .from('player_stats')
            .update({
              referrals_count: realCount,
              croc_from_refs: expectedCrocFromRefs,
              coins_from_refs: expectedCoinsFromRefs,
              updated_at: new Date().toISOString()
            })
            .eq('player_id', gameData.player.id);
        }
      }
      
      // 3. Actualizar tabla players
      await supabase
        .from('players')
        .update({
          total_earned_croc: expectedCrocFromRefs,
          total_earned_coins: expectedCoinsFromRefs,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameData.player.id);
      
      // 4. Actualizar estado local
      const newStats = {
        referralsCount: realCount,
        crocFromRefs: expectedCrocFromRefs,
        coinsFromRefs: expectedCoinsFromRefs
      };
      
      setGameData(prev => ({
        ...prev,
        referralStats: newStats,
        gameState: {
          ...prev.gameState,
          referralsCount: realCount,
          crocFromRefs: expectedCrocFromRefs,
          coinsFromRefs: expectedCoinsFromRefs,
          nativeTokenBalance: newCrocBalance || prev.gameState.nativeTokenBalance,
          coins: newCoinsBalance || prev.gameState.coins,
          totalCoins: newTotalCoins || prev.gameState.totalCoins
        }
      }));
      
      console.log('✅ Stats actualizadas:', {
        referidos: realCount,
        croc: expectedCrocFromRefs,
        monedas: expectedCoinsFromRefs,
        balanceCroc: newCrocBalance,
        balanceMonedas: newCoinsBalance
      });
      
    } catch (error) {
      console.error('❌ Error en refreshReferralStats:', error);
    }
  }, [gameData.player?.id]);

  // 🎯 REPARAR SISTEMA DE REFERIDOS
  const repairReferralSystem = async () => {
    try {
      console.log('🔧 =========== INICIO REPARACIÓN ===========');
      
      // 1. ACTUALIZAR TODOS LOS CÓDIGOS A MAYÚSCULAS
      console.log('🔧 Actualizando códigos a mayúsculas...');
      await supabase
        .from('players')
        .update({ 
          referral_code: supabase.raw('UPPER(referral_code)')
        })
        .neq('referral_code', null);
      
      // 2. OBTENER TODOS LOS JUGADORES
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, username');
      
      if (!allPlayers) return;
      
      let repairedCount = 0;
      
      for (const player of allPlayers) {
        // 3. CONTAR REFERIDOS DE ESTE JUGADOR
        const { data: referrals } = await supabase
          .from('players')
          .select('id')
          .eq('referred_by', player.id);
        
        const referralCount = referrals?.length || 0;
        
        if (referralCount > 0) {
          // 4. ACTUALIZAR PLAYER_STATS DEL REFERIDOR
          const { data: playerStats } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', player.id)
            .maybeSingle();
          
          const expectedCroc = referralCount * 10;
          const expectedCoins = referralCount * 1000;
          
          if (playerStats) {
            // Calcular bonos faltantes
            const currentCroc = Number(playerStats.croc_from_refs) || 0;
            const missingCroc = Math.max(0, expectedCroc - currentCroc);
            
            const currentCoins = Number(playerStats.coins_from_refs) || 0;
            const missingCoins = Math.max(0, expectedCoins - currentCoins);
            
            if (missingCroc > 0 || missingCoins > 0) {
              const updateData = {
                player_id: player.id,
                referrals_count: referralCount,
                croc_from_refs: expectedCroc,
                coins_from_refs: expectedCoins,
                native_token_balance: (Number(playerStats.native_token_balance) || 0) + missingCroc,
                coins: (Number(playerStats.coins) || 0) + missingCoins,
                total_coins: (Number(playerStats.total_coins) || 0) + missingCoins,
                updated_at: new Date().toISOString()
              };
              
              // Mantener otros campos
              Object.keys(playerStats).forEach(key => {
                if (!updateData[key] && key !== 'player_id' && key !== 'id') {
                  updateData[key] = playerStats[key];
                }
              });
              
              await supabase
                .from('player_stats')
                .upsert(updateData, { onConflict: 'player_id' });
              
              console.log(`✅ ${player.username}: +${missingCroc} CROC, +${missingCoins} monedas`);
              repairedCount++;
            }
          }
          
          // 5. DAR BONOS A LOS REFERIDOS QUE NO LOS TIENEN
          for (const referral of referrals) {
            const { data: referralStats } = await supabase
              .from('player_stats')
              .select('native_token_balance, coins, total_coins')
              .eq('player_id', referral.id)
              .maybeSingle();
            
            if (referralStats) {
              const currentTokens = Number(referralStats.native_token_balance) || 0;
              const currentCoinsRef = Number(referralStats.coins) || 0;
              const currentTotalCoins = Number(referralStats.total_coins) || 0;
              
              // Si tiene menos de 10 CROC, darle los que faltan
              if (currentTokens < 10) {
                const missingTokens = 10 - currentTokens;
                const missingCoinsRef = 1000 - currentCoinsRef;
                
                await supabase
                  .from('player_stats')
                  .update({
                    native_token_balance: currentTokens + missingTokens,
                    coins: currentCoinsRef + missingCoinsRef,
                    total_coins: currentTotalCoins + missingCoinsRef,
                    updated_at: new Date().toISOString()
                  })
                  .eq('player_id', referral.id);
                
                console.log(`   👤 Referido ${referral.id}: +${missingTokens} CROC, +${missingCoinsRef} monedas`);
              }
            }
          }
          
          // 6. ACTUALIZAR TABLA PLAYERS
          await supabase
            .from('players')
            .update({
              total_earned_croc: expectedCroc,
              total_earned_coins: expectedCoins,
              updated_at: new Date().toISOString()
            })
            .eq('id', player.id);
        }
      }
      
      console.log(`🔧 REPARACIÓN COMPLETADA: ${repairedCount} jugadores reparados`);
      console.log('🔧 =========== FIN REPARACIÓN ===========');
      
      // Actualizar stats locales si hay jugador activo
      if (gameData.player?.id) {
        await refreshReferralStats();
      }
      
    } catch (error) {
      console.error('❌ Error en repairReferralSystem:', error);
    }
  };

  // 🎯 FORZAR ACTUALIZACIÓN DE RECOMPENSAS DEL REFERIDOR
  const forceUpdateReferrerRewards = useCallback(async (referrerId) => {
    try {
      console.log('🔄 Forzando actualización de recompensas para referidor:', referrerId);
      
      // 1. Contar referidos
      const { data: referrals } = await supabase
        .from('players')
        .select('id')
        .eq('referred_by', referrerId);
      
      const totalReferrals = referrals?.length || 0;
      
      // 2. Obtener stats actuales
      const { data: currentStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', referrerId)
        .maybeSingle();
      
      if (currentStats) {
        // Calcular recompensas esperadas
        const expectedCroc = totalReferrals * 10;
        const expectedCoins = totalReferrals * 1000;
        
        // Calcular diferencias
        const currentCroc = Number(currentStats.croc_from_refs) || 0;
        const currentCoins = Number(currentStats.coins_from_refs) || 0;
        
        const missingCroc = Math.max(0, expectedCroc - currentCroc);
        const missingCoins = Math.max(0, expectedCoins - currentCoins);
        
        if (missingCroc > 0 || missingCoins > 0) {
          // Actualizar balances
          const updateData = {
            ...currentStats,
            native_token_balance: (Number(currentStats.native_token_balance) || 0) + missingCroc,
            coins: (Number(currentStats.coins) || 0) + missingCoins,
            total_coins: (Number(currentStats.total_coins) || 0) + missingCoins,
            croc_from_refs: expectedCroc,
            coins_from_refs: expectedCoins,
            referrals_count: totalReferrals,
            updated_at: new Date().toISOString()
          };
          
          await supabase
            .from('player_stats')
            .upsert(updateData, { onConflict: 'player_id' });
          
          console.log(`✅ Referidor ${referrerId}: +${missingCroc} CROC, +${missingCoins} monedas`);
          
          // Actualizar tabla players
          await supabase
            .from('players')
            .update({
              total_earned_croc: expectedCroc,
              total_earned_coins: expectedCoins,
              updated_at: new Date().toISOString()
            })
            .eq('id', referrerId);
          
          // Si es el usuario actual, actualizar estado local
          if (gameData.player?.id === referrerId) {
            await refreshReferralStats();
          }
          
          return { success: true, missingCroc, missingCoins };
        }
      }
      
      return { success: false, message: 'No hay recompensas faltantes' };
    } catch (error) {
      console.error('❌ Error en forceUpdateReferrerRewards:', error);
      return { success: false, error: error.message };
    }
  }, [gameData.player?.id, refreshReferralStats]);

  // 🎯 FUNCIONES DE ACTUALIZACIÓN
  const updateGameState = useCallback((newState) => {
    if (!isMounted.current) return;

    setGameData(prev => {
      const updated = { 
        ...prev, 
        gameState: { ...prev.gameState, ...newState } 
      };
      
      syncGameData(newState);
      
      return updated;
    });
  }, [syncGameData]);

  const updateUpgrades = useCallback((newUpgrades) => {
    setGameData(prev => {
      const updated = { ...prev, upgrades: newUpgrades };
      syncGameData({ upgrades: newUpgrades });
      return updated;
    });
  }, [syncGameData]);

  const updateMissions = useCallback((newMissions) => {
    setGameData(prev => ({ ...prev, missions: newMissions }));
  }, []);

  const updateOwnedCards = useCallback((newOwnedCards) => {
    setGameData(prev => ({ ...prev, ownedCards: newOwnedCards }));
  }, []);

 // 🎯 FUNCIONES DE ACTUALIZACIÓN MEJORADAS
const updateOwnedItems = useCallback((newOwnedItems) => {
  setGameData(prev => {
    const updated = { ...prev, ownedItems: newOwnedItems };
    // Sincronizar inmediatamente
    syncGameData({ owned_items: newOwnedItems });
    return updated;
  });
}, [syncGameData]);

const updateActiveSkin = useCallback((newActiveSkin) => {
  setGameData(prev => {
    const updated = { ...prev, activeSkin: newActiveSkin };
    // Sincronizar inmediatamente
    syncGameData({ active_skin: newActiveSkin });
    return updated;
  });
}, [syncGameData]);

  const updateAchievementsUnlocked = useCallback((newAchievements) => {
    setGameData(prev => ({ ...prev, achievementsUnlocked: newAchievements }));
  }, []);

 const updateDailyRewards = useCallback((newDailyRewards) => {
  console.log('🔄 Actualizando dailyRewards local:', newDailyRewards);
  
  setGameData(prev => { 
    const updated = { 
      ...prev, 
      dailyRewards: newDailyRewards 
    };
    
    // Sincronizar inmediatamente con BD
    syncGameData({ daily_rewards: newDailyRewards });
    
    return updated;
  });
}, [syncGameData]);

  const updateFarmingMilestones = useCallback((newFarmingMilestones) => {
    setGameData(prev => ({ ...prev, farmingMilestones: newFarmingMilestones }));
  }, []);

  const updateReferralStats = useCallback((newReferralStats) => {
    setGameData(prev => ({ ...prev, referralStats: newReferralStats }));
  }, []);

  const getReferralLink = useCallback(() => {
    if (!gameData.player?.referral_code) return window.location.origin;
    return `${window.location.origin}?ref=${gameData.player.referral_code}`;
  }, [gameData.player]);


// En useGameData.js, mejorar las funciones de actualización:

// 🛍️ REFRESCAR DATOS DE LA TIENDA (función nueva)
const refreshShopData = useCallback(async () => {
  if (!gameData.player?.id) return;
  
  try {
    const { data: stats } = await supabase
      .from('player_stats')
      .select('owned_items, active_skin, coins, native_token_balance')
      .eq('player_id', gameData.player.id)
      .single();
    
    if (stats) {
      setGameData(prev => ({
        ...prev,
        ownedItems: stats.owned_items || [],
        activeSkin: stats.active_skin || null,
        gameState: {
          ...prev.gameState,
          coins: Number(stats.coins) || 0,
          nativeTokenBalance: Number(stats.native_token_balance) || 0
        }
      }));
    }
  } catch (error) {
    console.error('❌ Error refrescando datos de tienda:', error);
  }
}, [gameData.player?.id]);

// Agregar esta función al return del hook


  // 📥 CARGA INICIAL
  useEffect(() => {
    isMounted.current = true;
    loadGameData();

    return () => {
      isMounted.current = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [loadGameData]);

  // 🔄 ACTUALIZAR REFERIDOS CADA 30 SEGUNDOS
  useEffect(() => {
    if (!gameData.player?.id) return;

    const interval = setInterval(async () => {
      try {
        await refreshReferralStats();
      } catch (error) {
        console.error('❌ Error en actualización periódica de referidos:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [gameData.player?.id, refreshReferralStats]);

  return {
    // 🎯 DATOS COMPLETOS
    ...gameData,
    
    // 🎯 FUNCIONES DE ACTUALIZACIÓN
    updateGameState,
    updateUpgrades,
    updateMissions,
    updateOwnedCards,
    updateOwnedItems,
    updateActiveSkin,
    updateAchievementsUnlocked,
    updateDailyRewards,
    updateFarmingMilestones,
    updateReferralStats,
    refreshShopData,

    
    // 🎯 FUNCIONES DE SINCRONIZACIÓN
    syncGameData,
    refreshReferralStats,
    getReferralLink,
    repairReferralSystem,
    forceUpdateReferrerRewards,
    
    // 🏆 FUNCIONES DE RANKING
    loadRanking,
    refreshRanking,
    
    // 🎯 FUNCIONES DE UTILIDAD
    loadGameData
  };
}