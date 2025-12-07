import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  UPGRADES, 
  ACHIEVEMENTS, 
  MISSIONS, 
  CARDS_DATA, 
  SHOP_ITEMS, 
  FARMING_MILESTONES, 
  INITIAL_GAME_STATE as DEFAULT_INITIAL_GAME_STATE, 
  INITIAL_UPGRADES_STATE as DEFAULT_INITIAL_UPGRADES_STATE, 
  INITIAL_MISSIONS_STATE as DEFAULT_INITIAL_MISSIONS_STATE, 
  INITIAL_FARMING_MILESTONES_STATE,
  DIFFICULTY_CONFIG
} from '@/config/gameConfig';

export function useGameLogic({
  gameData,
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
  syncGameData,
  toast,
  playSound,
  setShowMilestoneModal,
  setLastReachedMilestone
}) {
  // 🎯 DATOS DEL JUEGO DESDE EL HOOK CENTRAL
  const {
    gameState,
    upgrades,
    missions,
    ownedCards,
    ownedItems,
    activeSkin,
    achievementsUnlocked,
    dailyRewards,
    farmingMilestones,
    referralStats,
    player
  } = gameData;

  // 🎯 ESTADOS DE UI LOCALES (no se sincronizan con BD)
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [clickEffect, setClickEffect] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // 🔥 REFS PARA INTERVALOS Y SINCRONIZACIÓN
  const energyIntervalRef = useRef(null);
  const coinsIntervalRef = useRef(null);
  const gameStateRef = useRef(gameState);
  const upgradesRef = useRef(upgrades);
  const syncTimeoutRef = useRef(null);

  // 🔄 ACTUALIZAR REFS CUANDO CAMBIAN LOS DATOS
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

    // ⚡ REGENERACIÓN DE ENERGÍA
  useEffect(() => {
    console.log("⚡ Iniciando regeneración de energía...");
    
    if (energyIntervalRef.current) {
      clearInterval(energyIntervalRef.current);
    }

    energyIntervalRef.current = setInterval(() => {
      if (gameState.energy < gameState.maxEnergy) {
        updateGameState({
          energy: Math.min(gameState.maxEnergy, gameState.energy + 1)
        });
      }
    }, DIFFICULTY_CONFIG.ENERGY_REGEN_RATE); // 🆕 USAR TIEMPO CONFIGURABLE

    return () => {
      if (energyIntervalRef.current) {
        clearInterval(energyIntervalRef.current);
        energyIntervalRef.current = null;
      }
    };
  }, [gameState.energy, gameState.maxEnergy, updateGameState]);


   // 💰 GENERACIÓN AUTOMÁTICA DE MONEDAS
  useEffect(() => {
    console.log("💰 Iniciando generación de monedas...");
    
    if (coinsIntervalRef.current) {
      clearInterval(coinsIntervalRef.current);
    }

    coinsIntervalRef.current = setInterval(() => {
      let effectiveCPS = gameState.coinsPerSecond * DIFFICULTY_CONFIG.BASE_CPS_MULTIPLIER; // 🆕 APLICAR MULTIPLICADOR
      
      // Aplicar boosts de items
      ownedItems.forEach(itemId => {
        const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
        if (item && item.effect.type === 'cps_boost') {
          effectiveCPS += item.effect.value * DIFFICULTY_CONFIG.BASE_CPS_MULTIPLIER; // 🆕 APLICAR MULTIPLICADOR
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
        updateGameState({
          coins: gameState.coins + increment,
          totalCoins: gameState.totalCoins + increment
        });
      }
    }, 1000);

    return () => {
      if (coinsIntervalRef.current) {
        clearInterval(coinsIntervalRef.current);
        coinsIntervalRef.current = null;
      }
    };
  }, [gameState, ownedItems, ownedCards, updateGameState]);


  // 🏆 SISTEMA DE LOGROS
  useEffect(() => {
    ACHIEVEMENTS.forEach(achievement => {
      if (!achievementsUnlocked.includes(achievement.id)) {
        let currentValue = 0;
        
        switch (achievement.type) {
          case 'clicks': 
            currentValue = gameState.totalClicks; 
            break;
          case 'totalCoins': 
            currentValue = gameState.totalCoins; 
            break;
          case 'upgrades': 
            currentValue = Object.values(upgrades).reduce((sum, upg) => sum + (upg?.level || 0), 0); 
            break;
          case 'missions': 
            currentValue = Object.values(missions).filter(m => m.completed).length; 
            break;
          case 'cards': 
            currentValue = ownedCards.length; 
            break;
          case 'items': 
            currentValue = ownedItems.filter(item => 
              typeof item === 'string' || (typeof item === 'object' && item.type !== 'consumable')
            ).length; 
            break;
          case 'farming_milestones': 
            currentValue = Object.values(farmingMilestones).filter(m => m.claimed).length; 
            break;
        }
        
        if (currentValue >= achievement.requirement) {
          const newAchievements = [...achievementsUnlocked, achievement.id];
          updateAchievementsUnlocked(newAchievements);
          
          toast({
            title: "🏆 ¡Logro Desbloqueado!",
            description: `${achievement.name}: ${achievement.description}`,
            duration: 4000,
          });
          
          playSound('achievement');
          
          // Sincronizar con BD
          syncGameData({
            achievements_unlocked: newAchievements
          });
        }
      }
    });
  }, [
    gameState, 
    upgrades, 
    missions, 
    achievementsUnlocked, 
    ownedCards, 
    ownedItems, 
    farmingMilestones, 
    toast, 
    playSound, 
    updateAchievementsUnlocked,
    syncGameData
  ]);

  // 🎯 FUNCIÓN PARA CALCULAR CLICK POWER REAL
  const calculateRealClickPower = useCallback(() => {
    let clickPower = gameState.clickPower;
    
    // ✅ APLICAR BONUS DE UPGRADES
    Object.entries(upgrades).forEach(([upgradeId, upgradeData]) => {
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

    return Math.max(1, clickPower);
  }, [gameState.clickPower, upgrades, ownedItems, ownedCards]);

   const handleClick = useCallback((event) => {
    if (gameState.energy <= 0) {
      toast({ 
        title: "⚡ Sin Energía", 
        description: `Espera a que se recargue tu energía (${gameState.energy}/${gameState.maxEnergy})`, 
        duration: 2000 
      });
      playSound('error');
      return;
    }
    
    playSound('click');

    const currentClickPower = calculateRealClickPower();
    // Aplicar multiplicador de dificultad al clic
    const coinsEarned = Math.floor(currentClickPower * DIFFICULTY_CONFIG.BASE_CLICK_MULTIPLIER);

    // Actualizar estado del juego
    const newState = {
      coins: gameState.coins + coinsEarned,
      totalCoins: gameState.totalCoins + coinsEarned,
      totalClicks: gameState.totalClicks + 1,
      energy: Math.max(0, gameState.energy - DIFFICULTY_CONFIG.ENERGY_PER_CLICK),
      experience: gameState.experience + DIFFICULTY_CONFIG.EXPERIENCE_PER_CLICK
    };
    
    updateGameState(newState);

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

    // 🆕 NUEVA FÓRMULA DE NIVELES (usando la configuración de dificultad)
    const experienceNeeded = DIFFICULTY_CONFIG.LEVEL_FORMULA(gameState.level);
    const newLevel = Math.floor((gameState.experience + DIFFICULTY_CONFIG.EXPERIENCE_PER_CLICK) / experienceNeeded) + 1;
    if (newLevel > gameState.level) {
      updateGameState({ level: newLevel });
      toast({ 
        title: "🎉 ¡Nivel Subido!", 
        description: `¡Ahora eres nivel ${newLevel}! Se necesitan ${Math.ceil(experienceNeeded)} XP para el siguiente.`, 
        duration: 3000 
      });
      playSound('levelUp');
      
      // Sincronizar nivel
      syncGameData({ level: newLevel });
    }
  }, [gameState, calculateRealClickPower, updateGameState, toast, playSound, syncGameData]);

   // 🆕 FUNCIÓN PARA VERIFICAR SI SE PUEDE COMPRAR UN UPGRADE
  const canBuyUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return { canBuy: false, reason: "Upgrade no encontrado" };
    
    const currentLevel = upgrades[upgradeId]?.level || 0;
    
    // Verificar nivel requerido
    if (gameState.level < (upgrade.requiredLevel || 1)) {
      return { 
        canBuy: false, 
        reason: `Requiere nivel ${upgrade.requiredLevel}`, 
        requiredLevel: upgrade.requiredLevel 
      };
    }
    
    // Verificar nivel máximo
    if (currentLevel >= (upgrade.maxLevel || 999)) {
      return { 
        canBuy: false, 
        reason: `Límite máximo (nivel ${upgrade.maxLevel}) alcanzado`, 
        maxLevel: upgrade.maxLevel 
      };
    }
    
    // Calcular precio con multiplicador
    const priceMultiplier = upgrade.priceMultiplier || 2.0;
    const price = Math.floor(upgrade.basePrice * Math.pow(priceMultiplier, currentLevel));
    
    if (gameState.coins < price) {
      return { 
        canBuy: false, 
        reason: `Necesitas ${price - gameState.coins} monedas más`,
        price 
      };
    }
    
    return { canBuy: true, price };
  }, [gameState, upgrades]);
  
  
   const buyUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('Upgrade not found:', upgradeId);
      return;
    }

    const checkResult = canBuyUpgrade(upgradeId);
    
    if (!checkResult.canBuy) {
      toast({ 
        title: "❌ No disponible", 
        description: checkResult.reason, 
        duration: 2000 
      });
      playSound('error');
      return;
    }

    const currentLevel = upgrades[upgradeId]?.level || 0;
    const price = checkResult.price;

    // Crear nueva versión del estado del juego
    const newGameState = { coins: gameState.coins - price };
    
    // 🆕 APLICAR MULTIPLICADOR DE DIFICULTAD A LA PRODUCCIÓN
    const effectivePower = upgrade.basePower * DIFFICULTY_CONFIG.BASE_CPS_MULTIPLIER;
    
    switch (upgrade.type) {
      case 'click':
        newGameState.clickPower = gameState.clickPower + effectivePower;
        break;
      case 'cps':
        newGameState.coinsPerSecond = gameState.coinsPerSecond + effectivePower;
        break;
      case 'multiplier':
        newGameState.clickPower = Math.floor(gameState.clickPower * effectivePower);
        break;
      case 'energy':
        newGameState.maxEnergy = gameState.maxEnergy + effectivePower;
        newGameState.energy = newGameState.maxEnergy;
        break;
      default:
        console.warn('Unknown upgrade type:', upgrade.type);
    }
    
    // Actualizar gameState
    updateGameState(newGameState);

    // Actualizar upgrades
    const newUpgrades = {
      ...upgrades,
      [upgradeId]: { 
        level: (upgrades[upgradeId]?.level || 0) + 1, 
        owned: (upgrades[upgradeId]?.owned || 0) + 1 
      }
    };
    
    updateUpgrades(newUpgrades);

    // Sincronizar
    syncGameData({
      coins: newGameState.coins,
      click_power: newGameState.clickPower || gameState.clickPower,
      coins_per_second: newGameState.coinsPerSecond || gameState.coinsPerSecond,
      max_energy: newGameState.maxEnergy || gameState.maxEnergy,
      energy: newGameState.energy || gameState.energy,
      upgrades: newUpgrades
    });

    toast({ 
      title: "✅ Mejora Comprada", 
      description: `${upgrade.name} nivel ${currentLevel + 1}`, 
      duration: 2000 
    });
    playSound('upgrade');
  }, [gameState, upgrades, canBuyUpgrade, updateGameState, updateUpgrades, toast, playSound, syncGameData]);


  // 🎯 MISIONES
  const completeMission = useCallback((missionId, isSocial = false) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || missions[missionId]?.completed) return;

    let canComplete = false;
    
    if (isSocial) {
      const newMissions = {
        ...missions,
        [missionId]: { 
          ...missions[missionId], 
          progress: (missions[missionId]?.progress || 0) + 1 
        }
      };
      
      updateMissions(newMissions);
      canComplete = (newMissions[missionId].progress || 0) >= mission.requirement.value;
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
        default: 
          break;
      }
    }

    if (canComplete) {
      const newMissions = {
        ...missions,
        [missionId]: { 
          ...missions[missionId], 
          completed: true, 
          claimed: false 
        }
      };
      
      updateMissions(newMissions);
      
      toast({ 
        title: "🎯 Misión Cumplida", 
        description: `¡Has completado "${mission.name}"! Reclama tu recompensa.`, 
        duration: 3000 
      });
      
      playSound('missionComplete');
      
      // Sincronizar misiones
      syncGameData({ missions: newMissions });
    } else if (!isSocial) {
      toast({ 
        title: "⏳ Misión Incompleta", 
        description: `Aún no cumples los requisitos para "${mission.name}".`, 
        duration: 2000 
      });
      playSound('uiClick');
    }
  }, [gameState, missions, upgrades, updateMissions, toast, playSound, syncGameData]);

  // 🎁 RECLAMAR RECOMPENSA DE MISIÓN
  const claimMissionReward = useCallback((missionId) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || !missions[missionId]?.completed || missions[missionId]?.claimed) return;

    // Actualizar monedas
    const newGameState = {
      coins: gameState.coins + mission.reward.coins,
      totalCoins: gameState.totalCoins + mission.reward.coins,
      experience: gameState.experience + (mission.reward.xp || 0)
    };
    
    updateGameState(newGameState);
    
    // Añadir carta si hay recompensa
    if (mission.reward.cardId) {
      const card = CARDS_DATA.find(c => c.id === mission.reward.cardId);
      if (card && !ownedCards.includes(card.id)) {
        const newOwnedCards = [...ownedCards, card.id];
        updateOwnedCards(newOwnedCards);
        
        toast({ 
          title: "🃏 Carta Obtenida!", 
          description: `¡Recibiste la carta "${card.name}"!`, 
          duration: 3000 
        });
        playSound('cardGet');
      }
    }

    // Marcar misión como reclamada
    const newMissions = {
      ...missions,
      [missionId]: { 
        ...missions[missionId], 
        claimed: true 
      }
    };
    
    updateMissions(newMissions);
    
    toast({ 
      title: "🎁 Recompensa Reclamada", 
      description: `+${mission.reward.coins} monedas por "${mission.name}"`, 
      duration: 3000 
    });
    
    playSound('reward');
    
    // Sincronizar todo
    syncGameData({
      coins: newGameState.coins,
      total_coins: newGameState.totalCoins,
      missions: newMissions,
      owned_cards: mission.reward.cardId ? [...ownedCards, mission.reward.cardId] : ownedCards
    });
  }, [missions, ownedCards, gameState, updateGameState, updateOwnedCards, updateMissions, toast, playSound, syncGameData]);

  // 📅 RECOMPENSA DIARIA
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
      
      // Actualizar monedas
      const newGameState = {
        coins: gameState.coins + reward,
        totalCoins: gameState.totalCoins + reward
      };
      
      updateGameState(newGameState);
      
      // Actualizar recompensa diaria
      const newDailyRewards = { 
        lastClaim: now.toISOString(), 
        streak: newStreak, 
        available: false 
      };
      
      updateDailyRewards(newDailyRewards);
      
      toast({ 
        title: "🎁 ¡Recompensa Diaria!", 
        description: `+${reward} monedas (Racha: ${newStreak} días)`, 
        duration: 3000 
      });
      
      playSound('reward');
      
      // Sincronizar
      syncGameData({
        coins: newGameState.coins,
        total_coins: newGameState.totalCoins,
        daily_rewards: newDailyRewards
      });
    } else {
      toast({ 
        title: "🤔 Ya Reclamaste Hoy", 
        description: "Vuelve mañana para tu próxima recompensa.", 
        duration: 2000 
      });
      playSound('uiClick');
    }
  }, [dailyRewards, gameState, updateGameState, updateDailyRewards, toast, playSound, syncGameData]);

  // 🔄 VERIFICAR DISPONIBILIDAD DE RECOMPENSA DIARIA
  useEffect(() => {
    const now = new Date();
    const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
    
    if (!lastClaimDate || now.toDateString() !== lastClaimDate.toDateString()) {
      updateDailyRewards(prev => ({ ...prev, available: true }));
    } else {
      updateDailyRewards(prev => ({ ...prev, available: false }));
    }
  }, [dailyRewards.lastClaim, updateDailyRewards]);

  // 🛍️ TIENDA
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
      // Actualizar monedas
      const newGameState = { coins: gameState.coins - item.price };
      updateGameState(newGameState);
      
      if (item.type === 'skin') {
        // Aplicar skin
        updateActiveSkin(itemId);
        
        if (!ownedItems.some(owned => 
          (typeof owned === 'string' && owned === itemId) || 
          (typeof owned === 'object' && owned.id === itemId)
        )) {
          const newOwnedItems = [...ownedItems, itemId];
          updateOwnedItems(newOwnedItems);
        }
        
        toast({ 
          title: "🎨 Skin Aplicada", 
          description: `¡Ahora usas la skin "${item.name}"!`, 
          duration: 3000 
        });
        
        playSound('equip');
      } else {
        // Manejar otros tipos de items
        let newOwnedItems;
        
        if (item.type === 'consumable') {
          const existingItemIndex = ownedItems.findIndex(i => 
            typeof i === 'object' && i.id === itemId
          );
          
          if (existingItemIndex > -1) {
            const updatedItems = [...ownedItems];
            updatedItems[existingItemIndex] = { 
              ...updatedItems[existingItemIndex], 
              quantity: (updatedItems[existingItemIndex].quantity || 0) + 1 
            };
            newOwnedItems = updatedItems;
          } else {
            newOwnedItems = [...ownedItems, { ...item, quantity: 1 }];
          }
        } else {
          if (!ownedItems.some(owned => 
            (typeof owned === 'string' && owned === itemId) || 
            (typeof owned === 'object' && owned.id === itemId)
          )) {
            newOwnedItems = [...ownedItems, itemId];
          } else {
            newOwnedItems = ownedItems;
          }
        }
        
        updateOwnedItems(newOwnedItems);
        
        toast({ 
          title: "🛍️ Ítem Comprado", 
          description: `¡Has comprado "${item.name}"!`, 
          duration: 3000 
        });
        
        playSound('buy');
        
        // Aplicar efecto inmediato si es consumible de energía
        if (item.type === 'consumable' && item.effect.type === 'energy_fill') {
          const updatedEnergy = Math.min(gameState.maxEnergy, gameState.energy + item.effect.value);
          updateGameState({ energy: updatedEnergy });
          
          toast({ 
            title: "⚡ Energía Restaurada", 
            description: `+${item.effect.value} de energía.`, 
            duration: 2000 
          });
          
          playSound('powerUp');
        }
      }
      
      // Sincronizar compra
      syncGameData({
        coins: newGameState.coins,
        owned_items: item.type === 'skin' ? [...ownedItems, itemId] : ownedItems,
        active_skin: item.type === 'skin' ? itemId : activeSkin,
        energy: item.type === 'consumable' && item.effect.type === 'energy_fill' 
          ? Math.min(gameState.maxEnergy, gameState.energy + item.effect.value)
          : gameState.energy
      });
    } else {
      toast({ 
        title: "💰 Monedas Insuficientes", 
        description: `Necesitas ${item.price - gameState.coins} monedas más para "${item.name}".`, 
        duration: 2000 
      });
      playSound('error');
    }
  }, [
    gameState, 
    ownedItems, 
    activeSkin, 
    updateGameState, 
    updateActiveSkin, 
    updateOwnedItems, 
    toast, 
    playSound, 
    syncGameData
  ]);

  // 🏆 HITOS DE FARMEO
  const claimFarmingMilestone = useCallback((milestoneId) => {
    const milestone = FARMING_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone || farmingMilestones[milestoneId]?.claimed) return;

    if (gameState.totalCoins >= milestone.coinsRequired) {
      // Añadir tokens CROC
      const newGameState = {
        nativeTokenBalance: gameState.nativeTokenBalance + milestone.tokenReward
      };
      
      updateGameState(newGameState);
      
      // Marcar hito como reclamado
      const newFarmingMilestones = {
        ...farmingMilestones,
        [milestoneId]: { claimed: true }
      };
      
      updateFarmingMilestones(newFarmingMilestones);
      
      toast({ 
        title: "🏆 Hito de Farmeo Reclamado!", 
        description: `¡Has ganado ${milestone.tokenReward} CROC por "${milestone.name}"!`, 
        duration: 4000 
      });
      
      playSound('milestone');
      setLastReachedMilestone(milestone);
      setShowMilestoneModal(true);
      
      // Sincronizar hito
      syncGameData({
        native_token_balance: newGameState.nativeTokenBalance,
        farming_milestones: newFarmingMilestones
      });
    } else {
      toast({ 
        title: "⏳ Requisito No Cumplido", 
        description: `Necesitas ${milestone.coinsRequired.toLocaleString()} monedas totales para reclamar este hito.`, 
        duration: 3000 
      });
      playSound('uiClick');
    }
  }, [
    gameState, 
    farmingMilestones, 
    updateGameState, 
    updateFarmingMilestones, 
    toast, 
    playSound, 
    setShowMilestoneModal, 
    setLastReachedMilestone,
    syncGameData
  ]);

  // 🔔 NOTIFICACIONES DE HITOS DISPONIBLES
  useEffect(() => {
    FARMING_MILESTONES.forEach(milestone => {
      if (gameState.totalCoins >= milestone.coinsRequired && 
          !farmingMilestones[milestone.id]?.claimed && 
          !farmingMilestones[milestone.id]?.notified) {
        
        toast({
          title: `🎉 ¡Hito de Farmeo Disponible!`,
          description: `Puedes reclamar ${milestone.tokenReward} CROC por "${milestone.name}". Ve a la sección de Hitos.`,
          duration: 5000,
        });
        
        playSound('notification');
        
        const newFarmingMilestones = {
          ...farmingMilestones,
          [milestone.id]: { ...farmingMilestones[milestone.id], notified: true }
        };
        
        updateFarmingMilestones(newFarmingMilestones);
      }
    });
  }, [gameState.totalCoins, farmingMilestones, updateFarmingMilestones, toast, playSound]);

  // 🔄 REINICIAR PROGRESO
  const resetProgress = useCallback(() => {
    const resetData = {
      gameState: DEFAULT_INITIAL_GAME_STATE,
      upgrades: DEFAULT_INITIAL_UPGRADES_STATE,
      missions: DEFAULT_INITIAL_MISSIONS_STATE,
      ownedCards: [],
      ownedItems: [],
      activeSkin: null,
      achievementsUnlocked: [],
      dailyRewards: { lastClaim: null, streak: 0, available: true },
      farmingMilestones: INITIAL_FARMING_MILESTONES_STATE,
    };
    
    // Actualizar todos los estados
    updateGameState(DEFAULT_INITIAL_GAME_STATE);
    updateUpgrades(DEFAULT_INITIAL_UPGRADES_STATE);
    updateMissions(DEFAULT_INITIAL_MISSIONS_STATE);
    updateOwnedCards([]);
    updateOwnedItems([]);
    updateActiveSkin(null);
    updateAchievementsUnlocked([]);
    updateDailyRewards({ lastClaim: null, streak: 0, available: true });
    updateFarmingMilestones(INITIAL_FARMING_MILESTONES_STATE);
    
    toast({ 
      title: "🔄 Progreso Reiniciado", 
      description: "¡Comienza una nueva aventura!", 
      duration: 3000 
    });
    
    // Sincronizar reinicio completo
    syncGameData({
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
      upgrades: DEFAULT_INITIAL_UPGRADES_STATE,
      missions: DEFAULT_INITIAL_MISSIONS_STATE,
      owned_cards: [],
      owned_items: [],
      active_skin: null,
      achievements_unlocked: [],
      daily_rewards: { lastClaim: null, streak: 0, available: true },
      farming_milestones: INITIAL_FARMING_MILESTONES_STATE,
    });
  }, [
    updateGameState,
    updateUpgrades,
    updateMissions,
    updateOwnedCards,
    updateOwnedItems,
    updateActiveSkin,
    updateAchievementsUnlocked,
    updateDailyRewards,
    updateFarmingMilestones,
    toast,
    syncGameData
  ]);

  // 📤 DEVOLVER DATOS Y FUNCIONES
  return {
    // 🎯 DATOS DEL JUEGO
    gameState,
    upgrades,
    missions,
    ownedCards,
    ownedItems,
    activeSkin,
    achievementsUnlocked,
    dailyRewards,
    farmingMilestonesState: farmingMilestones,
    referralStats,
    player,
    
    
    // 🎯 ESTADOS DE UI
    floatingNumbers,
    clickEffect,
    soundEnabled,
    
    // 🎯 FUNCIONES DE ACTUALIZACIÓN DE UI
    setFloatingNumbers,
    setClickEffect,
    setSoundEnabled,
    canBuyUpgrade,
    
    // 🎯 FUNCIONES DEL JUEGO
    handleClick,
    buyUpgrade,
    completeMission,
    claimMissionReward,
    claimDailyReward,
    buyShopItem,
    resetProgress,
    claimFarmingMilestone,
    calculateRealClickPower,
    
    // 🎯 FUNCIONES DE SINCRONIZACIÓN
    syncAllData: syncGameData,
  };
}