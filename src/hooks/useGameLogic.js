
import { useState, useEffect, useCallback } from 'react';
import { UPGRADES, ACHIEVEMENTS, MISSIONS, CARDS_DATA, SHOP_ITEMS, FARMING_MILESTONES, INITIAL_GAME_STATE as DEFAULT_INITIAL_GAME_STATE, INITIAL_UPGRADES_STATE as DEFAULT_INITIAL_UPGRADES_STATE, INITIAL_MISSIONS_STATE as DEFAULT_INITIAL_MISSIONS_STATE, INITIAL_FARMING_MILESTONES_STATE } from '@/config/gameConfig';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export function useGameLogic(initialGameStateOverrides, initialUpgradesOverrides, initialMissionsOverrides, toast, playSound, setShowMilestoneModal, setLastReachedMilestone) {
  const INITIAL_GAME_STATE = { ...DEFAULT_INITIAL_GAME_STATE, ...initialGameStateOverrides };
  const INITIAL_UPGRADES_STATE = { ...DEFAULT_INITIAL_UPGRADES_STATE, ...initialUpgradesOverrides };
  const INITIAL_MISSIONS_STATE = { ...DEFAULT_INITIAL_MISSIONS_STATE, ...initialMissionsOverrides };

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

  useEffect(() => {
    loadGameState();
    loadUpgrades();
    loadMissions();
    loadOwnedCards();
    loadOwnedItems();
    loadActiveSkin();
    loadAchievementsUnlocked();
    loadDailyRewards();
    loadSoundEnabled();
    loadFarmingMilestonesState();
  }, []);

  useEffect(() => {
    let effectiveCoinsPerSecond = gameState.coinsPerSecond;
    ownedItems.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
      if (item && item.effect.type === 'cps_boost') {
        effectiveCoinsPerSecond += item.effect.value;
      }
    });
    ownedCards.forEach(cardId => {
      const card = CARDS_DATA.find(c => c.id === cardId);
      if (card && card.effect.type === 'cps_boost_percent') {
        effectiveCoinsPerSecond *= (1 + card.effect.value / 100);
      }
    });

    if (effectiveCoinsPerSecond > 0) {
      const interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          coins: prev.coins + effectiveCoinsPerSecond,
          totalCoins: prev.totalCoins + effectiveCoinsPerSecond
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.coinsPerSecond, ownedItems, ownedCards, setGameState]);

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

  const handleClick = useCallback((event) => {
    if (gameState.energy <= 0) {
      toast({ title: "⚡ Sin Energía", description: "Espera a que se recargue tu energía", duration: 2000 });
      playSound('error');
      return;
    }
    playSound('click');

    let currentClickPower = gameState.clickPower;
    ownedItems.forEach(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId || (typeof i === 'object' && i.id === itemId));
      if (item && item.effect.type === 'click_boost') {
        currentClickPower += item.effect.value;
      }
    });
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
    setGameState(prev => ({
      ...prev,
      coins: prev.coins + coinsEarned,
      totalCoins: prev.totalCoins + coinsEarned,
      totalClicks: prev.totalClicks + 1,
      energy: Math.max(0, prev.energy - 1),
      experience: prev.experience + 1
    }));

    setClickEffect(true);
    setTimeout(() => setClickEffect(false), 300);

    if (event && event.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = Date.now() + Math.random();
      setFloatingNumbers(prev => [...prev, { id, x, y, value: coinsEarned }]);
      setTimeout(() => setFloatingNumbers(prev => prev.filter(num => num.id !== id)), 1000);
    }

    const newLevel = Math.floor(gameState.experience / 100) + 1;
    if (newLevel > gameState.level) {
      setGameState(prev => ({ ...prev, level: newLevel }));
      toast({ title: "🎉 ¡Nivel Subido!", description: `¡Ahora eres nivel ${newLevel}!`, duration: 3000 });
      playSound('levelUp');
    }
  }, [gameState.clickPower, gameState.energy, gameState.experience, gameState.level, ownedItems, ownedCards, toast, playSound, setGameState]);

  useEffect(() => {
    let energyRegenRate = 2000; 
    ownedCards.forEach(cardId => {
        const card = CARDS_DATA.find(c => c.id === cardId);
        if (card && card.effect.type === 'energy_regen_boost_percent') {
            energyRegenRate /= (1 + card.effect.value / 100);
        }
    });

    if (gameState.energy < gameState.maxEnergy) {
      const interval = setInterval(() => {
        setGameState(prev => ({ ...prev, energy: Math.min(prev.maxEnergy, prev.energy + 1) }));
      }, energyRegenRate);
      return () => clearInterval(interval);
    }
  }, [gameState.energy, gameState.maxEnergy, ownedCards, setGameState]);

  const buyUpgrade = useCallback((upgradeId) => {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    const currentLevel = upgrades[upgradeId].level;
    const price = Math.floor(upgrade.basePrice * Math.pow(1.5, currentLevel));

    if (gameState.coins >= price) {
      setGameState(prev => {
        const newState = { ...prev, coins: prev.coins - price };
        if (upgrade.type === 'click') {
          newState.clickPower = prev.clickPower + upgrade.basePower;
        } else if (upgrade.type === 'cps') {
          newState.coinsPerSecond = prev.coinsPerSecond + upgrade.basePower;
        } else if (upgrade.type === 'multiplier') {
           newState.clickPower = Math.floor(prev.clickPower * upgrade.basePower);
        }
        return newState;
      });
      setUpgrades(prev => ({ ...prev, [upgradeId]: { level: prev[upgradeId].level + 1, owned: prev[upgradeId].owned + 1 } }));
      toast({ title: "✅ Mejora Comprada", description: `${upgrade.name} nivel ${currentLevel + 1}`, duration: 2000 });
      playSound('upgrade');
    } else {
      toast({ title: "💰 Monedas Insuficientes", description: `Necesitas ${price - gameState.coins} monedas más`, duration: 2000 });
      playSound('error');
    }
  }, [gameState.coins, upgrades, toast, playSound, setGameState, setUpgrades]);

  const completeMission = useCallback((missionId, isSocial = false) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || missions[missionId].completed) return;

    let canComplete = false;
    if (isSocial) {
        setMissions(prev => ({ ...prev, [missionId]: { ...prev[missionId], progress: (prev[missionId]?.progress || 0) + 1 } }));
        canComplete = (missions[missionId]?.progress || 0) + 1 >= mission.requirement.value;
    } else {
        switch(mission.requirement.type) {
          case 'clicks': canComplete = gameState.totalClicks >= mission.requirement.value; break;
          case 'coins': canComplete = gameState.totalCoins >= mission.requirement.value; break;
          case 'level': canComplete = gameState.level >= mission.requirement.value; break;
          case 'upgradeLevel': 
            const targetUpgrade = upgrades[mission.requirement.upgradeId];
            canComplete = targetUpgrade && targetUpgrade.level >= mission.requirement.value;
            break;
          default: break;
        }
    }
    

    if (canComplete) {
      setMissions(prev => ({ ...prev, [missionId]: { ...prev[missionId], completed: true, claimed: false } }));
      toast({ title: "🎯 Misión Cumplida", description: `¡Has completado "${mission.name}"! Reclama tu recompensa.`, duration: 3000 });
      playSound('missionComplete');
    } else if (!isSocial) {
      toast({ title: "⏳ Misión Incompleta", description: `Aún no cumples los requisitos para "${mission.name}".`, duration: 2000 });
      playSound('uiClick');
    }
  }, [gameState, missions, upgrades, toast, playSound, setMissions]);
  
  const claimMissionReward = useCallback((missionId) => {
    const mission = MISSIONS.find(m => m.id === missionId);
    if (!mission || !missions[missionId].completed || missions[missionId].claimed) return;

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
            toast({ title: "🃏 Carta Obtenida!", description: `¡Recibiste la carta "${card.name}"!`, duration: 3000 });
            playSound('cardGet');
        }
    }

    setMissions(prev => ({ ...prev, [missionId]: { ...prev[missionId], claimed: true } }));
    toast({ title: "🎁 Recompensa Reclamada", description: `+${mission.reward.coins} monedas por "${mission.name}"`, duration: 3000 });
    playSound('reward');
  }, [missions, ownedCards, toast, playSound, setGameState, setOwnedCards, setMissions]);

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
      setGameState(prev => ({ ...prev, coins: prev.coins + reward, totalCoins: prev.totalCoins + reward }));
      setDailyRewards({ lastClaim: now.toISOString(), streak: newStreak, available: false });
      toast({ title: "🎁 ¡Recompensa Diaria!", description: `+${reward} monedas (Racha: ${newStreak} días)`, duration: 3000 });
      playSound('reward');
    } else {
       toast({ title: "🤔 Ya Reclamaste Hoy", description: "Vuelve mañana para tu próxima recompensa.", duration: 2000 });
       playSound('uiClick');
    }
  }, [dailyRewards, toast, playSound, setGameState, setDailyRewards]);

  useEffect(() => {
    const now = new Date();
    const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;
    if (!lastClaimDate || now.toDateString() !== lastClaimDate.toDateString()) {
      setDailyRewards(prev => ({ ...prev, available: true }));
    } else {
      setDailyRewards(prev => ({ ...prev, available: false }));
    }
  }, [dailyRewards.lastClaim, setDailyRewards]);
  
  const buyShopItem = useCallback((itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const isAlreadyOwnedNonConsumable = ownedItems.some(owned => (typeof owned === 'string' && owned === itemId) || (typeof owned === 'object' && owned.id === itemId && owned.type !== 'consumable'));

    if (isAlreadyOwnedNonConsumable && item.type !== 'consumable') {
        toast({ title: "🚫 Ya Posees Este Ítem", description: `Ya tienes "${item.name}".`, duration: 2000 });
        playSound('error');
        return;
    }
    
    if (item.type === 'skin' && activeSkin === itemId) {
        toast({ title: "🎨 Skin ya Activa", description: `La skin "${item.name}" ya está en uso.`, duration: 2000 });
        playSound('uiClick');
        return;
    }

    if (gameState.coins >= item.price) {
        setGameState(prev => ({ ...prev, coins: prev.coins - item.price }));
        if (item.type === 'skin') {
            setActiveSkin(itemId);
            if (!ownedItems.some(owned => (typeof owned === 'string' && owned === itemId) || (typeof owned === 'object' && owned.id === itemId))) {
              setOwnedItems(prev => [...prev, itemId]);
            }
            toast({ title: "🎨 Skin Aplicada", description: `¡Ahora usas la skin "${item.name}"!`, duration: 3000 });
            playSound('equip');
        } else {
            setOwnedItems(prev => {
                if (item.type === 'consumable') {
                    const existingItemIndex = prev.findIndex(i => typeof i === 'object' && i.id === itemId);
                    if (existingItemIndex > -1) {
                        const updatedItems = [...prev];
                        updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], quantity: (updatedItems[existingItemIndex].quantity || 0) + 1 };
                        return updatedItems;
                    } else {
                        return [...prev, { ...item, quantity: 1 }];
                    }
                } else {
                     if (!prev.some(owned => (typeof owned === 'string' && owned === itemId) || (typeof owned === 'object' && owned.id === itemId))) {
                        return [...prev, itemId];
                     }
                     return prev;
                }
            });
            toast({ title: "🛍️ Ítem Comprado", description: `¡Has comprado "${item.name}"!`, duration: 3000 });
            playSound('buy');
            if (item.type === 'consumable' && item.effect.type === 'energy_fill') {
                setGameState(prev => ({...prev, energy: Math.min(prev.maxEnergy, prev.energy + item.effect.value)}));
                toast({ title: "⚡ Energía Restaurada", description: `+${item.effect.value} de energía.`, duration: 2000 });
                playSound('powerUp');
            }
        }
    } else {
        toast({ title: "💰 Monedas Insuficientes", description: `Necesitas ${item.price - gameState.coins} monedas más para "${item.name}".`, duration: 2000 });
        playSound('error');
    }
  }, [gameState.coins, ownedItems, activeSkin, toast, playSound, setGameState, setActiveSkin, setOwnedItems]);

  const claimFarmingMilestone = useCallback((milestoneId) => {
    const milestone = FARMING_MILESTONES.find(m => m.id === milestoneId);
    if (!milestone || farmingMilestonesState[milestoneId].claimed) return;

    if (gameState.totalCoins >= milestone.coinsRequired) {
      setGameState(prev => ({
        ...prev,
        nativeTokenBalance: prev.nativeTokenBalance + milestone.tokenReward
      }));
      setFarmingMilestonesState(prev => ({
        ...prev,
        [milestoneId]: { claimed: true }
      }));
      toast({ title: "🏆 Hito de Farmeo Reclamado!", description: `¡Has ganado ${milestone.tokenReward} CROC por "${milestone.name}"!`, duration: 4000 });
      playSound('milestone');
      setLastReachedMilestone(milestone);
      setShowMilestoneModal(true);
    } else {
      toast({ title: "⏳ Requisito No Cumplido", description: `Necesitas ${milestone.coinsRequired.toLocaleString()} monedas totales para reclamar este hito.`, duration: 3000 });
      playSound('uiClick');
    }
  }, [gameState.totalCoins, farmingMilestonesState, toast, playSound, setGameState, setFarmingMilestonesState, setShowMilestoneModal, setLastReachedMilestone]);

  useEffect(() => {
    FARMING_MILESTONES.forEach(milestone => {
      if (gameState.totalCoins >= milestone.coinsRequired && !farmingMilestonesState[milestone.id]?.claimed && !farmingMilestonesState[milestone.id]?.notified) {
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
    toast({ title: "🔄 Progreso Reiniciado", description: "¡Comienza una nueva aventura!", duration: 3000 });
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
