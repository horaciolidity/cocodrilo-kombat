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
    getReferralLink,
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

  
// ✅ SINCRONIZACIÓN SIMPLIFICADA EN App.jsx
// REEMPLAZAR la función syncAllDataToSupabase:
const syncAllDataToSupabase = useCallback(() => {
  if (!player?.id) {
    console.log("⏸️ Sync pausado: no hay player.id");
    return;
  }
  
  console.log("🔄 Sincronización manual");
  
  const dataToSync = {
    // ✅ DATOS BÁSICOS
    coins: Math.floor(gameState.coins),
    nativeTokenBalance: Math.floor(gameState.nativeTokenBalance || 0),
    level: gameState.level,
    totalClicks: gameState.totalClicks,
    energy: gameState.energy,
    maxEnergy: gameState.maxEnergy,
    clickPower: gameState.clickPower,
    coinsPerSecond: gameState.coinsPerSecond,
    experience: gameState.experience,
    totalCoins: gameState.totalCoins,
    
    // ✅ DATOS DE REFERIDOS
    crocFromRefs: gameState.crocFromRefs || 0,
    coinsFromRefs: gameState.coinsFromRefs || 0,
    referralsCount: gameState.referralsCount || 0,
    
    // ✅ DATOS ADICIONALES
    upgrades: upgrades,
    missions: missions,
    owned_cards: ownedCards,
    owned_items: ownedItems,
    active_skin: activeSkin,
    achievements_unlocked: achievementsUnlocked,
    daily_rewards: dailyRewards,
    farming_milestones: farmingMilestonesState,
  };

  console.log("📤 Datos a sincronizar:", {
    coins: dataToSync.coins,
    croc: dataToSync.nativeTokenBalance,
    level: dataToSync.level
  });

  if (syncStatsToSupabase) {
    syncStatsToSupabase(dataToSync);
  }
}, [
  player?.id,
  gameState,
  upgrades,
  missions,
  ownedCards,
  ownedItems,
  activeSkin,
  achievementsUnlocked,
  dailyRewards,
  farmingMilestonesState,
  syncStatsToSupabase
]);
  // ✅ SINCRONIZACIÓN AUTOMÁTICA CENTRALIZADA - SOLO UNA VEZ CADA 30 SEGUNDOS
useEffect(() => {
  if (!player?.id || !syncStatsToSupabase) return;

  console.log("🎯 Iniciando sincronización automática corregida");
  
  const syncInterval = setInterval(() => {
    const hasSignificantChanges = 
      Math.floor(stats?.coins || 0) !== Math.floor(gameState.coins) ||
      (stats?.level || 1) !== gameState.level ||
      Math.floor(stats?.croc_tokens || 0) !== Math.floor(gameState.nativeTokenBalance || 0) ||
      (stats?.referrals_count || 0) !== (gameState.referralsCount || 0);

    if (hasSignificantChanges) {
      console.log("🔄 Sincronización automática por cambios significativos");
      syncAllDataToSupabase();
    }
  }, 30000); // 30 segundos

  return () => {
    console.log("🧹 Limpiando sincronización automática");
    clearInterval(syncInterval);
  };
}, [player?.id, stats, gameState, syncStatsToSupabase, syncAllDataToSupabase]);

