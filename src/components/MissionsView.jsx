import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  ListChecks,
  CheckCircle,
  Award,
  Gift,
  Zap,
  DollarSign,
  Star as StarIcon,
  TrendingUp,
  CalendarCheck,
  Share2,
  UserPlus,
  Target,
  Sparkles,
  BarChart3,
  Youtube,
  ThumbsUp,
  MessageCircle,
  UserCheck,
  RefreshCw,
  Check
} from 'lucide-react';
import { MISSIONS, CARDS_DATA } from '@/config/gameConfig';

export function MissionsView({
  missions,
  completeMission,
  claimMissionReward,
  gameState,
  upgrades,
  toast,
  playSound,
  verifyMissionCode, // 🆕 Prop passed from parent
  gameConfig // 🆕 Prop for global config
}) {
  const [secretCodeInput, setSecretCodeInput] = React.useState({}); // Store input per mission
  const [verifying, setVerifying] = React.useState(null);

  // 🎯 Obtener progreso de misión - OPTIMIZADO
  const getMissionProgress = (mission) => {
    if (!mission.requirement) return { current: 0, target: 0, percentage: 0 };

    let current = 0;
    const target = mission.requirement.value || 1;

    switch (mission.requirement.type) {
      case 'clicks':
        current = gameState.totalClicks || 0;
        break;
      case 'coins':
        current = gameState.totalCoins || 0;
        break;
      case 'level':
        current = gameState.level || 1;
        break;
      case 'upgradeLevel':
        const targetUpgrade = upgrades?.[mission.requirement.upgradeId];
        current = targetUpgrade?.level || 0;
        break;
      case 'social_share':
      case 'social_follow':
        current = missions?.[mission.id]?.progress || 0;
        break;
      default:
        current = 0;
        break;
    }

    const percentage = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    return { current, target, percentage };
  };

  // 🌐 Manejo de misiones sociales - MEJORADO
  const handleSocialMission = (missionId, url, actionText) => {
    if (!url) {
      toast({
        title: "❌ Enlace no disponible",
        description: "Esta acción social no está configurada correctamente.",
        duration: 3000
      });
      return;
    }

    // Abrir enlace en nueva pestaña
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (newWindow) {
      // Marcar como completada después de un breve delay
      setTimeout(() => {
        completeMission(missionId, true);
        playSound('missionComplete');

        toast({
          title: "✅ Acción Registrada",
          description: `¡Gracias por ${actionText?.toLowerCase() || "completar la acción"}!`,
          duration: 3000
        });
      }, 1000);
    }
  };

  // 🕵️ Manejo de Códigos Secretos
  const handleCodeVerification = async (missionId) => {
    const code = secretCodeInput[missionId];
    if (!code) {
      toast({ title: "⚠️ Código vacío", description: "Ingresa el código secreto primero." });
      return;
    }

    setVerifying(missionId);
    try {
      const result = await verifyMissionCode(missionId, code);
      if (result.success) {
        playSound('success');
        toast({ title: "✅ Código Correcto!", description: `+${result.reward_coins} Monedas` });
        // Manually trigger local update or reload if needed, but App state might sync
      } else {
        playSound('error');
        toast({ title: "❌ Código Incorrecto", description: result.error || "Inténtalo de nuevo", variant: "destructive" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(null);
    }
  };

  // 📊 Calcular estadísticas de misiones
  const completedMissions = Object.values(missions || {}).filter(m => m?.completed).length;
  const claimedMissions = Object.values(missions || {}).filter(m => m?.claimed).length;
  const totalMissions = MISSIONS.length;
  const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        {/* 🎯 Encabezado con estadísticas */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <ListChecks className="w-8 h-8 mr-3 text-primary" />
            Misiones del Pantano
          </h1>
          <p className="text-muted-foreground mb-4">
            Completa misiones para ganar recompensas especiales y subir de nivel
          </p>

          {/* 📊 Barra de progreso general */}
          <div className="max-w-2xl mx-auto bg-gray-800/50 rounded-xl p-4 border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-sm font-semibold">Progreso General</span>
              </div>
              <span className="text-green-400 font-bold">
                {completedMissions}/{totalMissions} ({Math.floor(completionRate)}%)
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            {/* 📈 Estadísticas rápidas */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-2 bg-green-900/20 rounded-lg border border-green-700/30">
                <div className="text-lg font-bold text-green-400">{completedMissions}</div>
                <div className="text-xs text-green-200">Completadas</div>
              </div>
              <div className="text-center p-2 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
                <div className="text-lg font-bold text-yellow-400">{claimedMissions}</div>
                <div className="text-xs text-yellow-200">Reclamadas</div>
              </div>
              <div className="text-center p-2 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="text-lg font-bold text-blue-400">{totalMissions}</div>
                <div className="text-xs text-blue-200">Totales</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 🎯 Lista de misiones */}
        <div className="space-y-6">
          {MISSIONS.map((mission, index) => {
            const missionState = missions?.[mission.id] || { completed: false, claimed: false, progress: 0 };
            const progress = getMissionProgress(mission);
            const Icon = mission.icon || Award;
            const isSocialMission = mission.requirement?.type?.startsWith('social_') || mission.requirement?.type === 'video_watch' || mission.validation_type === 'youtube_actions';

            return (
              <motion.div
                key={mission.id}
                className={`mission-card rounded-xl p-4 md:p-6 shadow-lg transition-all duration-300 backdrop-blur-sm ${missionState.completed
                  ? missionState.claimed
                    ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-2 border-green-500/50'
                    : 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/50'
                  : 'bg-card/80 border border-border/50 hover:border-primary/50'
                  }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
                  {/* 🎯 Información de la misión */}
                  <div className="flex items-start mb-2 md:mb-0 flex-1">
                    <div className={`p-3 rounded-lg mr-3 ${missionState.completed
                      ? 'bg-green-700/50'
                      : 'bg-gray-700/50'
                      }`}>
                      <Icon className={`w-6 h-6 ${missionState.completed ? 'text-green-300' : 'text-primary'
                        }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg md:text-xl font-semibold">{mission.name}</h3>
                        {mission.category && (
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                            {mission.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{mission.description}</p>

                      {/* 📊 Barra de progreso para misiones no sociales */}
                      {!missionState.completed && !isSocialMission && mission.requirement && (
                        <div className="mt-2 max-w-md">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progreso: {Math.floor(progress.current).toLocaleString()} / {progress.target.toLocaleString()}</span>
                            <span>{Math.floor(progress.percentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <motion.div
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.percentage}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 🎁 Botones de acción */}
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    {missionState.completed && !missionState.claimed && (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Button
                          onClick={() => claimMissionReward(mission.id)}
                          size="sm"
                          className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-bold sparkle-effect"
                        >
                          <Gift className="w-4 h-4 mr-2" />
                          Reclamar Recompensa
                        </Button>
                      </motion.div>
                    )}

                    {missionState.completed && missionState.claimed && (
                      <div className="flex items-center justify-center text-green-400 text-sm p-2 bg-green-900/30 rounded-lg">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Reclamada
                      </div>
                    )}

                    {/* 🕵️ INPUT DE CÓDIGO */}
                    {!missionState.completed && mission.requirement?.type === 'code' && (
                      <div className="flex gap-2 w-full">
                        <input
                          type="text"
                          placeholder="Ingresa código..."
                          className="flex-1 bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                          value={secretCodeInput[mission.id] || ''}
                          onChange={(e) => setSecretCodeInput({ ...secretCodeInput, [mission.id]: e.target.value })}
                        />
                        <Button
                          onClick={() => handleCodeVerification(mission.id)}
                          size="sm"
                          disabled={verifying === mission.id}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {verifying === mission.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </Button>
                      </div>
                    )}

                    {/* VIDEO WATCH */}
                    {!missionState.completed && mission.requirement?.type === 'video_watch' && (
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          onClick={() => handleSocialMission(mission.id, mission.requirement.url, mission.requirement.actionText || "Ver Video")}
                          variant="outline"
                          className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          {mission.requirement.actionText || "Ver Video"}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">Ve el video para completar</p>
                      </div>
                    )}

                    {/* YOUTUBE ACTIONS */}
                    {!missionState.completed && mission.validation_type === 'youtube_actions' && (
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          onClick={() => {
                            const globalYoutubeUrl = gameConfig?.daily_youtube_link?.url;
                            const url = mission.youtube_url || mission.requirement?.url || globalYoutubeUrl;
                            if (url) {
                              window.open(url, '_blank', 'noopener,noreferrer');
                              toast({
                                title: "📺 Video Abierto",
                                description: "Completa las acciones requeridas y vuelve para reclamar tu recompensa",
                                duration: 5000
                              });
                            }
                          }}
                          variant="outline"
                          className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          <Youtube className="w-4 h-4 mr-2" />
                          Abrir Video de YouTube
                        </Button>
                        {mission.video_actions && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p className="font-semibold">Acciones requeridas:</p>
                            <div className="flex flex-wrap gap-2">
                              {mission.video_actions.subscribe && <span className="flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded"><UserCheck className="w-3 h-3" /> Suscribirse</span>}
                              {mission.video_actions.like && <span className="flex items-center gap-1 bg-blue-900/20 px-2 py-1 rounded"><ThumbsUp className="w-3 h-3" /> Like</span>}
                              {mission.video_actions.comment && <span className="flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded"><MessageCircle className="w-3 h-3" /> Comentar</span>}
                              {mission.video_actions.follow && <span className="flex items-center gap-1 bg-purple-900/20 px-2 py-1 rounded"><UserPlus className="w-3 h-3" /> Seguir</span>}
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => completeMission(mission.id, true)}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 mt-2"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ya completé las acciones
                        </Button>
                      </div>
                    )}

                    {/* DAILY CODE */}
                    {!missionState.completed && mission.validation_type === 'daily_code' && (
                      <div className="flex flex-col gap-2 w-full">
                        <div className="text-xs text-muted-foreground mb-1">
                          <p>💡 Busca el código secreto en nuestros videos diarios</p>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Código diario..."
                            className="flex-1 bg-black/30 border border-cyan-600 rounded px-2 py-1 text-sm text-white uppercase"
                            value={secretCodeInput[mission.id] || ''}
                            onChange={(e) => setSecretCodeInput({ ...secretCodeInput, [mission.id]: e.target.value.toUpperCase() })}
                            maxLength={20}
                          />
                          <Button
                            onClick={() => handleCodeVerification(mission.id)}
                            size="sm"
                            disabled={verifying === mission.id}
                            className="bg-cyan-600 hover:bg-cyan-700"
                          >
                            {verifying === mission.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STANDARD / SOCIAL */}
                    {!missionState.completed && mission.requirement?.type !== 'code' && mission.requirement?.type !== 'video_watch' && (
                      isSocialMission ? (
                        <Button
                          onClick={() => handleSocialMission(
                            mission.id,
                            mission.requirement.url,
                            mission.requirement.actionText
                          )}
                          size="sm"
                          className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                        >
                          {mission.requirement.type === 'social_share' ?
                            <Share2 className="w-4 h-4 mr-2" /> :
                            <UserPlus className="w-4 h-4 mr-2" />
                          }
                          {mission.requirement.actionText || "Realizar Acción"}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => completeMission(mission.id)}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verificar Progreso
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* 💰 Recompensa */}
                {mission.reward && (
                  <motion.div
                    className="mt-3 pt-3 border-t border-border/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-semibold text-yellow-400 flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        Recompensa:
                      </span>

                      <div className="flex flex-wrap gap-2">
                        {mission.reward.coins > 0 && (
                          <span className="px-2 py-1 bg-yellow-900/30 rounded-lg flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-yellow-400" />
                            <span className="text-yellow-300 font-bold">+{mission.reward.coins} 💰</span>
                          </span>
                        )}

                        {mission.reward.xp && mission.reward.xp > 0 && (
                          <span className="px-2 py-1 bg-purple-900/30 rounded-lg flex items-center gap-1">
                            <StarIcon className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-300 font-bold">+{mission.reward.xp} XP</span>
                          </span>
                        )}

                        {mission.validation_type === 'code' && (
                          <span className="px-2 py-1 bg-pink-900/30 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3 text-pink-400" />
                            <span className="text-pink-300 font-bold">Código Secreto</span>
                          </span>
                        )}

                        {mission.reward.cardId && CARDS_DATA.find(c => c.id === mission.reward.cardId) && (
                          <span className="px-2 py-1 bg-indigo-900/30 rounded-lg flex items-center gap-1">
                            <span className="text-indigo-300">🃏</span>
                            <span className="text-indigo-300 font-bold">
                              {CARDS_DATA.find(c => c.id === mission.reward.cardId).name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* ℹ️ Información adicional */}
        <motion.div
          className="mt-8 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-border/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-lg">💡 Consejos para Misiones</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 p-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <span className="font-semibold">Misiones Sociales:</span>
                <p className="text-muted-foreground">Sigue nuestras redes sociales y comparte el juego para completarlas rápidamente.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <span className="font-semibold">Recompensas Diarias:</span>
                <p className="text-muted-foreground">Reclama recompensas diarias para obtener bonos adicionales.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
              <div>
                <span className="font-semibold">Cartas Coleccionables:</span>
                <p className="text-muted-foreground">Algunas misiones otorgan cartas especiales que mejoran tu juego.</p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
              <div>
                <span className="font-semibold">Sincronización:</span>
                <p className="text-muted-foreground">Tu progreso en misiones se guarda automáticamente en la nube.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}