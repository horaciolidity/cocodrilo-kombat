
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  INITIAL_GAME_STATE, 
  INITIAL_UPGRADES_STATE, 
  INITIAL_MISSIONS_STATE,
  INITIAL_FARMING_MILESTONES_STATE,
  CARDS_DATA,
  SHOP_ITEMS
} from '@/config/gameConfig';

// 🎯 CONSTANTES DE CONFIGURACIÓN
const SYNC_THROTTLE_MS = 2000; // 2 segundos entre syncs
const ENERGY_CHECK_INTERVAL = 30000; // 30 segundos
const RANKING_CACHE_DURATION = 60000; // 60 segundos cache
const AUTO_SAVE_INTERVAL = 30000; // 30 segundos auto-guardado
const DATA_INTEGRITY_CHECK = 300000; // 5 minutos

export function useGameData(user) {
  // 🎯 ESTADO UNIFICADO DEL JUEGO - OPTIMIZADO
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
    
    // 🔧 ESTADO DEL SISTEMA
    loading: true,
    error: null,
    lastSync: null,
    syncInProgress: false,
    lastEnergyCheck: null
  });

  // 🎯 REFERENCIAS PARA OPTIMIZACIÓN
  const lastSyncRef = useRef(0);
  const pendingSyncRef = useRef({});
  const syncTimeoutRef = useRef(null);
  const isMounted = useRef(true);
  const energyCheckRef = useRef(null);
  const autoSaveRef = useRef(null);
  const dataIntegrityRef = useRef(null);
  
  // 🏆 CACHE DE RANKING MEJORADO
  const rankingCacheRef = useRef({
    global: { 
      data: null, 
      timestamp: 0, 
      version: 0,
      lastRequest: 0 
    },
    weekly: { 
      data: null, 
      timestamp: 0, 
      version: 0,
      lastRequest: 0 
    },
    monthly: { 
      data: null, 
      timestamp: 0, 
      version: 0,
      lastRequest: 0 
    }
  });

  // 🔄 CARGAR DATOS COMPLETOS DESDE SUPABASE - MEJORADO
  const loadGameData = useCallback(async (forceReload = false) => {
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
      
      // 2. Obtener estadísticas del jugador CON RECUPERACIÓN DE ENERGÍA
      const stats = await getOrCreatePlayerStats(player.id);
      
      // 3. VERIFICAR Y CORREGIR ENERGÍA AUTOMÁTICAMENTE
      const correctedStats = await verifyAndCorrectEnergy(stats, player.id);
      
      // 4. Obtener estadísticas de referidos
      const referralStats = await getReferralStats(player.id);
      
      // 5. Actualizar estado con todos los datos
      setGameData(prev => ({
        ...prev,
        player,
        gameState: mapStatsToGameState(correctedStats),
        upgrades: correctedStats.upgrades || INITIAL_UPGRADES_STATE,
        missions: correctedStats.missions || INITIAL_MISSIONS_STATE,
        ownedCards: correctedStats.owned_cards || [],
        ownedItems: correctedStats.owned_items || [],
        activeSkin: correctedStats.active_skin || null,
        achievementsUnlocked: correctedStats.achievements_unlocked || [],
        dailyRewards: correctedStats.daily_rewards || { 
          lastClaim: null, 
          streak: 0, 
          available: true 
        },
        farmingMilestones: correctedStats.farming_milestones || INITIAL_FARMING_MILESTONES_STATE,
        referralStats,
        loading: false,
        lastSync: new Date().toISOString(),
        lastEnergyCheck: new Date().toISOString()
      }));
      
      console.log('✅ Datos cargados correctamente:', {
        player: player.username,
        coins: correctedStats.coins,
        level: correctedStats.level,
        energy: correctedStats.energy,
        maxEnergy: correctedStats.max_energy
      });
      
      // 🔥 SINCRONIZAR DATOS CORREGIDOS
      if (forceReload || correctedStats.energy !== stats.energy) {
        console.log('🔄 Sincronizando datos corregidos...');
        syncGameData(mapStatsToGameState(correctedStats), true);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setGameData(prev => ({ 
        ...prev, 
        error: `Error: ${error.message}`, 
        loading: false 
      }));
    }
  }, [user]);

  // ⚡ VERIFICAR Y CORREGIR ENERGÍA - NUEVA FUNCIÓN
  const verifyAndCorrectEnergy = async (stats, playerId) => {
    const now = new Date();
    const lastActive = new Date(stats.last_active || stats.updated_at);
    const diffMinutes = (now - lastActive) / (1000 * 60);
    
    // Calcular energía regenerada desde la última vez
    const energyRegenerated = Math.floor(diffMinutes * 0.33); // ~1 cada 3 minutos
    const newEnergy = Math.min(
      stats.max_energy || 100,
      (stats.energy || 0) + energyRegenerated
    );
    
    // Si hay regeneración significativa, actualizar
    if (energyRegenerated > 0) {
      console.log(`⚡ Energía regenerada: +${energyRegenerated} (${stats.energy} -> ${newEnergy})`);
      
      const { error } = await supabase
        .from('player_stats')
        .update({ 
          energy: newEnergy,
          last_active: now.toISOString()
        })
        .eq('player_id', playerId);
      
      if (!error) {
        return { ...stats, energy: newEnergy };
      }
    }
    
    return stats;
  };

  // 🎯 OBTENER O CREAR JUGADOR - SIN CAMBIOS
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
      const { data: referrer } = await supabase
        .from('players')
        .select('id')
        .eq('referral_code', referralCodeFromMetadata)
        .single();

      if (referrer) {
        referredBy = referrer.id;
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
      farming_milestones: INITIAL_FARMING_MILESTONES_STATE,
      last_active: new Date().toISOString()
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
    try {
      const { data: referrals } = await supabase
        .from('players')
        .select('id')
        .eq('referred_by', playerId);

      const referralsCount = referrals?.length || 0;
      const crocFromRefs = referralsCount * 10;
      const coinsFromRefs = referralsCount * 1000;

      return { referralsCount, crocFromRefs, coinsFromRefs };
    } catch (error) {
      console.error('❌ Error obteniendo referidos:', error);
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
    nativeTokenBalance: Number(stats.native_token_balance) || Number(stats.croc_tokens) || 0,
    referralsCount: Number(stats.referrals_count) || 0,
    crocFromRefs: Number(stats.croc_from_refs) || 0,
    coinsFromRefs: Number(stats.coins_from_refs) || 0,
    playerId: stats.player_id
  });

  // 🔄 SINCRONIZACIÓN OPTIMIZADA - MEJORADA CON ENERGÍA
  const syncGameData = useCallback(async (updates = {}, force = false) => {
    if (!gameData.player?.id || gameData.syncInProgress) {
      if (Object.keys(updates).length > 0) {
        pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
      }
      return;
    }

    const now = Date.now();
    
    // Throttling: 2 segundos mínimo entre syncs
    if (!force && now - lastSyncRef.current < SYNC_THROTTLE_MS) {
      if (Object.keys(updates).length > 0) {
        pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
        
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
          if (Object.keys(pendingSyncRef.current).length > 0) {
            syncGameData(pendingSyncRef.current, false);
            pendingSyncRef.current = {};
          }
        }, SYNC_THROTTLE_MS - (now - lastSyncRef.current));
      }
      return;
    }

    try {
      setGameData(prev => ({ ...prev, syncInProgress: true }));
      
      // Combinar actualizaciones pendientes con las nuevas
      const allUpdates = { ...pendingSyncRef.current, ...updates };
      pendingSyncRef.current = {};
      
      const currentState = gameData.gameState;
      
      // Preparar payload optimizado
      const payload = {
        player_id: gameData.player.id,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Solo incluir campos que han cambiado
      if (allUpdates.coins !== undefined) {
        payload.coins = Math.floor(allUpdates.coins);
        payload.total_coins = Math.max(currentState.totalCoins, payload.coins);
      }
      
      if (allUpdates.nativeTokenBalance !== undefined) {
        payload.native_token_balance = Math.floor(allUpdates.nativeTokenBalance);
      }
      
      if (allUpdates.level !== undefined) payload.level = allUpdates.level;
      if (allUpdates.totalClicks !== undefined) payload.clicks = allUpdates.totalClicks;
      
      // 🎯 ENERGÍA: Sincronización prioritaria
      if (allUpdates.energy !== undefined) {
        payload.energy = Math.max(0, Math.min(currentState.maxEnergy, allUpdates.energy));
      }
      
      if (allUpdates.maxEnergy !== undefined) payload.max_energy = allUpdates.maxEnergy;
      if (allUpdates.clickPower !== undefined) payload.click_power = allUpdates.clickPower;
      if (allUpdates.coinsPerSecond !== undefined) payload.coins_per_second = allUpdates.coinsPerSecond;
      if (allUpdates.experience !== undefined) payload.experience = allUpdates.experience;
      if (allUpdates.crocFromRefs !== undefined) payload.croc_from_refs = allUpdates.crocFromRefs;
      if (allUpdates.coinsFromRefs !== undefined) payload.coins_from_refs = allUpdates.coinsFromRefs;
      if (allUpdates.referralsCount !== undefined) payload.referrals_count = allUpdates.referralsCount;
      
      // Datos JSON
      if (allUpdates.upgrades !== undefined) payload.upgrades = allUpdates.upgrades;
      if (allUpdates.missions !== undefined) payload.missions = allUpdates.missions;
      if (allUpdates.ownedCards !== undefined) payload.owned_cards = allUpdates.ownedCards;
      if (allUpdates.ownedItems !== undefined) payload.owned_items = allUpdates.ownedItems;
      if (allUpdates.activeSkin !== undefined) payload.active_skin = allUpdates.activeSkin;
      if (allUpdates.achievementsUnlocked !== undefined) payload.achievements_unlocked = allUpdates.achievementsUnlocked;
      if (allUpdates.dailyRewards !== undefined) payload.daily_rewards = allUpdates.dailyRewards;
      if (allUpdates.farmingMilestones !== undefined) payload.farming_milestones = allUpdates.farmingMilestones;

      console.log('🔄 Sincronizando datos:', {
        energy: payload.energy,
        coins: payload.coins,
        tokens: payload.native_token_balance,
        force: force
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
          syncGameData(pendingSyncRef.current, false);
        }
      }, 5000);
    }
  }, [gameData]);

 // 🏆 CARGAR RANKING CON CACHÉ MEJORADA - SIN PARPADEO
