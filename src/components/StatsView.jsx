import React from 'react';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Layers as LayersIcon, 
  ShoppingBag, 
  Target, 
  DollarSign,
  Users,
  Sparkles,
  Coins,
  Award
} from 'lucide-react';
import { UPGRADES, ACHIEVEMENTS, FARMING_MILESTONES } from '@/config/gameConfig';

export function StatsView({ 
  gameState, 
  upgrades, 
  achievementsUnlocked, 
  ownedCardsCount, 
  ownedItemsCount, 
  farmingMilestonesCount,
  referralStats, // ✅ NUEVA PROP PARA REFERIDOS
  tokenPrice = 0.05 // ✅ NUEVA PROP PARA PRECIO DEL TOKEN (valor por defecto)
}) {
  // ✅ Calcular valor proyectado de tokens CROC
  const projectedCrocValue = (gameState.nativeTokenBalance || 0) * tokenPrice;

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">📊 Estadísticas</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <GeneralStatsCard 
            gameState={gameState} 
            ownedCardsCount={ownedCardsCount} 
            ownedItemsCount={ownedItemsCount} 
            farmingMilestonesCount={farmingMilestonesCount}
            projectedCrocValue={projectedCrocValue}
            tokenPrice={tokenPrice}
          />
          <AchievementsCard achievementsUnlocked={achievementsUnlocked} />
          <UpgradesOwnedCard upgradesState={upgrades} />
          {/* ✅ NUEVA TARJETA DE REFERIDOS */}
          <ReferralsStatsCard 
            referralStats={referralStats} 
            projectedCrocValue={projectedCrocValue}
            tokenPrice={tokenPrice}
          />
          {/* ✅ NUEVA TARJETA DE VALOR PROYECTADO */}
          <ProjectedValueCard 
            gameState={gameState}
            projectedCrocValue={projectedCrocValue}
            tokenPrice={tokenPrice}
          />
        </div>
      </div>
    </div>
  );
}

