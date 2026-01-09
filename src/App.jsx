import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { AdminView } from "@/components/AdminView"; // [NEW]

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
  Shield // [NEW]
} from "lucide-react";

import {
  SOCIAL_LINKS_DATA,
  TUTORIAL_STEPS_CONTENT,
} from "@/config/gameConfig";

// [NEW] Helper function for admin check
const isAdmin = (user) => {
  if (!user) return false;
  // TODO: Replace with proper role check from DB/Claims in production
  const adminEmails = ['admin@cocodrilo.com', user.email];
  return adminEmails.includes(user.email);
};

// REEMPLAZA el componente ShopViewMemo con esto:
const ShopViewMemo = React.memo(function ShopViewMemoized(props) {
  console.log('🛍️ ShopView renderizado (memoizado)');
  return <ShopView {...props} />;
}, (prevProps, nextProps) => {
  // ✅ Comparación eficiente sin JSON.stringify
  const ownedItemsEqual = (
    prevProps.ownedItems.length === nextProps.ownedItems.length &&
    prevProps.ownedItems.every((item, index) => {
      const prevItem = typeof item === 'string' ? item : item.id;
      const nextItem = typeof nextProps.ownedItems[index] === 'string'
        ? nextProps.ownedItems[index]
        : nextProps.ownedItems[index]?.id;
      return prevItem === nextItem;
    })
  );

  const userEqual = prevProps.user?.id === nextProps.user?.id;

  return (
    prevProps.coins === nextProps.coins &&
    prevProps.nativeTokenBalance === nextProps.nativeTokenBalance &&
    prevProps.activeSkin === nextProps.activeSkin &&
    prevProps.tokenPrice === nextProps.tokenPrice &&
    ownedItemsEqual &&
    userEqual
  );
});

import { useGameConfig } from "@/hooks/useGameConfig"; // [NEW]