const loadRanking = useCallback(async (scope = "global") => {
  const cacheKey = scope;
  const now = Date.now();
  const RANKING_CACHE_DURATION = 60000; // 60 segundos en milisegundos
  
  // Verificar caché y timestamp
  const cache = rankingCacheRef.current[cacheKey];
  
  // Devolver caché si es reciente (< 60 segundos) y del mismo usuario
  if (cache?.data && cache.userId === user?.id && now - cache.timestamp < RANKING_CACHE_DURATION) {
    console.log(`🏆 Usando caché de ranking (${scope}) - Válida por ${Math.floor((RANKING_CACHE_DURATION - (now - cache.timestamp)) / 1000)}s`);
    
    // Actualizar isCurrentUser en datos cacheados
    const updatedData = cache.data.map(player => ({
      ...player,
      isCurrentUser: player.user_id === user?.id
    }));
    
    return updatedData;
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
      joinedDate: row.players.created_at,
      // ID estable para evitar recreación de elementos
      _stableKey: `${row.player_id}_${scope}_${Math.floor(now / 10000)}`
    }));

    // Ordenar por monedas (descendente)
    const sortedData = [...processedData].sort((a, b) => b.coins - a.coins);

    // Actualizar caché con datos clonados
    rankingCacheRef.current[cacheKey] = {
      data: JSON.parse(JSON.stringify(sortedData)), // Clonar profundamente
      timestamp: now,
      version: (cache?.version || 0) + 1,
      userId: user?.id,
      scope: scope,
      lastUpdated: new Date().toISOString()
    };

    console.log(`✅ Ranking ${scope} cargado: ${sortedData.length} jugadores`);
    return sortedData;
    
  } catch (error) {
    console.error(`❌ Error cargando ranking (${scope}):`, error);
    
    // Devolver caché anterior si existe (aunque esté expirada)
    if (cache?.data && cache.userId === user?.id) {
      console.log(`⚠️ Usando caché expirada de ranking (${scope}) por error`);
      
      // Actualizar isCurrentUser en caché expirada
      const cachedWithCurrentUser = cache.data.map(player => ({
        ...player,
        isCurrentUser: player.user_id === user?.id
      }));
      
      return cachedWithCurrentUser;
    }
    
    // Devolver array vacío para evitar errores
    return [];
  }
}, [user?.id]); // Solo depende de user.id


  // 🔄 REFRESCAR RANKING (ignorar caché) - VERSIÓN ESTABLE
