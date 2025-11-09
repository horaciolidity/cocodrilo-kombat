
import React from 'react';
import { BarChart3, Trophy, TrendingUp, Layers as LayersIcon, ShoppingBag, Target, DollarSign } from 'lucide-react';
import { UPGRADES, ACHIEVEMENTS, FARMING_MILESTONES } from '@/config/gameConfig';

export function StatsView({ gameState, upgrades, achievementsUnlocked, ownedCardsCount, ownedItemsCount, farmingMilestonesCount }) {
  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">📊 Estadísticas</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GeneralStatsCard gameState={gameState} ownedCardsCount={ownedCardsCount} ownedItemsCount={ownedItemsCount} farmingMilestonesCount={farmingMilestonesCount} />
          <AchievementsCard achievementsUnlocked={achievementsUnlocked} />
          <UpgradesOwnedCard upgradesState={upgrades} />
        </div>
      </div>
    </div>
  );
}

function GeneralStatsCard({ gameState, ownedCardsCount, ownedItemsCount, farmingMilestonesCount }) {
  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
        Estadísticas Generales
      </h3>
      <div className="space-y-3">
        {[
          { label: "Clics Totales:", value: gameState.totalClicks.toLocaleString(), color: "text-yellow-400" },
          { label: "Monedas Totales:", value: Math.floor(gameState.totalCoins).toLocaleString(), color: "text-yellow-400" },
          { label: "Nivel Actual:", value: gameState.level, color: "text-purple-400" },
          { label: "Poder de Clic:", value: Math.floor(gameState.clickPower), color: "text-red-400" },
          { label: "Monedas/Segundo:", value: gameState.coinsPerSecond, color: "text-green-400" },
          { label: "Cartas Obtenidas:", value: ownedCardsCount, color: "text-indigo-400", icon: LayersIcon },
          { label: "Ítems Comprados:", value: ownedItemsCount, color: "text-pink-400", icon: ShoppingBag },
          { label: "Hitos CROC:", value: `${farmingMilestonesCount} / ${FARMING_MILESTONES.length}`, color: "text-yellow-500", icon: Target },
          { label: "Tokens CROC Farm.:", value: gameState.nativeTokenBalance.toLocaleString(), color: "text-yellow-500", icon: DollarSign },
        ].map(stat => (
          <div key={stat.label} className="flex justify-between items-center">
            <span className="flex items-center">
              {stat.icon && <stat.icon className={`w-4 h-4 mr-1.5 ${stat.color}`} />}
              {stat.label}
            </span>
            <span className={`font-bold ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsCard({ achievementsUnlocked }) {
  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
        Logros ({achievementsUnlocked.length}/{ACHIEVEMENTS.length})
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {ACHIEVEMENTS.map(achievement => {
          const unlocked = achievementsUnlocked.includes(achievement.id);
          const Icon = achievement.icon;
          return (
            <div key={achievement.id} className={`flex items-center p-2 rounded-lg ${unlocked ? 'bg-green-700/30' : 'bg-gray-800/30'}`}>
              <div className="text-2xl mr-3">
                {unlocked ? <Icon className="w-6 h-6 text-green-400" /> : <Icon className="w-6 h-6 text-gray-500" />}
              </div>
              <div>
                <h4 className={`font-semibold ${unlocked ? 'text-green-300' : 'text-gray-400'}`}>
                  {achievement.name}
                </h4>
                <p className="text-xs text-muted-foreground">{achievement.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpgradesOwnedCard({ upgradesState }) {
  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
        Mejoras Compradas
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {UPGRADES.map(upgrade => {
          const level = upgradesState[upgrade.id].level;
          const Icon = upgrade.icon;
          return (
            <div key={upgrade.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <Icon className={`w-4 h-4 mr-2 ${upgrade.color}`} />
                <span className="text-sm">{upgrade.name}</span>
              </div>
              <span className="font-bold text-yellow-400">Nv. {level}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
