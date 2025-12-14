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
    // 🎮 DATOS DEL JUEGO
    gameState: INITIAL_GAME_STATE,
    upgrades: INITIAL_UPGRADES_STATE,
    missions: INITIAL_MISSIONS_STATE,
    ownedCards: [],
    ownedItems: [],
    activeSkin: null,
    achievementsUnlocked: [],
    dailyRewards: { lastClaim: null, streak: 0, available: true },
    farmingMilestones: INITIAL_FARMING_MILESTONES_STATE,
    
    // 👤 DATOS DEL JUGADOR
    player: null,
    referralStats: { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 },
    
    // 📊 DATOS ADICIONALES
    allCards: CARDS_DATA,
    allShopItems: SHOP_ITEMS,
    statsForRanking: null,
    
    // 🔧 ESTADO DEL SISTEMA
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

  // 🔄 CARGAR DATOS COMPLETOS DESDE SUPABASE
  const loadGameData = useCallback(async () => {
    if (!user) {
      setGameData(prev => ({ 
        ...prev, 
        loading: false,
        player: null,
        gameState: INITIAL_GAME_STATE
      }));
      return;
    }

    try {
      setGameData(prev => ({ ...prev, loading: true, error: null }));
      console.log('🎮 Cargando datos del juego para usuario:', user.id);
      
      // 1. Obtener o crear jugador
      let player = await getOrCreatePlayer(user);
      
      if (!player) {
        throw new Error('No se pudo crear/obtener el jugador');
      }
      
      // 2. Obtener estadísticas del jugador
      const stats = await getOrCreatePlayerStats(player.id);
      
      // 3. Obtener estadísticas de referidos (ACTUALIZADO - LLAMADO INMEDIATO)
      const referralStats = await getReferralStats(player.id);
      
      // 4. Actualizar estado con todos los datos
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
      
      console.log('✅ Datos cargados correctamente:', {
        player: player.username,
        coins: stats.coins,
        level: stats.level,
        tokens: stats.native_token_balance,
        referidos: referralStats.referralsCount
      });
      
      // 5. FORZAR ACTUALIZACIÓN DE REFERIDOS INMEDIATAMENTE
      console.log('🔁 Forzando actualización completa de referidos...');
      await refreshReferralStats();
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setGameData(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  }, [user]);

  // 🎯 OBTENER O CREAR JUGADOR - VERSIÓN CORREGIDA
  const getOrCreatePlayer = async (user) => {
    console.log('🔍 Debug - Buscando jugador para user_id:', user.id);
    
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPlayer) {
      console.log('✅ Jugador existente encontrado:', existingPlayer.username);
      return existingPlayer;
    }

    // Generar username a partir del email (si existe) o aleatorio
    const emailUsername = user.email ? user.email.split('@')[0] : '';
    const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
    const username = emailUsername 
      ? `${emailUsername}${randomSuffix}` 
      : `croc${randomSuffix}`;
    
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // 🔍 Obtener código de referencia (de múltiples fuentes)
    let referredBy = null;
    let referralCodeUsed = null;
    
    // 1. Primero de user_metadata (si viene del AuthModal)
    if (user.user_metadata?.referral_code) {
      referralCodeUsed = user.user_metadata.referral_code;
      console.log('🔗 Código de referencia de metadata:', referralCodeUsed);
    } 
    // 2. Luego de localStorage (si viene de URL)
    else if (localStorage.getItem('referral_code')) {
      referralCodeUsed = localStorage.getItem('referral_code');
      localStorage.removeItem('referral_code'); // Limpiar después de usar
      console.log('🔗 Código de referencia de localStorage:', referralCodeUsed);
    }
    
    // Buscar referidor
    if (referralCodeUsed) {
      console.log(`🎯 Buscando referidor con código: ${referralCodeUsed.toUpperCase()}`);
      
      const { data: referrer, error: referrerError } = await supabase
        .from('players')
        .select('id, username, referral_code')
        .eq('referral_code', referralCodeUsed.toUpperCase().trim())
        .maybeSingle();
      
      if (!referrerError && referrer) {
        referredBy = referrer.id;
        console.log(`✅ Referidor encontrado: ${referrer.username} (${referrer.id}) con código ${referrer.referral_code}`);
        
        // Aplicar recompensas inmediatamente
        await applyReferralRewards(referredBy);
      } else {
        console.warn(`⚠️ Código de referencia no válido o no encontrado: ${referralCodeUsed}`);
      }
    }

    console.log('🎮 Creando nuevo jugador:', { username, referralCode, referredBy });

    // Crear nuevo jugador
    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert([{
        user_id: user.id,
        username: username,
        avatar_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`,
        referral_code: referralCode,
        referred_by: referredBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando jugador:', error);
      
      // Intentar con otro username si hay duplicado
      if (error.code === '23505' && error.message.includes('username')) {
        const altUsername = `${username}_${Math.floor(Math.random() * 1000)}`;
        const { data: altPlayer, error: altError } = await supabase
          .from('players')
          .insert([{
            user_id: user.id,
            username: altUsername,
            avatar_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${altUsername}`,
            referral_code: referralCode,
            referred_by: referredBy,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (altError) {
          console.error('❌ Error creando jugador alternativo:', altError);
          throw altError;
        }
        return altPlayer;
      }
      throw error;
    }

    console.log('✅ Nuevo jugador creado:', newPlayer.username);
    return newPlayer;
  };

  // 🎯 FUNCIÓN PARA APLICAR RECOMPENSAS DE REFERIDO - NUEVA Y MEJORADA
  const applyReferralRewards = async (referrerId) => {
    try {
      console.log(`🎁 Aplicando recompensas al referidor: ${referrerId}`);
      
      // 1. Primero contar cuántos referidos tiene ACTUALMENTE
      const { data: referrals, error: countError } = await supabase
        .from('players')
        .select('id')
        .eq('referred_by', referrerId);
      
      if (countError) {
        console.error('❌ Error contando referidos:', countError);
        return;
      }
      
      const totalReferrals = referrals?.length || 0;
      console.log(`📊 Referidor ${referrerId} tiene ${totalReferrals} referidos`);
      
      // 2. Calcular cuánto debería tener
      const expectedCrocFromRefs = totalReferrals * 10;
      const expectedCoinsFromRefs = totalReferrals * 1000;
      
      // 3. Verificar si ya tiene player_stats
      const { data: existingStats, error: statsError } = await supabase
        .from('player_stats')
        .select('croc_from_refs, coins_from_refs, referrals_count, native_token_balance, coins')
        .eq('player_id', referrerId)
        .maybeSingle();
      
      let updatePayload = {
        referrals_count: totalReferrals,
        croc_from_refs: expectedCrocFromRefs,
        coins_from_refs: expectedCoinsFromRefs,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      
      if (existingStats) {
        // Si ya existe, calcular la diferencia y aplicar
        const currentCrocRefs = Number(existingStats.croc_from_refs) || 0;
        const currentCoinsRefs = Number(existingStats.coins_from_refs) || 0;
        
        const crocDiff = expectedCrocFromRefs - currentCrocRefs;
        const coinsDiff = expectedCoinsFromRefs - currentCoinsRefs;
        
        if (crocDiff > 0 || coinsDiff > 0) {
          console.log(`💰 Aplicando diferencia: +${crocDiff} CROC, +${coinsDiff} monedas`);
          
          updatePayload.native_token_balance = supabase.raw(`COALESCE(native_token_balance, 0) + ${crocDiff}`);
          updatePayload.coins = supabase.raw(`COALESCE(coins, 0) + ${coinsDiff}`);
          
          // Actualizar player_stats
          const { error: updateError } = await supabase
            .from('player_stats')
            .update(updatePayload)
            .eq('player_id', referrerId);
          
          if (updateError) throw updateError;
        }
      } else {
        // Si no existe, crear con los valores iniciales
        updatePayload.player_id = referrerId;
        updatePayload.native_token_balance = expectedCrocFromRefs;
        updatePayload.coins = expectedCoinsFromRefs;
        updatePayload.level = 1;
        updatePayload.energy = 100;
        updatePayload.max_energy = 100;
        updatePayload.click_power = 1;
        updatePayload.coins_per_second = 0;
        updatePayload.experience = 0;
        updatePayload.total_coins = expectedCoinsFromRefs;
        updatePayload.clicks = 0;
        
        const { error: insertError } = await supabase
          .from('player_stats')
          .insert([updatePayload]);
        
        if (insertError) throw insertError;
      }
      
      // 4. ACTUALIZAR TABLA PLAYERS (ESTO ES LO QUE FALTABA)
      const { error: updatePlayerError } = await supabase
        .from('players')
        .update({
          total_earned_croc: expectedCrocFromRefs,
          total_earned_coins: expectedCoinsFromRefs,
          updated_at: new Date().toISOString(),
          last_active: new Date().toISOString()
        })
        .eq('id', referrerId);
      
      if (updatePlayerError) throw updatePlayerError;
      
      console.log(`✅ Recompensas aplicadas al referidor ${referrerId}:`, {
        referidos: totalReferrals,
        croc: expectedCrocFromRefs,
        coins: expectedCoinsFromRefs
      });
      
    } catch (error) {
      console.error("❌ Error aplicando recompensas de referido:", error);
    }
  };

  // 🎯 OBTENER O CREAR ESTADÍSTICAS DEL JUGADOR
  const getOrCreatePlayerStats = async (playerId) => {
    console.log('📊 Buscando player_stats para player_id:', playerId);
    
    const { data: stats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();

    if (stats) {
      console.log('✅ Player_stats encontradas:', { 
        coins: stats.coins, 
        tokens: stats.native_token_balance,
        upgrades: Object.keys(stats.upgrades || {}).length,
        referidos: stats.referrals_count
      });
      return stats;
    }

    console.log('📝 Creando player_stats nuevas para:', playerId);
    
    // Verificar si el jugador fue referido
    const { data: player } = await supabase
      .from('players')
      .select('referred_by')
      .eq('id', playerId)
      .single();

    const isReferred = !!player?.referred_by;
    console.log(`🎯 Jugador ${playerId} es referido: ${isReferred}`);
    
    const initialStats = {
      player_id: playerId,
      coins: isReferred ? 1000 : 0,
      native_token_balance: isReferred ? 10 : 0,
      level: 1,
      clicks: 0,
      energy: 100,
      max_energy: 100,
      click_power: 1,
      coins_per_second: 0,
      experience: 0,
      total_coins: isReferred ? 1000 : 0,
      croc_from_refs: 0,
      coins_from_refs: 0,
      referrals_count: 0,
      upgrades: INITIAL_UPGRADES_STATE,
      missions: INITIAL_MISSIONS_STATE,
      owned_cards: [],
      owned_items: [],
      active_skin: null,
      achievements_unlocked: [],
      daily_rewards: { 
        streak: 0, 
        available: true, 
        lastClaim: null 
      },
      farming_milestones: INITIAL_FARMING_MILESTONES_STATE,
      updated_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    const { data: newStats, error } = await supabase
      .from('player_stats')
      .insert([initialStats])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando player_stats:', error);
      throw error;
    }
    
    console.log(`📊 Player_stats creadas para jugador ${playerId}. Referido: ${isReferred}`);
    
    return newStats;
  };

  // 🎯 OBTENER ESTADÍSTICAS DE REFERIDOS - VERSIÓN SIMPLIFICADA Y CORREGIDA
  const getReferralStats = async (playerId) => {
    try {
      console.log('📈 Obteniendo stats de referidos para:', playerId);
      
      // 1. Contar referidos REALES de la tabla players
      const { data: referrals, error: referralsError } = await supabase
        .from('players')
        .select('id, username, created_at')
        .eq('referred_by', playerId);

      if (referralsError) {
        console.error('❌ Error obteniendo referidos:', referralsError);
        return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
      }
      
      const realReferralsCount = referrals?.length || 0;
      
      // 2. Obtener stats actuales del jugador
      const { data: playerStats, error: statsError } = await supabase
        .from('player_stats')
        .select('croc_from_refs, coins_from_refs, referrals_count')
        .eq('player_id', playerId)
        .single();

      // Si no hay stats, crear unas básicas
      if (statsError || !playerStats) {
        console.log('📝 No hay player_stats, creando nuevas...');
        await getOrCreatePlayerStats(playerId);
        return { 
          referralsCount: realReferralsCount, 
          crocFromRefs: realReferralsCount * 10, 
          coinsFromRefs: realReferralsCount * 1000 
        };
      }
      
      const currentCrocRefs = Number(playerStats.croc_from_refs) || 0;
      const currentCoinsRefs = Number(playerStats.coins_from_refs) || 0;
      const currentRefCount = Number(playerStats.referrals_count) || 0;
      
      // 3. Calcular cuánto DEBERÍA tener
      const expectedCrocFromRefs = realReferralsCount * 10;
      const expectedCoinsFromRefs = realReferralsCount * 1000;
      
      console.log(`📊 Referral stats para ${playerId}:`, {
        referidosReales: realReferralsCount,
        referidosEnStats: currentRefCount,
        crocEsperado: expectedCrocFromRefs,
        crocActual: currentCrocRefs,
        monedasEsperadas: expectedCoinsFromRefs,
        monedasActuales: currentCoinsRefs,
        necesitaActualizar: currentRefCount !== realReferralsCount
      });
      
      return { 
        referralsCount: realReferralsCount, 
        crocFromRefs: expectedCrocFromRefs, 
        coinsFromRefs: expectedCoinsFromRefs 
      };
    } catch (error) {
      console.error("❌ Error obteniendo estadísticas de referidos:", error);
      return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
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

  const updateOwnedItems = useCallback((newOwnedItems) => {
    setGameData(prev => ({ ...prev, ownedItems: newOwnedItems }));
  }, []);

  const updateActiveSkin = useCallback((newActiveSkin) => {
    setGameData(prev => ({ ...prev, activeSkin: newActiveSkin }));
  }, []);

  const updateAchievementsUnlocked = useCallback((newAchievements) => {
    setGameData(prev => ({ ...prev, achievementsUnlocked: newAchievements }));
  }, []);

  const updateDailyRewards = useCallback((newDailyRewards) => {
    setGameData(prev => ({ ...prev, dailyRewards: newDailyRewards }));
  }, []);

  const updateFarmingMilestones = useCallback((newFarmingMilestones) => {
    setGameData(prev => ({ ...prev, farmingMilestones: newFarmingMilestones }));
  }, []);

  const updateReferralStats = useCallback((newReferralStats) => {
    setGameData(prev => ({ ...prev, referralStats: newReferralStats }));
  }, []);

  // 🎯 ACTUALIZAR ESTADÍSTICAS DE REFERIDOS - VERSIÓN SIMPLIFICADA
  const refreshReferralStats = useCallback(async () => {
    if (!gameData.player?.id) return;
    
    try {
      console.log('🔄 Actualizando estadísticas de referidos para:', gameData.player.username);
      
      // 1. Contar referidos REALES
      const { data: referrals, error: referralsError } = await supabase
        .from('players')
        .select('id, username')
        .eq('referred_by', gameData.player.id);
      
      if (referralsError) {
        console.error('❌ Error obteniendo referidos:', referralsError);
        return;
      }
      
      const realReferralsCount = referrals?.length || 0;
      
      // 2. Calcular valores que DEBERÍA tener
      const expectedCrocFromRefs = realReferralsCount * 10;
      const expectedCoinsFromRefs = realReferralsCount * 1000;
      
      // 3. ACTUALIZAR player_stats con los valores CORRECTOS
      const { error: updateStatsError } = await supabase
        .from('player_stats')
        .update({
          referrals_count: realReferralsCount,
          croc_from_refs: expectedCrocFromRefs,
          coins_from_refs: expectedCoinsFromRefs,
          native_token_balance: supabase.raw(`GREATEST(COALESCE(native_token_balance, 0), ${expectedCrocFromRefs})`),
          coins: supabase.raw(`GREATEST(COALESCE(coins, 0), ${expectedCoinsFromRefs})`),
          updated_at: new Date().toISOString()
        })
        .eq('player_id', gameData.player.id);
      
      if (updateStatsError) {
        console.error('❌ Error actualizando player_stats:', updateStatsError);
        return;
      }
      
      // 4. ACTUALIZAR TABLA players (ESTO ES CLAVE)
      const { error: updatePlayerError } = await supabase
        .from('players')
        .update({
          total_earned_croc: expectedCrocFromRefs,
          total_earned_coins: expectedCoinsFromRefs,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameData.player.id);
      
      if (updatePlayerError) {
        console.error('❌ Error actualizando tabla players:', updatePlayerError);
        return;
      }
      
      // 5. Actualizar estado local
      const newStats = { 
        referralsCount: realReferralsCount, 
        crocFromRefs: expectedCrocFromRefs, 
        coinsFromRefs: expectedCoinsFromRefs 
      };
      
      setGameData(prev => ({ 
        ...prev, 
        referralStats: newStats 
      }));
      
      updateGameState({
        referralsCount: newStats.referralsCount,
        crocFromRefs: newStats.crocFromRefs,
        coinsFromRefs: newStats.coinsFromRefs
      });
      
      console.log('✅ Referidos actualizados correctamente:', {
        referidos: realReferralsCount,
        croc: expectedCrocFromRefs,
        monedas: expectedCoinsFromRefs,
        lista: referrals?.map(r => r.username)
      });
      
    } catch (error) {
      console.error('❌ Error refrescando referral stats:', error);
    }
  }, [gameData.player?.id, gameData.player?.username, updateGameState]);

  const getReferralLink = useCallback(() => {
    if (!gameData.player?.referral_code) return window.location.origin;
    return `${window.location.origin}?ref=${gameData.player.referral_code}`;
  }, [gameData.player]);

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
        // Actualizar referidos cada 30 segundos
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
    
    // 🎯 FUNCIONES DE SINCRONIZACIÓN
    syncGameData,
    refreshReferralStats,
    getReferralLink,
    
    // 🏆 FUNCIONES DE RANKING
    loadRanking,
    refreshRanking,
    
    // 🎯 FUNCIONES DE UTILIDAD
    loadGameData
  };
}