function GeneralStatsCard({ gameState, ownedCardsCount, ownedItemsCount, farmingMilestonesCount, projectedCrocValue, tokenPrice }) {
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
          { label: "Monedas Actuales:", value: Math.floor(gameState.coins).toLocaleString(), color: "text-yellow-300" },
          { label: "Nivel Actual:", value: gameState.level, color: "text-purple-400" },
          { label: "Poder de Clic:", value: Math.floor(gameState.clickPower), color: "text-red-400" },
          { label: "Monedas/Segundo:", value: gameState.coinsPerSecond.toFixed(1), color: "text-green-400" },
          { label: "Energía Actual:", value: `${gameState.energy}/${gameState.maxEnergy}`, color: "text-blue-400" },
          { label: "Experiencia:", value: `${gameState.experience % 100}/100`, color: "text-purple-300" },
          { label: "Cartas Obtenidas:", value: ownedCardsCount, color: "text-indigo-400", icon: LayersIcon },
          { label: "Ítems Comprados:", value: ownedItemsCount, color: "text-pink-400", icon: ShoppingBag },
          { label: "Hitos CROC:", value: `${farmingMilestonesCount} / ${FARMING_MILESTONES.length}`, color: "text-yellow-500", icon: Target },
          { label: "Tokens CROC:", value: (gameState.nativeTokenBalance || 0).toLocaleString(), color: "text-yellow-500", icon: DollarSign },
          { label: "Precio CROC Actual:", value: `$${tokenPrice}`, color: "text-green-400" },
        ].map(stat => (
          <div key={stat.label} className="flex justify-between items-center">
            <span className="flex items-center text-sm">
              {stat.icon && <stat.icon className={`w-4 h-4 mr-1.5 ${stat.color}`} />}
              {stat.label}
            </span>
            <span className={`font-bold ${stat.color} text-sm`}>{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ NUEVO COMPONENTE PARA ESTADÍSTICAS DE REFERIDOS
function ReferralsStatsCard({ referralStats = {}, projectedCrocValue, tokenPrice }) {
  const stats = {
    referralsCount: referralStats?.referralsCount || 0,
    coinsFromRefs: referralStats?.coinsFromRefs || 0,
    crocFromRefs: referralStats?.crocFromRefs || 0,
  };

  const totalReferralValue = (stats.crocFromRefs * tokenPrice) + (stats.coinsFromRefs * 0.0001); // Valor aproximado de monedas

  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Users className="w-6 h-6 mr-2 text-green-400" />
        Programa de Referidos
      </h3>
      
      <div className="space-y-4">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-900/30 rounded-lg p-3 text-center border border-green-700/30">
            <Users className="w-6 h-6 mx-auto mb-1 text-green-300" />
            <div className="text-lg font-bold text-green-400">{stats.referralsCount}</div>
            <div className="text-xs text-green-200">Referidos</div>
          </div>
          <div className="bg-yellow-900/30 rounded-lg p-3 text-center border border-yellow-700/30">
            <Coins className="w-6 h-6 mx-auto mb-1 text-yellow-300" />
            <div className="text-lg font-bold text-yellow-400">{stats.coinsFromRefs.toLocaleString()}</div>
            <div className="text-xs text-yellow-200">Monedas</div>
          </div>
        </div>

        {/* Desglose detallado */}
        <div className="space-y-3">
          {[
            { label: "Referidos Activos:", value: stats.referralsCount, color: "text-green-400" },
            { label: "Monedas por Referidos:", value: stats.coinsFromRefs.toLocaleString(), color: "text-yellow-400" },
            { label: "Tokens CROC por Referidos:", value: stats.crocFromRefs, color: "text-emerald-400" },
            { label: "Valor Total Referidos:", value: `$${totalReferralValue.toFixed(2)}`, color: "text-blue-400" },
          ].map(stat => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-sm">{stat.label}</span>
              <span className={`font-bold ${stat.color} text-sm`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Bonificación activa */}
        {stats.referralsCount > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-green-900/40 to-emerald-800/40 rounded-lg border border-green-600/30">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-green-300" />
              <p className="text-xs text-green-200 text-center">
                ¡Ganando recompensas por tus {stats.referralsCount} referido(s)!
              </p>
            </div>
          </div>
        )}

        {/* Información del programa */}
        <div className="mt-3 p-2 bg-gray-800/30 rounded border border-gray-700/50">
          <p className="text-xs text-gray-300 text-center">
            💰 Cada referido te da 10% de sus ganancias
          </p>
        </div>
      </div>
    </div>
  );
}

// ✅ NUEVO COMPONENTE PARA VALOR PROYECTADO
function ProjectedValueCard({ gameState, projectedCrocValue, tokenPrice }) {
  const totalProjectedValue = projectedCrocValue + (gameState.coins * 0.0001); // Valor aproximado de monedas

  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Award className="w-6 h-6 mr-2 text-yellow-400" />
        Valor Proyectado
      </h3>
      
      <div className="space-y-4">
        {/* Valor principal */}
        <div className="bg-gradient-to-r from-yellow-900/40 to-amber-800/40 rounded-lg p-4 text-center border border-yellow-600/30">
          <div className="text-2xl font-bold text-yellow-400 mb-1">
            ${totalProjectedValue.toFixed(2)}
          </div>
          <div className="text-xs text-yellow-200">Valor Total Proyectado</div>
        </div>

        {/* Desglose */}
        <div className="space-y-3">
          {[
            { 
              label: "Tokens CROC:", 
              value: `$${projectedCrocValue.toFixed(2)}`, 
              detail: `${(gameState.nativeTokenBalance || 0).toLocaleString()} CROC @ $${tokenPrice}`,
              color: "text-yellow-400" 
            },
            { 
              label: "Monedas:", 
              value: `$${(gameState.coins * 0.0001).toFixed(2)}`, 
              detail: `${Math.floor(gameState.coins).toLocaleString()} monedas`,
              color: "text-yellow-300" 
            },
            { 
              label: "Por Segundo:", 
              value: `$${(gameState.coinsPerSecond * 0.0001 * 3600).toFixed(2)}/h`, 
              detail: "Proyección horaria",
              color: "text-green-400" 
            },
          ].map(stat => (
            <div key={stat.label} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-sm">{stat.label}</span>
                  <span className={`font-bold ${stat.color} text-sm`}>{stat.value}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">{stat.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Nota informativa */}
        <div className="mt-3 p-2 bg-blue-900/20 rounded border border-blue-700/30">
          <p className="text-xs text-blue-300 text-center">
            💡 Valores basados en precio simulado de CROC
          </p>
        </div>
      </div>
    </div>
  );
}

function AchievementsCard({ achievementsUnlocked }) {
  const unlockedCount = achievementsUnlocked.length;
  const totalCount = ACHIEVEMENTS.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <div className="stats-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
          Logros
        </h3>
        <div className="text-sm text-yellow-400 font-bold">
          {unlockedCount}/{totalCount}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span>Progreso</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {ACHIEVEMENTS.map(achievement => {
          const unlocked = achievementsUnlocked.includes(achievement.id);
          const Icon = achievement.icon;
          return (
            <div 
              key={achievement.id} 
              className={`flex items-center p-3 rounded-lg transition-all duration-300 ${
                unlocked 
                  ? 'bg-green-900/30 border border-green-700/50' 
                  : 'bg-gray-800/30 border border-gray-700/30'
              }`}
            >
              <div className={`p-2 rounded-lg mr-3 ${
                unlocked ? 'bg-green-700/50' : 'bg-gray-700/50'
              }`}>
                {unlocked ? 
                  <Icon className="w-5 h-5 text-green-300" /> : 
                  <Icon className="w-5 h-5 text-gray-500" />
                }
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold text-sm ${unlocked ? 'text-green-300' : 'text-gray-400'}`}>
                  {achievement.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                <div className="text-xs text-gray-500 mt-1">
                  Requiere: {achievement.requirement} {achievement.type}
                </div>
              </div>
              {unlocked && (
                <div className="ml-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UpgradesOwnedCard({ upgradesState }) {
  const totalLevels = Object.values(upgradesState).reduce((sum, upgrade) => sum + upgrade.level, 0);
  const totalUpgrades = UPGRADES.length;
  const averageLevel = totalLevels / totalUpgrades;

  return (
    <div className="stats-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
          Mejoras Compradas
        </h3>
        <div className="text-sm text-green-400 font-bold">
          Nv. Prom: {averageLevel.toFixed(1)}
        </div>
      </div>

      {/* Resumen de niveles */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-green-900/30 rounded p-2 text-center border border-green-700/30">
          <div className="text-lg font-bold text-green-400">{totalLevels}</div>
          <div className="text-xs text-green-200">Niveles</div>
        </div>
        <div className="bg-blue-900/30 rounded p-2 text-center border border-blue-700/30">
          <div className="text-lg font-bold text-blue-400">
            {Object.values(upgradesState).filter(u => u.level > 0).length}
          </div>
          <div className="text-xs text-blue-200">Mejoras</div>
        </div>
        <div className="bg-purple-900/30 rounded p-2 text-center border border-purple-700/30">
          <div className="text-lg font-bold text-purple-400">{totalUpgrades}</div>
          <div className="text-xs text-purple-200">Total</div>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
        {UPGRADES.map(upgrade => {
          const level = upgradesState[upgrade.id].level;
          const Icon = upgrade.icon;
          const progress = (level / 10) * 100; // Asumiendo máximo nivel 10

          return (
            <div key={upgrade.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20">
              <div className="flex items-center flex-1">
                <Icon className={`w-4 h-4 mr-2 ${upgrade.color}`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{upgrade.name}</span>
                    <span className="font-bold text-yellow-400 text-sm">Nv. {level}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${upgrade.color}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}