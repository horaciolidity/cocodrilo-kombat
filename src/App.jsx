import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/components/ui/use-toast';

import { GameView } from '@/components/GameView';
import { StatsView } from '@/components/StatsView';
import { SettingsView } from '@/components/SettingsView';
import { WalletView } from '@/components/WalletView';
import { MissionsView } from '@/components/MissionsView';
import { RankingView } from '@/components/RankingView';
import { CardsView } from '@/components/CardsView';
import { ShopView } from '@/components/ShopView';
import { FairlaunchView } from '@/components/FairlaunchView';
import { WhitepaperView } from '@/components/WhitepaperView';
import { FarmingMilestonesView } from '@/components/FarmingMilestonesView';

import { AuthModal } from '@/components/AuthModal';
import { TutorialModal } from '@/components/TutorialModal';
import { SocialLinks } from '@/components/SocialLinks';
import { MilestoneReachedModal } from '@/components/MilestoneReachedModal';

import { useGameLogic } from '@/hooks/useGameLogic';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useSound } from '@/hooks/useSound';

import {
  Home, BarChart3, Settings, Wallet, ListChecks, Award, Layers, ShoppingCart, Rocket, FileText, Target as TargetIcon
} from 'lucide-react';

import {
  INITIAL_GAME_STATE,
  INITIAL_UPGRADES_STATE,
  INITIAL_MISSIONS_STATE,
  SOCIAL_LINKS_DATA,
  TUTORIAL_STEPS_CONTENT,
  FARMING_MILESTONES
} from '@/config/gameConfig';

