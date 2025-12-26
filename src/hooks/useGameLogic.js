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
  INITIAL_FARMING_MILESTONES_STATE 
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







  
// ⚡ REGENERACIÓN DE ENERGÍA - VERSIÓN CORREGIDA Y ESTABLE
useEffect(() => {
  if (!gameState || !updateGameState) return;
  
  console.log("⚡ Iniciando sistema de regeneración de energía (estable)...");
  
  let isMounted = true;
  let energyInterval = null;
  
  const startEnergySystem = () => {
    if (!isMounted) return;
    
    // Limpiar intervalo existente
    if (energyInterval) {
      clearInterval(energyInterval);
      energyInterval = null;
    }
    
    // 1. REGENERACIÓN EN TIEMPO REAL (cada 3 segundos)
    energyInterval = setInterval(() => {
      if (!isMounted || !gameStateRef.current) return;
      
      const currentEnergy = gameStateRef.current.energy;
      const currentMaxEnergy = gameStateRef.current.maxEnergy;
      
      if (currentEnergy < currentMaxEnergy) {
        const newEnergy = currentEnergy + 1;
        
        console.log(`⚡ Regenerando: ${currentEnergy} -> ${newEnergy}`);
        
        updateGameState({
          energy: newEnergy
        });
        
        // Sincronizar con BD cada 10 regeneraciones
        if (newEnergy % 10 === 0) {
          syncGameData({
            energy: newEnergy,
            last_active: new Date().toISOString()
          });
        }
      }
    }, 3000);
  };
  
  // Iniciar sistema
  startEnergySystem();
  
  // 2. REGENERACIÓN POR VISIBILIDAD
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && isMounted) {
      console.log("👀 Usuario activo - Verificando energía...");
      
      // Solo sincronizar, no regenerar inmediatamente
      syncGameData({
        last_active: new Date().toISOString()
      });
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    console.log("🔄 Sistema de regeneración limpiado");
    isMounted = false;
    
    if (energyInterval) {
      clearInterval(energyInterval);
      energyInterval = null;
    }
    
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [gameState.maxEnergy]); // Solo depende de maxEnergy, no de updateGameState o syncGameData


  // 💰 GENERACIÓN AUTOMÁTICA DE MONEDAS
  useEffect(() => {
    console.log("💰 Iniciando generación de monedas...");
    
    if (coinsIntervalRef.current) {
      clearInterval(coinsIntervalRef.current);
    }

    coinsIntervalRef.current = setInterval(() => {
      let effectiveCPS = gameState.coinsPerSecond;
      
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

  // 👆 FUNCIÓN DE CLIC - OPTIMIZADA
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
    const coinsEarned = Math.floor(currentClickPower);

    // Actualizar estado del juego
    const newState = {
      coins: gameState.coins + coinsEarned,
      totalCoins: gameState.totalCoins + coinsEarned,
      totalClicks: gameState.totalClicks + 1,
      energy: Math.max(0, gameState.energy - 1),
      experience: gameState.experience + 1
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

    // Sistema de niveles
    const newLevel = Math.floor((gameState.experience + 1) / 100) + 1;
    if (newLevel > gameState.level) {
      updateGameState({ level: newLevel });
      toast({ 
        title: "🎉 ¡Nivel Subido!", 
        description: `¡Ahora eres nivel ${newLevel}!`, 
        duration: 3000 
      });
      playSound('levelUp');
      
      // Sincronizar nivel
      syncGameData({ level: newLevel });
    }
  }, [gameState, calculateRealClickPower, updateGameState, toast, playSound, syncGameData]);

  // 🛒 FUNCIÓN DE COMPRA DE UPGRADES
  const buyUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('Upgrade not found:', upgradeId);
      return;
    }

    const currentLevel = upgrades[upgradeId]?.level || 0;
    const price = Math.floor(upgrade.basePrice * Math.pow(1.5, currentLevel));

    if (gameState.coins >= price) {
      // Crear nueva versión del estado del juego
      const newGameState = { coins: gameState.coins - price };
      
      switch (upgrade.type) {
        case 'click':
          newGameState.clickPower = gameState.clickPower + upgrade.basePower;
          break;
        case 'cps':
          newGameState.coinsPerSecond = gameState.coinsPerSecond + upgrade.basePower;
          break;
        case 'multiplier':
          newGameState.clickPower = Math.floor(gameState.clickPower * upgrade.basePower);
          break;
        case 'energy':
          newGameState.maxEnergy = gameState.maxEnergy + upgrade.basePower;
          newGameState.energy = newGameState.maxEnergy;
          break;
        default:
          console.warn('Unknown upgrade type:', upgrade.type);
      }
      
      // Actualizar gameState
      updateGameState(newGameState);

      // ✅ ACTUALIZAR UPGRADES
      const newUpgrades = {
        ...upgrades,
        [upgradeId]: { 
          level: (upgrades[upgradeId]?.level || 0) + 1, 
          owned: (upgrades[upgradeId]?.owned || 0) + 1 
        }
      };
      
      updateUpgrades(newUpgrades);

      // 🔥 SINCRONIZAR INMEDIATAMENTE
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
    } else {
      toast({ 
        title: "💰 Monedas Insuficientes", 
        description: `Necesitas ${price - gameState.coins} monedas más`, 
        duration: 2000 
      });
      playSound('error');
    }
  }, [gameState, upgrades, updateGameState, updateUpgrades, toast, playSound, syncGameData]);

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


// 📅 RECOMPENSA DIARIA - VERSIÓN CORREGIDA
const claimDailyReward = useCallback(() => {
  console.log('🎁 Intentando reclamar recompensa diaria...');
  
  if (!dailyRewards.available) {
    toast({ 
      title: "⏳ Ya Reclamaste Hoy", 
      description: "Vuelve mañana para tu próxima recompensa.", 
      duration: 2000 
    });
    playSound('uiClick');
    return;
  }

  const now = new Date();
  const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
  
  // Calcular nueva racha
  let newStreak = 1;
  
  if (lastClaimDate) {
    const diffTime = Math.abs(now - lastClaimDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Reclamación consecutiva
      newStreak = dailyRewards.streak + 1;
    } else if (diffDays > 1) {
      // Se perdió la racha
      newStreak = 1;
      toast({
        title: "🔄 Racha Reiniciada",
        description: `Pasaron ${diffDays} días desde tu última reclamación.`,
        duration: 3000,
      });
    }
  }

  // Calcular recompensa (base 100 + bonus por racha)
  const baseReward = 100;
  const streakBonus = (newStreak - 1) * 50; // +50 monedas por cada día de racha
  const totalReward = baseReward + streakBonus;

  console.log(`🎁 Recompensa: ${totalReward} monedas (Racha: ${newStreak})`);

  // Actualizar estado del juego
  const newGameState = {
    coins: gameState.coins + totalReward,
    totalCoins: gameState.totalCoins + totalReward
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
    title: "🎁 ¡Recompensa Diaria Reclamada!", 
    description: `+${totalReward} monedas (Racha: ${newStreak} días)`, 
    duration: 4000 
  });
  
  playSound('reward');

  // Sincronizar con Supabase
  syncGameData({
    coins: newGameState.coins,
    total_coins: newGameState.totalCoins,
    daily_rewards: newDailyRewards
  });

}, [dailyRewards, gameState, updateGameState, updateDailyRewards, toast, playSound, syncGameData]);


