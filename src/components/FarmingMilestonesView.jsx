
import React from 'react';
import { Button } from '@/components/ui/button';
import { Target, Award, Gift, CheckCircle, DollarSign } from 'lucide-react';
import { FARMING_MILESTONES } from '@/config/gameConfig';
import { motion } from 'framer-motion';

export function FarmingMilestonesView({ gameState, farmingMilestonesState, claimFarmingMilestone }) {
  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Target className="w-8 h-8 mr-3 text-yellow-400" /> Hitos de Farmeo CROC
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          ¡Alcanza estas metas de monedas para ganar tokens CROC antes del Fairlaunch! ¡Maximiza tus ganancias!
        </p>

        <div className="space-y-6">
          {FARMING_MILESTONES.map((milestone, index) => {
            const state = farmingMilestonesState[milestone.id];
            const canClaim = gameState.totalCoins >= milestone.coinsRequired && !state.claimed;
            const progressPercentage = Math.min(100, (gameState.totalCoins / milestone.coinsRequired) * 100);

            return (
              <motion.div
                key={milestone.id}
                className={`mission-card rounded-xl p-4 md:p-6 shadow-lg transition-all duration-300 ${state.claimed ? 'completed' : (canClaim ? 'border-yellow-400 border-2' : '')}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3">
                  <div className="flex items-center mb-2 md:mb-0">
                    <Award className={`w-8 h-8 mr-3 ${state.claimed ? 'text-green-400' : (canClaim ? 'text-yellow-400 animate-pulse' : 'text-primary')}`} />
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold">{milestone.name}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        Requisito: {milestone.coinsRequired.toLocaleString()} monedas
                      </p>
                    </div>
                  </div>
                  {state.claimed ? (
                    <div className="flex items-center text-green-400 text-sm mt-2 md:mt-0">
                      <CheckCircle className="w-4 h-4 mr-1" /> Reclamado ({milestone.tokenReward.toLocaleString()} CROC)
                    </div>
                  ) : canClaim ? (
                    <Button 
                      onClick={() => claimFarmingMilestone(milestone.id)} 
                      size="sm" 
                      className="bg-yellow-500 hover:bg-yellow-600 text-black mobile-button sparkle-effect mt-2 md:mt-0"
                    >
                      <Gift className="w-4 h-4 mr-2" /> Reclamar {milestone.tokenReward.toLocaleString()} CROC
                    </Button>
                  ) : (
                     <div className="text-sm text-muted-foreground mt-2 md:mt-0">
                        {milestone.tokenReward.toLocaleString()} CROC
                     </div>
                  )}
                </div>

                {!state.claimed && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progreso: {Math.floor(gameState.totalCoins).toLocaleString()} / {milestone.coinsRequired.toLocaleString()}</span>
                      <span>{Math.floor(progressPercentage)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${canClaim ? 'bg-yellow-400' : 'progress-bar'}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
