import { useState, useEffect, useCallback, useRef } from 'react';
import { UPGRADES, ACHIEVEMENTS, MISSIONS, CARDS_DATA, SHOP_ITEMS, FARMING_MILESTONES, INITIAL_GAME_STATE as DEFAULT_INITIAL_GAME_STATE, INITIAL_UPGRADES_STATE as DEFAULT_INITIAL_UPGRADES_STATE, INITIAL_MISSIONS_STATE as DEFAULT_INITIAL_MISSIONS_STATE, INITIAL_FARMING_MILESTONES_STATE } from '@/config/gameConfig';

export function useGameLogic(
  initialGameStateOverrides, 
  initialUpgradesOverrides, 
  initialMissionsOverrides, 
  toast, 
  playSound, 
  setShowMilestoneModal, 
  setLastReachedMilestone, 
  user, 
  supabasePlayerData
) {
  const INITIAL_GAME_STATE = { ...DEFAULT_INITIAL_GAME_STATE, ...initialGameStateOverrides };
  const INITIAL_UPGRADES_STATE = { ...DEFAULT_INITIAL_UPGRADES_STATE, ...initialUpgradesOverrides };
  const INITIAL_MISSIONS_STATE = { ...DEFAULT_INITIAL_MISSIONS_STATE, ...initialMissionsOverrides };

  // 🎯 ESTADOS LOCALES - INICIALIZADOS DESDE SUPABASE
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [upgrades, setUpgrades] = useState(INITIAL_UPGRADES_STATE);
  const [missions, setMissions] = useState(INITIAL_MISSIONS_STATE);
  const [ownedCards, setOwnedCards] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [activeSkin, setActiveSkin] = useState(null);
  const [achievementsUnlocked, setAchievementsUnlocked] = useState([]);
  const [dailyRewards, setDailyRewards] = useState({ lastClaim: null, streak: 0, available: true });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [farmingMilestonesState, setFarmingMilestonesState] = useState(INITIAL_FARMING_MILESTONES_STATE);
  
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [clickEffect, setClickEffect] = useState(false);

  // 🔥 REFS PARA INTERVALOS ESTABLES
  const energyIntervalRef = useRef(null);
  const coinsIntervalRef = useRef(null);
  const gameStateRef = useRef(gameState);
  const upgradesRef = useRef(upgrades);
  const syncTimeoutRef = useRef(null);
  const lastSyncRef = useRef(0);

  // 🔄 Actualizar refs cuando los estados cambien
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  // 📥 CARGAR DATOS COMPLETOS DE SUPABASE AL INICIALIZAR - OPTIMIZADO
  useEffect(() => {
    if (supabasePlayerData?.stats && !supabasePlayerData?.loading) {
      console.log("🔄 Cargando datos COMPLETOS de Supabase");
      
      const loadedStats = supabasePlayerData.stats;
      
      // ✅ CARGAR TODOS LOS ESTADOS DESDE SUPABASE EN UNA SOLA OPERACIÓN
      setGameState(prev => ({
        ...prev,
        coins: Number(loadedStats.coins) || 0,
        totalCoins: Number(loadedStats.total_coins) || 0,
        level: Number(loadedStats.level) || 1,
        totalClicks: Number(loadedStats.clicks) || 0,
        energy: Number(loadedStats.energy) || 100,
        maxEnergy: Number(loadedStats.max_energy) || 100,
        clickPower: Number(loadedStats.click_power) || 1,
        coinsPerSecond: Number(loadedStats.coins_per_second) || 0,
        experience: Number(loadedStats.experience) || 0,
        nativeTokenBalance: Number(loadedStats.native_token_balance) || 0,
        crocFromRefs: Number(loadedStats.croc_from_refs) || 0,
        coinsFromRefs: Number(loadedStats.coins_from_refs) || 0,
        referralsCount: Number(loadedStats.referrals_count) || 0
      }));

      // ✅ CARGAR UPGRADES DESDE SUPABASE
      if (loadedStats.upgrades && typeof loadedStats.upgrades === 'object') {
        console.log("📥 Cargando upgrades desde Supabase");
        setUpgrades(loadedStats.upgrades);
      }

      // ✅ CARGAR DATOS ADICIONALES DESDE SUPABASE
      if (loadedStats.missions && Object.keys(loadedStats.missions).length > 0) {
        setMissions(loadedStats.missions);
      }

      if (loadedStats.owned_cards && Array.isArray(loadedStats.owned_cards)) {
        setOwnedCards(loadedStats.owned_cards);
      }

      if (loadedStats.owned_items && Array.isArray(loadedStats.owned_items)) {
        setOwnedItems(loadedStats.owned_items);
      }

      if (loadedStats.active_skin) {
        setActiveSkin(loadedStats.active_skin);
      }

      if (loadedStats.achievements_unlocked && Array.isArray(loadedStats.achievements_unlocked)) {
        setAchievementsUnlocked(loadedStats.achievements_unlocked);
      }

      if (loadedStats.daily_rewards) {
        setDailyRewards(loadedStats.daily_rewards);
      }

      if (loadedStats.farming_milestones && Object.keys(loadedStats.farming_milestones).length > 0) {
        setFarmingMilestonesState(loadedStats.farming_milestones);
      }

      console.log("✅ Todos los datos cargados desde Supabase");
    }
  }, [supabasePlayerData?.stats, supabasePlayerData?.loading]);

  // 🎯 SINCRONIZACIÓN UNIFICADA Y OPTIMIZADA
  const syncAllData = useCallback(() => {
    if (!user || !supabasePlayerData?.syncStatsToSupabase) {
      console.log("⏸️ Sync pausado: usuario no autenticado");
      return;
    }

    const now = Date.now();
    
    // Throttling: mínimo 3 segundos entre sincronizaciones
    if (now - lastSyncRef.current < 3000) {
      console.log("⏸️ Sync throttled, demasiado rápido");
      return;
    }

    console.log("🚀 Sincronización unificada de todos los datos");

    const dataToSync = {
      // ✅ DATOS BÁSICOS DEL JUEGO
      coins: Math.floor(gameState.coins),
      croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
      native_token_balance: Math.floor(gameState.nativeTokenBalance || 0),
      level: gameState.level,
      clicks: gameState.totalClicks,
      energy: gameState.energy,
      max_energy: gameState.maxEnergy,
      click_power: gameState.clickPower,
      coins_per_second: gameState.coinsPerSecond,
      experience: gameState.experience,
      total_coins: gameState.totalCoins,
      
      // ✅ DATOS DE REFERIDOS
      croc_from_refs: gameState.crocFromRefs || 0,
      coins_from_refs: gameState.coinsFromRefs || 0,
      referrals_count: gameState.referralsCount || 0,
      
      // ✅ DATOS ADICIONALES
      upgrades: upgrades,
      missions: missions,
      owned_cards: ownedCards,
      owned_items: ownedItems,
      active_skin: activeSkin,
      achievements_unlocked: achievementsUnlocked,
      daily_rewards: dailyRewards,
      farming_milestones: farmingMilestonesState,
    };

    supabasePlayerData.syncStatsToSupabase(dataToSync);
    lastSyncRef.current = now;
  }, [gameState, upgrades, missions, ownedCards, ownedItems, activeSkin, achievementsUnlocked, dailyRewards, farmingMilestonesState, user, supabasePlayerData]);

  // 📤 SINCRONIZACIÓN AUTOMÁTICA UNIFICADA - SOLO UNA VEZ CADA 30 SEGUNDOS
  useEffect(() => {
    if (!user || !supabasePlayerData?.syncStatsToSupabase) return;

    console.log("🎯 Iniciando sincronización automática unificada");

    const syncInterval = setInterval(() => {
      const hasSignificantChanges = 
        Math.floor(gameState.coins) !== Math.floor(supabasePlayerData.stats?.coins || 0) ||
        gameState.level !== (supabasePlayerData.stats?.level || 1) ||
        Math.floor(gameState.nativeTokenBalance || 0) !== Math.floor(supabasePlayerData.stats?.native_token_balance || 0);

      if (hasSignificantChanges) {
        console.log("🔄 Sincronización automática por cambios significativos");
        syncAllData();
      }
    }, 30000); // 30 segundos

    return () => {
      console.log("🧹 Limpiando sincronización automática");
      clearInterval(syncInterval);
    };
  }, [user, gameState, supabasePlayerData, syncAllData]);

  // 📤 SINCRONIZACIÓN EN EVENTOS IMPORTANTES
  const syncImportantChange = useCallback((changeType, additionalData = {}) => {
    if (!user || !supabasePlayerData?.syncStatsToSupabase) return;

    console.log(`🚀 Sincronización por evento: ${changeType}`);

    const dataToSync = {
      coins: Math.floor(gameState.coins),
      croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
      native_token_balance: Math.floor(gameState.nativeTokenBalance || 0),
      level: gameState.level,
      clicks: gameState.totalClicks,
      energy: gameState.energy,
      max_energy: gameState.maxEnergy,
      click_power: gameState.clickPower,
      coins_per_second: gameState.coinsPerSecond,
      experience: gameState.experience,
      total_coins: gameState.totalCoins,
      croc_from_refs: gameState.crocFromRefs || 0,
      coins_from_refs: gameState.coinsFromRefs || 0,
      referrals_count: gameState.referralsCount || 0,
      ...additionalData
    };

    supabasePlayerData.syncStatsToSupabase(dataToSync);
    lastSyncRef.current = Date.now();
  }, [gameState, user, supabasePlayerData]);

  // ⚡ REGENERACIÓN DE ENERGÍA
  useEffect(() => {
    console.log("⚡ Iniciando regeneración de energía...");
    
    if (energyIntervalRef.current) {
      clearInterval(energyIntervalRef.current);
    }

    energyIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        if (prev.energy < prev.maxEnergy) {
          const newEnergy = Math.min(prev.maxEnergy, prev.energy + 1);
          return {
            ...prev,
            energy: newEnergy
          };
        }
        return prev;
      });
    }, 3000);

    return () => {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
        energyIntervalRef.current = null;
      }
    };
  }, []);

  // 💰 GENERACIÓN AUTOMÁTICA DE MONEDAS
  useEffect(() => {
    console.log("💰 Iniciando generación de monedas...");
    
    if (coinsIntervalRef.current) {
      clearInterval(coinsIntervalRef.current);
    }

    coinsIntervalRef.current = setInterval(() => {
      setGameState(prev => {
        let effectiveCPS = prev.coinsPerSecond;
        
        // Aplicar boosts de items
        ownedItems.forEach(itemId => {
          const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
          if (item && item.effect.type === 'cps_boost') {
            effectiveCPS += item.effect.value;
          }
        });

        // Aplicar boosts de cartas (porcentaje)
        ownedCards.forEach(cardId => {
          const card = CARDS_DATA.find(c => c.id === cardId);
          if (card && card.effect.type === 'cps_boost_percent') {
            effectiveCPS *= (1 + card.effect.value / 100);
          }
        });

        if (effectiveCPS > 0) {
          const increment = effectiveCPS;
          return {
            ...prev,
            coins: prev.coins + increment,
            totalCoins: prev.totalCoins + increment
          };
        }
        return prev;
      });
    }, 1000);

    return () => {
      if (coinsIntervalRef.current) {
        clearInterval(coinsIntervalRef.current);
        coinsIntervalRef.current = null;
      }
    };
  }, [ownedItems, ownedCards]);

  // 🏆 Sistema de logros
  useEffect(() => {
    ACHIEVEMENTS.forEach(achievement => {
      if (!achievementsUnlocked.includes(achievement.id)) {
        let currentValue = 0;
        switch (achievement.type) {
          case 'clicks': currentValue = gameState.totalClicks; break;
          case 'totalCoins': currentValue = gameState.totalCoins; break;
          case 'upgrades': currentValue = Object.values(upgrades).reduce((sum, upg) => sum + (upg?.owned || 0), 0); break;
          case 'missions': currentValue = Object.values(missions).filter(m => m.completed).length; break;
          case 'cards': currentValue = ownedCards.length; break;
          case 'items': currentValue = ownedItems.filter(item => typeof item === 'string' || (typeof item === 'object' && item.type !== 'consumable')).length; break;
          case 'farming_milestones': currentValue = Object.values(farmingMilestonesState).filter(m => m.claimed).length; break;
        }
        if (currentValue >= achievement.requirement) {
          setAchievementsUnlocked(prev => [...prev, achievement.id]);
          toast({
            title: "🏆 ¡Logro Desbloqueado!",
            description: `${achievement.name}: ${achievement.description}`,
            duration: 4000,
          });
          playSound('achievement');
          
          // Sincronizar logros desbloqueados
          syncImportantChange('achievement_unlock', {
            achievements_unlocked: [...achievementsUnlocked, achievement.id]
          });
        }
      }
    });
  }, [gameState, upgrades, missions, achievementsUnlocked, ownedCards, ownedItems, farmingMilestonesState, toast, playSound, syncImportantChange]);

  // 🎯 FUNCIÓN AUXILIAR PARA CALCULAR CLICK POWER REAL
  const calculateRealClickPower = useCallback(() => {
    let clickPower = gameStateRef.current.clickPower;
    
    // ✅ APLICAR BONUS DE UPGRADES
    Object.entries(upgradesRef.current).forEach(([upgradeId, upgradeData]) => {
      const upgradeConfig = UPGRADES.find(u => u.id === upgradeId);
      if (upgradeConfig && upgradeData?.level > 0) {
        if (upgradeConfig.type === 'multiplier') {
          const multiplierBonus = (upgradeConfig.basePower - 1) * upgradeData.level;
          clickPower = clickPower * (1 + multiplierBonus);
        } else if (upgradeConfig.type === 'click') {
          const clickBonus = upgradeConfig.basePower * upgradeData.level;
          clickPower += clickBonus;
        }
      }
    });

    // ✅ APLICAR BONUS DE ITEMS
    ownedItems.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
      if (item && item.effect.type === 'click_boost') {
        clickPower += item.effect.value;
      }
    });

    // ✅ APLICAR BONUS DE CARTAS
    ownedCards.forEach(cardId => {
      const card = CARDS_DATA.find(c => c.id === cardId);
      if (card) {
        if (card.effect.type === 'click_power_flat') {
          clickPower += card.effect.value;
        }
        if (card.effect.type === 'click_power_percent') {
          const percentBonus = clickPower * (card.effect.value / 100);
          clickPower += percentBonus;
        }
      }
    });

    const finalClickPower = Math.max(1, clickPower);
    return finalClickPower;
  }, [ownedItems, ownedCards]);

  // 👆 FUNCIÓN DE TAP - OPTIMIZADA
  const handleClick = useCallback((event) => {
    const currentEnergy = gameStateRef.current.energy;
    const maxEnergy = gameStateRef.current.maxEnergy;
    
    if (currentEnergy <= 0) {
      toast({ 
        title: "⚡ Sin Energía", 
        description: `Espera a que se recargue tu energía (${currentEnergy}/${maxEnergy})`, 
        duration: 2000 
      });
      playSound('error');
      return;
    }
    
    playSound('click');

    const currentClickPower = calculateRealClickPower();
    const coinsEarned = Math.floor(currentClickPower);

    // Actualizar estado del juego
    setGameState(prev => {
      const newState = {
        ...prev,
        coins: prev.coins + coinsEarned,
        totalCoins: prev.totalCoins + coinsEarned,
        totalClicks: prev.totalClicks + 1,
        energy: Math.max(0, prev.energy - 1),
        experience: prev.experience + 1
      };
      
      return newState;
    });

    // Efectos visuales
    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 300);

    // Números flotantes
    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = Date.now() + Math.random();
      setFloatingNumbers(prev => [...prev, { id, x, y, value: coinsEarned }]);
      setTimeout(() => setFloatingNumbers(prev => prev.filter(num => num.id !== id)), 1000);
    }

    // Sistema de niveles
    const newLevel = Math.floor((gameStateRef.current.experience + 1) / 100) + 1;
    if (newLevel > gameStateRef.current.level) {
      setGameState(prev => ({ ...prev, level: newLevel }));
      toast({ 
        title: "🎉 ¡Nivel Subido!", 
        description: `¡Ahora eres nivel ${newLevel}!`, 
        duration: 3000 
      });
      playSound('levelUp');
      
      // Sincronizar nivel
      syncImportantChange('level_up', { level: newLevel });
    }
  }, [calculateRealClickPower, toast, playSound, syncImportantChange]);

  // 🛒 FUNCIÓN DE COMPRA DE UPGRADES OPTIMIZADA
  const buyUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('Upgrade not found:', upgradeId);
      return;
    }

    const currentLevel = upgrades[upgradeId]?.level || 0;
    const price = Math.floor(upgrade.basePrice * Math.pow(1.5, currentLevel));

    if (gameState.coins >= price) {
      // Aplicar el efecto del upgrade
      setGameState(prev => {
        const newState = { ...prev, coins: prev.coins - price };
        
        switch (upgrade.type) {
          case 'click':
            newState.clickPower = prev.clickPower + upgrade.basePower;
            break;
          case 'cps':
            newState.coinsPerSecond = prev.coinsPerSecond + upgrade.basePower;
            break;
          case 'multiplier':
            newState.clickPower = Math.floor(prev.clickPower * upgrade.basePower);
            break;
          case 'energy':
            newState.maxEnergy = prev.maxEnergy + upgrade.basePower;
            newState.energy = newState.maxEnergy;
            break;
          default:
            console.warn('Unknown upgrade type:', upgrade.type);
        }
        
        return newState;
      });

      // ✅ ACTUALIZAR UPGRADES
      const newUpgrades = {
        ...upgrades,
        [upgradeId]: { 
          level: (upgrades[upgradeId]?.level || 0) + 1, 
          owned: (upgrades[upgradeId]?.owned || 0) + 1 
        }
      };
      
      setUpgrades(newUpgrades);

      // 🔥 SINCRONIZAR INMEDIATAMENTE
      syncImportantChange('upgrade_purchase', {
        coins: Math.floor(gameState.coins - price),
        click_power: gameState.clickPower + (upgrade.type === 'click' ? upgrade.basePower : 0),
        coins_per_second: gameState.coinsPerSecond + (upgrade.type === 'cps' ? upgrade.basePower : 0),
        max_energy: gameState.maxEnergy + (upgrade.type === 'energy' ? upgrade.basePower : 0),
        upgrades: newUpgrades
      });

      toast({ 
        title: "✅ Mejora Comprada", 
        description: `${upgrade.name} nivel ${currentLevel + 1}`, 
        duration: 2000 
      });
      playSound('upgrade');
    } else {
      toast({ 
        title: "💰 Monedas Insuficientes", 
        description: `Necesitas ${price - gameState.coins} monedas más`, 
        duration: 2000 
      });
      playSound('error');
    }
  }, [gameState, upgrades, toast, playSound, syncImportantChange]);

  // 🎯 Misiones
  const completeMission = useCallback((missionId, isSocial = false) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || missions[missionId]?.completed) return;

    let canComplete = false;
    if (isSocial) {
        setMissions(prev => ({ 
          ...prev, 
          [missionId]: { 
            ...prev[missionId], 
            progress: (prev[missionId]?.progress || 0) + 1 
          } 
        }));
        canComplete = (missions[missionId]?.progress || 0) + 1 >= mission.requirement.value;
    } else {
        switch(mission.requirement.type) {
          case 'clicks': 
            canComplete = gameState.totalClicks >= mission.requirement.value; 
            break;
          case 'coins': 
            canComplete = gameState.totalCoins >= mission.requirement.value; 
            break;
          case 'level': 
            canComplete = gameState.level >= mission.requirement.value; 
            break;
          case 'upgradeLevel': 
            const targetUpgrade = upgrades[mission.requirement.upgradeId];
            canComplete = targetUpgrade && targetUpgrade.level >= mission.requirement.value;
            break;
          default: break;
        }
    }

    if (canComplete) {
      setMissions(prev => ({ 
        ...prev, 
        [missionId]: { 
          ...prev[missionId], 
          completed: true, 
          claimed: false 
        } 
      }));
      toast({ 
        title: "🎯 Misión Cumplida", 
        description: `¡Has completado "${mission.name}"! Reclama tu recompensa.`, 
        duration: 3000 
      });
      playSound('missionComplete');
      
      // Sincronizar misiones
      syncImportantChange('mission_complete', { missions: {...missions, [missionId]: { completed: true, claimed: false }} });
    } else if (!isSocial) {
      toast({ 
        title: "⏳ Misión Incompleta", 
        description: `Aún no cumples los requisitos para "${mission.name}".`, 
        duration: 2000 
      });
      playSound('uiClick');
    }
  }, [gameState, missions, upgrades, toast, playSound, syncImportantChange]);

  // 🎁 Reclamar recompensa de misión
  const claimMissionReward = useCallback((missionId) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || !missions[missionId]?.completed || missions[missionId]?.claimed) return;

    setGameState(prev => ({
      ...prev,
      coins: prev.coins + mission.reward.coins,
      totalCoins: prev.totalCoins + mission.reward.coins,
      experience: prev.experience + (mission.reward.xp || 0)
    }));
    
    if (mission.reward.cardId) {
        const card = CARDS_DATA.find(c => c.id === mission.reward.cardId);
        if (card && !ownedCards.includes(card.id)) {
            setOwnedCards(prev => [...prev, card.id]);
            toast({ 
              title: "🃏 Carta Obtenida!", 
              description: `¡Recibiste la carta "${card.name}"!`, 
              duration: 3000 
            });
            playSound('cardGet');
        }
    }

    setMissions(prev => ({ 
      ...prev, 
      [missionId]: { 
        ...prev[missionId], 
        claimed: true 
      } 
    }));
    
    toast({ 
      title: "🎁 Recompensa Reclamada", 
      description: `+${mission.reward.coins} monedas por "${mission.name}"`, 
      duration: 3000 
    });
    playSound('reward');
    
    // Sincronizar recompensa
    syncImportantChange('mission_reward', {
      coins: Math.floor(gameState.coins + mission.reward.coins),
      total_coins: gameState.totalCoins + mission.reward.coins,
      missions: {...missions, [missionId]: { claimed: true }},
      owned_cards: mission.reward.cardId ? [...ownedCards, mission.reward.cardId] : ownedCards
    });
  }, [missions, ownedCards, gameState, toast, playSound, syncImportantChange]);

  // 📅 Recompensa diaria
  const claimDailyReward = useCallback(() => {
    const now = new Date();
    const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
    
    if (!lastClaimDate || now.toDateString() !== lastClaimDate.toDateString()) {
      let newStreak = dailyRewards.streak;
      if (lastClaimDate) {
        const diffTime = Math.abs(now - lastClaimDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak += 1;
        } else {
          newStreak = 1; 
        }
      } else {
        newStreak = 1;
      }

      const reward = 100 * newStreak;
      setGameState(prev => ({ 
        ...prev, 
        coins: prev.coins + reward, 
        totalCoins: prev.totalCoins + reward 
      }));
      setDailyRewards({ 
        lastClaim: now.toISOString(), 
        streak: newStreak, 
        available: false 
      });
      
      toast({ 
        title: "🎁 ¡Recompensa Diaria!", 
        description: `+${reward} monedas (Racha: ${newStreak} días)`, 
        duration: 3000 
      });
      playSound('reward');
      
      // Sincronizar recompensa diaria
      syncImportantChange('daily_reward', {
        coins: Math.floor(gameState.coins + reward),
        total_coins: gameState.totalCoins + reward,
        daily_rewards: { lastClaim: now.toISOString(), streak: newStreak, available: false }
      });
    } else {
       toast({ 
         title: "🤔 Ya Reclamaste Hoy", 
         description: "Vuelve mañana para tu próxima recompensa.", 
         duration: 2000 
       });
       playSound('uiClick');
    }
  }, [dailyRewards, gameState, toast, playSound, syncImportantChange]);

  // 🔄 Verificar disponibilidad de recompensa diaria
  useEffect(() => {
    const now = new Date();
    const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
    if (!lastClaimDate || now.toDateString() !== lastClaimDate.toDateString()) {
      setDailyRewards(prev => ({ ...prev, available: true }));
    } else {
      setDailyRewards(prev => ({ ...prev, available: false }));
    }
  }, [dailyRewards.lastClaim]);

  // 🛍️ Tienda
  const buyShopItem = useCallback((itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const isAlreadyOwnedNonConsumable = ownedItems.some(owned => 
      (typeof owned === 'string' && owned === itemId) || 
      (typeof owned === 'object' && owned.id === itemId && owned.type !== 'consumable')
    );

    if (isAlreadyOwnedNonConsumable && item.type !== 'consumable') {
        toast({ 
          title: "🚫 Ya Posees Este Ítem", 
          description: `Ya tienes "${item.name}".`, 
          duration: 2000 
        });
        playSound('error');
        return;
    }
    
    if (item.type === 'skin' && activeSkin === itemId) {
        toast({ 
          title: "🎨 Skin ya Activa", 
          description: `La skin "${item.name}" ya está en uso.`, 
          duration: 2000 
        });
        playSound('uiClick');
        return;
    }

    if (gameState.coins >= item.price) {
        setGameState(prev => ({ ...prev, coins: prev.coins - item.price }));
        
        if (item.type === 'skin') {
            setActiveSkin(itemId);
            if (!ownedItems.some(owned => 
              (typeof owned === 'string' && owned === itemId) || 
              (typeof owned === 'object' && owned.id === itemId)
            )) {
              setOwnedItems(prev => [...prev, itemId]);
            }
            toast({ 
              title: "🎨 Skin Aplicada", 
              description: `¡Ahora usas la skin "${item.name}"!`, 
              duration: 3000 
            });
            playSound('equip');
        } else {
            setOwnedItems(prev => {
                if (item.type === 'consumable') {
                    const existingItemIndex = prev.findIndex(i => 
                      typeof i === 'object' && i.id === itemId
                    );
                    if (existingItemIndex > -1) {
                        const updatedItems = [...prev];
                        updatedItems[existingItemIndex] = { 
                          ...updatedItems[existingItemIndex], 
                          quantity: (updatedItems[existingItemIndex].quantity || 0) + 1 
                        };
                        return updatedItems;
                    } else {
                        return [...prev, { ...item, quantity: 1 }];
                    }
                } else {
                     if (!prev.some(owned => 
                       (typeof owned === 'string' && owned === itemId) || 
                       (typeof owned === 'object' && owned.id === itemId)
                     )) {
                        return [...prev, itemId];
                     }
                     return prev;
                }
            });
            toast({ 
              title: "🛍️ Ítem Comprado", 
              description: `¡Has comprado "${item.name}"!`, 
              duration: 3000 
            });
            playSound('buy');
            
            // Aplicar efecto inmediato si es consumible de energía
            if (item.type === 'consumable' && item.effect.type === 'energy_fill') {
                setGameState(prev => ({
                  ...prev, 
                  energy: Math.min(prev.maxEnergy, prev.energy + item.effect.value)
                }));
                toast({ 
                  title: "⚡ Energía Restaurada", 
                  description: `+${item.effect.value} de energía.`, 
                  duration: 2000 
                });
                playSound('powerUp');
            }
        }
        
        // Sincronizar compra
        syncImportantChange('shop_purchase', {
          coins: Math.floor(gameState.coins - item.price),
          owned_items: item.type === 'skin' ? [...ownedItems, itemId] : ownedItems,
          active_skin: item.type === 'skin' ? itemId : activeSkin
        });
    } else {
        toast({ 
          title: "💰 Monedas Insuficientes", 
          description: `Necesitas ${item.price - gameState.coins} monedas más para "${item.name}".`, 
          duration: 2000 
        });
        playSound('error');
    }
  }, [gameState.coins, ownedItems, activeSkin, toast, playSound, syncImportantChange]);

  // 🏆 Hitos de farmeo
  const claimFarmingMilestone = useCallback((milestoneId) => {
    const milestone = FARMING_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone || farmingMilestonesState[milestoneId]?.claimed) return;

    if (gameState.totalCoins >= milestone.coinsRequired) {
      setGameState(prev => ({
        ...prev,
        nativeTokenBalance: prev.nativeTokenBalance + milestone.tokenReward
      }));
      setFarmingMilestonesState(prev => ({
        ...prev,
        [milestoneId]: { claimed: true }
      }));
      toast({ 
        title: "🏆 Hito de Farmeo Reclamado!", 
        description: `¡Has ganado ${milestone.tokenReward} CROC por "${milestone.name}"!`, 
        duration: 4000 
      });
      playSound('milestone');
      setLastReachedMilestone(milestone);
      setShowMilestoneModal(true);
      
      // Sincronizar hito
      syncImportantChange('farming_milestone', {
        native_token_balance: gameState.nativeTokenBalance + milestone.tokenReward,
        farming_milestones: {...farmingMilestonesState, [milestoneId]: { claimed: true }}
      });
    } else {
      toast({ 
        title: "⏳ Requisito No Cumplido", 
        description: `Necesitas ${milestone.coinsRequired.toLocaleString()} monedas totales para reclamar este hito.`, 
        duration: 3000 
      });
      playSound('uiClick');
    }
  }, [gameState.totalCoins, farmingMilestonesState, toast, playSound, setShowMilestoneModal, setLastReachedMilestone, syncImportantChange]);

  // 🔔 Notificaciones de hitos disponibles
  useEffect(() => {
    FARMING_MILESTONES.forEach(milestone => {
      if (gameState.totalCoins >= milestone.coinsRequired && 
          !farmingMilestonesState[milestone.id]?.claimed && 
          !farmingMilestonesState[milestone.id]?.notified) {
        toast({
          title: `🎉 ¡Hito de Farmeo Disponible!`,
          description: `Puedes reclamar ${milestone.tokenReward} CROC por "${milestone.name}". Ve a la sección de Hitos.`,
          duration: 5000,
        });
        playSound('notification');
        setFarmingMilestonesState(prev => ({
          ...prev,
          [milestone.id]: { ...prev[milestone.id], notified: true }
        }));
      }
    });
  }, [gameState.totalCoins, farmingMilestonesState, toast, playSound]);

  // 🔄 Reiniciar progreso
  const resetProgress = useCallback(() => {
    setGameState(INITIAL_GAME_STATE);
    setUpgrades(INITIAL_UPGRADES_STATE);
    setMissions(INITIAL_MISSIONS_STATE);
    setOwnedCards([]);
    setOwnedItems([]);
    setActiveSkin(null);
    setAchievementsUnlocked([]);
    setDailyRewards({ lastClaim: null, streak: 0, available: true });
    setFarmingMilestonesState(INITIAL_FARMING_MILESTONES_STATE);
    
    toast({ 
      title: "🔄 Progreso Reiniciado", 
      description: "¡Comienza una nueva aventura!", 
      duration: 3000 
    });
    
    // Sincronizar reinicio
    if (user && supabasePlayerData?.syncStatsToSupabase) {
      const resetData = {
        coins: 0,
        croc_tokens: 0,
        native_token_balance: 0,
        level: 1,
        clicks: 0,
        energy: 100,
        max_energy: 100,
        click_power: 1,
        coins_per_second: 0,
        experience: 0,
        total_coins: 0,
        croc_from_refs: 0,
        coins_from_refs: 0,
        referrals_count: 0,
        upgrades: INITIAL_UPGRADES_STATE,
        missions: INITIAL_MISSIONS_STATE,
        owned_cards: [],
        owned_items: [],
        active_skin: null,
        achievements_unlocked: [],
        daily_rewards: { lastClaim: null, streak: 0, available: true },
        farming_milestones: INITIAL_FARMING_MILESTONES_STATE,
      };
      supabasePlayerData.syncStatsToSupabase(resetData);
    }
  }, [toast, INITIAL_GAME_STATE, INITIAL_UPGRADES_STATE, INITIAL_MISSIONS_STATE, INITIAL_FARMING_MILESTONES_STATE, user, supabasePlayerData]);

  return {
    gameState,
    upgrades,
    missions,
    ownedCards,
    ownedItems,
    activeSkin,
    achievementsUnlocked,
    dailyRewards,
    soundEnabled,
    floatingNumbers,
    clickEffect,
    farmingMilestonesState,
    supabasePlayer: supabasePlayerData?.player,
    supabaseLoading: supabasePlayerData?.loading,
    setGameState,
    setUpgrades,
    setMissions,
    setOwnedCards,
    setOwnedItems,
    setActiveSkin,
    setAchievementsUnlocked,
    setDailyRewards,
    setSoundEnabled,
    setFloatingNumbers,
    setClickEffect,
    setFarmingMilestonesState,
    handleClick,
    buyUpgrade,
    completeMission,
    claimMissionReward,
    claimDailyReward,
    buyShopItem,
    resetProgress,
    claimFarmingMilestone,
    calculateRealClickPower,
    syncAllData,
  };
}