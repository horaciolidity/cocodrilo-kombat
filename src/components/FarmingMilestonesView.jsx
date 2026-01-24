import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Target,
  Award,
  Gift,
  CheckCircle,
  DollarSign,
  Trophy,
  TrendingUp,
  Sparkles,
  Zap,
  BarChart3,
  Users,
  Coins,
  Clock,
  Calendar,
  Shield,
  Crown,
  Star
} from 'lucide-react';
import { FARMING_MILESTONES } from '@/config/gameConfig';
import { useSound } from '@/hooks/useSound';

export function FarmingMilestonesView({
  gameState,
  farmingMilestonesState = {},
  claimFarmingMilestone,
  toast,
  playSound
}) {
  const { playSound: playSoundHook } = useSound();
  const sound = playSound || playSoundHook;

  const [viewMode, setViewMode] = useState('all'); // 'all', 'available', 'claimed'
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [timeUntilNext, setTimeUntilNext] = useState(null);
  const [showCelebration, setShowCelebration] = useState(null);

  // 📊 Calcular estadísticas de hitos
  const calculateMilestoneStats = () => {
    if (!FARMING_MILESTONES || !farmingMilestonesState) return {};

    const totalMilestones = FARMING_MILESTONES.length;
    const claimedMilestones = Object.values(farmingMilestonesState).filter(m => m?.claimed).length;
    const availableMilestones = FARMING_MILESTONES.filter(milestone => {
      const state = farmingMilestonesState[milestone.id];
      return gameState.totalCoins >= milestone.coinsRequired && !state?.claimed;
    }).length;

    const totalTokens = FARMING_MILESTONES.reduce((sum, m) => sum + m.tokenReward, 0);
    const claimedTokens = FARMING_MILESTONES.reduce((sum, m) => {
      return sum + (farmingMilestonesState[m.id]?.claimed ? m.tokenReward : 0);
    }, 0);

    const completionRate = totalMilestones > 0 ? (claimedMilestones / totalMilestones) * 100 : 0;

    // Encontrar próximo hito alcanzable
    const nextMilestone = FARMING_MILESTONES.find(milestone => {
      const state = farmingMilestonesState[milestone.id];
      return gameState.totalCoins < milestone.coinsRequired && !state?.claimed;
    });

    return {
      totalMilestones,
      claimedMilestones,
      availableMilestones,
      totalTokens,
      claimedTokens,
      completionRate,
      nextMilestone
    };
  };

  const stats = calculateMilestoneStats();
  const nextMilestone = stats.nextMilestone;
  const nextMilestoneProgress = nextMilestone
    ? Math.min(100, (gameState.totalCoins / nextMilestone.coinsRequired) * 100)
    : 100;

  // ⏰ Calcular tiempo estimado para próximo hito
  useEffect(() => {
    if (!nextMilestone || !gameState.coinsPerSecond || gameState.coinsPerSecond <= 0) {
      setTimeUntilNext(null);
      return;
    }

    const coinsNeeded = nextMilestone.coinsRequired - gameState.totalCoins;
    const secondsNeeded = coinsNeeded / gameState.coinsPerSecond;

    if (secondsNeeded <= 0) {
      setTimeUntilNext(null);
      return;
    }

    const updateTime = () => {
      const hours = Math.floor(secondsNeeded / 3600);
      const minutes = Math.floor((secondsNeeded % 3600) / 60);
      const seconds = Math.floor(secondsNeeded % 60);

      let timeString = '';
      if (hours > 0) timeString += `${hours}h `;
      if (minutes > 0) timeString += `${minutes}m `;
      if (seconds > 0 && hours === 0) timeString += `${seconds}s`;

      setTimeUntilNext(timeString.trim() || '¡Ya casi!');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [nextMilestone, gameState.totalCoins, gameState.coinsPerSecond]);

  // 🎮 Manejar reclamación de hito
  const handleClaimMilestone = (milestoneId) => {
    if (!claimFarmingMilestone) return;

    sound('reward');
    claimFarmingMilestone(milestoneId);

    // Efecto de celebración
    setShowCelebration(milestoneId);
    setTimeout(() => setShowCelebration(null), 3000);

    setSelectedMilestone(null);
  };

  // 🎨 Filtrar hitos según modo de vista
  const filteredMilestones = () => {
    if (!FARMING_MILESTONES) return [];

    return FARMING_MILESTONES.filter(milestone => {
      const state = farmingMilestonesState[milestone.id];

      switch (viewMode) {
        case 'available':
          return gameState.totalCoins >= milestone.coinsRequired && !state?.claimed;
        case 'claimed':
          return state?.claimed;
        default:
          return true;
      }
    });
  };

  // 🏆 Renderizar tarjeta de hito
  const renderMilestoneCard = (milestone, index) => {
    const state = farmingMilestonesState[milestone.id] || {};

    // Logic for social vs coin milestones
    const isSocial = !!milestone.socialTask;
    let canClaim = false;
    let progressPercentage = 0;

    if (isSocial) {
      // Social milestones are claimable if not already claimed (simulating instant verification on click for now, or just open link -> enable claim)
      // For better UX, we might tracking 'clicked' state locally if needed, but for now let's assume if it's social and not claimed, it's 'available' to interact with.
      // Actually, requested logic is "complete hito...". Usually means click link -> return -> claim.
      // We will assume they are 'available' to start immediately.
      // Real claim logic: User must click button to do task, then claim button appears.
      // Simplified for this view: always available to see/try.
      canClaim = !state.claimed; // We'll handle the 'interaction' requirement inside the card UI
      progressPercentage = state.claimed ? 100 : 0;
    } else {
      canClaim = gameState.totalCoins >= milestone.coinsRequired && !state.claimed;
      progressPercentage = Math.min(100, (gameState.totalCoins / milestone.coinsRequired) * 100);
    }

    const isSelected = selectedMilestone === milestone.id;

    // Determinar rango del hito
    let milestoneTier = 'common';
    let tierColor = 'text-gray-400';
    let tierBgColor = 'bg-gray-800/50';

    if (milestone.tokenReward >= 200) { // Adjusted for new social rewards
      milestoneTier = 'legendary';
      tierColor = 'text-yellow-400';
      tierBgColor = 'bg-yellow-900/30';
    } else if (milestone.tokenReward >= 150) {
      milestoneTier = 'epic';
      tierColor = 'text-purple-400';
      tierBgColor = 'bg-purple-900/30';
    } else if (milestone.tokenReward >= 100) {
      milestoneTier = 'rare';
      tierColor = 'text-blue-400';
      tierBgColor = 'bg-blue-900/30';
    } else if (milestone.tokenReward >= 50) {
      milestoneTier = 'uncommon';
      tierColor = 'text-green-400';
      tierBgColor = 'bg-green-900/30';
    }

    // Local state for social verification flow (simple version)
    const [actionClicked, setActionClicked] = useState(false);

    const handleSocialAction = (e) => {
      e.stopPropagation();
      if (milestone.socialTask.url && milestone.socialTask.url !== '#') {
        window.open(milestone.socialTask.url, '_blank');
      }
      setActionClicked(true); // Enable claim button after action
      // In a real app we might wait specific time or verify API
    };

    return (
      <motion.div
        key={milestone.id}
        className={`milestone-card rounded-xl p-4 md:p-6 shadow-lg transition-all duration-300 relative overflow-hidden ${state.claimed
            ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50'
            : (canClaim && !isSocial) || (isSocial && actionClicked)
              ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/50 animate-pulse-border'
              : 'bg-card/80 border border-border/50 hover:border-primary/50'
          } ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => setSelectedMilestone(isSelected ? null : milestone.id)}
      >
        {/* Efecto de celebración */}
        {showCelebration === milestone.id && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 z-10"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 3 }}
          />
        )}

        {/* Indicador de rango */}
        <div className={`absolute -top-3 -right-3 ${tierBgColor} ${tierColor} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
          {milestoneTier === 'legendary' && <Crown className="w-3 h-3" />}
          {milestoneTier === 'epic' && <Star className="w-3 h-3" />}
          {milestoneTier === 'rare' && <Award className="w-3 h-3" />}
          {milestoneTier.toUpperCase()}
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
          {/* Información del hito */}
          <div className="flex items-start mb-2 md:mb-0 flex-1">
            <div className={`p-3 rounded-lg mr-3 ${state.claimed
                ? 'bg-green-700/50'
                : canClaim
                  ? 'bg-yellow-700/50'
                  : 'bg-gray-700/50'
              }`}>
              {milestone.icon ? <milestone.icon className={`w-6 h-6 ${state.claimed ? 'text-green-300' :
                  canClaim ? 'text-yellow-300 animate-pulse' :
                    'text-primary'
                }`} /> : <Target className={`w-6 h-6 ${state.claimed ? 'text-green-300' :
                    canClaim ? 'text-yellow-300 animate-pulse' :
                      'text-primary'
                  }`} />}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg md:text-xl font-semibold">{milestone.name}</h3>
                {state.claimed && (
                  <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-300 rounded-full">
                    Reclamado
                  </span>
                )}
                {/* Disponibilidad badge different logic for social */}
                {!state.claimed && isSocial && !actionClicked && (
                  <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">
                    Misión Social
                  </span>
                )}
                {!state.claimed && ((!isSocial && canClaim) || (isSocial && actionClicked)) && (
                  <motion.span
                    className="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-300 rounded-full flex items-center gap-1"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Sparkles className="w-3 h-3" />
                    ¡Listo para Reclamar!
                  </motion.span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {/* Si no es social, mostrar requisito monedas */}
                {!isSocial && (
                  <span className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    {milestone.coinsRequired.toLocaleString()} monedas
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  {milestone.tokenReward.toLocaleString()} CROC
                </span>

                {isSocial && (
                  <span className="text-xs text-blue-300 italic">
                    {milestone.description}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 min-w-[180px]">
            {state.claimed ? (
              <div className="flex items-center justify-center text-green-400 text-sm p-2 bg-green-900/30 rounded-lg">
                <CheckCircle className="w-4 h-4 mr-1" />
                {milestone.tokenReward.toLocaleString()} CROC obtenidos
              </div>
            ) : isSocial && !actionClicked ? (
              // Botón de acción social
              <Button
                onClick={handleSocialAction}
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Ir a la Misión
              </Button>
            ) : (canClaim && !isSocial) || (isSocial && actionClicked) ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaimMilestone(milestone.id);
                  }}
                  size="sm"
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold shadow-lg shadow-yellow-900/30"
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Reclamar {milestone.tokenReward.toLocaleString()} CROC
                </Button>
              </motion.div>
            ) : (
              // Locked Coin Milestone state checks
              <div className="text-center p-2 bg-gray-800/30 rounded-lg">
                <div className="text-sm font-semibold text-muted-foreground">
                  {milestone.tokenReward.toLocaleString()} CROC
                </div>
                <div className="text-xs text-gray-500">
                  Faltan {(milestone.coinsRequired - gameState.totalCoins).toLocaleString()} monedas
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de progreso ONLY for Coin Milestones */}
        {!state.claimed && !isSocial && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Progreso: {Math.floor(gameState.totalCoins).toLocaleString()} / {milestone.coinsRequired.toLocaleString()}
              </span>
              <span>{Math.floor(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
              <motion.div
                className={`h-3 rounded-full ${canClaim
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-400'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            {/* Indicador de monedas faltantes */}
            {progressPercentage < 100 && (
              <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                <span>
                  Faltan {(milestone.coinsRequired - gameState.totalCoins).toLocaleString()} monedas
                </span>
                {gameState.coinsPerSecond > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{Math.ceil((milestone.coinsRequired - gameState.totalCoins) / gameState.coinsPerSecond)} segundos
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Información expandida */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              className="mt-4 pt-4 border-t border-gray-700/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Detalles del Hito
                  </h4>
                  <p className="text-xs text-gray-400">
                    Este hito forma parte del programa de farmeo previo al lanzamiento oficial de CROC.
                    Los tokens obtenidos se acreditarán automáticamente a tu wallet.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Valor estimado:</span>
                    <span className="font-bold text-green-400">
                      ${(milestone.tokenReward * 0.05).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Dificultad:</span>
                    <span className={`font-bold ${tierColor}`}>
                      {milestoneTier === 'legendary' ? '🚀 Épico' :
                        milestoneTier === 'epic' ? '🔥 Difícil' :
                          milestoneTier === 'rare' ? '⚡ Moderado' :
                            milestoneTier === 'uncommon' ? '✨ Fácil' : '📈 Básico'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Tasa de finalización:</span>
                    <span className="font-bold text-blue-400">
                      {Math.floor((claimedMilestones / FARMING_MILESTONES.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // 🎭 Renderizar hitos filtrados
  const milestones = filteredMilestones();

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <Trophy className="w-8 h-8 mr-3 text-yellow-400" />
            Hitos de Farmeo CROC
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
            ¡Acumula monedas para ganar tokens CROC antes del Fairlaunch! Cada hito alcanzado te acerca más a ser parte del ecosistema.
          </p>
        </motion.div>

        {/* 📊 Panel de estadísticas */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">
                  {stats.claimedMilestones}/{stats.totalMilestones}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Hitos Completados</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.completionRate}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>

            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 mr-2 text-emerald-400" />
                <span className="text-2xl font-bold text-emerald-400">
                  {stats.claimedTokens.toLocaleString()} CROC
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Tokens Obtenidos</p>
              <div className="text-xs text-emerald-300 mt-1">
                Total: {stats.totalTokens.toLocaleString()} CROC
              </div>
            </div>

            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-400">
                  {gameState.totalCoins.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Monedas Totales</p>
              <div className="text-xs text-yellow-300 mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{gameState.coinsPerSecond}/seg
              </div>
            </div>

            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Gift className="w-5 h-5 mr-2 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">
                  {stats.availableMilestones}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Hitos Disponibles</p>
              {stats.availableMilestones > 0 && (
                <div className="text-xs text-purple-300 mt-1 animate-pulse">
                  ¡Reclámalos ahora!
                </div>
              )}
            </div>
          </div>

          {/* Próximo hito */}
          {nextMilestone && (
            <motion.div
              className="p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-700/30 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <div>
                    <h3 className="font-bold text-yellow-300">Próximo Hito: {nextMilestone.name}</h3>
                    <p className="text-sm text-blue-200">
                      {nextMilestone.coinsRequired.toLocaleString()} monedas • {nextMilestone.tokenReward.toLocaleString()} CROC
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-300">Progreso</div>
                  <div className="text-lg font-bold text-green-400">{Math.floor(nextMilestoneProgress)}%</div>
                </div>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-3">
                <motion.div
                  className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${nextMilestoneProgress}%` }}
                  transition={{ duration: 1 }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="text-gray-300">
                  Faltan {(nextMilestone.coinsRequired - gameState.totalCoins).toLocaleString()} monedas
                </span>

                {timeUntilNext && (
                  <span className="text-yellow-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{timeUntilNext}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 🎯 Filtros */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => {
              setViewMode('all');
              sound('uiClick');
            }}
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Todos ({FARMING_MILESTONES?.length || 0})
          </Button>

          <Button
            onClick={() => {
              setViewMode('available');
              sound('uiClick');
            }}
            variant={viewMode === 'available' ? 'default' : 'outline'}
            size="sm"
            className={stats.availableMilestones > 0 ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            <Gift className="w-4 h-4 mr-2" />
            Disponibles ({stats.availableMilestones})
            {stats.availableMilestones > 0 && (
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="ml-2"
              >
                🔥
              </motion.span>
            )}
          </Button>

          <Button
            onClick={() => {
              setViewMode('claimed');
              sound('uiClick');
            }}
            variant={viewMode === 'claimed' ? 'default' : 'outline'}
            size="sm"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Reclamados ({stats.claimedMilestones})
          </Button>
        </div>

        {/* 📋 Lista de hitos */}
        <div className="space-y-6">
          {milestones.length > 0 ? (
            milestones.map((milestone, index) => renderMilestoneCard(milestone, index))
          ) : (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center">
                <Trophy className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                {viewMode === 'available' ? '¡No hay hitos disponibles!' :
                  viewMode === 'claimed' ? 'Aún no has reclamado hitos' :
                    'No hay hitos para mostrar'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                {viewMode === 'available'
                  ? 'Sigue farmeando monedas para desbloquear más hitos y ganar tokens CROC.'
                  : 'Completa hitos reclamando recompensas cuando estén disponibles.'}
              </p>
              {viewMode === 'available' && (
                <Button
                  onClick={() => setViewMode('all')}
                  variant="outline"
                  className="mx-auto"
                >
                  Ver todos los hitos
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {/* 📝 Información adicional */}
        <motion.div
          className="mt-8 p-4 bg-gradient-to-r from-gray-900/30 to-gray-800/30 rounded-xl border border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-lg mb-2 text-blue-300">¿Qué son los Hitos de Farmeo CROC?</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>
                  Los hitos de farmeo son objetivos que puedes alcanzar acumulando monedas en el juego.
                  Cada hito completado te recompensa con tokens CROC, la criptomoneda oficial del juego.
                </p>
                <p>
                  Estos tokens se acumulan en tu wallet y podrán ser utilizados en el ecosistema Cocodrilo Kombat
                  una vez se lance oficialmente el token.
                </p>
                <p className="text-yellow-300 font-semibold">
                  💡 Consejo: Enfócate en completar los hitos más bajos primero para obtener tokens
                  rápidamente y luego persigue los hitos más grandes.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// 🆕 Componente Info (no estaba importado)
const Info = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);