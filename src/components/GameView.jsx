import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabase } from "@/lib/customSupabaseClient";

import {
  Coins,
  TrendingUp,
  Star,
  Zap,
  ShoppingCart,
  Gift,
  DollarSign,
  BarChart2,
  ExternalLink,
} from 'lucide-react';
import { UPGRADES, SHOP_ITEMS } from '@/config/gameConfig';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useSound } from '@/hooks/useSound';

const generateRandomPriceData = () => {
  let price = 0.05;
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({ name: `D${i + 1}`, price: parseFloat(price.toFixed(4)) });
    price += (Math.random() - 0.45) * 0.01;
    if (price < 0.01) price = 0.01;
  }
  return data;
};

export function GameView({
  gameState,
  upgrades,
  buyUpgrade,
  handleClick,
  floatingNumbers,
  dailyRewards,
  claimDailyReward,
  tutorialStep,
  showTutorial,
  activeSkin,
  toast,
}) {
  const [tokenPrice, setTokenPrice] = useState(0.05);
  const [liquidity, setLiquidity] = useState(50000);
  const [priceData, setPriceData] = useState(generateRandomPriceData());
  const [isClicked, setIsClicked] = useState(false);
  const { playSound } = useSound();
  const videoRefIdle = useRef(null);
  const videoRefBite = useRef(null);

  // 💾 Asegurar que el jugador exista en player_stats antes de sincronizar
  useEffect(() => {
    const ensurePlayerStats = async () => {
      if (!gameState?.playerId) return;

      try {
        const { data: existing, error: selectError } = await supabase
          .from("player_stats")
          .select("id")
          .eq("player_id", gameState.playerId)
          .maybeSingle();

        if (selectError) console.warn("⚠️ Error verificando stats:", selectError.message);

        if (!existing) {
          console.log("🆕 Creando registro en player_stats...");
          const { error: insertError } = await supabase.from("player_stats").insert({
            player_id: gameState.playerId,
            coins: 0,
            croc_tokens: 0,
            level: 1,
            clicks: 0,
            updated_at: new Date().toISOString(),
          });
          if (insertError) console.error("❌ Error creando stats:", insertError.message);
        }
      } catch (err) {
        console.error("❌ Error general en ensurePlayerStats:", err);
      }
    };

    ensurePlayerStats();
  }, [gameState?.playerId]);

 // En GameView.jsx, reemplaza los useEffect de sincronización con esto:

useEffect(() => {
  if (!gameState?.playerId) return;

  // Sincronizar solo cuando cambien valores importantes
  const shouldSync = 
    Math.floor(gameState.coins) !== Math.floor(prevCoinsRef.current) ||
    gameState.level !== prevLevelRef.current ||
    gameState.totalClicks !== prevClicksRef.current;

  if (shouldSync) {
    syncStatsToSupabase({
      coins: gameState.coins,
      croc_tokens: gameState.nativeTokenBalance,
      level: gameState.level,
      clicks: gameState.totalClicks,
    });

    // Actualizar referencias
    prevCoinsRef.current = Math.floor(gameState.coins);
    prevLevelRef.current = gameState.level;
    prevClicksRef.current = gameState.totalClicks;
  }
}, [gameState.coins, gameState.level, gameState.totalClicks, gameState.playerId, syncStatsToSupabase]);

  // Simulación simple de precio/token
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenPrice(prev =>
        parseFloat(
          Math.max(0.01, prev + (Math.random() - 0.5) * 0.005).toFixed(4),
        ),
      );
      setLiquidity(prev =>
        Math.max(10000, prev + (Math.random() - 0.5) * 1000),
      );
      setPriceData(prevData => {
        const newPrice = parseFloat(
          Math.max(
            0.01,
            tokenPrice + (Math.random() - 0.5) * 0.005,
          ).toFixed(4),
        );
        return [
          ...prevData.slice(1),
          { name: `D${prevData.length}`, price: newPrice },
        ];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [tokenPrice]);

  const getCrocodileCharacter = () => {
    if (activeSkin) {
      const skin = SHOP_ITEMS.find(item => item.id === activeSkin);
      if (skin?.id === 'skin_golden_croc') return '🌟🐊';
      if (skin?.id === 'skin_camo_croc') return '🌳🐊';
      if (skin?.id === 'skin_cyborg_croc') return '🤖🐊';
    }
    return '🐊';
  };

  // 🐊 Reproduce el video y el sonido cuando se hace clic en el cocodrilo
const handleCrocClick = (event) => {
  handleClick(event);
  playSound('bite');

  if (videoRefIdle.current && videoRefBite.current) {
    // pausa el video idle
    videoRefIdle.current.pause();
    // reinicia y reproduce el video de mordida
    videoRefBite.current.currentTime = 0;
    videoRefBite.current.play();
  }

  setIsClicked(true);
  setTimeout(() => setIsClicked(false), 300);
};



  const handleBuyToken = () => {
    toast({
      title: '🚧 Comprar Token CROC',
      description:
        'Próximamente podrás adquirir CROC en un exchange descentralizado (DEX).',
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-optimized">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          icon={Coins}
          value={Math.floor(gameState.coins).toLocaleString()}
          label="Monedas"
          color="text-yellow-400"
        />
        <StatCard
          icon={TrendingUp}
          value={`${gameState.coinsPerSecond}/s`}
          label="Por Segundo"
          color="text-green-400"
        />
        <StatCard
          icon={Star}
          value={gameState.level}
          label="Nivel"
          color="text-purple-400"
        />
        <EnergyStatCard
          energy={gameState.energy}
          maxEnergy={gameState.maxEnergy}
        />
        <StatCard
          icon={BarChart2}
          value={`${gameState.nativeTokenBalance?.toLocaleString() || 0}`}
          label="CROC Tokens"
          color="text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
{/* 🐊 Zona del cocodrilo */}
<div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[400px] relative">
  <motion.div
    whileHover={{ scale: 1.05 }}
    animate={isClicked ? { scale: [1, 0.9, 1.1, 1] } : { scale: 1 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className="relative"
  >
    <div
      onClick={(event) => {
        if (gameState.energy <= 0) {
          const el = event.currentTarget;
          el.classList.add('shake');
          playSound('error');
          setTimeout(() => el.classList.remove('shake'), 500);
          return;
        }

        handleClick(event);
        playSound('bite');
        setIsClicked(true);

        // 🎥 Solo video 2 (mordida)
        if (videoRefBite.current) {
          videoRefBite.current.pause();
          videoRefBite.current.currentTime = 0;
          videoRefBite.current.play().catch(() => {});
        }

        // 🪙 Efecto +1 — aparece donde se hace click
        const clickEffect = document.createElement('div');
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        clickEffect.textContent = `+${Math.floor(gameState.clickPower)}`;
        clickEffect.style.position = 'absolute';
        clickEffect.style.left = `${x}px`;
        clickEffect.style.top = `${y}px`;
        clickEffect.style.transform = 'translate(-50%, -50%)';
        clickEffect.style.pointerEvents = 'none';
        clickEffect.style.fontWeight = 'bold';
        clickEffect.style.fontSize = '30px';
        clickEffect.style.zIndex = '50';
        clickEffect.style.animation = 'riseUp 1.2s ease-out forwards';

        const lvl = gameState.level;
        clickEffect.style.color =
          lvl < 5 ? '#bef264' :
          lvl < 10 ? '#86efac' :
          lvl < 20 ? '#4ade80' :
          lvl < 30 ? '#22c55e' : '#16a34a';

        event.currentTarget.appendChild(clickEffect);
        setTimeout(() => clickEffect.remove(), 1200);

        // 🔁 Reset efecto de clic visual
        setTimeout(() => setIsClicked(false), 200);
      }}
      className={`relative w-[22rem] h-[22rem] sm:w-[18rem] sm:h-[18rem] md:w-[26rem] md:h-[26rem] 
        rounded-full select-none overflow-hidden
        transition-transform duration-150 border-[6px] flex items-center justify-center cursor-pointer
        ${
          activeSkin === 'skin_golden_croc'
            ? 'border-yellow-300 shadow-[0_0_80px_rgba(250,204,21,0.8)]'
            : activeSkin === 'skin_camo_croc'
            ? 'border-lime-400 shadow-[0_0_80px_rgba(132,204,22,0.7)]'
            : activeSkin === 'skin_cyborg_croc'
            ? 'border-sky-300 shadow-[0_0_90px_rgba(56,189,248,0.8)]'
            : 'border-green-300 shadow-[0_0_70px_rgba(34,197,94,0.6)]'
        }`}
    >
      {/* 🎥 Video único (mordida) */}
      <video
        ref={videoRefBite}
        src="/videos/crocodile_bite.mp4"
        className="absolute inset-0 w-full h-full object-cover rounded-full"
        muted
        playsInline
        preload="auto"
        onLoadedData={() => {
          videoRefBite.current.pause();
        }}
        onEnded={() => {
          videoRefBite.current.pause();
          videoRefBite.current.currentTime = 0;
        }}
      />

      {/* ✨ Efecto circular brillante */}
      <motion.div
        className="absolute inset-0 rounded-full border-[4px] border-lime-400 pointer-events-none"
        animate={{ opacity: [1, 0.6, 1], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />

      {/* 🪙 Texto principal */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center select-none z-10">
        <div className="font-bold text-2xl md:text-3xl neon-glow">
          {gameState.energy <= 0 ? 'SIN ENERGÍA ⚡' : '¡MORDER!'}
        </div>
        <div className="text-lime-200 text-lg md:text-xl mt-1">
          +{Math.floor(gameState.clickPower)}
        </div>
      </div>
    </div>
  </motion.div>

  {/* Barra de progreso */}
  <div className="mt-10 w-full max-w-md">
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




        {/* 📊 Panel lateral */}
        <div className="w-full space-y-4">
          <TokenInfoPanel
            tokenPrice={tokenPrice}
            liquidity={liquidity}
            priceData={priceData}
            onBuyToken={handleBuyToken}
          />
          <UpgradePanel
            upgradesConfig={UPGRADES}
            upgradesState={upgrades}
            buyUpgrade={buyUpgrade}
            coins={gameState.coins}
          />
          <DailyRewardPanel
            dailyRewards={dailyRewards}
            claimDailyReward={claimDailyReward}
          />
        </div>
      </div>
    </div>
  );
}

/* ===================== Subcomponentes ===================== */

function TokenInfoPanel({ tokenPrice, liquidity, priceData, onBuyToken }) {
  // ⚙️ Acceso a sonido y toast desde el hook global
  const { playSound } = useSound();

  const gameState = window?.gameState || {}; // opcional, si no lo recibís por props
  const toast = window?.toast || (() => {});

  return (
    <div className="stats-card rounded-xl p-4 relative overflow-visible">
      {/* Encabezado con Referidos integrado */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-primary" /> Token CROC 🐊
        </h3>

        {/* 🧩 Widget de Referidos embebido */}
        <div className="bg-green-950/60 border border-green-700/70 rounded-lg px-3 py-2 shadow-md text-green-100 backdrop-blur-md w-60">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[13px] font-semibold text-green-300 flex items-center gap-1">
              🐊 Referidos
            </span>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?ref=${gameState?.playerId || 'anon'}`);
                toast({
                  title: '📋 Enlace copiado',
                  description: '¡Compartí tu link y ganá recompensas!',
                  duration: 2000,
                });
                playSound('uiClick');
              }}
              size="sm"
              className="bg-green-700 hover:bg-green-600 text-white text-[11px] px-2 py-1 rounded-md"
            >
              Copiar
            </Button>
          </div>

          <input
            type="text"
            readOnly
            value={`${window.location.origin}?ref=${gameState?.playerId || 'anon'}`}
            className="w-full bg-green-900/30 border border-green-700/50 rounded-md px-2 py-1 text-green-100 text-[11px] mb-2 text-center select-all"
          />

          <div className="grid grid-cols-3 gap-1 text-[12px] text-green-200">
            <div className="flex items-center justify-center gap-1">
              👥 <b>{gameState?.referralsCount || 0}</b>
            </div>
            <span>💰 <b>{gameState?.crocFromRefs || 0}</b> CROC</span>
            <span>🪙 <b>{gameState?.coinsFromRefs || 0}</b></span>
          </div>
        </div>
      </div>

      {/* Datos del token */}
      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span>Precio Actual:</span>
          <span className="font-semibold text-primary">
            ${tokenPrice.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Liquidez Total:</span>
          <span className="font-semibold text-primary">
            ${liquidity.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-24 w-full mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              labelStyle={{
                color: 'hsl(var(--primary))',
                fontWeight: 'bold',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Button
        onClick={onBuyToken}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mobile-button"
      >
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
        <span className={`text-md md:text-lg font-bold ${color}`}>
          {value}
        </span>
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
        <span className="text-md md:text-lg font-bold text-blue-400">
          {energy}/{maxEnergy}
        </span>
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

function UpgradePanel({ upgradesConfig, upgradesState, buyUpgrade, coins }) {
  return (
    <div className="upgrade-card rounded-xl p-4">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <ShoppingCart className="w-6 h-6 mr-2 text-blue-400" />
        Mejoras
      </h3>

      <div className="space-y-4 max-h-60 md:max-h-96 overflow-y-auto scrollbar-hide">
        {upgradesConfig.map((upgrade) => {
          const currentLevel = upgradesState[upgrade.id]?.level || 0;
          const price = Math.floor(upgrade.basePrice * Math.pow(1.5, currentLevel));
          const canAfford = coins >= price;
          const Icon = upgrade.icon;

          return (
            <div
              key={upgrade.id}
              className="glass-effect rounded-lg overflow-hidden hover-lift transition-all duration-200"
            >
              {/* 🖼️ Imagen de portada */}
              {upgrade.image && (
                <div className="relative w-full h-28 md:h-32 overflow-hidden">
                  <img
                    src={upgrade.image}
                    alt={upgrade.name}
                    className={`w-full h-full object-cover ${
                      canAfford ? "brightness-100" : "brightness-50 grayscale"
                    } transition-all duration-300`}
                  />
                  {canAfford && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  )}
                </div>
              )}

              {/* 🧩 Contenido */}
              <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${upgrade.color}`} />
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

                {/* 💰 Precio y botón */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-yellow-400 font-bold text-sm">
                    {price.toLocaleString()} 💰
                  </span>
                  <Button
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                    size="sm"
                    className={`mobile-button ${
                      canAfford
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-600 cursor-not-allowed"
                    }`}
                  >
                    Comprar
                  </Button>
                </div>
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
          className={`w-full mobile-button ${
            dailyRewards.available
              ? 'bg-pink-600 hover:bg-pink-700 sparkle-effect'
              : 'bg-gray-600'
          }`}
        >
          {dailyRewards.available
            ? 'Reclamar Recompensa'
            : 'Ya Reclamada Hoy'}
        </Button>
      </div>
    </div>
  );
}