// ✅ CORREGIR EFECTO DE REFERIDOS
// REEMPLAZAR el efecto de referidos:
useEffect(() => {
  if (referralStats && user && setGameState) {
    console.log("🔄 Procesando referidos:", {
      actual: {
        croc: gameState.crocFromRefs,
        coins: gameState.coinsFromRefs,
        count: gameState.referralsCount
      },
      nuevo: referralStats
    });
    
    setGameState(prev => {
      const currentCroc = prev.crocFromRefs || 0;
      const newCroc = referralStats.crocFromRefs || 0;
      const currentCoins = prev.coinsFromRefs || 0;
      const newCoins = referralStats.coinsFromRefs || 0;
      const currentCount = prev.referralsCount || 0;
      const newCount = referralStats.referralsCount || 0;
      
      // Solo aplicar diferencias positivas
      const crocDiff = Math.max(0, newCroc - currentCroc);
      const coinsDiff = Math.max(0, newCoins - currentCoins);
      
      if (crocDiff > 0 || coinsDiff > 0 || newCount !== currentCount) {
        console.log(`🎁 Aplicando: ${crocDiff} CROC, ${coinsDiff} monedas`);
        
        return {
          ...prev,
          referralsCount: newCount,
          crocFromRefs: newCroc,
          coinsFromRefs: newCoins,
          nativeTokenBalance: (prev.nativeTokenBalance || 0) + crocDiff,
          coins: (prev.coins || 0) + coinsDiff,
          totalCoins: (prev.totalCoins || 0) + coinsDiff
        };
      }
      
      return prev;
    });
  }
}, [referralStats, user, setGameState]);


  // ✅ SINCRONIZACIÓN AL CAMBIAR DE PESTAÑA O CERRAR
  useEffect(() => {
    if (!player?.id) return;

    const handleBeforeUnload = () => {
      console.log("📤 Sincronizando antes de cerrar...");
      // Usar sendBeacon para sincronización confiable antes de cerrar
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          player_id: player.id,
          coins: Math.floor(gameState.coins),
          croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
          last_active: new Date().toISOString()
        });
        navigator.sendBeacon('/api/sync', data);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log("📤 Sincronizando al cambiar de pestaña...");
        syncAllDataToSupabase();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [player?.id, gameState, syncAllDataToSupabase]);

  // ✅ ACTUALIZAR REFERIDOS PERIÓDICAMENTE
  useEffect(() => {
    if (user && refreshReferralStats) {
      const interval = setInterval(() => {
        refreshReferralStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, refreshReferralStats]);



  const processReferralBonuses = useCallback(() => {
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
    
    // Calcular diferencias
    const crocDifference = newCrocFromRefs - currentCrocFromRefs;
    const coinsDifference = newCoinsFromRefs - currentCoinsFromRefs;
    
    console.log(`🎁 Diferencia: ${crocDifference} CROC y ${coinsDifference} monedas`);
    
    // Solo actualizar si hay cambios positivos
    if (crocDifference > 0 || coinsDifference > 0) {
      console.log(`🎁 Aplicando ${crocDifference} CROC y ${coinsDifference} monedas por referidos`);
      
      return {
        ...prev,
        referralsCount: referralStats.referralsCount || 0,
        crocFromRefs: newCrocFromRefs,
        coinsFromRefs: newCoinsFromRefs,
        nativeTokenBalance: (prev.nativeTokenBalance || 0) + crocDifference,
        coins: (prev.coins || 0) + coinsDifference,
        totalCoins: (prev.totalCoins || 0) + coinsDifference
      };
    }
    
    // Si no hay cambios, solo actualizar los contadores
    if (prev.referralsCount !== referralStats.referralsCount) {
      return {
        ...prev,
        referralsCount: referralStats.referralsCount || 0,
        crocFromRefs: newCrocFromRefs,
        coinsFromRefs: newCoinsFromRefs
      };
    }
    
    return prev;
  });
}, [referralStats, setGameState]);

  // ✅ EFECTO PARA APLICAR BONIFICACIONES DE REFERIDOS
  useEffect(() => {
    if (referralStats && user) {
      console.log("🔄 Verificando bonificaciones de referidos...", referralStats);
      processReferralBonuses();
    }
  }, [referralStats, user, processReferralBonuses]);

  // En App.jsx, agregar un efecto para sincronizar después de cargar referralStats
useEffect(() => {
  if (referralStats && user && gameState) {
    console.log("🔄 Sincronizando bonificaciones de referidos...");
    
    // Verificar si hay bonificaciones pendientes por aplicar
    const hasPendingBonuses = 
      (referralStats.crocFromRefs || 0) > (gameState.crocFromRefs || 0) ||
      (referralStats.coinsFromRefs || 0) > (gameState.coinsFromRefs || 0);
    
    if (hasPendingBonuses) {
      console.log("🎯 Aplicando bonificaciones pendientes de referidos");
      processReferralBonuses();
      
      // Sincronizar con Supabase después de aplicar bonificaciones
      setTimeout(() => {
        syncAllDataToSupabase();
      }, 2000);
    }
  }
}, [referralStats, user, gameState, processReferralBonuses, syncAllDataToSupabase]);

  // ✅ INICIALIZAR DATOS DE REFERIDOS SI NO EXISTEN
  useEffect(() => {
    if (user && gameState && setGameState) {
      if (gameState.crocFromRefs === undefined || gameState.referralsCount === undefined) {
        console.log("🆕 Inicializando datos de referidos en el estado del juego");
        setGameState(prev => ({
          ...prev,
          crocFromRefs: 0,
          coinsFromRefs: 0,
          referralsCount: 0
        }));
      }
    }
  }, [user, gameState, setGameState]);

  // ✅ FUNCIÓN DE LIMPIEZA DE DATOS CORRUPTOS
  const cleanupCorruptedData = useCallback(async () => {
    if (!player?.id) return;
    
    try {
      console.log("🧹 Iniciando limpieza de datos corruptos...");
      
      const cleanData = {
        coins: Math.floor(gameState.coins),
        croc_tokens: Math.floor(gameState.nativeTokenBalance || 0),
        native_token_balance: Math.floor(gameState.nativeTokenBalance || 0),
        level: gameState.level,
        clicks: gameState.totalClicks,
        energy: gameState.energy,
        max_energy: gameState.maxEnergy,
        click_power: gameState.clickPower,
        coins_per_second: gameState.coinsPerSecond,
        experience: gameState.experience,
        total_coins: gameState.totalCoins,
        croc_from_refs: gameState.crocFromRefs || 0,
        coins_from_refs: gameState.coinsFromRefs || 0,
        referrals_count: gameState.referralsCount || 0,
        upgrades: upgrades || {},
        missions: missions || {},
        owned_cards: ownedCards || [],
        owned_items: ownedItems || [],
        active_skin: activeSkin || null,
        achievements_unlocked: achievementsUnlocked || [],
        daily_rewards: dailyRewards || { streak: 0, available: true, lastClaim: null },
        farming_milestones: farmingMilestonesState || {},
      };
      
      if (setStats) {
        setStats(cleanData);
      }
      
      if (syncStatsToSupabase) {
        syncStatsToSupabase(cleanData);
      }
      
      toast({
        title: "🧹 Datos limpiados",
        description: "Se han corregido inconsistencias en los datos",
        duration: 3000,
      });
      
    } catch (error) {
      console.error("❌ Error en limpieza:", error);
      toast({
        title: "❌ Error en limpieza",
        description: "No se pudieron corregir los datos",
        duration: 3000,
      });
    }
  }, [
    player?.id, 
    gameState, 
    upgrades, 
    missions, 
    ownedCards, 
    ownedItems, 
    activeSkin, 
    achievementsUnlocked, 
    dailyRewards, 
    farmingMilestonesState, 
    setStats, 
    syncStatsToSupabase, 
    toast
  ]);

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
    // Sincronizar antes de cerrar sesión
    syncAllDataToSupabase();
    await supabase.auth.signOut();
    setUser(null);
    toast({
      title: "👋 Sesión cerrada",
      description: "Tu sesión fue cerrada correctamente",
      duration: 2000,
    });
    playSound("logout");
  }, [syncAllDataToSupabase, toast, playSound]);

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
   // ✅ FUNCIÓN PARA VERIFICAR CONEXIÓN SUPABASE
