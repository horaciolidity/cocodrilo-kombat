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

  // 🎯 REFERENCIAS PARA THROTTLING
  const lastSyncRef = useRef(0);
  const pendingSyncRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const isMounted = useRef(true);

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

  // En useGameData.js - función getOrCreatePlayer
const getOrCreatePlayer = async (user) => {
  // Buscar jugador existente
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingPlayer) {
    return existingPlayer;
  }

  // Crear nuevo jugador
  const username = `croc${Math.floor(Math.random() * 9000 + 1000)}`;
  const referralCode = Math.random().toString(36).substring(2, 10);
  
  // 🎯 OBTENER CÓDIGO DE REFERIDO DESDE METADATA DE SUPABASE
  const referralCodeFromMetadata = user.user_metadata?.referral_code;
  let referredBy = null;

  // Buscar jugador que refirió (si hay código)
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
    } else {
      console.warn(`⚠️ Código de referido no válido: ${referralCodeFromMetadata}`);
    }
  }

  const { data: newPlayer, error } = await supabase
    .from('players')
    .insert([{
      user_id: user.id,
      username,
      avatar_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`,
      referral_code: referralCode,
      referred_by: referredBy // 🎯 Guardar quién refirió
    }])
    .select()
    .single();

  if (error) throw error;

  // 🎯 APLICAR RECOMPENSAS DE REFERIDO SI HAY REFERIDOR
  if (referredBy) {
    try {
      // 1. Actualizar estadísticas del referidor
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
      
      // 2. Dar bonificación inicial al nuevo jugador por ser referido
      // Esto se hará en getOrCreatePlayerStats cuando vea que tiene referred_by
      
    } catch (refError) {
      console.error("❌ Error aplicando recompensas de referido:", refError);
    }
  }

  return newPlayer;
};

  const getOrCreatePlayerStats = async (playerId) => {
  const { data: stats } = await supabase
    .from('player_stats')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();

  if (stats) return stats;

  // 🎯 VERIFICAR SI EL JUGADOR FUE REFERIDO
  const { data: player } = await supabase
    .from('players')
    .select('referred_by')
    .eq('id', playerId)
    .single();

  const isReferred = !!player?.referred_by;

  // Crear estadísticas iniciales (con bonos si fue referido)
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

  // 🔄 SINCRONIZACIÓN UNIFICADA
  const syncGameData = useCallback(async (updates = {}) => {
    if (!gameData.player?.id || gameData.syncInProgress) {
      console.log('⏸️ Sync pausado:', { 
        hasPlayer: !!gameData.player?.id, 
        syncInProgress: gameData.syncInProgress 
      });
      return;
    }

    // Throttling: 2 segundos mínimo entre syncs
    const now = Date.now();
    if (now - lastSyncRef.current < 2000) {
      pendingSyncRef.current = { ...pendingSyncRef.current, ...updates };
      
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        if (pendingSyncRef.current) {
          syncGameData(pendingSyncRef.current);
          pendingSyncRef.current = null;
        }
      }, 2000 - (now - lastSyncRef.current));
      return;
    }

    try {
      setGameData(prev => ({ ...prev, syncInProgress: true }));
      
      const payload = {
        player_id: gameData.player.id,
        // 🎯 DATOS DEL JUEGO
        coins: Math.floor(updates.coins ?? gameData.gameState.coins),
        native_token_balance: Math.floor(updates.nativeTokenBalance ?? gameData.gameState.nativeTokenBalance),
        level: updates.level ?? gameData.gameState.level,
        clicks: updates.totalClicks ?? gameData.gameState.totalClicks,
        energy: updates.energy ?? gameData.gameState.energy,
        max_energy: updates.maxEnergy ?? gameData.gameState.maxEnergy,
        click_power: updates.clickPower ?? gameData.gameState.clickPower,
        coins_per_second: updates.coinsPerSecond ?? gameData.gameState.coinsPerSecond,
        experience: updates.experience ?? gameData.gameState.experience,
        total_coins: updates.totalCoins ?? gameData.gameState.totalCoins,
        
        // 🎯 DATOS DE REFERIDOS
        croc_from_refs: updates.crocFromRefs ?? gameData.gameState.crocFromRefs,
        coins_from_refs: updates.coinsFromRefs ?? gameData.gameState.coinsFromRefs,
        referrals_count: updates.referralsCount ?? gameData.gameState.referralsCount,
        
        // 🎯 DATOS ADICIONALES
        upgrades: updates.upgrades ?? gameData.upgrades,
        missions: updates.missions ?? gameData.missions,
        owned_cards: updates.ownedCards ?? gameData.ownedCards,
        owned_items: updates.ownedItems ?? gameData.ownedItems,
        active_skin: updates.activeSkin ?? gameData.activeSkin,
        achievements_unlocked: updates.achievementsUnlocked ?? gameData.achievementsUnlocked,
        daily_rewards: updates.dailyRewards ?? gameData.dailyRewards,
        farming_milestones: updates.farmingMilestones ?? gameData.farmingMilestones,
        
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Sincronizando datos:', {
        coins: payload.coins,
        tokens: payload.native_token_balance,
        level: payload.level
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
      setTimeout(() => syncGameData(updates), 5000);
    }
  }, [gameData]);

  // 🎯 FUNCIONES DE ACTUALIZACIÓN
  const updateGameState = useCallback((newState) => {
    if (!isMounted.current) return;

    setGameData(prev => {
      const updated = { 
        ...prev, 
        gameState: { ...prev.gameState, ...newState } 
      };
      
      // Sincronizar automáticamente después de 1 segundo
      setTimeout(() => syncGameData(newState), 1000);
      
      return updated;
    });
  }, [syncGameData]);

  const updateUpgrades = useCallback((newUpgrades) => {
    setGameData(prev => {
      const updated = { ...prev, upgrades: newUpgrades };
      setTimeout(() => syncGameData({ upgrades: newUpgrades }), 1000);
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
      
      // Verificar que los datos locales coinciden con la BD
      const { data: serverStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', gameData.player.id)
        .single();

      if (!serverStats) {
        console.warn('⚠️ No hay datos en el servidor para comparar');
        return;
      }

      // Comparar datos críticos
      const discrepancies = [];
      
      if (Math.floor(serverStats.coins) !== Math.floor(gameData.gameState.coins)) {
        discrepancies.push(`Monedas: local=${gameData.gameState.coins}, servidor=${serverStats.coins}`);
      }
      
      if (Math.floor(serverStats.native_token_balance) !== Math.floor(gameData.gameState.nativeTokenBalance)) {
        discrepancies.push(`Tokens: local=${gameData.gameState.nativeTokenBalance}, servidor=${serverStats.native_token_balance}`);
      }
      
      if (serverStats.level !== gameData.gameState.level) {
        discrepancies.push(`Nivel: local=${gameData.gameState.level}, servidor=${serverStats.level}`);
      }

      if (discrepancies.length > 0) {
        console.warn('⚠️ Discrepancias encontradas:', discrepancies);
        // Podrías mostrar una notificación al usuario o corregir automáticamente
      } else {
        console.log('✅ Integridad de datos verificada - Todo correcto');
      }
      
    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
    }
  }, [gameData]);

  // 📥 CARGA INICIAL
  useEffect(() => {
    isMounted.current = true;
    loadGameData();

    return () => {
      isMounted.current = false;
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [loadGameData]);

  // 🔄 SINCRONIZACIÓN PERIÓDICA
  useEffect(() => {
    if (!gameData.player?.id) return;

    const interval = setInterval(() => {
      syncGameData();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [gameData.player?.id, syncGameData]);

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