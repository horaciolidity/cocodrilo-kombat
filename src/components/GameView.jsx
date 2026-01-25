import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
  Users,
  Copy,
  Sparkles,
  Target,
  Award,
  Trophy, // New Icon
  Hammer, // New Icon
  Timer, // New Icon
  Crown // New Icon
} from 'lucide-react';
// Imports removed
// UPGRADES and SHOP_ITEMS are now passed via gameConfig
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

const generateRandomPriceData = (initialPrice = 0.05) => {
  let price = initialPrice;
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
  clickEffect,
  dailyRewards,
  claimDailyReward,
  tutorialStep,
  showTutorial,
  activeSkin,
  toast,
  user,
  tokenPrice,
  liquidity,
  priceData,
  referralStats,
  refreshReferralStats,
  calculateRealClickPower,
  getReferralLink,
  onBuyToken,
  gameConfig, // [NEW]
}) {
  const { upgrades: UPGRADES = [], shopItems: SHOP_ITEMS = [] } = gameConfig || {};


  const priceDataToUse = priceData || generateRandomPriceData(tokenPrice);

  const [isClicked, setIsClicked] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { playSound } = useSound();
  const videoRefIdle = useRef(null);
  const videoRefBite = useRef(null);

  // Calculate next claim time text
  const getNextClaimText = () => {
    if (dailyRewards?.available) return "¡Reclamar!";
    if (!dailyRewards?.lastClaim) return "¡Reclamar!";

    const last = new Date(dailyRewards.lastClaim);
    const next = new Date(last.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();

    if (now >= next) return "¡Reclamar!";

    const diff = next - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const handleBuyToken = () => {
    toast({
      title: '🚧 Comprar Token CROC',
      description: 'Próximamente podrás adquirir CROC en un exchange descentralizado (DEX).',
      duration: 5000,
    });
    playSound('uiClick');
  };

  useEffect(() => {
    console.log('🎮 GameView usando precio CROC:', tokenPrice);
  }, [tokenPrice]);

  useEffect(() => {
    if (user && refreshReferralStats) {
      const interval = setInterval(() => {
        refreshReferralStats();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, refreshReferralStats]);

  useEffect(() => {
    const initializeVideos = async () => {
      if (!videoRefIdle.current || !videoRefBite.current) return;

      try {
        videoRefIdle.current.loop = true;
        videoRefBite.current.loop = false;

        const loadVideo = (videoElement, src) => {
          return new Promise((resolve) => {
            videoElement.src = src;
            videoElement.onloadeddata = () => resolve(true);
            videoElement.onerror = () => {
              console.warn(`❌ Video no disponible: ${src}`);
              const altSrc = src.replace('.mp4', '.webm');
              videoElement.src = altSrc;
              videoElement.onerror = () => resolve(false);
              videoElement.onloadeddata = () => resolve(true);
            };

            setTimeout(() => resolve(false), 4000);
          });
        };

        const [idleLoaded, biteLoaded] = await Promise.all([
          loadVideo(videoRefIdle.current, '/videos/crocodile_idle.mp4'),
          loadVideo(videoRefBite.current, '/videos/crocodile_bite.mp4')
        ]);

        if (idleLoaded) {
          try {
            await videoRefIdle.current.play();
          } catch (err) {
            console.log("🔇 Autoplay bloqueado");
          }
        }

        setVideoLoaded(idleLoaded || biteLoaded);

      } catch (error) {
        console.error("🎥 Error inicializando videos:", error);
        setVideoLoaded(false);
      }
    };

    initializeVideos();

    // [NEW] Persistent listener for bite video ending
    const biteVideo = videoRefBite.current;
    const idleVideo = videoRefIdle.current;

    const handleBiteEnded = () => {
      if (idleVideo && biteVideo) {
        biteVideo.style.opacity = '0';
        biteVideo.style.zIndex = '0';
        idleVideo.style.opacity = '1';
        idleVideo.play().catch(() => { });
      }
    };

    if (biteVideo) {
      biteVideo.addEventListener('ended', handleBiteEnded);
    }

    return () => {
      if (biteVideo) {
        biteVideo.removeEventListener('ended', handleBiteEnded);
      }
    };
  }, []);

  const getCurrentClickPower = () => {
    if (calculateRealClickPower) {
      return calculateRealClickPower();
    }

    // Fallback cálculo simple
    let clickPower = 1;

    Object.entries(upgrades || {}).forEach(([upgradeId, upgradeData]) => {
      const upgradeConfig = UPGRADES.find(u => u.id === upgradeId);
      if (upgradeConfig && upgradeData?.level > 0) {
        if (upgradeConfig.type === 'click') {
          clickPower += upgradeConfig.basePower * upgradeData.level;
        } else if (upgradeConfig.type === 'multiplier') {
          const multiplierBonus = (upgradeConfig.basePower - 1) * upgradeData.level;
          clickPower *= (1 + multiplierBonus);
        }
      }
    });

    return Math.floor(clickPower);
  };

  const handleCrocClick = (event) => {
    if (gameState.energy <= 0) {
      const el = event.currentTarget;
      el.classList.add('shake');
      playSound('error');
      setTimeout(() => el.classList.remove('shake'), 500);

      toast({
        title: "⚡ Sin Energía",
        description: `La energía se regenera automáticamente. Actual: ${gameState.energy}/${gameState.maxEnergy}`,
        duration: 3000,
      });
      return;
    }

    handleClick(event);
    playSound('bite');
    setIsClicked(true);

    if (videoRefIdle.current && videoRefBite.current) {
      try {
        // [FIX] Hide idle, show and play bite immediately
        videoRefIdle.current.style.opacity = '0';
        videoRefBite.current.style.zIndex = '10';
        videoRefBite.current.style.opacity = '1';

        videoRefBite.current.currentTime = 0;
        const playPromise = videoRefBite.current.play();

        if (playPromise !== undefined) {
          playPromise.catch(err => console.log("🔇 Bite video play failed:", err));
        }
      } catch (error) {
        console.log("🎥 Error in video animation triggered");
      }
    }

    const clickEffect = document.createElement('div');
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const currentClickPower = getCurrentClickPower();
    const coinsEarned = Math.floor(currentClickPower);

    clickEffect.textContent = `+${coinsEarned}`;
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

    clickEffect.style.textShadow = '0 0 8px rgba(0,0,0,0.8)';

    event.currentTarget.appendChild(clickEffect);
    setTimeout(() => {
      if (clickEffect.parentNode) {
        clickEffect.parentNode.removeChild(clickEffect);
      }
    }, 1200);

    setTimeout(() => setIsClicked(false), 200);
  };

  const handleBuyUpgrade = (upgradeId) => {
    buyUpgrade(upgradeId);
  };

  const copyReferralLink = () => {
    if (!getReferralLink) {
      toast({
        title: '❌ Error',
        description: 'Función de referidos no disponible',
        duration: 3000,
      });
      return;
    }

    const referralLink = getReferralLink();
    navigator.clipboard.writeText(referralLink).then(() => {
      toast({
        title: '📋 Enlace copiado',
        description: '¡Comparte tu link y gana recompensas!',
        duration: 3000,
      });
      playSound('uiClick');
    }).catch(err => {
      console.error('Error copiando enlace:', err);
      toast({
        title: '❌ Error',
        description: 'No se pudo copiar el enlace',
        duration: 3000,
      });
    });
  };

  const actualTokenPrice = tokenPrice;
  const projectedCrocValue = (gameState.nativeTokenBalance || 0) * actualTokenPrice;
  const totalProjectedValue = projectedCrocValue;
  // En GameView.jsx - Desafíos élite (nivel 10+)
  const eliteChallenges = [
    {
      name: "Maestro del AutoClick",
      goal: "Nivel 50 en AutoClick",
      reward: "500 CROC + 100k monedas",
      current: upgrades?.autoClick?.level || 0
    }
  ];
  return (
    <div className="min-h-screen game-bg p-4 mobile-optimized">
      {/* 📊 Stats rápidas */}
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
          isRegenerating={gameState.energy < gameState.maxEnergy}
        />
        <StatCard
          icon={BarChart2}
          value={`${gameState.nativeTokenBalance?.toLocaleString() || 0}`}
          label="CROC Tokens"
          color="text-emerald-400"
        />
      </div>

      {/* 🎯 Widget de Referidos Móvil */}
      <div className="block md:hidden mb-4">
        <ReferralsWidget
          referralStats={referralStats}
          onCopyLink={copyReferralLink}
        />
      </div>

      {/* ✅ VALOR CROC MÓVIL */}
      <div className="block md:hidden mb-4">
        <ProjectedValueMobile
          projectedValue={totalProjectedValue}
          tokenBalance={gameState.nativeTokenBalance || 0}
          tokenPrice={actualTokenPrice}
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
              onClick={handleCrocClick}
              className={`relative w-[22rem] h-[22rem] sm:w-[18rem] sm:h-[18rem] md:w-[26rem] md:h-[26rem] 
                rounded-full select-none overflow-hidden
                transition-transform duration-150 border-[6px] flex items-center justify-center cursor-pointer
                ${activeSkin === 'skin_golden_croc'
                  ? 'border-yellow-300 shadow-[0_0_80px_rgba(250,204,21,0.8)] bg-yellow-500/10'
                  : activeSkin === 'skin_camo_croc'
                    ? 'border-lime-400 shadow-[0_0_80px_rgba(132,204,22,0.7)] bg-green-500/10'
                    : activeSkin === 'skin_cyborg_croc'
                      ? 'border-sky-300 shadow-[0_0_90px_rgba(56,189,248,0.8)] bg-blue-500/10'
                      : 'border-green-300 shadow-[0_0_70px_rgba(34,197,94,0.6)] bg-emerald-500/10'
                }`}
            >
              <video
                ref={videoRefIdle}
                src="/videos/crocodile_idle.mp4"
                className="absolute inset-0 w-full h-full object-cover rounded-full transition-opacity duration-300 scale-[1.05]"
                style={{ objectPosition: 'center 20%' }}
                muted
                playsInline
                loop
                preload="auto"
                poster="/images/skins/base_croc.jpeg"
                onError={(e) => {
                  console.error("❌ Error cargando video idle");
                  e.target.style.display = 'none';
                }}
              />

              <video
                ref={videoRefBite}
                src="/videos/crocodile_bite.mp4"
                className="absolute inset-0 w-full h-full object-cover rounded-full opacity-0 z-0 scale-[1.05]"
                style={{ objectPosition: 'center 20%' }}
                muted
                playsInline
                preload="auto"
                onError={(e) => {
                  console.error("❌ Error cargando video bite");
                  e.target.style.display = 'none';
                }}
              />

              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src="/images/skins/base_croc.jpeg"
                      alt="Cargando..."
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              )}

              <motion.div
                className="absolute inset-0 rounded-full border-[4px] border-lime-400 pointer-events-none"
                animate={{ opacity: [1, 0.6, 1], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center select-none z-10 p-4">
                <div className="font-bold text-2xl md:text-3xl neon-glow mb-2">
                  {gameState.energy <= 0 ? 'SIN ENERGÍA ⚡' : '¡MORDER!'}
                </div>
                <div className="text-lime-200 text-lg md:text-xl font-semibold">
                  +{Math.floor(getCurrentClickPower())}
                </div>
                {gameState.energy <= 0 && (
                  <div className="text-red-300 text-sm mt-2 animate-pulse flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span>Energía regenerándose...</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <div className="mt-10 w-full max-w-md space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  Nivel {gameState.level}
                </span>
                <span className="text-yellow-300 font-semibold">
                  {gameState.experience % 100}/100 XP
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
                <div
                  className="progress-bar h-3 rounded-full transition-all duration-300 shadow-lg"
                  style={{ width: `${(gameState.experience % 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-blue-400" />
                  Energía
                  {gameState.energy < gameState.maxEnergy && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-green-400"
                    >
                      ⚡
                    </motion.span>
                  )}
                </span>
                <span className={`font-semibold ${gameState.energy < gameState.maxEnergy ? "text-green-400" : "text-blue-400"}`}>
                  {gameState.energy}/{gameState.maxEnergy}
                  {gameState.energy < gameState.maxEnergy && " 🔄"}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 shadow-lg ${gameState.energy > 50
                    ? 'bg-green-500'
                    : gameState.energy > 20
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                    } ${gameState.energy < gameState.maxEnergy ? 'pulse-energy' : ''}`}
                  style={{ width: `${(gameState.energy / gameState.maxEnergy) * 100}%` }}
                />
              </div>
              {gameState.energy < gameState.maxEnergy && (
                <div className="text-xs text-green-400 text-center mt-1 animate-pulse flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Regenerando {gameState.maxEnergy - gameState.energy} puntos...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full space-y-4">
          <TokenInfoPanel
            tokenPrice={actualTokenPrice}
            liquidity={liquidity}
            priceData={priceData}
            onBuyToken={handleBuyToken}
            referralStats={referralStats}
            onCopyReferralLink={copyReferralLink}
            nativeTokenBalance={gameState.nativeTokenBalance || 0}
            projectedValue={totalProjectedValue}
          />
          <UpgradePanel
            upgradesConfig={UPGRADES}
            upgradesState={upgrades}
            buyUpgrade={handleBuyUpgrade}
            coins={gameState.coins}
            calculateRealClickPower={calculateRealClickPower}
          />
          <DailyRewardPanel
            dailyRewards={dailyRewards}
            claimDailyReward={claimDailyReward}
          />
        </div>
      </div>

      <style>{`
        @keyframes riseUp {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -100px) scale(1.5);
          }
        }

        @keyframes pulseEnergy {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .pulse-energy {
          animation: pulseEnergy 1.5s ease-in-out infinite;
        }

        .shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .neon-glow {
          text-shadow: 
            0 0 5px currentColor,
            0 0 10px currentColor,
            0 0 15px currentColor,
            0 0 20px currentColor;
        }

        .progress-bar {
          background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a);
        }

        .energy-bar {
          background: linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd);
        }
      `}</style>
    </div>
  );
}

function ProjectedValueMobile({ projectedValue, tokenBalance, tokenPrice }) {
  return (
    <motion.div
      className="bg-gradient-to-br from-yellow-900/90 to-amber-800/90 border border-yellow-500/50 rounded-xl p-4 backdrop-blur-md shadow-lg"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-300" />
          <h3 className="text-lg font-bold text-yellow-100">
            💰 Valor CROC
          </h3>
        </div>
        <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Live</span>
        </div>
      </div>

      <div className="text-center mb-3">
        <div className="text-2xl font-bold text-yellow-400 mb-1">
          ${projectedValue.toFixed(2)}
        </div>
        <div className="text-sm text-yellow-200">
          {tokenBalance.toLocaleString()} CROC @ ${tokenPrice}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-yellow-800/40 rounded-lg p-2 border border-yellow-600/30">
          <div className="text-yellow-300 text-xs mb-1">💰 Tokens</div>
          <div className="text-white font-bold text-sm">{tokenBalance.toLocaleString()}</div>
        </div>
        <div className="bg-yellow-800/40 rounded-lg p-2 border border-yellow-600/30">
          <div className="text-yellow-300 text-xs mb-1">📈 Precio</div>
          <div className="text-white font-bold text-sm">${tokenPrice.toFixed(6)}</div>
        </div>
      </div>
    </motion.div>
  );
}

function ReferralsWidget({ referralStats, onCopyLink }) {
  const hasReferrals = referralStats?.referralsCount > 0;

  return (
    <motion.div
      className="bg-gradient-to-br from-green-900/90 to-emerald-800/90 border border-green-500/50 rounded-xl p-4 backdrop-blur-md shadow-lg"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-300" />
          <h3 className="text-lg font-bold text-green-100">
            🐊 Referidos
          </h3>
          {hasReferrals && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Activo</span>
            </motion.div>
          )}
        </div>
        <Button
          onClick={onCopyLink}
          size="sm"
          className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition-all duration-200 shadow-md"
        >
          <Copy className="w-3 h-3 mr-1.5" />
          Copiar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div className="bg-green-800/40 rounded-lg p-3 border border-green-600/30">
          <div className="text-green-300 text-sm mb-1">👥 Referidos</div>
          <div className="text-white font-bold text-xl">{referralStats?.referralsCount || 0}</div>
        </div>
        <div className="bg-green-800/40 rounded-lg p-3 border border-green-600/30">
          <div className="text-green-300 text-sm mb-1">💰 CROC</div>
          <div className="text-white font-bold text-xl">{referralStats?.crocFromRefs || 0}</div>
        </div>
        <div className="bg-green-800/40 rounded-lg p-3 border border-green-600/30">
          <div className="text-green-300 text-sm mb-1">🪙 Monedas</div>
          <div className="text-white font-bold text-xl">{(referralStats?.coinsFromRefs || 0).toLocaleString()}</div>
        </div>
      </div>

      {hasReferrals && (
        <motion.div
          className="bg-green-700/30 border border-green-500/30 rounded-lg p-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-xs text-green-200 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>¡Ganando recompensas por tus referidos!</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

function TokenInfoPanel({
  tokenPrice,
  liquidity,
  priceData,
  onBuyToken,
  referralStats,
  onCopyReferralLink,
  nativeTokenBalance,
  projectedValue
}) {
  const hasReferrals = referralStats?.referralsCount > 0;

  const currentPrice = tokenPrice || 0.05;
  const tokenValue = nativeTokenBalance * currentPrice;

  const [chartData, setChartData] = useState(priceData || []);

  useEffect(() => {
    if (priceData && priceData.length > 0) {
      setChartData(priceData.slice(-30));
    }
  }, [priceData]);

  return (
    <div className="stats-card rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-yellow-400" />
          CROC Token 🐊
        </h3>

        <motion.div
          className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-900/50 to-amber-800/50 border border-yellow-500/30"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-yellow-300">
              ${currentPrice.toFixed(6)}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="mb-4 p-4 bg-gradient-to-r from-yellow-900/40 to-amber-800/40 rounded-lg border border-yellow-600/30">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-yellow-300 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Valor tus CROC:
          </span>
          <span className="font-bold text-lg text-yellow-400">
            ${tokenValue.toFixed(2)}
          </span>
        </div>
        <div className="text-xs text-yellow-200 flex justify-between">
          <span>{nativeTokenBalance.toLocaleString()} CROC</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            @ ${currentPrice.toFixed(6)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">📈 Precio</div>
          <div className="font-bold text-lg text-green-400">
            ${currentPrice.toFixed(6)}
          </div>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-1">💧 Liquidez</div>
          <div className="font-bold text-lg text-blue-400">
            ${liquidity.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="h-32 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              interval={7}
              axisLine={false}
            />
            <YAxis
              domain={['dataMin - 0.001', 'dataMax + 0.001']}
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              tickFormatter={(value) => `$${value.toFixed(4)}`}
              width={35}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(6)}`, 'Precio CROC']}
              labelFormatter={(label) => `Hora: ${label}`}
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#FBBF24' }}
              labelStyle={{ color: '#D1D5DB', fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#FBBF24"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: '#F59E0B',
                stroke: '#FFFFFF',
                strokeWidth: 1
              }}
              isAnimationActive={true}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-400">
          Actualizando en tiempo real • Sincronizado con Supabase
        </span>
      </div>

      <Button
        onClick={onBuyToken}
        className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white mobile-button"
      >
        <ExternalLink className="w-4 h-4 mr-2" /> Comprar CROC
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

function EnergyStatCard({ energy, maxEnergy, isRegenerating = false }) {
  return (
    <div className="stats-card rounded-xl p-3 md:p-4 text-center">
      <div className="flex items-center justify-center mb-1 md:mb-2">
        <Zap className={`w-5 h-5 md:w-6 md:h-6 ${isRegenerating ? 'text-green-400 animate-pulse' : 'text-blue-400'} mr-2`} />
        <span className={`text-md md:text-lg font-bold ${isRegenerating ? 'text-green-400' : 'text-blue-400'}`}>
          {energy}/{maxEnergy}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">Energía</p>
      <div className="w-full bg-gray-700 rounded-full h-1.5 md:h-2 mt-2">
        <div
          className={`h-1.5 md:h-2 rounded-full transition-all duration-1000 ${energy > 50 ? 'bg-green-500' : energy > 20 ? 'bg-yellow-500' : 'bg-red-500'
            } ${isRegenerating ? 'pulse-energy' : ''}`}
          style={{ width: `${(energy / maxEnergy) * 100}%` }}
        />
      </div>
      {isRegenerating && (
        <p className="text-xs text-green-400 mt-1">Regenerando...</p>
      )}
    </div>
  );
}

function UpgradePanel({ upgradesConfig, upgradesState, buyUpgrade, coins, calculateRealClickPower }) {
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
              {upgrade.image && (
                <div className="relative w-full h-28 md:h-32 overflow-hidden">
                  <img
                    src={upgrade.image}
                    alt={upgrade.name}
                    className={`w-full h-full object-cover ${canAfford ? "brightness-100" : "brightness-50 grayscale"
                      } transition-all duration-300`}
                  />
                  {canAfford && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  )}
                </div>
              )}

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

                <div className="flex items-center justify-between mt-1">
                  <span className="text-yellow-400 font-bold text-sm">
                    {price.toLocaleString()} 💰
                  </span>
                  <Button
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                    size="sm"
                    className={`mobile-button ${canAfford
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
  // Agregar para depuración
  useEffect(() => {
    console.log('🎯 DailyRewardPanel actualizado:', {
      lastClaim: dailyRewards.lastClaim,
      streak: dailyRewards.streak,
      available: dailyRewards.available,
      fechaActual: new Date().toISOString()
    });
  }, [dailyRewards]);

  const handleClaim = () => {
    console.log('🎯 Botón de recompensa diaria clickeado');
    claimDailyReward();
  };

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
          onClick={handleClaim}
          disabled={!dailyRewards.available}
          className={`w-full mobile-button ${dailyRewards.available
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