const refreshRanking = useCallback(async (scope = "global") => {
  console.log(`🔄 Refrescando ranking (${scope}) - Ignorando caché`);
  
  // Invalidar caché
  rankingCacheRef.current[scope] = null;
  
  try {
    return await loadRanking(scope);
  } catch (error) {
    console.error(`❌ Error refrescando ranking (${scope}):`, error);
    return [];
  }
}, [loadRanking]); // Solo depende de loadRanking


const updateGameState = useCallback((newState) => {
  if (!isMounted.current) return;

  setGameData(prev => {
    const updated = { 
      ...prev, 
      gameState: { ...prev.gameState, ...newState } 
    };
    
    return updated;
  });
  
  // Sincronizar con throttling, pero de forma optimizada
  const syncData = () => {
    syncGameData(newState);
  };
  
  if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
  syncTimeoutRef.current = setTimeout(syncData, 1000);
}, [syncGameData]);



  const updateUpgrades = useCallback((newUpgrades) => {
    setGameData(prev => {
      const updated = { ...prev, upgrades: newUpgrades };
      syncGameData({ upgrades: newUpgrades }, false);
      return updated;
    });
  }, [syncGameData]);

  const updateMissions = useCallback((newMissions) => {
    setGameData(prev => ({ ...prev, missions: newMissions }));
    syncGameData({ missions: newMissions }, false);
  }, [syncGameData]);

  const updateOwnedCards = useCallback((newOwnedCards) => {
    setGameData(prev => ({ ...prev, ownedCards: newOwnedCards }));
    syncGameData({ ownedCards: newOwnedCards }, false);
  }, [syncGameData]);

  const updateOwnedItems = useCallback((newOwnedItems) => {
    setGameData(prev => ({ ...prev, ownedItems: newOwnedItems }));
    syncGameData({ ownedItems: newOwnedItems }, false);
  }, [syncGameData]);

  const updateActiveSkin = useCallback((newActiveSkin) => {
    setGameData(prev => ({ ...prev, activeSkin: newActiveSkin }));
    syncGameData({ activeSkin: newActiveSkin }, false);
  }, [syncGameData]);

  const updateAchievementsUnlocked = useCallback((newAchievements) => {
    setGameData(prev => ({ ...prev, achievementsUnlocked: newAchievements }));
    syncGameData({ achievementsUnlocked: newAchievements }, false);
  }, [syncGameData]);

  const updateDailyRewards = useCallback((newDailyRewards) => {
    setGameData(prev => ({ ...prev, dailyRewards: newDailyRewards }));
    syncGameData({ dailyRewards: newDailyRewards }, false);
  }, [syncGameData]);

  const updateFarmingMilestones = useCallback((newFarmingMilestones) => {
    setGameData(prev => ({ ...prev, farmingMilestones: newFarmingMilestones }));
    syncGameData({ farmingMilestones: newFarmingMilestones }, false);
  }, [syncGameData]);

  const updateReferralStats = useCallback((newReferralStats) => {
    setGameData(prev => ({ ...prev, referralStats: newReferralStats }));
  }, []);

  // 🎯 FUNCIONES DE UTILIDAD
  const refreshReferralStats = useCallback(async () => {
    if (!gameData.player?.id) return;
    
    try {
      const stats = await getReferralStats(gameData.player.id);
      setGameData(prev => ({ ...prev, referralStats: stats }));
      
      // Actualizar también en gameState
      updateGameState({
        referralsCount: stats.referralsCount,
        crocFromRefs: stats.crocFromRefs,
        coinsFromRefs: stats.coinsFromRefs
      });
    } catch (error) {
      console.error('❌ Error refrescando referidos:', error);
    }
  }, [gameData.player?.id, updateGameState]);

  const getReferralLink = useCallback(() => {
    if (!gameData.player?.referral_code) return window.location.origin;
    return `${window.location.origin}?ref=${gameData.player.referral_code}`;
  }, [gameData.player]);

  // 🎯 VERIFICACIÓN DE INTEGRIDAD DE DATOS MEJORADA
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
      
      // 🎯 VERIFICACIÓN DE ENERGÍA MEJORADA
      const serverEnergy = Number(serverStats.energy);
      const localEnergy = gameData.gameState.energy;
      const maxEnergy = Math.max(serverStats.max_energy, gameData.gameState.maxEnergy);
      
      // Si hay desincronización > 10% de maxEnergy, corregir
      const energyDiff = Math.abs(serverEnergy - localEnergy);
      if (energyDiff > (maxEnergy * 0.1)) {
        console.warn(`⚡ Desincronización de energía: local=${localEnergy}, servidor=${serverEnergy}`);
        
        // Usar el valor más alto (favor jugador)
        const correctedEnergy = Math.max(serverEnergy, localEnergy, 0);
        updateGameState({ 
          energy: correctedEnergy,
          maxEnergy: maxEnergy
        });
        
        discrepancies.push('energy');
      }

      // Verificar otros campos críticos
      if (Math.floor(serverStats.coins) !== Math.floor(gameData.gameState.coins)) {
        console.warn(`⚠️ Monedas desincronizadas: local=${gameData.gameState.coins}, servidor=${serverStats.coins}`);
        updateGameState({ coins: Math.max(serverStats.coins, gameData.gameState.coins) });
        discrepancies.push('coins');
      }
      
      if (Math.floor(serverStats.native_token_balance) !== Math.floor(gameData.gameState.nativeTokenBalance)) {
        console.warn(`⚠️ Tokens desincronizados: local=${gameData.gameState.nativeTokenBalance}, servidor=${serverStats.native_token_balance}`);
        updateGameState({ 
          nativeTokenBalance: Math.max(serverStats.native_token_balance, gameData.gameState.nativeTokenBalance)
        });
        discrepancies.push('tokens');
      }
      
      if (serverStats.level !== gameData.gameState.level) {
        console.warn(`⚠️ Nivel desincronizado: local=${gameData.gameState.level}, servidor=${serverStats.level}`);
        updateGameState({ level: Math.max(serverStats.level, gameData.gameState.level) });
        discrepancies.push('level');
      }

      if (discrepancies.length > 0) {
        console.log(`⚠️ Corregidas ${discrepancies.length} discrepancias:`, discrepancies);
      } else {
        console.log('✅ Integridad de datos verificada - Todo correcto');
      }
      
    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
    }
  }, [gameData, updateGameState]);

  // 🎯 AUTO-GUARDADO PERIÓDICO
  const autoSave = useCallback(async () => {
    if (!gameData.player?.id || gameData.syncInProgress) return;
    
    try {
      console.log('💾 Auto-guardando datos...');
      
      const payload = {
        player_id: gameData.player.id,
        last_active: new Date().toISOString(),
        energy: gameData.gameState.energy,
        coins: gameData.gameState.coins,
        native_token_balance: gameData.gameState.nativeTokenBalance,
        level: gameData.gameState.level
      };
      
      await supabase
        .from('player_stats')
        .upsert(payload, { onConflict: 'player_id' });
        
      console.log('✅ Auto-guardado completado');
    } catch (error) {
      console.error('❌ Error en auto-guardado:', error);
    }
  }, [gameData]);

  // 📥 CARGA INICIAL
  useEffect(() => {
    isMounted.current = true;
    loadGameData();

    return () => {
      isMounted.current = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (energyCheckRef.current) clearInterval(energyCheckRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      if (dataIntegrityRef.current) clearInterval(dataIntegrityRef.current);
    };
  }, [loadGameData]);

  // 🔄 SINCRONIZACIÓN PERIÓDICA MEJORADA
  useEffect(() => {
    if (!gameData.player?.id) return;

    // 🎯 VERIFICACIÓN DE ENERGÍA CADA 30 SEGUNDOS
    energyCheckRef.current = setInterval(async () => {
      try {
        const { data: serverStats } = await supabase
          .from('player_stats')
          .select('energy, max_energy, last_active')
          .eq('player_id', gameData.player.id)
          .single();

        if (serverStats) {
          const serverEnergy = Number(serverStats.energy);
          const localEnergy = gameData.gameState.energy;
          const maxEnergy = Math.max(serverStats.max_energy, gameData.gameState.maxEnergy);
          
          // Calcular regeneración natural
          const lastActive = new Date(serverStats.last_active);
          const now = new Date();
          const diffMinutes = (now - lastActive) / (1000 * 60);
          const regeneratedEnergy = Math.floor(diffMinutes * 0.33);
          
          // Determinar energía esperada
          const expectedEnergy = Math.min(
            maxEnergy,
            Math.max(0, serverEnergy + regeneratedEnergy)
          );
          
          // Si hay diferencia significativa, corregir
          if (Math.abs(localEnergy - expectedEnergy) > 5) {
            console.log(`⚡ Corrección de energía: local=${localEnergy}, esperada=${expectedEnergy}`);
            updateGameState({ 
              energy: expectedEnergy,
              maxEnergy: maxEnergy 
            });
          }
        }

        // Sincronizar datos pendientes
        if (Object.keys(pendingSyncRef.current).length > 0) {
          syncGameData(pendingSyncRef.current, false);
        }

      } catch (error) {
        console.error('❌ Error en verificación de energía:', error);
      }
    }, ENERGY_CHECK_INTERVAL);

    // 💾 AUTO-GUARDADO CADA 30 SEGUNDOS
    autoSaveRef.current = setInterval(() => {
      autoSave();
    }, AUTO_SAVE_INTERVAL);

    // 🔍 VERIFICACIÓN DE INTEGRIDAD CADA 5 MINUTOS
    dataIntegrityRef.current = setInterval(() => {
      verifyDataIntegrity();
    }, DATA_INTEGRITY_CHECK);

    return () => {
      if (energyCheckRef.current) clearInterval(energyCheckRef.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
      if (dataIntegrityRef.current) clearInterval(dataIntegrityRef.current);
    };
  }, [gameData.player?.id, gameData.gameState.energy, syncGameData, verifyDataIntegrity, updateGameState, autoSave]);


// 🔄 SINCRONIZACIÓN PERIÓDICA DE ENERGÍA
useEffect(() => {
  if (!gameData.player?.id || gameData.loading) return;
  
  const energySyncInterval = setInterval(async () => {
    try {
      const { data: serverStats } = await supabase
        .from('player_stats')
        .select('energy, max_energy')
        .eq('player_id', gameData.player.id)
        .single();
      
      if (serverStats) {
        const serverEnergy = Number(serverStats.energy);
        const localEnergy = gameData.gameState.energy;
        
        // Si hay desincronización mayor a 2 puntos, corregir
        if (Math.abs(serverEnergy - localEnergy) > 2) {
          console.log(`⚡ Sincronizando energía: local=${localEnergy}, servidor=${serverEnergy}`);
          
          // Actualizar estado local con la energía del servidor
          updateGameState({ 
            energy: serverEnergy,
            maxEnergy: serverStats.max_energy
          });
        }
      }
    } catch (error) {
      console.log("⚠️ Error en sincronización de energía:", error.message);
    }
  }, 10000); // Verificar cada 10 segundos
  
  return () => clearInterval(energySyncInterval);
}, [gameData.player?.id, gameData.loading, gameData.gameState.energy, updateGameState]);




  // 🎯 MEMOIZAR DATOS PARA OPTIMIZAR RENDERS
  const memoizedGameData = useMemo(() => gameData, [
    gameData.gameState.coins,
    gameData.gameState.energy,
    gameData.gameState.level,
    gameData.gameState.nativeTokenBalance,
    gameData.upgrades,
    gameData.missions,
    gameData.ownedCards,
    gameData.ownedItems,
    gameData.player,
    gameData.loading,
    gameData.error
  ]);

  return {
    // 🎯 DATOS COMPLETOS (MEMOIZADOS)
    ...memoizedGameData,
    
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
    
    // 🏆 FUNCIONES DE RANKING (SIN PARPADEO)
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
      syncGameData(resetData, true);
    }
  };
}
