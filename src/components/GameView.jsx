
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, Star, Zap, ShoppingCart, Gift, Palette, DollarSign, BarChart2, ExternalLink } from 'lucide-react';
import { UPGRADES, SHOP_ITEMS } from '@/config/gameConfig';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const generateRandomPriceData = () => {
  let price = 0.05;
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({ name: `D${i+1}`, price: parseFloat(price.toFixed(4)) });
    price += (Math.random() - 0.45) * 0.01; 
    if (price < 0.01) price = 0.01; 
  }
  return data;
};


export function GameView({ gameState, upgrades, buyUpgrade, handleClick, clickEffect, floatingNumbers, dailyRewards, claimDailyReward, tutorialStep, showTutorial, activeSkin, toast }) {
  const [tokenPrice, setTokenPrice] = useState(0.05);
  const [liquidity, setLiquidity] = useState(50000);
  const [priceData, setPriceData] = useState(generateRandomPriceData());

  useEffect(() => {
    const interval = setInterval(() => {
      setTokenPrice(prev => parseFloat(Math.max(0.01, prev + (Math.random() - 0.5) * 0.005).toFixed(4)));
      setLiquidity(prev => Math.max(10000, prev + (Math.random() - 0.5) * 1000));
      setPriceData(prevData => {
        const currentTokenPrice = parseFloat(Math.max(0.01, tokenPrice + (Math.random() - 0.5) * 0.005).toFixed(4));
        const newData = [...prevData.slice(1), { name: `D${prevData.length}`, price: currentTokenPrice }];
        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []); 
  
  const getCrocodileCharacter = () => {
    if (activeSkin) {
      const skin = SHOP_ITEMS.find(item => item.id === activeSkin);
      if (skin && skin.id === 'skin_golden_croc') return '🌟🐊';
      if (skin && skin.id === 'skin_camo_croc') return '🌳🐊';
      if (skin && skin.id === 'skin_cyborg_croc') return '🤖🐊';
    }
    return '🐊'; 
  };

  const handleBuyToken = () => {
    toast({
      title: "🚧 Comprar Token CROC",
      description: "Esta función te redirigirá a un exchange descentralizado (DEX) para comprar tokens CROC. ¡Próximamente!",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-optimized">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Coins} value={Math.floor(gameState.coins).toLocaleString()} label="Monedas" color="text-yellow-400" />
        <StatCard icon={TrendingUp} value={`${gameState.coinsPerSecond}/s`} label="Por Segundo" color="text-green-400" />
        <StatCard icon={Star} value={gameState.level} label="Nivel" color="text-purple-400" />
        <EnergyStatCard energy={gameState.energy} maxEnergy={gameState.maxEnergy} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[400px] relative">
          <motion.div
            className={`relative ${clickEffect ? 'click-effect' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleClick}
              className={`w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-green-500 via-lime-500 to-emerald-600 hover:from-green-400 hover:via-lime-400 hover:to-emerald-500 border-4 border-green-300 shadow-2xl glow-effect mobile-button ${tutorialStep === 0 && showTutorial ? 'tutorial-highlight' : ''}`}
              disabled={gameState.energy <= 0}
            >
              <div className="text-center">
                <div className="text-6xl mb-2 crocodile-bounce">{getCrocodileCharacter()}</div>
                <div className="text-white font-bold text-lg neon-glow">¡MORDER!</div>
                <div className="text-lime-200 text-sm">+{Math.floor(gameState.clickPower)}</div>
              </div>
            </Button>
          </motion.div>

          <AnimatePresence>
            {floatingNumbers.map(num => (
              <motion.div
                key={num.id}
                className="floating-number"
                style={{ left: num.x, top: num.y }}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -80, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                +{num.value}
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="mt-8 w-full max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span>Nivel {gameState.level}</span>
              <span>{gameState.experience % 100}/100 XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="progress-bar h-3 rounded-full transition-all duration-300" 
                style={{ width: `${(gameState.experience % 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
          <TokenInfoPanel tokenPrice={tokenPrice} liquidity={liquidity} priceData={priceData} onBuyToken={handleBuyToken} />
          <UpgradePanel upgradesConfig={UPGRADES} upgradesState={upgrades} buyUpgrade={buyUpgrade} coins={gameState.coins} tutorialStep={tutorialStep} showTutorial={showTutorial} />
          <DailyRewardPanel dailyRewards={dailyRewards} claimDailyReward={claimDailyReward} />
        </div>
      </div>
    </div>
  );
}

function TokenInfoPanel({ tokenPrice, liquidity, priceData, onBuyToken }) {
  return (
    <div className="stats-card rounded-xl p-4">
      <h3 className="text-xl font-bold mb-3 flex items-center">
        <DollarSign className="w-6 h-6 mr-2 text-primary" /> Token CROC 🐊
      </h3>
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span>Precio Actual:</span>
          <span className="font-semibold text-primary">${tokenPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Liquidez Total:</span>
          <span className="font-semibold text-primary">${liquidity.toLocaleString()}</span>
        </div>
      </div>
      <div className="h-24 w-full mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
            />
            <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Button onClick={onBuyToken} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mobile-button">
        <ExternalLink className="w-4 h-4 mr-2" /> Comprar Token CROC
      </Button>
    </div>
  );
}


function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="stats-card rounded-xl p-3 md:p-4 text-center">
      <div className="flex items-center justify-center mb-1 md:mb-2">
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${color} mr-2`} />
        <span className={`text-md md:text-lg font-bold ${label === 'Monedas' ? 'gradient-text' : color}`}>{value}</span>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function EnergyStatCard({ energy, maxEnergy }) {
  return (
    <div className="stats-card rounded-xl p-3 md:p-4 text-center">
      <div className="flex items-center justify-center mb-1 md:mb-2">
        <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-400 mr-2" />
        <span className="text-md md:text-lg font-bold text-blue-400">{energy}/{maxEnergy}</span>
      </div>
      <p className="text-xs text-muted-foreground">Energía</p>
      <div className="w-full bg-gray-700 rounded-full h-1.5 md:h-2 mt-2">
        <div 
          className="energy-bar h-1.5 md:h-2 rounded-full" 
          style={{ width: `${(energy / maxEnergy) * 100}%` }}
        />
      </div>
    </div>
  );
}

function UpgradePanel({ upgradesConfig, upgradesState, buyUpgrade, coins, tutorialStep, showTutorial }) {
  return (
    <div className="upgrade-card rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <ShoppingCart className="w-6 h-6 mr-2 text-blue-400" />
        Mejoras
      </h3>
      <div className="space-y-3 max-h-60 md:max-h-96 overflow-y-auto scrollbar-hide">
        {upgradesConfig.map(upgrade => {
          const currentLevel = upgradesState[upgrade.id].level;
          const price = Math.floor(upgrade.basePrice * Math.pow(1.5, currentLevel));
          const canAfford = coins >= price;
          const Icon = upgrade.icon;
          return (
            <div key={upgrade.id} className={`glass-effect rounded-lg p-3 hover-lift ${tutorialStep === 1 && showTutorial && upgrade.id === 'auto늪지' ? 'tutorial-highlight' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-2 ${upgrade.color}`} />
                  <div>
                    <h4 className="font-semibold text-sm">{upgrade.name}</h4>
                    <p className="text-xs text-muted-foreground">{upgrade.description}</p>
                  </div>
                </div>
                {currentLevel > 0 && (
                  <div className="level-badge text-xs px-2 py-1 rounded-full text-white">
                    Nv. {currentLevel}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-bold text-sm">
                  {price.toLocaleString()} 💰
                </span>
                <Button
                  onClick={() => buyUpgrade(upgrade.id)}
                  disabled={!canAfford}
                  size="sm"
                  className={`mobile-button ${canAfford ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600'}`}
                >
                  Comprar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyRewardPanel({ dailyRewards, claimDailyReward }) {
  return (
    <div className="daily-reward-card rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Gift className="w-6 h-6 mr-2 text-pink-400" />
        Recompensa Diaria
      </h3>
      <div className="text-center">
        <div className="text-3xl mb-2">🎁</div>
        <p className="text-sm text-muted-foreground mb-3">
          Racha actual: {dailyRewards.streak} días
        </p>
        <Button
          onClick={claimDailyReward}
          disabled={!dailyRewards.available}
          className={`w-full mobile-button ${dailyRewards.available ? 'bg-pink-600 hover:bg-pink-700 sparkle-effect' : 'bg-gray-600'}`}
        >
          {dailyRewards.available ? 'Reclamar Recompensa' : 'Ya Reclamada Hoy'}
        </Button>
      </div>
    </div>
  );
}
