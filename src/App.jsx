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
  const [tokenPrice, setTokenPrice] = useState(0.05);

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
    syncUpgradesToSupabase,
    syncDailyRewardsToSupabase,
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
    calculateRealClickPower,
  } = useGameLogic(
    INITIAL_GAME_STATE,
    INITIAL_UPGRADES_STATE,
    INITIAL_MISSIONS_STATE,
    toast,
    playSound,
    setShowMilestoneModal,
    setLastReachedMilestone,
    user,
    {
      stats,
      player,
      loading: playerLoading,
      syncUpgradesToSupabase,
      syncStatsToSupabase,
      syncDailyRewardsToSupabase
    }
  );

  // ✅ FUNCIÓN MEJORADA PARA SUMAR CROC DE REFERIDOS - CORREGIDA
const addReferralBonuses = useCallback(() => {
  if (!referralStats || !setGameState) {
    console.log("⏸️ No se pueden procesar bonificaciones: datos faltantes");
    return;
  }

  console.log("💰 Procesando bonificaciones de referidos:", referralStats);
  
  setGameState(prev => {
    const currentCrocFromRefs = prev.crocFromRefs || 0;
    const newCrocFromRefs = referralStats.crocFromRefs || 0;
    const currentCoinsFromRefs = prev.coinsFromRefs || 0;
    const newCoinsFromRefs = referralStats.coinsFromRefs || 0;
    
    console.log(`📊 Comparando CROC de referidos: Actual ${currentCrocFromRefs} vs Nuevo ${newCrocFromRefs}`);
    
    let newBalance = prev.nativeTokenBalance || 0;
    let newCoins = prev.coins || 0;
    
    // ✅ SIEMPRE ACTUALIZAR SI HAY NUEVOS REFERIDOS
    if (newCrocFromRefs > currentCrocFromRefs || referralStats.referralsCount > (prev.referralsCount || 0)) {
      const crocDifference = newCrocFromRefs - currentCrocFromRefs;
      const coinsDifference = newCoinsFromRefs - currentCoinsFromRefs;
      
      newBalance = (prev.nativeTokenBalance || 0) + crocDifference;
      newCoins = (prev.coins || 0) + coinsDifference;
      
      console.log(`🎁 Sumando ${crocDifference} CROC y ${coinsDifference} monedas por referidos. Nuevo balance: ${newBalance} CROC`);
      
      return {
        ...prev,
        referralsCount: referralStats.referralsCount || 0,
        crocFromRefs: newCrocFromRefs,
        coinsFromRefs: newCoinsFromRefs,
        nativeTokenBalance: newBalance,
        coins: newCoins,
        totalCoins: (prev.totalCoins || 0) + coinsDifference
      };
    }
    
    return prev;
  });
}, [referralStats, setGameState]);

  // ✅ EFECTO MEJORADO PARA PROCESAR BONIFICACIONES DE REFERIDOS - CORREGIDO
  useEffect(() => {
    if (referralStats && user) {
      console.log("🔄 Verificando bonificaciones de referidos...", referralStats);
      
      // ✅ FORZAR ACTUALIZACIÓN SI HAY REFERIDOS, INCLUSO SI crocFromRefs ES 0
      if (referralStats.referralsCount > 0) {
        console.log("🎯 Jugador tiene referidos, procesando bonificaciones...");
        addReferralBonuses();
      }
    }
  }, [referralStats, user, addReferralBonuses]);

  // ✅ AGREGAR ESTE NUEVO EFECTO PARA INICIALIZAR CROC DE REFERIDOS
  useEffect(() => {
    if (user && gameState && setGameState) {
      // Inicializar crocFromRefs si no existe
      if (gameState.crocFromRefs === undefined) {
        console.log("🆕 Inicializando crocFromRefs en el estado del juego");
        setGameState(prev => ({
          ...prev,
          crocFromRefs: 0,
          coinsFromRefs: 0,
          referralsCount: 0
        }));
      }
    }
  }, [user, gameState, setGameState]);

  // ✅ SINCRONIZACIÓN SIMPLIFICADA - CORREGIDA
  useEffect(() => {
    if (!player?.id || !stats) return;

    // Sincronizar cada 15 segundos
    const interval = setInterval(() => {
      const updatedStats = {
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
      
      console.log("🔄 Sincronización automática:", updatedStats);
      setStats(updatedStats);
      
      // Solo sincronizar si hay cambios reales
      const hasChanges = 
        Math.floor(stats.coins) !== updatedStats.coins ||
        stats.level !== updatedStats.level ||
        stats.clicks !== updatedStats.clicks ||
        Math.floor(stats.croc_tokens) !== updatedStats.croc_tokens;
      
      if (hasChanges && syncStatsToSupabase) {
        syncStatsToSupabase(updatedStats);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [player?.id, stats, gameState, setStats, syncStatsToSupabase]);

  // ✅ SINCRONIZAR UPGRADES CUANDO CAMBIEN - MEJORADO
  useEffect(() => {
    if (!player?.id || !upgrades) return;

    const syncTimeout = setTimeout(() => {
      console.log("🔄 Sincronizando upgrades...", upgrades);
      
      if (syncUpgradesToSupabase) {
        syncUpgradesToSupabase(upgrades);
      } else {
        syncStatsToSupabase(null, upgrades);
      }
    }, 2000);

    return () => clearTimeout(syncTimeout);
  }, [upgrades, player?.id, syncUpgradesToSupabase, syncStatsToSupabase]);

  // ✅ SINCRONIZAR DAILY REWARDS CUANDO CAMBIEN - MEJORADO
  useEffect(() => {
    if (!player?.id || !dailyRewards) return;

    const syncTimeout = setTimeout(() => {
      console.log("🔄 Sincronizando daily rewards...", dailyRewards);
      
      if (syncDailyRewardsToSupabase) {
        syncDailyRewardsToSupabase(dailyRewards);
      } else {
        const payload = {
          player_id: player.id,
          daily_rewards: dailyRewards,
          updated_at: new Date().toISOString(),
        };

        supabase
          .from("player_stats")
          .update(payload)
          .eq('player_id', player.id)
          .then(({ error }) => {
            if (error) {
              console.error("❌ Error sincronizando daily rewards:", error);
            } else {
              console.log("✅ Daily rewards sincronizados");
            }
          });
      }
    }, 2500);

    return () => clearTimeout(syncTimeout);
  }, [dailyRewards, player?.id, syncDailyRewardsToSupabase]);

  /* 🔄 Cargar datos de Supabase al iniciar - MEJORADO CON REFERIDOS */
  useEffect(() => {
    if (stats && gameState && setGameState && setUpgrades) {
      // Solo cargar desde Supabase si el juego está recién iniciado
      if (gameState.coins === 0 && gameState.totalClicks === 0) {
        console.log("📥 Cargando datos desde Supabase...", stats);
        
        setGameState(prev => ({
          ...prev,
          coins: Number(stats.coins) || 0,
          totalCoins: Number(stats.total_coins) || 0,
          level: stats.level || 1,
          nativeTokenBalance: Number(stats.croc_tokens) || 0,
          totalClicks: stats.clicks || 0,
          energy: stats.energy || 100,
          maxEnergy: stats.max_energy || 100,
          clickPower: stats.click_power || 1,
          coinsPerSecond: stats.coins_per_second || 0,
          experience: stats.experience || 0,
          // ✅ INICIALIZAR CROC DE REFERIDOS DESDE STATS SI EXISTEN
          crocFromRefs: stats.croc_from_refs || 0,
          coinsFromRefs: stats.coins_from_refs || 0,
          referralsCount: stats.referrals_count || 0
        }));

        // ✅ CARGAR UPGRADES DESDE LA BASE DE DATOS
        if (stats.upgrades && typeof stats.upgrades === 'object' && Object.keys(stats.upgrades).length > 0) {
          console.log("🔄 Cargando upgrades desde BD:", stats.upgrades);
          setUpgrades(stats.upgrades);
        } else {
          console.log("🆕 No hay upgrades en BD, usando iniciales");
        }
      }
    }
  }, [stats, gameState, setGameState, setUpgrades]);

  // ✅ ACTUALIZAR REFERIDOS PERIÓDICAMENTE
  useEffect(() => {
    if (user && refreshReferralStats) {
      const interval = setInterval(() => {
        refreshReferralStats();
      }, 30000);
      
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
                    crocFromRefs: gameState.crocFromRefs,
                    coinsFromRefs: gameState.coinsFromRefs,
                    referralsCount: gameState.referralsCount,
                    energy: gameState.energy,
                    coinsPerSecond: gameState.coinsPerSecond,
                    clickPower: gameState.clickPower,
                    realClickPower: calculateRealClickPower ? calculateRealClickPower() : 'N/A'
                  },
                  upgrades: upgrades,
                  dailyRewards: dailyRewards
                });
                
                // Forzar sincronización de upgrades
                if (player?.id && upgrades && syncUpgradesToSupabase) {
                  syncUpgradesToSupabase(upgrades);
                  toast({
                    title: "🔄 Upgrades forzados",
                    description: "Upgrades enviados a la base de datos",
                    duration: 2000,
                  });
                }

                // Forzar sincronización de stats
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
                    title: "🔄 Stats forzados",
                    description: "Stats enviados a Supabase",
                    duration: 2000,
                  });
                }

                // Forzar sincronización de daily rewards
                if (dailyRewards && syncDailyRewardsToSupabase) {
                  syncDailyRewardsToSupabase(dailyRewards);
                  toast({
                    title: "🔄 Daily Rewards forzados",
                    description: "Daily rewards enviados a la base de datos",
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

            {/* 🔧 Botón de Debug Upgrades */}
            <Button
              onClick={() => {
                console.log("🔧 DEBUG UPGRADES:", {
                  upgrades: upgrades,
                  statsUpgrades: stats?.upgrades,
                  playerId: player?.id,
                  realClickPower: calculateRealClickPower ? calculateRealClickPower() : 'N/A'
                });
                
                // Forzar sincronización específica de upgrades
                if (player?.id && upgrades) {
                  const payload = {
                    player_id: player.id,
                    upgrades: upgrades,
                    updated_at: new Date().toISOString(),
                  };

                  supabase
                    .from("player_stats")
                    .update(payload)
                    .eq('player_id', player.id)
                    .then(({ error }) => {
                      if (error) {
                        console.error("❌ Error forzando sync upgrades:", error);
                        toast({
                          title: "❌ Error upgrades",
                          description: "No se pudieron sincronizar los upgrades",
                          duration: 3000,
                        });
                      } else {
                        console.log("✅ Upgrades forzados a BD");
                        toast({
                          title: "✅ Upgrades sincronizados",
                          description: "Upgrades guardados en la base de datos",
                          duration: 2000,
                        });
                      }
                    });
                }
              }}
              variant="outline"
              size="sm"
              className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0 bg-yellow-500 hover:bg-yellow-600"
            >
              🔧 Upgrades
            </Button>

            {/* 🔍 TEMPORAL: Botón de debug para referidos */}
            <Button
              onClick={() => {
                console.log("🔍 DEBUG REFERIDOS:", {
                  referralStats: referralStats,
                  gameState: {
                    crocFromRefs: gameState.crocFromRefs,
                    coinsFromRefs: gameState.coinsFromRefs,
                    referralsCount: gameState.referralsCount,
                    nativeTokenBalance: gameState.nativeTokenBalance
                  },
                  user: user?.id
                });
                
                // Forzar actualización de referidos
                if (refreshReferralStats) {
                  refreshReferralStats();
                  toast({
                    title: "🔄 Actualizando referidos",
                    description: "Forzando actualización de estadísticas de referidos",
                    duration: 2000,
                  });
                }
              }}
              variant="outline"
              size="sm"
              className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0 bg-purple-500 hover:bg-purple-600"
            >
              🔍 Referidos
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
                tokenPrice={tokenPrice}
                referralStats={referralStats}
                refreshReferralStats={refreshReferralStats}
                setGameState={setGameState}
                calculateRealClickPower={calculateRealClickPower}
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
                referralStats={referralStats}
                tokenPrice={tokenPrice}
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