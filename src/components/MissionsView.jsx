
import React from 'react';
import { Button } from '@/components/ui/button';
import { ListChecks, CheckCircle, Award, Gift, Zap, DollarSign, Star as StarIcon, TrendingUp, CalendarCheck, Share2, UserPlus } from 'lucide-react';
import { MISSIONS, CARDS_DATA } from '@/config/gameConfig';

export function MissionsView({ missions, completeMission, claimMissionReward, gameState, upgrades, toast, playSound }) {
  const getMissionProgress = (mission) => {
    if (!mission.requirement) return { current: 0, target: 0, percentage: 0 };
    
    let current = 0;
    const target = mission.requirement.value;

    switch(mission.requirement.type) {
      case 'clicks': current = gameState.totalClicks; break;
      case 'coins': current = gameState.totalCoins; break;
      case 'level': current = gameState.level; break;
      case 'upgradeLevel': 
        const targetUpgrade = upgrades[mission.requirement.upgradeId];
        current = targetUpgrade ? targetUpgrade.level : 0;
        break;
      case 'social_share':
      case 'social_follow':
        current = missions[mission.id]?.progress || 0; 
        break;
      default: current = 0; break;
    }
    const percentage = target > 0 ? Math.min(100, (current / target) * 100) : (mission.requirement.type.startsWith('social_') && missions[mission.id]?.completed ? 100 : 0);
    return { current, target, percentage };
  };

  const handleSocialMission = (missionId, url) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    completeMission(missionId, true); 
    playSound('uiClick');
    toast({
      title: "🌐 Acción Social Registrada",
      description: "¡Gracias por tu apoyo! Verifica el progreso de la misión.",
      duration: 3000
    });
  };


  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <ListChecks className="w-8 h-8 mr-3 text-primary" /> Misiones de Cocodrilo
        </h1>

        <div className="space-y-6">
          {MISSIONS.map(mission => {
            const missionState = missions[mission.id];
            const progress = getMissionProgress(mission);
            const Icon = mission.icon || Award;

            return (
              <div 
                key={mission.id} 
                className={`mission-card rounded-xl p-4 md:p-6 shadow-lg transition-all duration-300 ${missionState.completed ? 'completed' : ''}`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
                  <div className="flex items-center mb-2 md:mb-0">
                    <Icon className={`w-8 h-8 mr-3 ${missionState.completed ? 'text-green-400' : 'text-primary'}`} />
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold">{mission.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{mission.description}</p>
                    </div>
                  </div>
                  {missionState.completed && !missionState.claimed && (
                    <Button 
                      onClick={() => claimMissionReward(mission.id)} 
                      size="sm" 
                      className="bg-yellow-500 hover:bg-yellow-600 text-black mobile-button sparkle-effect mt-2 md:mt-0"
                    >
                      <Gift className="w-4 h-4 mr-2" /> Reclamar Recompensa
                    </Button>
                  )}
                  {missionState.completed && missionState.claimed && (
                    <div className="flex items-center text-green-400 text-sm mt-2 md:mt-0">
                      <CheckCircle className="w-4 h-4 mr-1" /> Reclamada
                    </div>
                  )}
                  {!missionState.completed && (
                    mission.requirement.type.startsWith('social_') ? (
                       <Button 
                        onClick={() => handleSocialMission(mission.id, mission.requirement.url)} 
                        size="sm" 
                        className="bg-blue-500 hover:bg-blue-600 text-white mobile-button mt-2 md:mt-0"
                      >
                        {mission.requirement.type === 'social_share' ? <Share2 className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        {mission.requirement.actionText || "Realizar Acción"}
                      </Button>
                    ) : (
                       <Button 
                        onClick={() => completeMission(mission.id)} 
                        size="sm" 
                        variant="outline"
                        className="mobile-button mt-2 md:mt-0"
                      >
                        Verificar Progreso
                      </Button>
                    )
                  )}
                </div>

                {!missionState.completed && mission.requirement && !mission.requirement.type.startsWith('social_') && mission.requirement.type !== 'custom' && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso: {Math.floor(progress.current).toLocaleString()} / {progress.target.toLocaleString()}</span>
                      <span>{Math.floor(progress.percentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="progress-bar h-2.5 rounded-full" 
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {mission.reward && (
                  <div className="mt-3 pt-3 border-t border-border/50 text-xs md:text-sm text-muted-foreground">
                    Recompensa: {mission.reward.coins}💰
                    {mission.reward.xp && `, ${mission.reward.xp} XP`}
                    {mission.reward.cardId && CARDS_DATA.find(c => c.id === mission.reward.cardId) && `, 🃏 ${CARDS_DATA.find(c => c.id === mission.reward.cardId).name}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
