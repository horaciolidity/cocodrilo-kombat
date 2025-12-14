import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

import { supabase } from "@/lib/supabaseClient";
import { useGameData } from "@/hooks/useGameData";
import { GameView } from "@/components/GameView";
import { StatsView } from "@/components/StatsView";
import { SettingsView } from "@/components/SettingsView";
import { WalletView } from "@/components/WalletView";
import { MissionsView } from "@/components/MissionsView";
import { RankingView } from "@/components/RankingView";
import { CardsView } from "@/components/CardsView";
import { ShopView } from "@/components/ShopView";
import { FairlaunchView } from "@/components/FairlaunchView";
import { WhitepaperView } from "@/components/WhitepaperView";
import { FarmingMilestonesView } from "@/components/FarmingMilestonesView";

import { AuthModal } from "@/components/AuthModal";
import { TutorialModal } from "@/components/TutorialModal";
import { SocialLinks } from "@/components/SocialLinks";
import { MilestoneReachedModal } from "@/components/MilestoneReachedModal";

import { useGameLogic } from "@/hooks/useGameLogic";
import { useSound } from "@/hooks/useSound";
import { useTokenPrice } from '@/hooks/useTokenPrice';

import {
  Home,
  BarChart3,
  Settings,
  Wallet,
  ListChecks,
  Award,
  Layers,
  ShoppingCart,
  Rocket,
  FileText,
  Target as TargetIcon,
} from "lucide-react";

import {
  SOCIAL_LINKS_DATA,
  TUTORIAL_STEPS_CONTENT,
  SHOP_ITEMS,
} from "@/config/gameConfig";