// 🔄 VERIFICAR DISPONIBILIDAD DE RECOMPENSA DIARIA - VERSIÓN CORREGIDA
useEffect(() => {
  const checkDailyReward = () => {
    if (!dailyRewards || !updateDailyRewards) return;
    
    const now = new Date();
    const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
    
    let shouldUpdate = false;
    let newDailyRewards = { ...dailyRewards };
    
    // Si no hay última reclamación, está disponible
    if (!lastClaimDate) {
      if (!dailyRewards.available) {
        newDailyRewards.available = true;
        shouldUpdate = true;
      }
    } else {
      // Calcular diferencia en días
      const diffTime = Math.abs(now - lastClaimDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isNewDay = now.toDateString() !== lastClaimDate.toDateString();
      
      // Si ha pasado al menos un día y es un nuevo día
      if (diffDays >= 1 && isNewDay) {
        if (!dailyRewards.available) {
          newDailyRewards.available = true;
          shouldUpdate = true;
        }
      } else if (diffDays < 1 && dailyRewards.available) {
        // Si no ha pasado un día pero dice que está disponible, corregir
        newDailyRewards.available = false;
        shouldUpdate = true;
      }
    }
    
    // Solo actualizar si hay cambios
    if (shouldUpdate) {
      console.log('🎁 Actualizando estado de recompensa diaria');
      updateDailyRewards(newDailyRewards);
    }
  };
  
  // Ejecutar una vez al cargar
  checkDailyReward();
  
  // Verificar cada 5 minutos (no cada render)
  const interval = setInterval(checkDailyReward, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, [dailyRewards?.lastClaim]); // Solo dependemos de lastClaim



 // 🛍️ TIENDA - VERSIÓN COMPLETA CON CROC Y DESCUENTOS
const buyShopItem = useCallback((itemId, useCroc = false, discount = 0) => {
  console.log('🛍️ Iniciando compra de item:', { itemId, useCroc, discount });
  
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) {
    console.error('❌ Item no encontrado:', itemId);
    toast({ 
      title: "❌ Error", 
      description: "El item no existe.", 
      duration: 2000 
    });
    playSound('error');
    return;
  }

  // 🔍 Verificar si ya es dueño (para items no consumibles)
  const isAlreadyOwnedNonConsumable = ownedItems.some(owned => {
    if (typeof owned === 'string') {
      return owned === itemId;
    } else if (typeof owned === 'object') {
      return owned.id === itemId && item.type !== 'consumable' && item.type !== 'boost';
    }
    return false;
  });

  if (isAlreadyOwnedNonConsumable && item.type !== 'consumable' && item.type !== 'boost') {
    toast({ 
      title: "🚫 Ya Posees Este Ítem", 
      description: `Ya tienes "${item.name}".`, 
      duration: 2000 
    });
    playSound('error');
    return;
  }
  
  // 🎨 Verificar si la skin ya está activa
  if (item.type === 'skin' && activeSkin === itemId) {
    toast({ 
      title: "🎨 Skin ya Activa", 
      description: `La skin "${item.name}" ya está en uso.`, 
      duration: 2000 
    });
    playSound('uiClick');
    return;
  }

  // 💰 Calcular precio (considerando descuentos y moneda)
  const basePrice = useCroc ? (item.priceCroc || Math.floor(item.price * 0.1)) : item.price;
  const finalPrice = Math.floor(basePrice * (1 - discount / 100));
  
  // 📊 Verificar saldo suficiente
  const balance = useCroc ? gameState.nativeTokenBalance : gameState.coins;
  const currencyName = useCroc ? 'CROC' : 'monedas';
  
  if (balance < finalPrice) {
    const needed = finalPrice - balance;
    toast({ 
      title: `💰 ${currencyName} Insuficientes`, 
      description: `Necesitas ${needed} ${currencyName} más para "${item.name}".`, 
      duration: 3000 
    });
    playSound('error');
    return;
  }

  // 🎯 Iniciar compra
  console.log(`✅ Compra aprobada: ${item.name} por ${finalPrice} ${currencyName} (descuento: ${discount}%)`);

  // 📉 Restar del saldo correspondiente
  const newGameState = { 
    ...gameState,
    coins: useCroc ? gameState.coins : Math.max(0, gameState.coins - finalPrice),
    nativeTokenBalance: useCroc ? Math.max(0, gameState.nativeTokenBalance - finalPrice) : gameState.nativeTokenBalance
  };
  
  updateGameState(newGameState);
  
  // 🎁 Manejar diferentes tipos de items
  let newOwnedItems = [...ownedItems];
  let newActiveSkin = activeSkin;
  let shouldApplyEffect = false;
  let effectMessage = null;

  switch (item.type) {
    case 'skin':
      // Equipar skin automáticamente
      newActiveSkin = itemId;
      updateActiveSkin(itemId);
      
      // Añadir a items poseídos si no está
      if (!newOwnedItems.includes(itemId)) {
        newOwnedItems.push(itemId);
      }
      
      // Mostrar efecto especial
      toast({ 
        title: "🎨 ¡Skin Equipada!", 
        description: `¡Ahora usas "${item.name}"!`, 
        duration: 4000 
      });
      
      // Bonus por skin legendaria
      if (item.rarity === 'legendary') {
        const bonusCroc = Math.floor(finalPrice * 0.05); // 5% de bonificación
        const updatedTokens = gameState.nativeTokenBalance + bonusCroc;
        updateGameState({ ...newGameState, nativeTokenBalance: updatedTokens });
        
        toast({
          title: "✨ ¡Bonus Legendario!",
          description: `¡Skin legendaria! +${bonusCroc} CROC de bonificación.`,
          duration: 5000,
        });
      }
      
      playSound('equip');
      break;

    case 'item':
    case 'boost':
      // Añadir item a la colección
      if (!newOwnedItems.includes(itemId)) {
        newOwnedItems.push(itemId);
      }
      
      // Aplicar efectos inmediatos si los tiene
      if (item.effect) {
        shouldApplyEffect = true;
        effectMessage = `¡${item.name} activado!`;
        
        if (item.effect.autoClicks) {
          // Auto-clicker: aumentar clics automáticos
          const newCPS = gameState.coinsPerSecond + item.effect.autoClicks;
          updateGameState({ ...newGameState, coinsPerSecond: newCPS });
          effectMessage += ` +${item.effect.autoClicks} clics/segundo`;
        }
        
        if (item.effect.coinMultiplier) {
          // Multiplicador de monedas
          effectMessage += ` x${item.effect.coinMultiplier} monedas`;
        }
      }
      
      toast({ 
        title: "✅ Ítem Comprado", 
        description: `¡Has adquirido "${item.name}"! ${effectMessage || ''}`, 
        duration: 4000 
      });
      playSound('buy');
      break;

    case 'consumable':
      // Manejar consumibles con cantidad
      const existingIndex = newOwnedItems.findIndex(i => 
        typeof i === 'object' && i.id === itemId
      );
      
      if (existingIndex > -1) {
        // Incrementar cantidad
        newOwnedItems[existingIndex] = { 
          ...newOwnedItems[existingIndex], 
          quantity: (newOwnedItems[existingIndex].quantity || 0) + 1 
        };
      } else {
        // Nuevo consumible
        newOwnedItems.push({ ...item, quantity: 1 });
      }
      
      // Aplicar efecto inmediato
      shouldApplyEffect = true;
      if (item.effect) {
        if (item.effect.energy) {
          const updatedEnergy = Math.min(gameState.maxEnergy, gameState.energy + item.effect.energy);
          updateGameState({ ...newGameState, energy: updatedEnergy });
          effectMessage = `+${item.effect.energy} energía`;
        }
        
        if (item.effect.coins) {
          const newCoins = gameState.coins + item.effect.coins;
          updateGameState({ ...newGameState, coins: newCoins });
          effectMessage = `+${item.effect.coins} monedas`;
        }
      }
      
      toast({ 
        title: "⚡ Consumible Activado", 
        description: `¡Usaste "${item.name}"! ${effectMessage || ''}`, 
        duration: 3000 
      });
      playSound('powerUp');
      break;

    default:
      console.warn('⚠️ Tipo de item desconocido:', item.type);
      break;
  }

  // 📦 Actualizar items poseídos
  updateOwnedItems(newOwnedItems);

  // 🏆 Verificar logros de colección
  if (item.type === 'skin') {
    const ownedSkins = newOwnedItems.filter(id => {
      const it = SHOP_ITEMS.find(s => s.id === id);
      return it && it.type === 'skin';
    }).length;
    
    // Logro por coleccionar skins
    if (ownedSkins >= 3 && !achievementsUnlocked.includes('skin_collector_1')) {
      const newAchievements = [...achievementsUnlocked, 'skin_collector_1'];
      updateAchievementsUnlocked(newAchievements);
      
      toast({
        title: "🏆 Logro Desbloqueado!",
        description: "¡Coleccionista de Skins Nivel 1!",
        duration: 5000,
      });
      
      syncGameData({ achievements_unlocked: newAchievements });
    }
  }

  // 💾 Preparar datos para sincronización
  const syncData = {
    coins: newGameState.coins,
    native_token_balance: newGameState.nativeTokenBalance,
    owned_items: newOwnedItems,
    active_skin: item.type === 'skin' ? itemId : activeSkin,
    energy: shouldApplyEffect && item.effect?.energy 
      ? Math.min(gameState.maxEnergy, gameState.energy + (item.effect.energy || 0))
      : gameState.energy,
    coins_per_second: shouldApplyEffect && item.effect?.autoClicks
      ? gameState.coinsPerSecond + item.effect.autoClicks
      : gameState.coinsPerSecond,
    total_coins: gameState.totalCoins // No restamos de total_coins
  };

  // 📤 Sincronizar con Supabase
  syncGameData(syncData);

  // 🎉 Notificación final
  if (discount > 0) {
    toast({
      title: "🎯 ¡Compra con Descuento!",
      description: `Ahorraste ${Math.floor(basePrice * (discount/100))} ${currencyName} (${discount}%)`,
      duration: 4000,
    });
  }

  console.log('✅ Compra completada exitosamente:', {
    item: item.name,
    precio: finalPrice,
    moneda: currencyName,
    descuento: discount,
    nuevoSaldo: useCroc ? newGameState.nativeTokenBalance : newGameState.coins
  });

}, [
  gameState, 
  ownedItems, 
  activeSkin, 
  achievementsUnlocked,
  updateGameState, 
  updateActiveSkin, 
  updateOwnedItems,
  updateAchievementsUnlocked,
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