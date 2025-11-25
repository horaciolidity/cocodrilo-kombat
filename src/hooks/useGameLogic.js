import { useState, useEffect, useCallback, useRef } from 'react';
import { UPGRADES, ACHIEVEMENTS, MISSIONS, CARDS_DATA, SHOP_ITEMS, FARMING_MILESTONES, INITIAL_GAME_STATE as DEFAULT_INITIAL_GAME_STATE, INITIAL_UPGRADES_STATE as DEFAULT_INITIAL_UPGRADES_STATE, INITIAL_MISSIONS_STATE as DEFAULT_INITIAL_MISSIONS_STATE, INITIAL_FARMING_MILESTONES_STATE } from '@/config/gameConfig';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSupabasePlayer } from './useSupabasePlayer';

export function useGameLogic(initialGameStateOverrides, initialUpgradesOverrides, initialMissionsOverrides, toast, playSound, setShowMilestoneModal, setLastReachedMilestone, user) {
  const INITIAL_GAME_STATE = { ...DEFAULT_INITIAL_GAME_STATE, ...initialGameStateOverrides };
  const INITIAL_UPGRADES_STATE = { ...DEFAULT_INITIAL_UPGRADES_STATE, ...initialUpgradesOverrides };
  const INITIAL_MISSIONS_STATE = { ...DEFAULT_INITIAL_MISSIONS_STATE, ...initialMissionsOverrides };

  // 🔄 Integración con Supabase
  const { 
    stats: supabaseStats, 
    updateGameStats, 
    loading: supabaseLoading,
    player: supabasePlayer
  } = useSupabasePlayer(user);

  const [gameState, setGameState, loadGameState] = useLocalStorage('cocodriloKombatGameState', INITIAL_GAME_STATE);
  const [upgrades, setUpgrades, loadUpgrades] = useLocalStorage('cocodriloKombatUpgrades', INITIAL_UPGRADES_STATE);
  const [missions, setMissions, loadMissions] = useLocalStorage('cocodriloKombatMissions', INITIAL_MISSIONS_STATE);
  const [ownedCards, setOwnedCards, loadOwnedCards] = useLocalStorage('cocodriloKombatOwnedCards', []);
  const [ownedItems, setOwnedItems, loadOwnedItems] = useLocalStorage('cocodriloKombatOwnedItems', []);
  const [activeSkin, setActiveSkin, loadActiveSkin] = useLocalStorage('cocodriloKombatActiveSkin', null);
  const [achievementsUnlocked, setAchievementsUnlocked, loadAchievementsUnlocked] = useLocalStorage('cocodriloKombatAchievements', []);
  const [dailyRewards, setDailyRewards, loadDailyRewards] = useLocalStorage('cocodriloKombatDailyRewards', { lastClaim: null, streak: 0, available: true });
  const [soundEnabled, setSoundEnabled, loadSoundEnabled] = useLocalStorage('cocodriloKombatSoundEnabled', true);
  const [farmingMilestonesState, setFarmingMilestonesState, loadFarmingMilestonesState] = useLocalStorage('cocodriloKombatFarmingMilestones', INITIAL_FARMING_MILESTONES_STATE);
  
  const [floatingNumbers, setFloatingNumbers] = useState([]);
  const [clickEffect, setClickEffect] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 🚀 Carga inicial agrupada
  useEffect(() => {
    const loadAllData = async () => {
      try {
        await Promise.allSettled([
          loadGameState(),
          loadUpgrades(),
          loadMissions(),
          loadOwnedCards(),
          loadOwnedItems(),
          loadActiveSkin(),
          loadAchievementsUnlocked(),
          loadDailyRewards(),
          loadSoundEnabled(),
          loadFarmingMilestonesState(),
        ]);
      } catch (error) {
        console.error("Error loading game data:", error);
      }
    };
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 📥 Cargar datos de Supabase al inicializar - CORREGIDO
  useEffect(() => {
    if (supabaseStats && !supabaseLoading && isInitialLoad) {
      console.log("🔄 Cargando datos de Supabase:", supabaseStats);
      
      // ✅ VERIFICAR Y CORREGIR ENERGÍA SI ES NECESARIO
      const currentEnergy = Number(supabaseStats.energy);
      const maxEnergy = Number(supabaseStats.max_energy) || DEFAULT_INITIAL_GAME_STATE.maxEnergy;
      
      setGameState(prev => ({
        ...prev,
        coins: Number(supabaseStats.coins) || prev.coins,
        level: Number(supabaseStats.level) || prev.level,
        totalClicks: Number(supabaseStats.clicks) || prev.totalClicks,
        energy: currentEnergy > 0 ? currentEnergy : maxEnergy, // ✅ Si energía es 0, llenarla
        maxEnergy: maxEnergy,
        clickPower: Number(supabaseStats.click_power) || prev.clickPower,
        coinsPerSecond: Number(supabaseStats.coins_per_second) || prev.coinsPerSecond,
        experience: Number(supabaseStats.experience) || prev.experience,
        totalCoins: Number(supabaseStats.total_coins) || prev.totalCoins,
        nativeTokenBalance: Number(supabaseStats.native_token_balance) || prev.nativeTokenBalance
      }));
      
      setIsInitialLoad(false);
    }
  }, [supabaseStats, supabaseLoading, isInitialLoad, setGameState]);

  // 📤 Sincronizar con Supabase cuando cambie el gameState
  useEffect(() => {
    if (!isInitialLoad && !supabaseLoading && user) {
      const syncTimeout = setTimeout(() => {
        console.log("📤 Sincronizando con Supabase:", gameState);
        updateGameStats(gameState);
      }, 2000);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [gameState, user, supabaseLoading, isInitialLoad, updateGameStats]);

  // ⚡ REGENERACIÓN DE ENERGÍA CORREGIDA - CON LOGS PARA DEBUG
  useEffect(() => {
    console.log("⚡ Iniciando regeneración de energía...");
    
    const energyInterval = setInterval(() => {
      setGameState(prev => {
        // Solo regenerar si la energía no está al máximo
        if (prev.energy < prev.maxEnergy) {
          const newEnergy = Math.min(prev.maxEnergy, prev.energy + 1);
          console.log(`⚡ Regenerando energía: ${prev.energy} -> ${newEnergy}`);
          return {
            ...prev,
            energy: newEnergy
          };
        }
        return prev;
      });
    }, 3000); // Regenera 1 de energía cada 3 segundos

    return () => {
      console.log("⚡ Limpiando intervalo de energía");
      clearInterval(energyInterval);
    };
  }, [setGameState]);

  // 💰 GENERACIÓN AUTOMÁTICA DE MONEDAS - Intervalo separado para coinsPerSecond
  useEffect(() => {
    const coinsInterval = setInterval(() => {
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
          const increment = effectiveCPS * (1); // Cada segundo
          return {
            ...prev,
            coins: prev.coins + increment,
            totalCoins: prev.totalCoins + increment
          };
        }
        return prev;
      });
    }, 1000); // Genera coins cada segundo

    return () => clearInterval(coinsInterval);
  }, [ownedItems, ownedCards, setGameState]);

  // 🏆 Sistema de logros
  useEffect(() => {
    ACHIEVEMENTS.forEach(achievement => {
      if (!achievementsUnlocked.includes(achievement.id)) {
        let currentValue = 0;
        switch (achievement.type) {
          case 'clicks': currentValue = gameState.totalClicks; break;
          case 'totalCoins': currentValue = gameState.totalCoins; break;
          case 'upgrades': currentValue = Object.values(upgrades).reduce((sum, upg) => sum + upg.owned, 0); break;
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
  }, [gameState, upgrades, missions, achievementsUnlocked, ownedCards, ownedItems, farmingMilestonesState, toast, playSound, setAchievementsUnlocked]);

  // 👆 FUNCIÓN DE TAP CORREGIDA - CON MEJOR MANEJO DE ENERGÍA
  const handleClick = useCallback((event) => {
    console.log(`⚡ Energía actual: ${gameState.energy}, Máxima: ${gameState.maxEnergy}`);
    
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

    // Calcular poder de click con todos los boosts
    let currentClickPower = gameState.clickPower;
    
    // Boosts de items
    ownedItems.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
      if (item && item.effect.type === 'click_boost') {
        currentClickPower += item.effect.value;
      }
    });

    // Boosts de cartas
    ownedCards.forEach(cardId => {
      const card = CARDS_DATA.find(c => c.id === cardId);
      if (card && card.effect.type === 'click_power_flat') {
        currentClickPower += card.effect.value;
      }
      if (card && card.effect.type === 'click_power_percent') {
        currentClickPower *= (1 + card.effect.value / 100);
      }
    });

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
      
      console.log(`👆 Tap realizado: +${coinsEarned} monedas, Energía: ${prev.energy} -> ${newState.energy}`);
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
    const newLevel = Math.floor((gameState.experience + 1) / 100) + 1;
    if (newLevel > gameState.level) {
      setGameState(prev => ({ ...prev, level: newLevel }));
      toast({ 
        title: "🎉 ¡Nivel Subido!", 
        description: `¡Ahora eres nivel ${newLevel}!`, 
        duration: 3000 
      });
      playSound('levelUp');
    }
  }, [gameState, ownedItems, ownedCards, toast, playSound, setGameState]);

  // 🛒 FUNCIÓN DE COMPRA DE UPGRADES CORREGIDA
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
            newState.energy = newState.maxEnergy; // Llenar energía al comprar upgrade de energía
            break;
          default:
            console.warn('Unknown upgrade type:', upgrade.type);
        }
        
        console.log(`🛒 Upgrade comprado: ${upgrade.name}, Tipo: ${upgrade.type}`);
        return newState;
      });

      // Actualizar nivel del upgrade
      setUpgrades(prev => ({
        ...prev, 
        [upgradeId]: { 
          level: (prev[upgradeId]?.level || 0) + 1, 
          owned: (prev[upgradeId]?.owned || 0) + 1 
        }
      }));

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
  }, [gameState.coins, upgrades, toast, playSound, setGameState, setUpgrades]);

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
  }, [gameState, missions, upgrades, toast, playSound, setMissions]);

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
  }, [missions, ownedCards, toast, playSound, setGameState, setOwnedCards, setMissions]);

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
  }, [dailyRewards, toast, playSound, setGameState, setDailyRewards]);

  // 🔄 Verificar disponibilidad de recompensa diaria
  useEffect(() => {
    const now = new Date();
    const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
    if (!lastClaimDate || now.toDateString() !== lastClaimDate.toDateString()) {
      setDailyRewards(prev => ({ ...prev, available: true }));
    } else {
      setDailyRewards(prev => ({ ...prev, available: false }));
    }
  }, [dailyRewards.lastClaim, setDailyRewards]);

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
  }, [gameState.coins, ownedItems, activeSkin, toast, playSound, setGameState, setActiveSkin, setOwnedItems]);

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
  }, [gameState.totalCoins, farmingMilestonesState, toast, playSound, setGameState, setFarmingMilestonesState, setShowMilestoneModal, setLastReachedMilestone]);

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
  }, [gameState.totalCoins, farmingMilestonesState, toast, playSound, setFarmingMilestonesState]);

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
    setIsInitialLoad(true);
    
    toast({ 
      title: "🔄 Progreso Reiniciado", 
      description: "¡Comienza una nueva aventura!", 
      duration: 3000 
    });
  }, [toast, setGameState, setUpgrades, setMissions, setOwnedCards, setOwnedItems, setActiveSkin, setAchievementsUnlocked, setDailyRewards, setFarmingMilestonesState, INITIAL_GAME_STATE, INITIAL_UPGRADES_STATE, INITIAL_MISSIONS_STATE, INITIAL_FARMING_MILESTONES_STATE]);

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
    supabasePlayer,
    supabaseLoading,
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
  };
}