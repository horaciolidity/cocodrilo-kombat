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
      
      // 3. Obtener estadísticas de referidos
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
        level: stats.level
      });
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setGameData(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
    }
  }, [user]);

  // 🎯 OBTENER O CREAR JUGADOR
  const getOrCreatePlayer = async (user) => {
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingPlayer) {
      return existingPlayer;
    }

    const username = `croc${Math.floor(Math.random() * 9000 + 1000)}`;
    const referralCode = Math.random().toString(36).substring(2, 10);
    
    const referralCodeFromMetadata = user.user_metadata?.referral_code;
    let referredBy = null;

    if (referralCodeFromMetadata) {
      console.log(`🎯 Buscando referidor con código: ${referralCodeFromMetadata}`);
      
      const { data: referrer } = await supabase
        .from('players')
        .select('id')
        .eq('referral_code', referralCodeFromMetadata)
        .single();

      if (referrer) {
        referredBy = referrer.id;
        console.log(`✅ Referidor encontrado: ${referrer.id}`);
      }
    }

    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert([{
        user_id: user.id,
        username,
        avatar_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`,
        referral_code: referralCode,
        referred_by: referredBy
      }])
      .select()
      .single();

    if (error) throw error;

    if (referredBy) {
      try {
        await supabase
          .from('player_stats')
          .update({
            native_token_balance: supabase.raw('native_token_balance + 10'),
            coins: supabase.raw('coins + 1000'),
            coins_from_refs: supabase.raw('coins_from_refs + 1000'),
            croc_from_refs: supabase.raw('croc_from_refs + 10'),
            referrals_count: supabase.raw('referrals_count + 1')
          })
          .eq('player_id', referredBy);

        console.log(`✅ Recompensas aplicadas al referidor: ${referredBy}`);
      } catch (refError) {
        console.error("❌ Error aplicando recompensas de referido:", refError);
      }
    }

    return newPlayer;
  };

  // 🎯 OBTENER O CREAR ESTADÍSTICAS DEL JUGADOR
  const getOrCreatePlayerStats = async (playerId) => {
    const { data: stats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();

    if (stats) return stats;

    const { data: player } = await supabase
      .from('players')
      .select('referred_by')
      .eq('id', playerId)
      .single();

    const isReferred = !!player?.referred_by;

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
      achievements_unlocked: [],
      daily_rewards: { streak: 0, available: true, lastClaim: null },
      farming_milestones: INITIAL_FARMING_MILESTONES_STATE
    };

    const { data: newStats, error } = await supabase
      .from('player_stats')
      .insert([initialStats])
      .select()
      .single();

    if (error) throw error;
    return newStats;
  };

  // 🎯 OBTENER ESTADÍSTICAS DE REFERIDOS
  const getReferralStats = async (playerId) => {
    const { data: referrals } = await supabase
      .from('players')
      .select('id')
      .eq('referred_by', playerId);

    const referralsCount = referrals?.length || 0;
    const crocFromRefs = referralsCount * 10;
    const coinsFromRefs = referralsCount * 1000;

    return { referralsCount, crocFromRefs, coinsFromRefs };
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
    nativeTokenBalance: Number(stats.native_token_balance) || Number(stats.croc_tokens) || 0,
    referralsCount: Number(stats.referrals_count) || 0,
    crocFromRefs: Number(stats.croc_from_refs) || 0,
    coinsFromRefs: Number(stats.coins_from_refs) || 0,
    playerId: stats.player_id
  });

  // 🔄 SINCRONIZACIÓN OPTIMIZADA CON THROTTLING Y BATCHING
  const syncGameData = useCallback(async (updates = {}) => {
    if (!gameData.player?.id || gameData.syncInProgress) {
      pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
      return;
    }

    const now = Date.now();
    
    // Throttling: 2 segundos mínimo entre syncs
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
      
      // Combinar actualizaciones pendientes con las nuevas
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

      console.log('🔄 Sincronizando datos:', {
        coins: payload.coins,
        energy: payload.energy,
        tokens: payload.native_token_balance
      });

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
      
      console.log('✅ Datos sincronizados exitosamente');

    } catch (error) {
      console.error('❌ Error en sync:', error);
      setGameData(prev => ({ ...prev, syncInProgress: false }));
      
      // Reintentar en 5 segundos
      setTimeout(() => {
        if (Object.keys(pendingSyncRef.current).length > 0) {
          syncGameData(pendingSyncRef.current);
        }
      }, 5000);
    }
  }, [gameData]);

  // 🏆 CARGAR RANKING CON CACHÉ
  const loadRanking = useCallback(async (scope = "global") => {
    const cacheKey = scope;
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30 segundos

    // Verificar caché
    if (rankingCacheRef.current[cacheKey]?.data && 
        now - rankingCacheRef.current[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`🏆 Usando caché de ranking (${scope})`);
      return rankingCacheRef.current[cacheKey].data;
    }

    try {
      console.log(`🏆 Cargando ranking desde Supabase (${scope})`);
      
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

      // Filtrar por período
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
        avatar: row.players.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${row.players.username || "anon"}&backgroundColor=transparent`,
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

      // Actualizar caché
      rankingCacheRef.current[cacheKey] = {
        data: processedData,
        timestamp: now
      };

      return processedData;
    } catch (error) {
      console.error(`❌ Error cargando ranking (${scope}):`, error);
      // Devolver caché anterior si existe
      return rankingCacheRef.current[cacheKey]?.data || [];
    }
  }, [user]);

  // 🔄 REFRESCAR RANKING (ignorar caché)
  const refreshRanking = useCallback(async (scope = "global") => {
    console.log(`🔄 Refrescando ranking (${scope})`);
    // Invalidar caché
    rankingCacheRef.current[scope] = null;
    return loadRanking(scope);
  }, [loadRanking]);

  // 🎯 FUNCIONES DE ACTUALIZACIÓN OPTIMIZADAS
  const updateGameState = useCallback((newState) => {
    if (!isMounted.current) return;

    setGameData(prev => {
      const updated = { 
        ...prev, 
        gameState: { ...prev.gameState, ...newState } 
      };
      
      // Sincronizar con throttling
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

  // 🎯 FUNCIONES DE UTILIDAD
  const refreshReferralStats = useCallback(async () => {
    if (!gameData.player?.id) return;
    
    const stats = await getReferralStats(gameData.player.id);
    setGameData(prev => ({ ...prev, referralStats: stats }));
    
    // Actualizar también en gameState
    updateGameState({
      referralsCount: stats.referralsCount,
      crocFromRefs: stats.crocFromRefs,
      coinsFromRefs: stats.coinsFromRefs
    });
  }, [gameData.player?.id, updateGameState]);

  const getReferralLink = useCallback(() => {
    if (!gameData.player?.referral_code) return window.location.origin;
    return `${window.location.origin}?ref=${gameData.player.referral_code}`;
  }, [gameData.player]);

  const verifyDataIntegrity = useCallback(async () => {
    if (!gameData.player?.id) return;
    
    try {
      console.log('🔍 Verificando integridad de datos...');
      
      const { data: serverStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', gameData.player.id)
        .single();

      if (!serverStats) {
        console.warn('⚠️ No hay datos en el servidor para comparar');
        return;
      }

      const discrepancies = [];
      
      if (Math.floor(serverStats.coins) !== Math.floor(gameData.gameState.coins)) {
        console.warn(`⚠️ Monedas desincronizadas: local=${gameData.gameState.coins}, servidor=${serverStats.coins}`);
        discrepancies.push('coins');
      }
      
      if (Math.floor(serverStats.native_token_balance) !== Math.floor(gameData.gameState.nativeTokenBalance)) {
        console.warn(`⚠️ Tokens desincronizados: local=${gameData.gameState.nativeTokenBalance}, servidor=${serverStats.native_token_balance}`);
        discrepancies.push('tokens');
      }
      
      if (serverStats.level !== gameData.gameState.level) {
        console.warn(`⚠️ Nivel desincronizado: local=${gameData.gameState.level}, servidor=${serverStats.level}`);
        discrepancies.push('level');
      }

      if (serverStats.energy !== gameData.gameState.energy) {
        console.warn(`⚠️ Energía desincronizada: local=${gameData.gameState.energy}, servidor=${serverStats.energy}`);
        discrepancies.push('energy');
      }

      if (discrepancies.length > 0) {
        console.warn('⚠️ Corrigiendo discrepancias...');
        // Sincronizar con datos del servidor para energía y otros campos críticos
        updateGameState({
          energy: serverStats.energy,
          coins: serverStats.coins,
          nativeTokenBalance: serverStats.native_token_balance,
          level: serverStats.level
        });
      } else {
        console.log('✅ Integridad de datos verificada - Todo correcto');
      }
      
    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
    }
  }, [gameData, updateGameState]);

  // 📥 CARGA INICIAL
  useEffect(() => {
    isMounted.current = true;
    loadGameData();

    return () => {
      isMounted.current = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [loadGameData]);

  // 🔄 SINCRONIZACIÓN PERIÓDICA Y VERIFICACIÓN DE ENERGÍA
  useEffect(() => {
    if (!gameData.player?.id) return;

    const interval = setInterval(async () => {
      try {
        // 1. Verificar energía en servidor
        const { data: serverStats } = await supabase
          .from('player_stats')
          .select('energy, max_energy')
          .eq('player_id', gameData.player.id)
          .single();

        if (serverStats) {
          const serverEnergy = Number(serverStats.energy);
          const localEnergy = gameData.gameState.energy;
          
          // Si hay desincronización mayor a 5 puntos, corregir
          if (Math.abs(serverEnergy - localEnergy) > 5) {
            console.warn(`⚡ Desincronización de energía detectada: local=${localEnergy}, servidor=${serverEnergy}`);
            updateGameState({ 
              energy: serverEnergy,
              maxEnergy: serverStats.max_energy
            });
          }
        }

        // 2. Sincronizar datos pendientes
        if (Object.keys(pendingSyncRef.current).length > 0) {
          syncGameData(pendingSyncRef.current);
        }

        // 3. Verificar integridad cada 5 minutos
        if (Math.random() < 0.2) { // ~20% de probabilidad cada 30 segundos
          verifyDataIntegrity();
        }

      } catch (error) {
        console.error('❌ Error en sincronización periódica:', error);
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [gameData.player?.id, gameData.gameState.energy, syncGameData, verifyDataIntegrity, updateGameState]);

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
    verifyDataIntegrity,
    
    // 🏆 FUNCIONES DE RANKING
    loadRanking,
    refreshRanking,
    
    // 🎯 FUNCIONES DE UTILIDAD
    loadGameData,
    
    // 🎯 FUNCIONES DE RESET
    resetGameData: () => {
      const resetData = {
        gameState: INITIAL_GAME_STATE,
        upgrades: INITIAL_UPGRADES_STATE,
        missions: INITIAL_MISSIONS_STATE,
        ownedCards: [],
        ownedItems: [],
        activeSkin: null,
        achievementsUnlocked: [],
        dailyRewards: { lastClaim: null, streak: 0, available: true },
        farmingMilestones: INITIAL_FARMING_MILESTONES_STATE,
      };
      
      setGameData(prev => ({ ...prev, ...resetData }));
      syncGameData(resetData);
    }
  };
}