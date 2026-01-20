import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ACHIEVEMENTS,
  FARMING_MILESTONES,
  INITIAL_GAME_STATE as DEFAULT_INITIAL_GAME_STATE
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
  setLastReachedMilestone,
  gameConfig
}) {
  const {
    upgrades: UPGRADES = [],
    missions: MISSIONS = [],
    shopItems: SHOP_ITEMS = [],
    cards: CARDS_DATA = [],
    // achievements: ACHIEVEMENTS // If achievements are dynamic too
  } = gameConfig || {};

  // Static Achievements fallback or import if not dynamic yet
  // Assuming ACHIEVEMENTS are still static for now as I didn't migrate them
  // But wait, useGameLogic imports ACHIEVEMENTS. I should probably keep imported ACHIEVEMENTS if not in config.
  // Let's import ACHIEVEMENTS again if not in config.

  // Re-importing static ACHIEVEMENTS for now since it wasn't in migration plan
  // But wait, I removed the import block.
  // I need to keep ACHIEVEMENTS import.
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
  const lastEnergySyncRef = useRef(0);

  // 🔄 ACTUALIZAR REFS CUANDO CAMBIAN LOS DATOS
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    upgradesRef.current = upgrades;
  }, [upgrades]);

  // ⚡ REGENERACIÓN DE ENERGÍA - VERSIÓN OPTIMIZADA
  useEffect(() => {
    if (!gameState || !updateGameState) return;

    let isMounted = true;
    let energyInterval = null;

    const startEnergySystem = () => {
      if (!isMounted) return;

      if (energyInterval) {
        clearInterval(energyInterval);
      }

      // 1. REGENERACIÓN EN TIEMPO REAL (cada 3 segundos)
      energyInterval = setInterval(() => {
        if (!isMounted || !gameStateRef.current) return;

        const currentEnergy = gameStateRef.current.energy;
        const currentMaxEnergy = gameStateRef.current.maxEnergy;

        if (currentEnergy < currentMaxEnergy) {
          const newEnergy = Math.min(Number(currentEnergy) + 1, Number(currentMaxEnergy));

          updateGameState({
            energy: newEnergy
          });

          // Sincronizar con BD cada 10 regeneraciones
          const now = Date.now();
          if (now - lastEnergySyncRef.current > 30000) {
            syncGameData({
              energy: newEnergy,
              last_active: new Date().toISOString()
            });
            lastEnergySyncRef.current = now;
          }
        }
      }, 3000);
    };

    startEnergySystem();

    return () => {
      isMounted = false;
      if (energyInterval) {
        clearInterval(energyInterval);
      }
    };
  }, [gameState.maxEnergy, updateGameState, syncGameData]);

  // 💰 GENERACIÓN AUTOMÁTICA DE MONEDAS - CORREGIDA
  useEffect(() => {
    console.log("💰 Iniciando generación de monedas...");

    if (coinsIntervalRef.current) {
      clearInterval(coinsIntervalRef.current);
    }

    coinsIntervalRef.current = setInterval(() => {
      let effectiveCPS = 0;

      // ✅ 1. CPS BASE del estado
      effectiveCPS += gameState.coinsPerSecond;

      // ✅ 2. CPS de UPGRADES
      Object.entries(upgrades).forEach(([upgradeId, upgradeData]) => {
        const upgradeConfig = UPGRADES.find(u => u.id === upgradeId);
        if (upgradeConfig && upgradeConfig.type === 'cps' && upgradeData?.level > 0) {
          effectiveCPS += upgradeConfig.basePower * upgradeData.level;
        }
      });

      // ✅ 3. Aplicar boosts de items
      ownedItems.forEach(itemId => {
        const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
        if (item && item.effect?.cpsBoost) {
          effectiveCPS += item.effect.cpsBoost;
        }
        if (item && item.effect?.autoClicks) {
          effectiveCPS += item.effect.autoClicks;
        }
        if (item && item.effect?.coinMultiplier) {
          effectiveCPS *= item.effect.coinMultiplier;
        }
      });

      // ✅ 4. Aplicar boosts de cartas (porcentaje)
      ownedCards.forEach(cardId => {
        const card = CARDS_DATA.find(c => c.id === cardId);
        if (card && card.effect.type === 'cps_boost_percent') {
          effectiveCPS *= (1 + card.effect.value / 100);
        }
      });

      if (effectiveCPS > 0) {
        const increment = effectiveCPS / 10; // Dividido por 10 porque se ejecuta 10 veces por segundo
        updateGameState({
          coins: gameState.coins + increment,
          totalCoins: gameState.totalCoins + increment
        });
      }
    }, 100);

    return () => {
      if (coinsIntervalRef.current) {
        clearInterval(coinsIntervalRef.current);
        coinsIntervalRef.current = null;
      }
    };
  }, [gameState, upgrades, ownedItems, ownedCards, updateGameState]);

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

  // 🎯 FUNCIÓN PARA CALCULAR CLICK POWER REAL - MEJORADA
  const calculateRealClickPower = useCallback(() => {
    let clickPower = 1; // ❌ NO usar gameState.clickPower

    // ✅ APLICAR BONUS DE UPGRADES
    Object.entries(upgrades).forEach(([upgradeId, upgradeData]) => {
      const upgradeConfig = UPGRADES.find(u => u.id === upgradeId);
      if (upgradeConfig && upgradeData?.level > 0) {
        if (upgradeConfig.type === 'click') {
          const clickBonus = upgradeConfig.basePower * upgradeData.level;
          clickPower += clickBonus;
        } else if (upgradeConfig.type === 'multiplier') {
          const multiplierBonus = (upgradeConfig.basePower - 1) * upgradeData.level;
          clickPower *= (1 + multiplierBonus);
        }
        // 'cps' y 'energy' no afectan click power
      }
    });

    // ✅ APLICAR BONUS DE ITEMS
    ownedItems.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
      if (item && item.effect?.clickMultiplier) {
        clickPower *= item.effect.clickMultiplier;
      }
      if (item && item.effect?.clickPower) {
        clickPower += item.effect.clickPower;
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

    // ✅ APLICAR BONUS DE SKIN ACTIVA
    if (activeSkin) {
      const skin = SHOP_ITEMS.find(i => i.id === activeSkin);
      if (skin && skin.effect?.clickMultiplier) {
        clickPower *= skin.effect.clickMultiplier;
      }
    }

    return Math.max(1, Math.floor(clickPower));
  }, [upgrades, ownedItems, ownedCards, activeSkin]);


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
    const expForNextLevel = 100; // 100 XP por nivel
    const currentExp = gameState.experience + 1;
    const newLevel = Math.floor(currentExp / expForNextLevel) + 1;

    if (newLevel > gameState.level) {
      const levelDiff = newLevel - gameState.level;
      updateGameState({
        level: newLevel,
        maxEnergy: gameState.maxEnergy + (levelDiff * 10) // +10 energía por nivel
      });

      toast({
        title: "🎉 ¡Nivel Subido!",
        description: `¡Ahora eres nivel ${newLevel}! +${levelDiff * 10} energía máxima`,
        duration: 3000
      });
      playSound('levelUp');

      // Sincronizar nivel
      syncGameData({
        level: newLevel,
        max_energy: gameState.maxEnergy + (levelDiff * 10)
      });
    }
  }, [gameState, calculateRealClickPower, updateGameState, toast, playSound, syncGameData]);

  // 🛒 FUNCIÓN DE COMPRA DE UPGRADES - VERSIÓN CORREGIDA
  const buyUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.error('Upgrade not found:', upgradeId);
      return;
    }

    const currentLevel = upgrades[upgradeId]?.level || 0;
    const price = Math.floor(upgrade.basePrice * Math.pow(1.5, currentLevel));

    if (gameState.coins >= price) {
      // SOLO descontar monedas, NO modificar otros estados
      const newGameState = {
        coins: gameState.coins - price,
        totalCoins: gameState.totalCoins // Mantener igual
      };

      // ✅ ACTUALIZAR UPGRADES (solo el nivel)
      const newUpgrades = {
        ...upgrades,
        [upgradeId]: {
          level: (upgrades[upgradeId]?.level || 0) + 1,
          owned: (upgrades[upgradeId]?.owned || 0) + 1
        }
      };

      updateGameState(newGameState);
      updateUpgrades(newUpgrades);

      // 🔥 SINCRONIZAR SOLO LO NECESARIO
      syncGameData({
        coins: newGameState.coins,
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
  // 🎯 MISIONES
  const completeMission = useCallback((missionId, isSocial = false) => {
    const activeMissions = gameConfig?.missions || MISSIONS;
    const mission = activeMissions.find(m => m.id === missionId);
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
      switch (mission.requirement.type) {
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
    const activeMissions = gameConfig?.missions || MISSIONS;
    const mission = activeMissions.find(m => m.id === missionId);
    if (!mission || !missions[missionId]?.completed || missions[missionId]?.claimed) return;

    // Actualizar monedas
    const newGameState = {
      coins: gameState.coins + (mission.reward.coins || 0),
      totalCoins: gameState.totalCoins + (mission.reward.coins || 0),
      experience: gameState.experience + (mission.reward.xp || 0),
      nativeTokenBalance: (gameState.nativeTokenBalance || 0) + (mission.reward.croc || 0)
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

  // 📅 RECOMPENSA DIARIA - VERSIÓN SIMPLIFICADA
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

  // 🔄 VERIFICAR DISPONIBILIDAD DE RECOMPENSA DIARIA
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

    // Verificar cada minuto
    const interval = setInterval(checkDailyReward, 60000);

    return () => clearInterval(interval);
  }, [dailyRewards, updateDailyRewards]);

  // 🛍️ TIENDA - VERSIÓN SIMPLIFICADA Y FUNCIONAL
  const buyShopItem = useCallback(async (itemId, useCroc = false, discount = 0) => {
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
      return false;
    }

    // 🔍 Verificar si ya es dueño (para items no consumibles)
    const isAlreadyOwned = ownedItems.some(owned => {
      if (typeof owned === 'string') return owned === itemId;
      if (typeof owned === 'object') return owned.id === itemId;
      return false;
    });

    if (isAlreadyOwned && item.type !== 'consumable' && item.type !== 'boost') {
      toast({
        title: "🚫 Ya Posees Este Ítem",
        description: `Ya tienes "${item.name}".`,
        duration: 2000
      });
      playSound('error');
      return false;
    }

    // 🎨 Verificar si la skin ya está activa
    if (item.type === 'skin' && activeSkin === itemId) {
      toast({
        title: "🎨 Skin ya Activa",
        description: `La skin "${item.name}" ya está en uso.`,
        duration: 2000
      });
      playSound('uiClick');
      return false;
    }

    // 💰 Calcular precio
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
      return false;
    }

    try {
      console.log(`✅ Compra aprobada: ${item.name} por ${finalPrice} ${currencyName} (descuento: ${discount}%)`);

      // 🎯 CALCULAR CAMBIOS BÁSICOS
      const updates = {
        coins: useCroc ? gameState.coins : gameState.coins - finalPrice,
        nativeTokenBalance: useCroc ? gameState.nativeTokenBalance - finalPrice : gameState.nativeTokenBalance,
        totalCoins: gameState.totalCoins,
        energy: gameState.energy,
        coinsPerSecond: gameState.coinsPerSecond,
        experience: gameState.experience
      };

      // 🎁 MANEJAR EFECTOS ESPECÍFICOS DEL ITEM
      let newOwnedItems = [...ownedItems];
      let newActiveSkin = activeSkin;

      switch (item.type) {
        case 'skin':
          newActiveSkin = itemId;
          if (!newOwnedItems.includes(itemId)) {
            newOwnedItems.push(itemId);
          }
          break;

        case 'item':
        case 'boost':
          if (!newOwnedItems.includes(itemId)) {
            newOwnedItems.push(itemId);
          }

          // Aplicar efectos inmediatos
          // NOTA: cpsBoost y autoClicks se calculan dinámicamente en useEffect,
          // por lo que NO debemos sumarlos al estado base 'coinsPerSecond' para evitar doble conteo.
          /* 
          if (item.effect?.autoClicks) {
            updates.coinsPerSecond = gameState.coinsPerSecond + item.effect.autoClicks;
          }
          if (item.effect?.cpsBoost) {
            updates.coinsPerSecond = gameState.coinsPerSecond + item.effect.cpsBoost;
          }
          */

          if (item.effect?.maxEnergy) {
            updates.maxEnergy = gameState.maxEnergy + item.effect.maxEnergy;
            updates.energy = updates.maxEnergy;
          }
          break;

        case 'consumable':
          // Para consumibles, no los agregamos a ownedItems permanentemente
          // Solo aplicamos el efecto inmediato
          if (item.effect?.energy) {
            updates.energy = Math.min(gameState.maxEnergy, gameState.energy + item.effect.energy);
          }
          if (item.effect?.coins) {
            updates.coins += item.effect.coins;
            updates.totalCoins += item.effect.coins;
          }
          if (item.effect?.crocTokens) {
            updates.nativeTokenBalance += item.effect.crocTokens;
          }
          if (item.effect?.experience) {
            updates.experience += item.effect.experience;
          }
          break;

        default:
          console.warn('⚠️ Tipo de item desconocido:', item.type);
          break;
      }

      // 📦 APLICAR ACTUALIZACIONES
      updateGameState(updates);

      if (item.type === 'skin') {
        updateActiveSkin(newActiveSkin);
      }

      // Solo actualizar ownedItems para items no consumibles
      if (item.type !== 'consumable') {
        updateOwnedItems(newOwnedItems);
      }

      // 🏆 VERIFICAR LOGROS
      if (item.type === 'skin') {
        const ownedSkins = newOwnedItems.filter(id => {
          const it = SHOP_ITEMS.find(s => s.id === id);
          return it && it.type === 'skin';
        }).length;

        if (ownedSkins >= 3 && !achievementsUnlocked.includes('skin_collector_1')) {
          const newAchievements = [...achievementsUnlocked, 'skin_collector_1'];
          updateAchievementsUnlocked(newAchievements);

          toast({
            title: "🏆 Logro Desbloqueado!",
            description: "¡Coleccionista de Skins Nivel 1!",
            duration: 5000,
          });
        }
      }

      // 💾 PREPARAR DATOS PARA SINCRONIZACIÓN
      const syncData = {
        coins: updates.coins,
        native_token_balance: updates.nativeTokenBalance,
        owned_items: item.type !== 'consumable' ? newOwnedItems : ownedItems,
        active_skin: item.type === 'skin' ? itemId : activeSkin,
        energy: updates.energy,
        coins_per_second: updates.coinsPerSecond,
        total_coins: updates.totalCoins,
        experience: updates.experience,
        max_energy: updates.maxEnergy || gameState.maxEnergy
      };

      // 📤 SINCRONIZAR CON SUPABASE
      await syncGameData(syncData);

      // 🎉 NOTIFICACIONES
      let title = "✅ Compra Exitosa!";
      let description = `Has adquirido "${item.name}" por ${finalPrice} ${currencyName}`;

      if (item.type === 'skin') {
        title = "🎨 ¡Skin Equipada!";
        description = `¡Ahora usas "${item.name}"!`;
      } else if (item.type === 'consumable') {
        title = "⚡ Consumible Activado";
      }

      if (discount > 0) {
        description += ` (${discount}% descuento)`;
      }

      toast({
        title,
        description,
        duration: 4000
      });

      // 🔊 SONIDO
      if (item.type === 'skin') playSound('equip');
      else if (item.type === 'consumable') playSound('powerUp');
      else playSound('buy');

      console.log('✅ Compra completada exitosamente');

      return true;

    } catch (error) {
      console.error('❌ Error en la compra:', error);
      toast({
        title: "❌ Error en la compra",
        description: "No se pudo completar la transacción. Intenta nuevamente.",
        duration: 3000,
      });
      playSound('error');
      return false;
    }
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

  // 🎨 FUNCIÓN PARA EQUIPAR SKIN (separada de buyShopItem)
  const equipSkin = useCallback((skinId) => {
    const skin = SHOP_ITEMS.find(i => i.id === skinId);
    if (!skin) {
      toast({
        title: "❌ Skin no encontrada",
        description: "Esta skin no existe.",
        duration: 2000,
      });
      playSound('error');
      return;
    }

    // Verificar si el usuario posee la skin
    const ownsSkin = ownedItems.includes(skinId);
    if (!ownsSkin) {
      toast({
        title: "❌ No posees esta skin",
        description: "Debes comprar la skin antes de equiparla.",
        duration: 3000,
      });
      playSound('error');
      return;
    }

    // Equipar la skin
    updateActiveSkin(skinId);

    toast({
      title: "🎨 Skin Equipada",
      description: `¡Ahora usas "${skin.name}"!`,
      duration: 3000,
    });

    playSound('equip');

    // Sincronizar con BD
    syncGameData({
      active_skin: skinId
    });
  }, [ownedItems, updateActiveSkin, toast, playSound, syncGameData]);

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
    equipSkin, // 🔥 NUEVA FUNCIÓN PARA EQUIPAR SKINS
    resetProgress,
    claimFarmingMilestone,
    calculateRealClickPower,

    // 🎯 FUNCIONES DE SINCRONIZACIÓN
    syncAllData: syncGameData,
  };
}