function App() {
  const { toast } = useToast();
  const { playSound } = useSound();

  /* 🔐 Sesión Supabase */
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const tokenPriceHook = useTokenPrice();

  /* 💰 PRECIO GLOBAL CROC - CENTRALIZADO EN SUPABASE */
  const {
    tokenPrice = 0.05,
    setTokenPrice,
    priceHistory = [],
    liquidity = 50000,
    getChartData,
    getPriceStats,
    isLoading: tokenPriceLoading,
    error: tokenPriceError,
    refreshPrice,
    updatePrice
  } = useTokenPrice();
  
  /* 🎮 Estados UI */
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState("game");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [lastReachedMilestone, setLastReachedMilestone] = useState(null);

  // 🔗 Verificar parámetro de referencia en la URL
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  
  if (refCode && !localStorage.getItem('referral_code')) {
    localStorage.setItem('referral_code', refCode);
    console.log('🔗 Código de referencia guardado desde URL:', refCode);
  }
}, []);

  /* 🧩 Escucha sesión Supabase */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  /* 🎯 HOOK CENTRAL DE DATOS */
  const gameData = useGameData(user);

  /* ⚙️ Lógica del juego que usa el hook central */
  const gameLogic = useGameLogic({
    gameData,
    updateGameState: gameData.updateGameState,
    updateUpgrades: gameData.updateUpgrades,
    updateMissions: gameData.updateMissions,
    updateOwnedCards: gameData.updateOwnedCards,
    updateOwnedItems: gameData.updateOwnedItems,
    updateActiveSkin: gameData.updateActiveSkin,
    updateAchievementsUnlocked: gameData.updateAchievementsUnlocked,
    updateDailyRewards: gameData.updateDailyRewards,
    updateFarmingMilestones: gameData.updateFarmingMilestones,
    updateReferralStats: gameData.updateReferralStats,
    syncGameData: gameData.syncGameData,
    toast,
    playSound,
    setShowMilestoneModal,
    setLastReachedMilestone
  });

  // ✅ DESESTRUCTURACIÓN SIMPLIFICADA
  const {
    gameState,
    upgrades,
    missions,
    ownedCards,
    ownedItems,
    activeSkin,
    achievementsUnlocked,
    dailyRewards,
    farmingMilestonesState,
    player,
    referralStats,
    loading,
    error,
    floatingNumbers,
    clickEffect,
    soundEnabled,
    handleClick,
    buyUpgrade,
    completeMission,
    claimMissionReward,
    claimDailyReward,
    buyShopItem,
    resetProgress,
    claimFarmingMilestone,
    calculateRealClickPower,
    setFloatingNumbers,
    setClickEffect,
    setSoundEnabled,
    syncAllData,
  } = gameLogic;

  // ✅ REFRESCAR PRECIO CROC PERIÓDICAMENTE
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshPrice && refreshPrice();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshPrice]);

  // ✅ SINCRONIZACIÓN AL CAMBIAR DE PESTAÑA O CERRAR
  useEffect(() => {
    if (!player?.id) return;

    const handleBeforeUnload = () => {
      console.log("📤 Sincronizando antes de cerrar...");
      syncAllData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log("📤 Sincronizando al cambiar de pestaña...");
        syncAllData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [player?.id, syncAllData]);

  /* 🎓 Tutorial primera vez */
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem("cocodriloKombatPlayed");
    if (!hasPlayedBefore) {
      setShowTutorial(true);
      localStorage.setItem("cocodriloKombatPlayed", "true");
    }
  }, []);

  /* 🚪 Logout */
  const logout = useCallback(async () => {
    syncAllData();
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "👋 Sesión cerrada",
      description: "Tu sesión fue cerrada correctamente",
      duration: 2000,
    });
    playSound("logout");
  }, [syncAllData, toast, playSound]);

  /* 🎓 Tutorial */
  const nextTutorialStep = useCallback(() => {
    setTutorialStep((prev) =>
      prev < TUTORIAL_STEPS_CONTENT.length - 1 ? prev + 1 : 0
    );
    if (tutorialStep >= TUTORIAL_STEPS_CONTENT.length - 1) setShowTutorial(false);
    playSound("uiClick");
  }, [tutorialStep, playSound]);

  const skipTutorial = useCallback(() => {
    setShowTutorial(false);
    setTutorialStep(0);
    playSound("uiClick");
  }, [playSound]);

  /* 🔀 Navegación */
  const handleNavigation = (view) => {
    setCurrentView(view);
    playSound("uiClick");
  };

  const navigationItems = [
    { view: "game", label: "Juego", icon: Home },
    { view: "missions", label: "Misiones", icon: ListChecks },
    { view: "farming_milestones", label: "Hitos", icon: TargetIcon },
    { view: "cards", label: "Cartas", icon: Layers },
    { view: "shop", label: "Tienda", icon: ShoppingCart },
    { view: "ranking", label: "Ranking", icon: Award },
    { view: "fairlaunch", label: "Fairlaunch", icon: Rocket },
    { view: "whitepaper", label: "Docs", icon: FileText },
    { view: "wallet", label: "Wallet", icon: Wallet },
    { view: "stats", label: "Stats", icon: BarChart3 },
    { view: "settings", label: "Config", icon: Settings },
  ];

  // ✅ FUNCIÓN PARA COMPRAR ITEMS
  const handleBuyShopItem = useCallback((itemId) => {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item || !user) return;
    
    buyShopItem(itemId);
  }, [user, buyShopItem]);

  // ✅ FUNCIÓN PARA EQUIPAR SKIN
  const handleEquipSkin = useCallback((skinId) => {
    if (!user) return;
    gameData.updateActiveSkin(skinId);
    playSound("equip");
  }, [user, gameData, playSound]);

  // ✅ FUNCIÓN PARA COMPRAR TOKENS CROC
  const handleBuyToken = useCallback(async () => {
    toast({
      title: '🚧 Comprar Token CROC',
      description: 'Próximamente podrás adquirir CROC en un exchange descentralizado (DEX).',
      duration: 5000,
    });
    playSound('uiClick');
  }, [toast, playSound]);

  /* 💡 UI Loading global */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-center text-lg text-muted-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-lg font-semibold gradient-text">🐊 Cargando Cocodrilo Kombat...</div>
          <div className="text-sm text-muted-foreground">Sincronizando datos con la nube</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-center text-red-500">
        <div className="bg-red-900/30 p-6 rounded-xl border border-red-700/50 max-w-md">
          <div className="text-2xl mb-2">❌ Error al cargar datos</div>
          <div className="text-sm mb-4">{error}</div>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700"
          >
            Recargar página
          </Button>
        </div>
      </div>
    );
  }

  // 💰 PAQUETE COMPLETO DE DATOS DE PRECIO PARA PASAR A COMPONENTES
  const tokenPriceData = {
    tokenPrice,
    priceHistory,
    liquidity,
    getChartData,
    getPriceStats,
    refreshPrice
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 🔝 Barra superior - SIN BOTONES DEBUG, SYNC, INTEGRIDAD */}
      <nav className="bg-card/80 backdrop-blur-lg border-b border-border p-2 md:p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold gradient-text">
              🐊 Cocodrilo Kombat
            </h1>
            {player && (
              <div className="hidden md:flex items-center gap-2 text-xs bg-primary/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-primary font-medium">{player.username}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 md:space-x-2 overflow-x-auto scrollbar-hide">
            {navigationItems.map((item) => (
              <Button
                key={item.view}
                onClick={() => handleNavigation(item.view)}
                variant={currentView === item.view ? "default" : "ghost"}
                size="sm"
                className="mobile-button px-2 sm:px-3 md:px-4 text-xs md:text-sm flex-shrink-0 transition-all duration-200"
              >
                <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 md:mr-1.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </nav>

      {/* 🧩 Contenido dinámico */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="pb-16"
        >
          <React.Suspense fallback={
            <div className="text-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <div className="mt-4 text-muted-foreground">Cargando vista...</div>
            </div>
          }>
            {currentView === "game" && (
              <GameView
                gameState={gameState}
                upgrades={upgrades}
                buyUpgrade={buyUpgrade}
                handleClick={handleClick}
                floatingNumbers={floatingNumbers}
                clickEffect={clickEffect}
                dailyRewards={dailyRewards}
                claimDailyReward={claimDailyReward}
                tutorialStep={tutorialStep}
                showTutorial={showTutorial}
                activeSkin={activeSkin}
                toast={toast}
                user={user}
                tokenPrice={tokenPrice}
                liquidity={liquidity}  
                priceData={getChartData()} 
                referralStats={referralStats}
                refreshReferralStats={gameData.refreshReferralStats}
                calculateRealClickPower={calculateRealClickPower}
                getReferralLink={gameData.getReferralLink}
                onBuyToken={handleBuyToken}
              />
            )}

            {currentView === "missions" && (
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

            {currentView === "farming_milestones" && (
              <FarmingMilestonesView
                gameState={gameState}
                farmingMilestonesState={farmingMilestonesState}
                claimFarmingMilestone={claimFarmingMilestone}
              />
            )}

            {currentView === "cards" && (
              <CardsView 
                ownedCards={ownedCards}
                allCards={gameData.allCards}
              />
            )}

            {currentView === "shop" && (
              <ShopView
                coins={gameState.coins}
                ownedItems={ownedItems}
                activeSkin={activeSkin}
                buyShopItem={handleBuyShopItem}
                equipSkin={handleEquipSkin}
              />
            )}

            {currentView === "ranking" && (
              <RankingView 
                user={user} 
                player={player}
                tokenPrice={tokenPrice}
                loadRanking={gameData.loadRanking}
                refreshRanking={gameData.refreshRanking}
                gameDataState={gameState}
              />
            )}

            {currentView === "fairlaunch" && (
              <FairlaunchView 
                toast={toast} 
                tokenPrice={tokenPrice}
                setTokenPrice={setTokenPrice}
                updatePriceInSupabase={updatePrice}
              />
            )}

            {currentView === "whitepaper" && <WhitepaperView />}
            
            {currentView === "wallet" && (
              <WalletView 
                toast={toast} 
                playSound={playSound}
                nativeTokenBalance={gameState.nativeTokenBalance}
                tokenPrice={tokenPrice}
                tokenPriceHistory={priceHistory}
                refreshTokenPrice={refreshPrice}
              />
            )}

            {currentView === "stats" && (
              <StatsView
                gameState={gameState}
                upgrades={upgrades}
                achievementsUnlocked={achievementsUnlocked}
                ownedCardsCount={ownedCards.length}
                ownedItemsCount={ownedItems.length}
                farmingMilestonesCount={
                  Object.values(farmingMilestonesState).filter((m) => m.claimed).length
                }
                referralStats={referralStats}
                tokenPrice={tokenPrice}
                liquidity={liquidity}
                priceHistory={priceHistory}
                tokenPriceData={tokenPriceData}
                getChartData={getChartData}
                getPriceStats={getPriceStats}
                refreshPrice={refreshPrice}
              />
            )}

            {currentView === "settings" && (
              <SettingsView
                user={user}
                logout={logout}
                setShowAuth={setShowAuth}
                soundEnabled={soundEnabled}
                setSoundEnabled={setSoundEnabled}
                setShowTutorial={setShowTutorial}
                resetProgress={resetProgress}
                playSound={playSound}
                syncGameData={syncAllData}
                gameData={gameData}
                refreshTokenPrice={refreshPrice}
              />
            )}
          </React.Suspense>
        </motion.div>
      </AnimatePresence>

      {/* 🔒 Modales */}
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
        onClose={() => setShowMilestoneModal(false)}
        milestone={lastReachedMilestone}
      />

      {/* 🔻 Footer - SIMPLIFICADO */}
      <footer className="relative bg-card/90 backdrop-blur-md border-t border-border p-3 md:p-4 mt-16 z-10">
        <div className="max-w-7xl mx-auto">
          <SocialLinks links={SOCIAL_LINKS_DATA} playSound={playSound} toast={toast} />
          
          {/* INFORMACIÓN DE SESIÓN Y PRECIO CROC */}
          <div className="mt-3 pt-3 border-t border-border/50 text-center text-xs text-muted-foreground">
            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Sesión activa: <strong>{player?.username || user.email}</strong></span>
                </div>
                <span className="hidden sm:inline">•</span>
                <span className="text-yellow-300">
                  🪙 CROC: <strong>{gameState.nativeTokenBalance?.toLocaleString() || 0}</strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="text-green-400">
                  💰 Valor: <strong>${((gameState.nativeTokenBalance || 0) * tokenPrice).toFixed(2)}</strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  👥 Referidos: <strong>{referralStats?.referralsCount || 0}</strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  🏆 Nivel: <strong>{gameState.level}</strong>
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Modo invitado - <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs text-primary"
                  onClick={() => setShowAuth(true)}
                >
                  Inicia sesión para guardar tu progreso
                </Button></span>
                <span className="hidden sm:inline">•</span>
                <span className="text-yellow-400">
                  💰 CROC: <strong>${tokenPrice.toFixed(4)}</strong>
                </span>
              </div>
            )}
          </div>
          
          {/* INDICADOR DE PRECIO EN TIEMPO REAL - SIMPLIFICADO */}
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-900/30 to-amber-800/30 rounded-full border border-yellow-600/30">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-yellow-300">
                Precio CROC actualizado cada 8 segundos
              </span>
            </div>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}

export default App;