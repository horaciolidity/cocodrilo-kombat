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

  // 🎯 CARGAR DATOS DEL JUEGO
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
      console.log('🎮 Cargando datos para usuario:', user.id);
      
      // 1. Obtener o crear jugador
      const player = await getOrCreatePlayer(user);
      if (!player) throw new Error('No se pudo crear/obtener jugador');
      
      // 2. Obtener estadísticas
      const stats = await getOrCreatePlayerStats(player.id);
      
      // 3. Obtener estadísticas de referidos
      const referralStats = await getReferralStats(player.id);
      
      // 4. Actualizar estado
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
      
      console.log('✅ Datos cargados:', {
        player: player.username,
        coins: stats.coins,
        tokens: stats.native_token_balance,
        referidos: referralStats.referralsCount
      });
      
      // 5. FORZAR ACTUALIZACIÓN DE REFERIDOS INMEDIATAMENTE
      console.log('🔁 Forzando actualización de referidos...');
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

  // 🎯 PROCESAR REFERIDO - VERSIÓN COMPLETA Y CORREGIDA
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
      
      // 4. APLICAR BONOS AL REFERIDOR
      const { data: referrerStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', referrer.id)
        .maybeSingle();
      
      const referrerUpdateData = {
        player_id: referrer.id,
        referrals_count: totalReferrals,
        croc_from_refs: totalReferrals * 10,
        coins_from_refs: totalReferrals * 1000,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      
      // Sumar bonos a estadísticas existentes
      if (referrerStats) {
        referrerUpdateData.native_token_balance = (Number(referrerStats.native_token_balance) || 0) + 10;
        referrerUpdateData.coins = (Number(referrerStats.coins) || 0) + 1000;
        referrerUpdateData.total_coins = (Number(referrerStats.total_coins) || 0) + 1000;
        
        // Mantener otros campos
        Object.keys(referrerStats).forEach(key => {
          if (!referrerUpdateData[key] && key !== 'player_id') {
            referrerUpdateData[key] = referrerStats[key];
          }
        });
      } else {
        // Si no tiene stats, inicializar con bonos
        referrerUpdateData.native_token_balance = 10;
        referrerUpdateData.coins = 1000;
        referrerUpdateData.total_coins = 1000;
        referrerUpdateData.level = 1;
        referrerUpdateData.energy = 100;
        referrerUpdateData.max_energy = 100;
        referrerUpdateData.click_power = 1;
        referrerUpdateData.coins_per_second = 0;
        referrerUpdateData.experience = 0;
        referrerUpdateData.clicks = 0;
        referrerUpdateData.upgrades = INITIAL_UPGRADES_STATE;
        referrerUpdateData.missions = INITIAL_MISSIONS_STATE;
        referrerUpdateData.owned_cards = [];
        referrerUpdateData.owned_items = [];
        referrerUpdateData.active_skin = null;
        referrerUpdateData.achievements_unlocked = [];
        referrerUpdateData.daily_rewards = { lastClaim: null, streak: 0, available: true };
        referrerUpdateData.farming_milestones = INITIAL_FARMING_MILESTONES_STATE;
      }
      
      console.log('📝 Actualizando player_stats del referidor...');
      
      const { error: updateReferrerError } = await supabase
        .from('player_stats')
        .upsert(referrerUpdateData, { onConflict: 'player_id' });
      
      if (updateReferrerError) {
        console.error('❌ Error actualizando referidor:', updateReferrerError);
      }
      
      // 5. ACTUALIZAR TABLA players DEL REFERIDOR
      await supabase
        .from('players')
        .update({
          total_earned_croc: totalReferrals * 10,
          total_earned_coins: totalReferrals * 1000,
          updated_at: new Date().toISOString()
        })
        .eq('id', referrer.id);
      
      // 6. DAR BONOS AL NUEVO JUGADOR (REFERIDO)
      console.log('🎁 Dando bonos al nuevo jugador (referido)...');
      
      const { data: newPlayerStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', newPlayerId)
        .maybeSingle();
      
      const newPlayerUpdateData = {
        player_id: newPlayerId,
        updated_at: new Date().toISOString(),
        last_active: new Date().toISOString()
      };
      
      if (newPlayerStats) {
        // Si YA tiene stats, SUMAR bonos
        newPlayerUpdateData.native_token_balance = (Number(newPlayerStats.native_token_balance) || 0) + 10;
        newPlayerUpdateData.coins = (Number(newPlayerStats.coins) || 0) + 1000;
        newPlayerUpdateData.total_coins = (Number(newPlayerStats.total_coins) || 0) + 1000;
        
        // Mantener otros campos
        Object.keys(newPlayerStats).forEach(key => {
          if (!newPlayerUpdateData[key] && key !== 'player_id') {
            newPlayerUpdateData[key] = newPlayerStats[key];
          }
        });
      } else {
        // Si NO tiene stats, crear nuevas CON bonos
        newPlayerUpdateData.native_token_balance = 10;
        newPlayerUpdateData.coins = 1000;
        newPlayerUpdateData.total_coins = 1000;
        newPlayerUpdateData.level = 1;
        newPlayerUpdateData.energy = 100;
        newPlayerUpdateData.max_energy = 100;
        newPlayerUpdateData.click_power = 1;
        newPlayerUpdateData.coins_per_second = 0;
        newPlayerUpdateData.experience = 0;
        newPlayerUpdateData.clicks = 0;
        newPlayerUpdateData.upgrades = INITIAL_UPGRADES_STATE;
        newPlayerUpdateData.missions = INITIAL_MISSIONS_STATE;
        newPlayerUpdateData.owned_cards = [];
        newPlayerUpdateData.owned_items = [];
        newPlayerUpdateData.active_skin = null;
        newPlayerUpdateData.achievements_unlocked = [];
        newPlayerUpdateData.daily_rewards = { lastClaim: null, streak: 0, available: true };
        newPlayerUpdateData.farming_milestones = INITIAL_FARMING_MILESTONES_STATE;
      }
      
      console.log('📝 Actualizando player_stats del nuevo jugador...');
      
      const { error: updateNewPlayerError } = await supabase
        .from('player_stats')
        .upsert(newPlayerUpdateData, { onConflict: 'player_id' });
      
      if (updateNewPlayerError) {
        console.error('❌ Error actualizando nuevo jugador:', updateNewPlayerError);
      }
      
      console.log('✅ BONOS APLICADOS EXITOSAMENTE!', {
        referidor: referrer.username,
        referidosTotales: totalReferrals,
        crocParaReferidor: totalReferrals * 10,
        monedasParaReferidor: totalReferrals * 1000,
        crocParaNuevo: 10,
        monedasParaNuevo: 1000
      });
      
      // 7. FORZAR ACTUALIZACIÓN DE ESTADÍSTICAS LOCALES
      console.log('🔄 Forzando actualización de estadísticas locales...');
      await refreshReferralStats();
      
    } catch (error) {
      console.error('❌ ERROR en processReferral:', error);
    } finally {
      console.log('💰 =========== FIN processReferral ===========');
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
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('referred_by')
      .eq('id', playerId)
      .single();

    if (playerError) {
      console.error('❌ Error obteniendo datos del jugador:', playerError);
    }

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

    console.log('📝 Datos iniciales de player_stats:', initialStats);

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
        .select('croc_from_refs, coins_from_refs, referrals_count')
        .eq('player_id', playerId)
        .maybeSingle();

      const currentCrocRefs = Number(playerStats?.croc_from_refs) || 0;
      const currentCoinsRefs = Number(playerStats?.coins_from_refs) || 0;
      
      console.log(`📊 Referral stats para ${playerId}:`, {
        referidosReales: realReferralsCount,
        crocActual: currentCrocRefs,
        monedasActuales: currentCoinsRefs
      });
      
      return { 
        referralsCount: realReferralsCount, 
        crocFromRefs: currentCrocRefs, 
        coinsFromRefs: currentCoinsRefs
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

  // 🎯 REFRESCAR ESTADÍSTICAS DE REFERIDOS
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
      
      // 2. Sincronizar con player_stats
      await supabase
        .from('player_stats')
        .upsert({
          player_id: gameData.player.id,
          referrals_count: realCount,
          croc_from_refs: realCount * 10,
          coins_from_refs: realCount * 1000,
          updated_at: new Date().toISOString()
        }, { onConflict: 'player_id' });
      
      // 3. Actualizar tabla players
      await supabase
        .from('players')
        .update({
          total_earned_croc: realCount * 10,
          total_earned_coins: realCount * 1000,
          updated_at: new Date().toISOString()
        })
        .eq('id', gameData.player.id);
      
      // 4. Actualizar estado local
      const newStats = {
        referralsCount: realCount,
        crocFromRefs: realCount * 10,
        coinsFromRefs: realCount * 1000
      };
      
      setGameData(prev => ({
        ...prev,
        referralStats: newStats,
        gameState: {
          ...prev.gameState,
          referralsCount: realCount,
          crocFromRefs: realCount * 10,
          coinsFromRefs: realCount * 1000
        }
      }));
      
      console.log('✅ Stats actualizadas:', {
        referidos: realCount,
        croc: realCount * 10,
        monedas: realCount * 1000
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
          
          const updateData = {
            player_id: player.id,
            referrals_count: referralCount,
            croc_from_refs: referralCount * 10,
            coins_from_refs: referralCount * 1000,
            updated_at: new Date().toISOString()
          };
          
          if (playerStats) {
            // Calcular bonos faltantes
            const expectedCroc = referralCount * 10;
            const currentCroc = Number(playerStats.croc_from_refs) || 0;
            const missingCroc = Math.max(0, expectedCroc - currentCroc);
            
            const expectedCoins = referralCount * 1000;
            const currentCoins = Number(playerStats.coins_from_refs) || 0;
            const missingCoins = Math.max(0, expectedCoins - currentCoins);
            
            if (missingCroc > 0 || missingCoins > 0) {
              updateData.native_token_balance = (Number(playerStats.native_token_balance) || 0) + missingCroc;
              updateData.coins = (Number(playerStats.coins) || 0) + missingCoins;
              updateData.total_coins = (Number(playerStats.total_coins) || 0) + missingCoins;
              
              // Mantener otros campos
              Object.keys(playerStats).forEach(key => {
                if (!updateData[key] && key !== 'player_id') {
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
              total_earned_croc: referralCount * 10,
              total_earned_coins: referralCount * 1000,
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
    repairReferralSystem,
    
    // 🏆 FUNCIONES DE RANKING
    loadRanking,
    refreshRanking,
    
    // 🎯 FUNCIONES DE UTILIDAD
    loadGameData
  };
}