function App() {
  const { toast } = useToast();
  const { playSound } = useSound();

  const [user, setUser] = useLocalStorage('cocodriloKombatUser', null);
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState('game');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [lastReachedMilestone, setLastReachedMilestone] = useState(null);

  const {
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
  } = useGameLogic(
    INITIAL_GAME_STATE,
    INITIAL_UPGRADES_STATE,
    INITIAL_MISSIONS_STATE,
    toast,
    playSound,
    setShowMilestoneModal,
    setLastReachedMilestone
  );

  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem('cocodriloKombatPlayed');
    if (!hasPlayedBefore) {
      setShowTutorial(true);
      localStorage.setItem('cocodriloKombatPlayed', 'true');
    }
  }, []);

  // 🪙 Detectar ingreso por link de referido
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref');

  if (ref && ref !== gameState.playerId) {
    const refs = JSON.parse(localStorage.getItem('cocodriloKombatRefs') || '{}');
    if (!refs[ref]) {
      refs[ref] = true;
      localStorage.setItem('cocodriloKombatRefs', JSON.stringify(refs));

      // 💎 Recompensa al referidor
      const players = JSON.parse(localStorage.getItem('cocodriloKombatPlayers') || '{}');
      const refData = players[ref] || {};
      refData.referralsCount = (refData.referralsCount || 0) + 1;
      refData.crocFromRefs = (refData.crocFromRefs || 0) + 10;
      refData.coinsFromRefs = (refData.coinsFromRefs || 0) + 500;
      refData.nativeTokenBalance = (refData.nativeTokenBalance || 0) + 10;
      refData.coins = (refData.coins || 0) + 500;
      players[ref] = refData;
      localStorage.setItem('cocodriloKombatPlayers', JSON.stringify(players));

      toast({
        title: '🐊 Nuevo referido!',
        description: '¡Ganaste +10 CROC y +500 monedas!',
        duration: 3000,
      });
      playSound('reward');
    }
  }
}, [gameState.playerId]);


  const logout = useCallback(() => {
    setUser(null);
    toast({
      title: '👋 Hasta luego',
      description: 'Sesión cerrada correctamente',
      duration: 2000,
    });
    playSound('logout');
  }, [setUser, toast, playSound]);

  const nextTutorialStep = useCallback(() => {
    if (tutorialStep < TUTORIAL_STEPS_CONTENT.length - 1) {
      setTutorialStep((prev) => prev + 1);
    } else {
      setShowTutorial(false);
      setTutorialStep(0);
    }
    playSound('uiClick');
  }, [tutorialStep, playSound]);

  const skipTutorial = useCallback(() => {
    setShowTutorial(false);
    setTutorialStep(0);
    playSound('uiClick');
  }, [playSound]);

  const handleNavigation = (view) => {
    setCurrentView(view);
    playSound('uiClick');
  };

  const navigationItems = [
    { view: 'game', label: 'Juego', icon: Home },
    { view: 'missions', label: 'Misiones', icon: ListChecks },
    { view: 'farming_milestones', label: 'Hitos', icon: TargetIcon },
    { view: 'cards', label: 'Cartas', icon: Layers },
    { view: 'shop', label: 'Tienda', icon: ShoppingCart },
    { view: 'ranking', label: 'Ranking', icon: Award },
    { view: 'fairlaunch', label: 'Fairlaunch', icon: Rocket },
    { view: 'whitepaper', label: 'Docs', icon: FileText },
    { view: 'wallet', label: 'Wallet', icon: Wallet },
    { view: 'stats', label: 'Stats', icon: BarChart3 },
    { view: 'settings', label: 'Config', icon: Settings },
  ];

  // ✅ fallback seguro si gameState o arrays aún no se cargan
  const safeCoins = gameState?.coins ?? 0;
  const safeOwnedItems = Array.isArray(ownedItems) ? ownedItems : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Barra superior */}
      <nav className="bg-card/50 backdrop-blur-lg border-b border-border p-2 md:p-4 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">
            🐊 Cocodrilo Kombat
          </h1>
          <div className="flex items-center space-x-0.5 md:space-x-1 overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => (
              <Button
                key={item.view}
                onClick={() => handleNavigation(item.view)}
                variant={currentView === item.view ? 'default' : 'ghost'}
                size="sm"
                className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0"
              >
                <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 md:mr-1" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* Contenido dinámico seguro */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="pb-16 will-change-transform"
        >
          <React.Suspense fallback={<div className="text-center p-10">Cargando...</div>}>
            {currentView === 'game' && (
              <GameView
                gameState={gameState}
                upgrades={upgrades}
                buyUpgrade={buyUpgrade}
                handleClick={handleClick}
                clickEffect={clickEffect}
                floatingNumbers={floatingNumbers}
                dailyRewards={dailyRewards}
                claimDailyReward={claimDailyReward}
                tutorialStep={tutorialStep}
                showTutorial={showTutorial}
                activeSkin={activeSkin}
                toast={toast}
              />
            )}







            {currentView === 'missions' && (
              <MissionsView
                missions={missions}
                completeMission={completeMission}
                claimMissionReward={claimMissionReward}
                gameState={gameState}
                upgrades={upgrades}
                toast={toast}
                playSound={playSound}
              />
            )}

            {currentView === 'farming_milestones' && (
              <FarmingMilestonesView
                gameState={gameState}
                farmingMilestonesState={farmingMilestonesState}
                claimFarmingMilestone={claimFarmingMilestone}
              />
            )}

            {currentView === 'cards' && <CardsView ownedCards={ownedCards} />}

            {currentView === 'shop' && (
              <ShopView
                buyShopItem={buyShopItem}
                coins={safeCoins}
                ownedItems={safeOwnedItems}
                activeSkin={activeSkin}
              />
            )}

            {currentView === 'ranking' && (
              <RankingView user={user} gameState={gameState} />
            )}

            {currentView === 'fairlaunch' && <FairlaunchView toast={toast} />}

            {currentView === 'whitepaper' && <WhitepaperView />}

            {currentView === 'wallet' && (
              <WalletView toast={toast} playSound={playSound} />
            )}

            {currentView === 'stats' && (
              <StatsView
                gameState={gameState}
                upgrades={upgrades}
                achievementsUnlocked={achievementsUnlocked}
                ownedCardsCount={ownedCards.length}
                ownedItemsCount={ownedItems.length}
                farmingMilestonesCount={
                  Object.values(farmingMilestonesState).filter((m) => m.claimed).length
                }
              />
            )}

            {currentView === 'settings' && (
              <SettingsView
                user={user}
                logout={logout}
                setShowAuth={setShowAuth}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                setShowTutorial={setShowTutorial}
                resetProgress={resetProgress}
                playSound={playSound}
              />
            )}
          </React.Suspense>
        </motion.div>
      </AnimatePresence>

      {/* Modales */}
      <AuthModal
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        setUser={setUser}
        toast={toast}
        playSound={playSound}
      />
      <TutorialModal
        showTutorial={showTutorial}
        tutorialStep={tutorialStep}
        nextTutorialStep={nextTutorialStep}
        skipTutorial={skipTutorial}
      />
      <MilestoneReachedModal
        isOpen={showMilestoneModal}
        onClose={() => {
          setShowMilestoneModal(false);
          playSound('uiClose');
        }}
        milestone={lastReachedMilestone}
      />

      {/* Footer no bloqueante */}
      <footer className="relative bg-card/80 backdrop-blur-md border-t border-border p-3 mt-16 z-10">
        <SocialLinks links={SOCIAL_LINKS_DATA} playSound={playSound} toast={toast} />
      </footer>

      <Toaster />
    </div>
  );
}

export default App;
