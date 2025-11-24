// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

import { supabase } from "@/lib/supabaseClient";
import { useSupabasePlayer } from "@/hooks/useSupabasePlayer";
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
import { buyShopItem, equipSkin } from "@/lib/shopService";

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
  INITIAL_GAME_STATE,
  INITIAL_UPGRADES_STATE,
  INITIAL_MISSIONS_STATE,
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
  const [tokenPrice, setTokenPrice] = useState(0.05); // ✅ PRECIO DEL TOKEN PARA VALOR PROYECTADO

  /* 🎮 Estados UI */
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState("game");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [lastReachedMilestone, setLastReachedMilestone] = useState(null);

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

  /* 🧠 Hook de jugador (vincula user con Supabase player/stats) */
  const {
    player,
    stats,
    setStats,
    referralStats,
    loading: playerLoading,
    error: playerError,
    syncStatsToSupabase,
    refreshReferralStats,
  } = useSupabasePlayer(user);

  /* ⚙️ Lógica del juego */
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

  // ✅ SINCRONIZACIÓN MEJORADA - CORREGIDA
  useEffect(() => {
    if (!stats || !gameState || !syncStatsToSupabase) return;

    const syncTimeout = setTimeout(() => {
      const updatedStats = {
        coins: Math.floor(gameState.coins),
        croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
        level: gameState.level,
        clicks: gameState.totalClicks,
      };
      
      // Solo sincronizar si hay cambios reales
      const hasChanges = 
        Math.floor(stats.coins) !== updatedStats.coins ||
        stats.level !== updatedStats.level ||
        stats.clicks !== updatedStats.clicks ||
        Math.floor(stats.croc_tokens) !== updatedStats.croc_tokens;
      
      if (hasChanges) {
        console.log("🔄 Sincronizando con Supabase...", updatedStats);
        setStats(updatedStats);
        syncStatsToSupabase(updatedStats);
      }
    }, 2000); // 2 segundos de delay para evitar sobrecarga

    return () => clearTimeout(syncTimeout);
  }, [gameState.coins, gameState.level, gameState.totalClicks, gameState.nativeTokenBalance, stats, setStats, syncStatsToSupabase]);

  // ✅ SINCRONIZACIÓN FORZADA EN EVENTOS IMPORTANTES
  useEffect(() => {
    if (!stats || !setStats || !syncStatsToSupabase) return;
    
    const interval = setInterval(() => {
      const updatedStats = {
        coins: Math.floor(gameState.coins),
        croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
        level: gameState.level,
        clicks: gameState.totalClicks,
      };
      
      // Actualizar stats locales periódicamente
      setStats(updatedStats);
    }, 10000); // Sincronizar cada 10 segundos

    return () => clearInterval(interval);
  }, [gameState, stats, setStats, syncStatsToSupabase]);

  /* 🔄 Cargar datos de Supabase al iniciar - MEJORADO */
  useEffect(() => {
    if (stats && gameState && setGameState) {
      // Solo cargar desde Supabase si el juego está recién iniciado
      if (gameState.coins === 0 && gameState.totalClicks === 0) {
        console.log("📥 Cargando datos desde Supabase...");
        setGameState(prev => ({
          ...prev,
          coins: Number(stats.coins) || 0,
          totalCoins: Number(stats.coins) || 0,
          level: stats.level || 1,
          nativeTokenBalance: Number(stats.croc_tokens) || 0,
          totalClicks: stats.clicks || 0,
        }));
      }
    }
  }, [stats?.coins, stats?.level, stats?.croc_tokens, stats?.clicks, gameState, setGameState]);

  // ✅ ACTUALIZAR REFERIDOS PERIÓDICAMENTE
  useEffect(() => {
    if (user && refreshReferralStats) {
      const interval = setInterval(() => {
        refreshReferralStats();
      }, 30000); // Actualizar cada 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [user, refreshReferralStats]);

  /* 🎓 Tutorial primera vez */
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem("cocodriloKombatPlayed");
    if (!hasPlayedBefore) {
      setShowTutorial(true);
      localStorage.setItem("cocodriloKombatPlayed", "true");
    }
  }, []);

  /* 🪙 Fallbacks seguros */
  const safeCoins = stats?.coins ?? gameState?.coins ?? 0;
  const safeOwnedItems = Array.isArray(ownedItems) ? ownedItems : [];

  // ✅ ACTUALIZAR REFERIDOS EN GAME STATE
  useEffect(() => {
    if (referralStats && setGameState) {
      setGameState(prev => ({
        ...prev,
        referralsCount: referralStats.referralsCount || 0,
        crocFromRefs: referralStats.crocFromRefs || 0,
        coinsFromRefs: referralStats.coinsFromRefs || 0,
      }));
    }
  }, [referralStats, setGameState]);

  /* 🚪 Logout */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "👋 Sesión cerrada",
      description: "Tu sesión fue cerrada correctamente",
      duration: 2000,
    });
    playSound("logout");
  }, [toast, playSound]);

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

  /* 💡 UI Loading global */
  if (playerLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-center text-lg text-muted-foreground">
        🐊 Cargando tu perfil de jugador...
      </div>
    );
  }

  if (playerError) {
    return (
      <div className="flex items-center justify-center h-screen text-center text-red-500">
        ❌ Error al cargar datos del jugador: {playerError}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 🔝 Barra superior */}
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
                variant={currentView === item.view ? "default" : "ghost"}
                size="sm"
                className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0"
              >
                <item.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 md:mr-1" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            ))}
            
            {/* 🐛 Botón de Debug temporal */}
            <Button
              onClick={() => {
                console.log("🐛 DEBUG INFO:", {
                  user: user?.id,
                  player: player?.id,
                  stats: stats,
                  referralStats: referralStats,
                  gameState: {
                    coins: gameState.coins,
                    level: gameState.level,
                    clicks: gameState.totalClicks,
                    nativeTokenBalance: gameState.nativeTokenBalance,
                    energy: gameState.energy,
                    coinsPerSecond: gameState.coinsPerSecond
                  }
                });
                
                // Forzar sincronización
                if (stats && syncStatsToSupabase) {
                  const updatedStats = {
                    coins: Math.floor(gameState.coins),
                    croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
                    level: gameState.level,
                    clicks: gameState.totalClicks,
                  };
                  setStats(updatedStats);
                  syncStatsToSupabase(updatedStats);
                  toast({
                    title: "🔄 Sincronización forzada",
                    description: "Datos enviados a Supabase",
                    duration: 2000,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0"
            >
              🐛 Debug
            </Button>
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
          <React.Suspense fallback={<div className="text-center p-10">Cargando...</div>}>
            {currentView === "game" && (
              <GameView
                player={player}
                stats={stats}
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
                user={user}
                tokenPrice={tokenPrice} // ✅ PASAR PRECIO DEL TOKEN
                referralStats={referralStats} // ✅ PASAR STATS DE REFERIDOS
                refreshReferralStats={refreshReferralStats} // ✅ PASAR FUNCIÓN DE ACTUALIZACIÓN
                setGameState={setGameState} // 🔥🔥🔥 CRÍTICO: PASAR setGameState PARA REGENERACIÓN Y FARMEO
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

            {currentView === "cards" && <CardsView ownedCards={ownedCards} />}

            {currentView === "shop" && (
              <ShopView
                coins={safeCoins}
                ownedItems={safeOwnedItems}
                activeSkin={activeSkin}
                buyShopItem={(itemId) => {
                  const item = SHOP_ITEMS.find((i) => i.id === itemId);
                  if (!item || !user) return;
                  buyShopItem(user.id, item.id, item.price, item.type, toast);
                }}
                equipSkin={(skinId) => {
                  if (!user) return;
                  equipSkin(user.id, skinId, toast);
                  setActiveSkin(skinId);
                }}
              />
            )}

            {currentView === "ranking" && <RankingView user={user} stats={stats} />}
            {currentView === "fairlaunch" && <FairlaunchView toast={toast} />}
            {currentView === "whitepaper" && <WhitepaperView />}
            {currentView === "wallet" && <WalletView toast={toast} playSound={playSound} />}
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
                referralStats={referralStats} // ✅ PASAR STATS DE REFERIDOS
                tokenPrice={tokenPrice} // ✅ PASAR PRECIO DEL TOKEN
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

      {/* 🔻 Footer */}
      <footer className="relative bg-card/80 backdrop-blur-md border-t border-border p-3 mt-16 z-10">
        <SocialLinks links={SOCIAL_LINKS_DATA} playSound={playSound} toast={toast} />
      </footer>

      <Toaster />
    </div>
  );
}

export default App;