const checkSupabaseConnection = useCallback(async () => {
  if (!player?.id) return false;
  
  try {
    console.log("🔍 Verificando conexión con Supabase...");
    
    const { data, error } = await supabase
      .from('player_stats')
      .select('player_id, coins, level')
      .eq('player_id', player.id)
      .single();
    
    if (error) {
      console.error("❌ Error conectando a Supabase:", error);
      return false;
    }
    
    console.log("✅ Conexión Supabase exitosa:", data);
    return true;
  } catch (error) {
    console.error("❌ Error en verificación:", error);
    return false;
  }
}, [player?.id]);

// Efecto para verificar conexión al cargar
useEffect(() => {
  if (player?.id) {
    checkSupabaseConnection();
  }
}, [player?.id, checkSupabaseConnection]);




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
            
            {/* 🔄 Botón de Sincronización Manual */}
            <Button
              onClick={syncAllDataToSupabase}
              variant="outline"
              size="sm"
              className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0 bg-blue-500 hover:bg-blue-600"
            >
              🔄 Sync
            </Button>

            {/* 🧹 Botón de Limpieza de Datos */}
            <Button
              onClick={cleanupCorruptedData}
              variant="outline"
              size="sm"
              className="mobile-button px-1 sm:px-1.5 md:px-3 text-xs md:text-sm flex-shrink-0 bg-red-500 hover:bg-red-600"
            >
              🧹 Limpiar
            </Button>

            {/* 🐛 Botón de Debug temporal */}
            // REEMPLAZAR el botón de debug:
<Button
  onClick={() => {
    const debugInfo = {
      user: user?.id,
      player: player?.id,
      playerExists: !!player,
      stats: {
        exists: !!stats,
        coins: stats?.coins,
        level: stats?.level,
        croc_tokens: stats?.croc_tokens,
        native_token_balance: stats?.native_token_balance,
        referrals_count: stats?.referrals_count
      },
      gameState: {
        coins: gameState.coins,
        level: gameState.level,
        nativeTokenBalance: gameState.nativeTokenBalance,
        crocFromRefs: gameState.crocFromRefs,
        coinsFromRefs: gameState.coinsFromRefs,
        referralsCount: gameState.referralsCount,
      },
      referralStats: referralStats,
      upgrades: {
        count: Object.keys(upgrades || {}).length,
        data: upgrades
      }
    };
    
    console.log("🐛 DEBUG COMPLETO:", debugInfo);
    
    // Verificar sincronización
    if (player?.id && syncStatsToSupabase) {
      console.log("🔍 Probando conexión Supabase...");
      syncAllDataToSupabase();
    }
    
    toast({
      title: "🐛 Debug Info",
      description: `Coins: ${gameState.coins} | CROC: ${gameState.nativeTokenBalance} | Level: ${gameState.level}`,
      duration: 5000,
    });
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
                tokenPrice={tokenPrice}
                referralStats={referralStats}
                refreshReferralStats={refreshReferralStats}
                setGameState={setGameState}
                calculateRealClickPower={calculateRealClickPower}
                getReferralLink={getReferralLink}
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