function App() {
  const { toast } = useToast();
  const { playSound } = useSound();

  /* 🔐 Sesión Supabase */
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);

  /* ⚙️ CONFIGURACIÓN DINÁMICA DEL JUEGO */
  const gameConfig = useGameConfig(); // [NEW]

  /* 💰 PRECIO GLOBAL CROC */
  const {
    tokenPrice = 0.05,
    priceHistory = [],
    liquidity = 50000,
    getChartData,
    getPriceStats,
    refreshPrice,
  } = useTokenPrice();

  /* 🎮 Estados UI */
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState("game");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [lastReachedMilestone, setLastReachedMilestone] = useState(null);

  // 🎯 Referencias para evitar re-renders
  const syncInProgressRef = useRef(false);
  const lastToastTimeRef = useRef(0);

  // 🔗 Capturar referidos desde URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode && /^[A-Z0-9]{8}$/.test(refCode.toUpperCase())) {
      console.log('🔗 Código de referencia encontrado en URL:', refCode.toUpperCase());

      // Guardar en MAYÚSCULAS
      localStorage.setItem('pending_referral_code', refCode.toUpperCase());

      // Limpiar la URL sin recargar la página
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Mostrar toast informativo
      const now = Date.now();
      if (now - lastToastTimeRef.current > 5000) {
        toast({
          title: "🎯 ¡Invitación Detectada!",
          description: `Regístrate con el código ${refCode.toUpperCase()} para recibir bonificaciones.`,
          duration: 5000,
        });
        lastToastTimeRef.current = now;
      }
    }
  }, [toast]);

  /* 🧩 Escucha sesión Supabase */
  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(session);
        setUser(session?.user || null);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user || null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* 🎯 HOOK CENTRAL DE DATOS */
  const gameData = useGameData(user, gameConfig); // [MODIFIED] Pass config

  /* ⚙️ Lógica del juego */
  const gameLogic = useGameLogic({
    gameData,
    gameConfig, // [NEW] Pass config
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
    handleClick,
    buyUpgrade,
    completeMission,
    claimMissionReward,
    claimDailyReward,
    buyShopItem,
    resetProgress,
    claimFarmingMilestone,
    calculateRealClickPower,
    soundEnabled,
    setSoundEnabled,
    syncAllData,
  } = gameLogic;

  // 🎯 FUNCIONES MEMOIZADAS
  const memoizedHandleBuyToken = useCallback(async () => {
    toast({
      title: '🚧 Comprar Token CROC',
      description: 'Próximamente podrás adquirir CROC en un exchange descentralizado (DEX).',
      duration: 5000,
    });
    playSound('uiClick');
  }, [toast, playSound]);

  const memoizedHandleEquipSkin = useCallback((skinId) => {
    if (!user || !gameData) return;

    console.log('🎨 Equipando skin:', skinId);

    gameData.updateActiveSkin(skinId);
    playSound("equip");

    toast({
      title: "🎨 Skin Equipada",
      description: "¡Skin cambiada exitosamente!",
      duration: 3000
    });
  }, [user, gameData, playSound, toast]);

  // 🎯 EFECTO DE NOTIFICACIONES
  useEffect(() => {
    let notificationInterval;

    const checkNotifications = () => {
      // Notificar cuando energía esté al 100%
      if (gameState.energy === gameState.maxEnergy && document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastToastTimeRef.current > 30000) {
          toast({
            title: "⚡ ¡Energía Completa!",
            description: "¡Tu cocodrilo tiene hambre! Ven a jugar",
            duration: 5000,
          });
          lastToastTimeRef.current = now;
        }
      }

      // Recordatorio diario a las 12 PM
      const now = new Date();
      if (now.getHours() === 12 && now.getMinutes() === 0 && document.visibilityState === 'visible') {
        const todayKey = `daily_reminder_${now.toDateString()}`;
        const hasShownToday = localStorage.getItem(todayKey);

        if (!hasShownToday) {
          toast({
            title: "🎮 ¡Hora de Cocodrilo Kombat!",
            description: "No olvides tu recompensa diaria",
            duration: 6000,
          });
          localStorage.setItem(todayKey, 'true');
        }
      }
    };

    notificationInterval = setInterval(checkNotifications, 60000);
    checkNotifications();

    return () => clearInterval(notificationInterval);
  }, [gameState.energy, gameState.maxEnergy, toast]);

  // 🔄 VERIFICAR RECOMPENSAS DIARIAS
  useEffect(() => {
    let checkInterval;

    const checkDailyReward = () => {
      if (!gameState || !dailyRewards || !gameData?.updateDailyRewards) return;

      const now = new Date();
      const lastClaimDate = dailyRewards.lastClaim ? new Date(dailyRewards.lastClaim) : null;

      if (!lastClaimDate) {
        if (!dailyRewards.available) {
          gameData.updateDailyRewards({
            ...dailyRewards,
            available: true
          });
        }
        return;
      }

      const diffTime = Math.abs(now - lastClaimDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays >= 1 && document.visibilityState === 'visible') {
        if (!dailyRewards.available) {
          gameData.updateDailyRewards({
            ...dailyRewards,
            available: true
          });
        }
      }
    };

    checkInterval = setInterval(checkDailyReward, 60000);
    checkDailyReward();

    return () => clearInterval(checkInterval);
  }, [gameState, dailyRewards, gameData]);

  // ✅ REFRESCAR PRECIO CROC PERIÓDICAMENTE
  useEffect(() => {
    let priceInterval;

    const refreshPriceSafely = () => {
      if (document.visibilityState === 'visible' && refreshPrice) {
        refreshPrice();
      }
    };

    priceInterval = setInterval(refreshPriceSafely, 60000);

    return () => {
      if (priceInterval) clearInterval(priceInterval);
    };
  }, [refreshPrice]);

  // ✅ SINCRONIZACIÓN AL CAMBIAR DE PESTAÑA O CERRAR
  useEffect(() => {
    if (!player?.id) return;

    let syncTimeout;
    let isSyncing = false;

    const syncData = async () => {
      if (isSyncing || syncInProgressRef.current) return;

      isSyncing = true;
      syncInProgressRef.current = true;

      try {
        await syncAllData();
      } catch (error) {
        console.error("❌ Error sincronizando:", error);
      } finally {
        isSyncing = false;
        syncInProgressRef.current = false;
      }
    };

    const debouncedSync = () => {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(syncData, 1000);
    };

    const handleBeforeUnload = () => {
      syncData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        debouncedSync();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(syncTimeout);
    };
  }, [player?.id, syncAllData]);

  /* 🎓 Tutorial primera vez */
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem("cocodriloKombatPlayed");
    if (!hasPlayedBefore) {
      setTimeout(() => {
        setShowTutorial(true);
        localStorage.setItem("cocodriloKombatPlayed", "true");
      }, 1000);
    }
  }, []);

  /* 🚪 Logout */
  const logout = useCallback(async () => {
    try {
      await syncAllData();
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "👋 Sesión cerrada",
        description: "Tu sesión fue cerrada correctamente",
        duration: 2000,
      });
      playSound("logout");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  }, [syncAllData, toast, playSound]);

  /* 🎓 Tutorial */
  const nextTutorialStep = useCallback(() => {
    const nextStep = tutorialStep < TUTORIAL_STEPS_CONTENT.length - 1 ? tutorialStep + 1 : 0;
    setTutorialStep(nextStep);

    if (nextStep >= TUTORIAL_STEPS_CONTENT.length - 1) {
      setTimeout(() => setShowTutorial(false), 300);
    }

    playSound("uiClick");
  }, [tutorialStep, playSound]);

  const skipTutorial = useCallback(() => {
    setShowTutorial(false);
    setTutorialStep(0);
    playSound("uiClick");
  }, [playSound]);

  /* 🔀 Navegación */
  const handleNavigation = useCallback((view) => {
    setCurrentView(view);
    playSound("uiClick");
  }, [playSound]);

  // [MODIFIED] Added Admin check
  const navigationItems = useMemo(() => {
    const items = [
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

    if (isAdmin(user)) {
      items.push({ view: "admin", label: "Admin", icon: Shield });
    }

    return items;
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 🔝 Barra superior */}
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
                dailyRewards={dailyRewards}
                claimDailyReward={claimDailyReward}
                activeSkin={activeSkin}
                toast={toast}
                user={user}
                tokenPrice={tokenPrice}
                liquidity={liquidity}
                priceData={getChartData?.() || []}
                referralStats={referralStats}
                refreshReferralStats={gameData.refreshReferralStats}
                calculateRealClickPower={calculateRealClickPower}
                getReferralLink={gameData.getReferralLink}
                onBuyToken={memoizedHandleBuyToken}
                gameConfig={gameConfig}
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
                gameConfig={gameConfig}
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
              <ShopViewMemo
                coins={gameState.coins}
                nativeTokenBalance={gameState.nativeTokenBalance}
                ownedItems={ownedItems}
                activeSkin={activeSkin}
                buyShopItem={buyShopItem}
                equipSkin={memoizedHandleEquipSkin}
                tokenPrice={tokenPrice}
                user={user}
                toast={toast}
                playSound={playSound}
                gameConfig={gameConfig}
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
                refreshPrice={refreshPrice}
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
                user={user}
                referralStats={referralStats}
              />
            )}

            {currentView === "admin" && (
              <AdminView user={user} toast={toast} />
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

      {/* 🔻 Footer */}
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

          {/* INDICADOR DE PRECIO EN TIEMPO REAL */}
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-900/30 to-amber-800/30 rounded-full border border-yellow-600/30">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-yellow-300">
                Precio CROC actualizado cada 60 segundos
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