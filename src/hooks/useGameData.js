import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  INITIAL_GAME_STATE
} from '@/config/gameConfig';

export function useGameData(user, gameConfig) {
  const { upgrades: configUpgrades, missions: configMissions, farmingMilestones: configMilestones, shopItems: configShopItems, cards: configCards } = gameConfig || {};

  // 🎯 ESTADO UNIFICADO DEL JUEGO
  const [gameData, setGameData] = useState({
    gameState: INITIAL_GAME_STATE,
    upgrades: {},
    missions: {},
    ownedCards: [],
    ownedItems: [],
    activeSkin: null,
    achievementsUnlocked: [],
    dailyRewards: { lastClaim: null, streak: 0, available: true },
    farmingMilestones: {},
    player: null,
    referralStats: { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 },
    allCards: [],
    allShopItems: [],
    statsForRanking: null,
    loading: true,
    error: null,
    lastSync: null,
    lastSyncState: null,
    syncInProgress: false,
    gameConfig: {} // Global config like fair_launch_date
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
    // Si la configuración aún no ha cargado, esperar (o si no hay usuario)
    if (gameConfig?.loading) return;

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
    if (gameData.loading && gameData.player) { // Solo si ya tenemos player seteado intentamos evitar recarga? No, loading es general.
      // Ajuste: permitimos recarga si loading es false OR si queremos forzar? 
      // Simplificación: confiamos en el flag loading
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

      // 3b. Obtener Configuración Global (Fair Launch)
      const { data: globalConfig } = await supabase
        .from('game_config')
        .select('*');

      const configMap = (globalConfig || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});

      // 4. Derivar estados iniciales desde CONFIG si no hay stats guardados
      const initialUpgrades = configUpgrades?.reduce((acc, u) => ({ ...acc, [u.id]: { level: 0, owned: 0 } }), {}) || {};
      const initialMissions = configMissions?.reduce((acc, m) => ({ ...acc, [m.id]: { completed: false, claimed: false, progress: 0 } }), {}) || {};
      // Farming milestones defaults? Assumed empty logic or handled by component. 
      // Need to import INITIAL_FARMING_MILESTONES_STATE logic? 
      // Let's implement reduction for milestones if config available
      const initialMilestones = {}; // configMilestones?.reduce(...) - Implement logic if configMilestones structure known

      setGameData(prev => ({
        ...prev,
        player,
        gameState: mapStatsToGameState(stats),
        upgrades: stats.upgrades || initialUpgrades,
        missions: stats.missions || initialMissions,
        ownedCards: stats.owned_cards || [],
        ownedItems: stats.owned_items || [],
        activeSkin: stats.active_skin || null,
        achievementsUnlocked: stats.achievements_unlocked || [],
        dailyRewards: stats.daily_rewards || { lastClaim: null, streak: 0, available: true },
        farmingMilestones: stats.farming_milestones || initialMilestones,
        referralStats,
        gameConfig: configMap,
        statsForRanking: stats,
        allCards: configCards || [],
        allShopItems: configShopItems || [],
        loading: false,
        lastSync: new Date().toISOString(),
        lastSyncState: mapStatsToGameState(stats) // Establecer estado inicial conocido
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
  }, [user, gameConfig]); // Dependencia clave: gameConfig


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

  // 🎯 PROCESAR REFERIDO - VERSIÓN SEGURA (RPC)
  const processReferral = async (newPlayerId, referralCode) => {
    try {
      console.log('💰 =========== INICIO processReferral (RPC) ===========');
      console.log('💰 Código:', referralCode);

      const { data, error } = await supabase.rpc('process_new_referral', {
        referral_code_input: referralCode
      });

      if (error) {
        console.error('❌ Error RPC process_new_referral:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.warn('⚠️ Fallo lógica de referido:', data.error);
        return { success: false, error: data.error };
      }

      console.log('✅ Referido procesado con éxito:', data);

      // Actualizar estado local
      await refreshReferralStats();

      return {
        success: true,
        referrer: data.referrer,
        crocAddedToReferrer: data.bonus_croc,
        coinsAddedToReferrer: data.bonus_coins
      };

    } catch (error) {
      console.error('❌ ERROR CRÍTICO en processReferral:', error);
      return { success: false, error: error.message };
    }
  };

  // 🎯 RECLAMAR RECOMPENSA DIARIA (RPC)
  const claimDailyReward = async () => {
    try {
      console.log('📅 Reclamando recompensa diaria...');
      const { data, error } = await supabase.rpc('claim_daily_reward');

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Error reclamando recompensa');
      }

      console.log('✅ Recompensa reclamada:', data);

      // Actualizar estado local
      setGameData(prev => ({
        ...prev,
        gameState: {
          ...prev.gameState,
          coins: Number(data.total_coins), // Sync total
          totalCoins: Number(data.total_coins)
        },
        dailyRewards: {
          streak: data.new_streak,
          lastClaim: new Date().toISOString(),
          available: false
        }
      }));

      return { success: true, reward: data.reward_coins, streak: data.new_streak };

    } catch (error) {
      console.error('❌ Error claimDailyReward:', error);
      return { success: false, error: error.message };
    }
  };

  // 🎯 VERIFICAR CÓDIGO SECRETO (RPC)
  const verifyMissionCode = async (missionId, code) => {
    try {
      const { data, error } = await supabase.rpc('verify_mission_code', {
        p_mission_id: missionId,
        p_code: code
      });

      if (error) throw error;

      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Update local mission state
      setGameData(prev => ({
        ...prev,
        missions: {
          ...prev.missions,
          [missionId]: { completed: true, claimed: true, progress: 1 }
        },
        gameState: {
          ...prev.gameState,
          coins: (prev.gameState.coins || 0) + data.reward_coins,
          totalCoins: (prev.gameState.totalCoins || 0) + data.reward_coins
        }
      }));

      return { success: true, reward: data.reward_coins };

    } catch (error) {
      console.error('❌ Error verifying code:', error);
      return { success: false, error: error.message };
    }
  };

  // 🎯 ESTADÍSTICAS JUGADOR DEFAULT

  // 🎯 OBTENER O CREAR ESTADÍSTICAS DEL JUGADOR
  const getOrCreatePlayerStats = async (playerId) => {
    // 1. Buscar stats existentes
    const { data: existingStats } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .maybeSingle();

    if (existingStats) {
      return existingStats;
    }

    // 2. Si no existen, crear stats iniciales
    const initialStats = {
      player_id: playerId,
      coins: INITIAL_GAME_STATE.coins,
      level: INITIAL_GAME_STATE.level,
      energy: INITIAL_GAME_STATE.energy,
      max_energy: INITIAL_GAME_STATE.maxEnergy,
      click_power: INITIAL_GAME_STATE.clickPower,
      coins_per_second: INITIAL_GAME_STATE.coinsPerSecond,
      experience: INITIAL_GAME_STATE.experience,
      total_coins: INITIAL_GAME_STATE.totalCoins,
      native_token_balance: INITIAL_GAME_STATE.nativeTokenBalance,
      last_active: new Date().toISOString()
    };

    const { data: newStats, error } = await supabase
      .from('player_stats')
      .insert([initialStats])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando stats:', error);
      throw error;
    }

    return newStats;
  };

  // 🎯 OBTENER ESTADÍSTICAS DE REFERIDOS
  const getReferralStats = async (playerId) => {
    // Esta lógica ya está integrada en la carga inicial y el refresh
    // Pero si necesitamos una función standalone:
    return {
      referralsCount: 0,
      crocFromRefs: 0,
      coinsFromRefs: 0
    };
    // El refreshReferralStats hace el trabajo pesado real.
  };

  // 🗺️ MAPEADOR DE STATS A GAMESTATE (DB -> Frontend)
  const mapStatsToGameState = (stats) => ({
    coins: Number(stats.coins) || 0,
    totalCoins: Number(stats.total_coins) || 0,
    clickPower: Number(stats.click_power) || 1,
    coinsPerSecond: Number(stats.coins_per_second) || 0,
    totalClicks: Number(stats.clicks) || 0,
    level: Number(stats.level) || 1,
    experience: Number(stats.experience) || 0,
    energy: Number(stats.energy) || 100,
    maxEnergy: Number(stats.max_energy) || 100,
    nativeTokenBalance: Number(stats.native_token_balance) || 0,
    referralsCount: stats.referrals_count || 0,
    crocFromRefs: Number(stats.croc_from_refs) || 0,
    coinsFromRefs: Number(stats.coins_from_refs) || 0,
    playerId: stats.player_id
  });

  // ... existing getOrCreatePlayer ...

  // 🔄 SINCRONIZAR PROGRESO DEL JUEGO (RPC SEGURA)
  const syncGameData = useCallback(async (updates = {}) => {
    // Si no hay jugador o ya estamos sincronizando, poner en cola
    if (!gameData.player?.id || gameData.syncInProgress) {
      pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
      return;
    }

    const now = Date.now();
    // Debounce de 30 segundos para llamadas RPC, para ahorrar costos y reducir estrés en BD
    // EXCEPTO si es una actualización crítica (ej. compra) que se forzará aparte
    if (now - lastSyncRef.current < 30000 && !updates._force) {
      pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (Object.keys(pendingSyncRef.current).length > 0) {
          syncGameData(pendingSyncRef.current);
        }
      }, 30000 - (now - lastSyncRef.current));

      return;
    }

    try {
      setGameData(prev => ({ ...prev, syncInProgress: true }));

      // Combinar actualizaciones pendientes
      const allUpdates = { ...pendingSyncRef.current, ...updates };
      delete allUpdates._force; // Limpiar flag interno

      pendingSyncRef.current = {}; // Limpiar cola

      // Calcular deltas para RPC
      // NOTA: En una implementación ideal, el cliente enviaría "acciones" (clics, compras)
      // en lugar de estados. Por ahora, calculamos la diferencia aproximada para el RPC.
      // Esto es una mejora sobre el update directo, pero aún susceptible a manipulación si no se
      // validan bien los inputs en el backend.

      const currentRemoteState = gameData.lastSyncState || gameData.gameState; // Necesitaríamos trackear el último estado confirmado

      // Simplificación: Enviamos acumulados desde la última vez
      // (Aquí asumimos que el cliente es honesto con los deltas, pero el RPC limitará valores absurdos)

      const coinsEarned = Math.max(0, (allUpdates.coins || gameData.gameState.coins) - (currentRemoteState.coins || 0));
      const energySpent = Math.max(0, (currentRemoteState.energy || 100) - (allUpdates.energy || gameData.gameState.energy));
      const clicksMade = Math.max(0, (allUpdates.clicks || gameData.gameState.totalClicks) - (currentRemoteState.clicks || 0));
      const experienceGained = Math.max(0, (allUpdates.experience || gameData.gameState.experience) - (currentRemoteState.experience || 0));

      if (coinsEarned === 0 && energySpent === 0 && clicksMade === 0 && experienceGained === 0) {
        setGameData(prev => ({ ...prev, syncInProgress: false }));
        return;
      }

      console.log('🔄 Sincronizando progreso (RPC)...', { coinsEarned, energySpent });

      const { data, error } = await supabase.rpc('sync_game_progress', {
        p_coins_earned: Math.floor(coinsEarned),
        p_energy_spend: Math.floor(energySpent),
        p_clicks: Math.floor(clicksMade),
        p_experience: Math.floor(experienceGained)
      });

      if (error) throw error;

      if (!data.success) {
        console.warn('⚠️ Servidor rechazó sincronización:', data.error);
        // Aquí podríamos revertir el estado local si fuera necesario
      } else {
        console.log('✅ Progreso guardado.');
      }

      lastSyncRef.current = Date.now();

      // Actualizar el estado de referencia
      // (En una app real, deberíamos quizás recargar del servidor o confiar en nuestro optimismo)
      setGameData(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        lastSyncState: JSON.parse(JSON.stringify(prev.gameState)), // Snapshot
        syncInProgress: false
      }));

    } catch (error) {
      console.error('❌ Error en sync (RPC):', error);
      // Restaurar pendientes para reintentar
      pendingSyncRef.current = { ...updates, ...pendingSyncRef.current };
      setGameData(prev => ({ ...prev, syncInProgress: false }));
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


  // 🛍️ REFRESCAR DATOS DE LA TIENDA
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
    claimDailyReward, // 🆕
    verifyMissionCode, // 🆕

    // 🏆 FUNCIONES DE RANKING
    loadRanking,
    refreshRanking,

    // 🎯 FUNCIONES DE UTILIDAD
    loadGameData
  };
}