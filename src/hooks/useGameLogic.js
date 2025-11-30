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

  // 🔄 Actualizar ref cuando gameState cambie
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // 📥 CARGAR DATOS COMPLETOS DE SUPABASE AL INICIALIZAR - CORREGIDO
useEffect(() => {
  if (supabasePlayerData?.stats && !supabasePlayerData?.loading) {
    console.log("🔄 Cargando datos COMPLETOS de Supabase:", supabasePlayerData.stats);
    
    // ✅ CARGAR TODOS LOS ESTADOS DESDE SUPABASE
    setGameState(prev => ({
      ...prev,
      coins: Number(supabasePlayerData.stats.coins) || 0,
      totalCoins: Number(supabasePlayerData.stats.total_coins) || 0,
      level: Number(supabasePlayerData.stats.level) || 1,
      totalClicks: Number(supabasePlayerData.stats.clicks) || 0,
      energy: Number(supabasePlayerData.stats.energy) || 100,
      maxEnergy: Number(supabasePlayerData.stats.max_energy) || 100,
      clickPower: Number(supabasePlayerData.stats.click_power) || 1,
      coinsPerSecond: Number(supabasePlayerData.stats.coins_per_second) || 0,
      experience: Number(supabasePlayerData.stats.experience) || 0,
      nativeTokenBalance: Number(supabasePlayerData.stats.native_token_balance) || 0,
      // ✅ CARGAR DATOS DE REFERIDOS DESDE SUPABASE
      crocFromRefs: Number(supabasePlayerData.stats.croc_from_refs) || 0,
      coinsFromRefs: Number(supabasePlayerData.stats.coins_from_refs) || 0,
      referralsCount: Number(supabasePlayerData.stats.referrals_count) || 0
    }));

    // ✅ CARGAR UPGRADES DESDE SUPABASE - CRÍTICO
    if (supabasePlayerData.stats.upgrades && typeof supabasePlayerData.stats.upgrades === 'object' && Object.keys(supabasePlayerData.stats.upgrades).length > 0) {
      console.log("📥 Cargando upgrades desde Supabase:", supabasePlayerData.stats.upgrades);
      setUpgrades(supabasePlayerData.stats.upgrades);
    } else {
      console.log("🆕 No hay upgrades en BD, usando iniciales");
      setUpgrades(INITIAL_UPGRADES_STATE);
    }

      // 🆕 CARGAR MISSIONS DESDE SUPABASE
      if (supabasePlayerData.stats.missions && Object.keys(supabasePlayerData.stats.missions).length > 0) {
        console.log("📥 Cargando missions desde Supabase:", supabasePlayerData.stats.missions);
        setMissions(supabasePlayerData.stats.missions);
      }

      // 🆕 CARGAR OWNED CARDS DESDE SUPABASE
      if (supabasePlayerData.stats.owned_cards && Array.isArray(supabasePlayerData.stats.owned_cards)) {
        console.log("📥 Cargando owned_cards desde Supabase:", supabasePlayerData.stats.owned_cards);
        setOwnedCards(supabasePlayerData.stats.owned_cards);
      }

      // 🆕 CARGAR OWNED ITEMS DESDE SUPABASE
      if (supabasePlayerData.stats.owned_items && Array.isArray(supabasePlayerData.stats.owned_items)) {
        console.log("📥 Cargando owned_items desde Supabase:", supabasePlayerData.stats.owned_items);
        setOwnedItems(supabasePlayerData.stats.owned_items);
      }

      // 🆕 CARGAR ACTIVE SKIN DESDE SUPABASE
      if (supabasePlayerData.stats.active_skin) {
        console.log("📥 Cargando active_skin desde Supabase:", supabasePlayerData.stats.active_skin);
        setActiveSkin(supabasePlayerData.stats.active_skin);
      }

      // 🆕 CARGAR ACHIEVEMENTS DESDE SUPABASE
      if (supabasePlayerData.stats.achievements_unlocked && Array.isArray(supabasePlayerData.stats.achievements_unlocked)) {
        console.log("📥 Cargando achievements desde Supabase:", supabasePlayerData.stats.achievements_unlocked);
        setAchievementsUnlocked(supabasePlayerData.stats.achievements_unlocked);
      }

      // 🆕 CARGAR DAILY REWARDS DESDE SUPABASE
      if (supabasePlayerData.stats.daily_rewards) {
        console.log("📥 Cargando daily_rewards desde Supabase:", supabasePlayerData.stats.daily_rewards);
        setDailyRewards(supabasePlayerData.stats.daily_rewards);
      }

      // 🆕 CARGAR FARMING MILESTONES DESDE SUPABASE
      if (supabasePlayerData.stats.farming_milestones && Object.keys(supabasePlayerData.stats.farming_milestones).length > 0) {
        console.log("📥 Cargando farming_milestones desde Supabase:", supabasePlayerData.stats.farming_milestones);
        setFarmingMilestonesState(supabasePlayerData.stats.farming_milestones);
      }

      console.log("✅ Todos los datos cargados desde Supabase");
    }
  }, [supabasePlayerData?.stats, supabasePlayerData?.loading]);

  // 📤 SINCRONIZAR UPGRADES CON SUPABASE CUANDO CAMBIEN - MEJORADO
  useEffect(() => {
    if (!supabasePlayerData?.loading && user && supabasePlayerData?.syncUpgradesToSupabase) {
      const syncTimeout = setTimeout(() => {
        console.log("🔄 Sincronizando upgrades con Supabase:", upgrades);
        supabasePlayerData.syncUpgradesToSupabase(upgrades);
      }, 2000);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [upgrades, user, supabasePlayerData?.loading, supabasePlayerData?.syncUpgradesToSupabase]);

  // 📤 SINCRONIZAR GAME STATE CON SUPABASE CUANDO CAMBIEN
  useEffect(() => {
    if (!supabasePlayerData?.loading && user && supabasePlayerData?.syncStatsToSupabase) {
      const syncTimeout = setTimeout(() => {
        console.log("🔄 Sincronizando gameState con Supabase");
        
        const statsToSync = {
          coins: Math.floor(gameState.coins),
          croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
          level: gameState.level,
          clicks: gameState.totalClicks,
          energy: gameState.energy,
          max_energy: gameState.maxEnergy,
          click_power: gameState.clickPower,
          coins_per_second: gameState.coinsPerSecond,
          experience: gameState.experience,
          total_coins: gameState.totalCoins,
          native_token_balance: gameState.nativeTokenBalance,
        };
        
        supabasePlayerData.syncStatsToSupabase(statsToSync);
      }, 3000);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [gameState, user, supabasePlayerData?.loading, supabasePlayerData?.syncStatsToSupabase]);

  // 📤 SINCRONIZAR DAILY REWARDS CON SUPABASE CUANDO CAMBIEN - NUEVO
  useEffect(() => {
    if (!supabasePlayerData?.loading && user && dailyRewards && supabasePlayerData?.syncDailyRewardsToSupabase) {
      const syncTimeout = setTimeout(() => {
        console.log("🔄 Sincronizando daily rewards con Supabase:", dailyRewards);
        supabasePlayerData.syncDailyRewardsToSupabase(dailyRewards);
      }, 2500);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [dailyRewards, user, supabasePlayerData?.loading, supabasePlayerData?.syncDailyRewardsToSupabase]);

  // ⚡ REGENERACIÓN DE ENERGÍA - SOLUCIÓN DEFINITIVA
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
      console.log("⚡ Limpiando intervalo de energía");
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
        energyIntervalRef.current = null;
      }
    };
  }, []);

  // 💰 GENERACIÓN AUTOMÁTICA DE MONEDAS - SOLUCIÓN DEFINITIVA
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
      console.log("💰 Limpiando intervalo de monedas");
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
        }
      }
    });
  }, [gameState, upgrades, missions, achievementsUnlocked, ownedCards, ownedItems, farmingMilestonesState, toast, playSound]);

  // 🎯 FUNCIÓN AUXILIAR PARA CALCULAR CLICK POWER REAL
  const calculateRealClickPower = useCallback(() => {
    let clickPower = gameStateRef.current.clickPower;
    
    console.log(`🎯 Click power base: ${clickPower}`);
    
    // ✅ APLICAR BONUS DE UPGRADES DE MULTIPLICADOR PRIMERO
    Object.entries(upgrades).forEach(([upgradeId, upgradeData]) => {
      const upgradeConfig = UPGRADES.find(u => u.id === upgradeId);
      if (upgradeConfig && upgradeData?.level > 0) {
        if (upgradeConfig.type === 'multiplier') {
          const multiplierBonus = (upgradeConfig.basePower - 1) * upgradeData.level;
          clickPower = clickPower * (1 + multiplierBonus);
          console.log(`🔢 Multiplicador ${upgradeConfig.name}: x${(1 + multiplierBonus).toFixed(2)}`);
        }
      }
    });

    // ✅ APLICAR BONUS DE ITEMS (suma plana)
    ownedItems.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
      if (item && item.effect.type === 'click_boost') {
        clickPower += item.effect.value;
        console.log(`🛍️ Item ${item.name}: +${item.effect.value}`);
      }
    });

    // ✅ APLICAR BONUS DE CARTAS (suma plana y porcentaje)
    ownedCards.forEach(cardId => {
      const card = CARDS_DATA.find(c => c.id === cardId);
      if (card) {
        if (card.effect.type === 'click_power_flat') {
          clickPower += card.effect.value;
          console.log(`🃏 Carta ${card.name}: +${card.effect.value}`);
        }
        if (card.effect.type === 'click_power_percent') {
          const percentBonus = clickPower * (card.effect.value / 100);
          clickPower += percentBonus;
          console.log(`🃏 Carta ${card.name}: +${card.effect.value}%`);
        }
      }
    });

    console.log(`💰 Click power total calculado: ${clickPower.toFixed(2)}`);
    return clickPower;
  }, [upgrades, ownedItems, ownedCards]);

  // 👆 FUNCIÓN DE TAP - CORREGIDA CON CÁLCULO EN TIEMPO REAL
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

    // 🎯 CALCULAR PODER DE CLIC EN TIEMPO REAL CON TODOS LOS BONUS
    const currentClickPower = calculateRealClickPower();
    const coinsEarned = Math.floor(currentClickPower);
    
    console.log(`💰 Monedas ganadas por click: ${coinsEarned}`);

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
    }
  }, [calculateRealClickPower, toast, playSound]);

  // 🛒 FUNCIÓN DE COMPRA DE UPGRADES CORREGIDA - CON SINCRONIZACIÓN INMEDIATA
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

      // ✅ ACTUALIZAR UPGRADES Y SINCRONIZAR INMEDIATAMENTE
      const newUpgrades = {
        ...upgrades,
        [upgradeId]: { 
          level: (upgrades[upgradeId]?.level || 0) + 1, 
          owned: (upgrades[upgradeId]?.owned || 0) + 1 
        }
      };
      
      setUpgrades(newUpgrades);

      // 🔥 SINCRONIZAR UPGRADES INMEDIATAMENTE CON SUPABASE
      if (supabasePlayerData?.syncUpgradesToSupabase) {
        console.log("🚀 Sincronizando upgrades inmediatamente...");
        supabasePlayerData.syncUpgradesToSupabase(newUpgrades);
      }

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
  }, [gameState.coins, upgrades, toast, playSound, supabasePlayerData]);

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
    } else if (!isSocial) {
      toast({ 
        title: "⏳ Misión Incompleta", 
        description: `Aún no cumples los requisitos para "${mission.name}".`, 
        duration: 2000 
      });
      playSound('uiClick');
    }
  }, [gameState, missions, upgrades, toast, playSound]);

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
  }, [missions, ownedCards, toast, playSound]);

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
    } else {
       toast({ 
         title: "🤔 Ya Reclamaste Hoy", 
         description: "Vuelve mañana para tu próxima recompensa.", 
         duration: 2000 
       });
       playSound('uiClick');
    }
  }, [dailyRewards, toast, playSound]);

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
    } else {
        toast({ 
          title: "💰 Monedas Insuficientes", 
          description: `Necesitas ${item.price - gameState.coins} monedas más para "${item.name}".`, 
          duration: 2000 
        });
        playSound('error');
    }
  }, [gameState.coins, ownedItems, activeSkin, toast, playSound]);

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
    } else {
      toast({ 
        title: "⏳ Requisito No Cumplido", 
        description: `Necesitas ${milestone.coinsRequired.toLocaleString()} monedas totales para reclamar este hito.`, 
        duration: 3000 
      });
      playSound('uiClick');
    }
  }, [gameState.totalCoins, farmingMilestonesState, toast, playSound, setShowMilestoneModal, setLastReachedMilestone]);

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
  }, [toast, INITIAL_GAME_STATE, INITIAL_UPGRADES_STATE, INITIAL_MISSIONS_STATE, INITIAL_FARMING_MILESTONES_STATE]);

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
    calculateRealClickPower, // ✅ NUEVO: Exportar función para GameView
  };
}