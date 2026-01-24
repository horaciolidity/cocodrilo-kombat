import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  Zap,
  Users,
  Shield,
  ExternalLink,
  CalendarDays,
  Clock,
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  Award,
  Gift,
  Lock,
  Globe,
  Wallet,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Coins,
  Timer,
  Percent,
  Package,
  Heart,
  FileText,
  Key,
  Cpu,
  Network,
  LockKeyhole,
  BadgeCheck,
  WalletCards,
  Star,
  Trophy,
  UserPlus,
  Share2,
  ListChecks,
  Calculator
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export function FairlaunchView({
  toast,
  tokenPrice = 0.05,
  user,
  onNavigate,
  gameConfig // [NEW] Receive config
}) {
  const { toast: uiToast } = useToast();

  // 🎯 ESTADOS OPTIMIZADOS - usando useRef para evitar re-renders
  const [fairlaunchPhase, setFairlaunchPhase] = useState('pre-launch');
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 0, minutes: 0, seconds: 0 });
  const [userParticipation, setUserParticipation] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState(100);

  // 🎯 Usar useRef para valores que no necesitan re-render
  const participationStatsRef = useRef({
    totalRaised: 125000,
    participants: 347,
    progress: 6.25
  });

  const fairlaunchDetailsRef = useRef({
    startDate: gameConfig?.fair_launch?.start_date ? new Date(gameConfig.fair_launch.start_date) : new Date(), // Starts NOW if no config
    endDate: gameConfig?.fair_launch?.end_date ? new Date(gameConfig.fair_launch.end_date) : new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // Ends in 4 months (120 days)
    totalTokens: 100000000,
    tokensForSale: 40000000,
    hardCap: 2000000,
    softCap: 500000,
    pricePerToken: tokenPrice,
    minContribution: 50,
    maxContribution: 10000,
    platform: "Pinksale",
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e0E3F3e4C3b",
    liquidityLock: "12 meses",
    vestingPeriod: "6 meses lineal",
    network: "Optimism"
  });

  // Effect to update ref when config changes (since ref doesn't trigger re-render, we might need state for dates if they change mid-session, but init is fine usually)
  useEffect(() => {
    if (gameConfig?.fair_launch) {
      if (gameConfig.fair_launch.start_date) fairlaunchDetailsRef.current.startDate = new Date(gameConfig.fair_launch.start_date);
      if (gameConfig.fair_launch.end_date) fairlaunchDetailsRef.current.endDate = new Date(gameConfig.fair_launch.end_date);
      // Force re-calc of timeleft by triggering a minimal state update?
      // Actually the existing interval will pick up the new Ref values on next tick.
    }
  }, [gameConfig]);

  // 🎯 MEMOIZAR valores calculados
  const progressPercentage = useMemo(() => {
    const stats = participationStatsRef.current;
    return Math.min(100, (stats.totalRaised / fairlaunchDetailsRef.current.hardCap) * 100);
  }, []);

  const softCapPercentage = useMemo(() => {
    return (fairlaunchDetailsRef.current.softCap / fairlaunchDetailsRef.current.hardCap) * 100;
  }, []);

  const participationPercentage = useMemo(() => {
    const goal = 500000;
    return Math.min(100, (participationStatsRef.current.totalRaised / goal) * 100);
  }, []);

  const simulationTokens = useMemo(() => {
    return simulationAmount / tokenPrice;
  }, [simulationAmount, tokenPrice]);

  const [timePercentage, setTimePercentage] = useState(100);

  // 🎯 CUENTA REGRESIVA OPTIMIZADA - sin parpadeo
  useEffect(() => {
    let mounted = true;
    let animationFrameId = null;
    let lastUpdateTime = Date.now();

    const updateCountdown = () => {
      if (!mounted) return;

      const now = Date.now();
      // Solo actualizar cada 1000ms (1 segundo)
      if (now - lastUpdateTime < 1000) {
        animationFrameId = requestAnimationFrame(updateCountdown);
        return;
      }

      lastUpdateTime = now;
      const startDate = fairlaunchDetailsRef.current.startDate;
      const targetDate = fairlaunchDetailsRef.current.endDate;

      const totalDuration = targetDate.getTime() - startDate.getTime();
      const difference = targetDate.getTime() - now;

      // Calcular porcentaje de tiempo restante (Energía)
      const percentage = Math.max(0, Math.min(100, (difference / totalDuration) * 100));
      setTimePercentage(percentage);

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setFairlaunchPhase('active'); // Should probably be 'completed' if we are past end date? Or maybe active phase logic is tricky. 
        // Assuming active means 'sale is live' but if time runs out it's done? 
        // Let's stick to existing logic but maybe check if time < 0
        if (difference <= 0) setFairlaunchPhase('completed');
      }

      animationFrameId = requestAnimationFrame(updateCountdown);
    };

    updateCountdown();

    return () => {
      mounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // ... (handleParticipate, formatTimeLeft, calculatePotentialReturn unchanged)

  const CountdownCard = useMemo(() => (
    <motion.div
      className={`p-6 rounded-xl border-2 mb-6 relative overflow-hidden ${fairlaunchPhase === 'pre-launch'
        ? 'border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-cyan-900/20'
        : fairlaunchPhase === 'active'
          ? 'border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20'
          : 'border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20'
        }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${fairlaunchPhase === 'pre-launch' ? 'bg-blue-600/30' :
            fairlaunchPhase === 'active' ? 'bg-green-600/30' :
              'bg-purple-600/30'
            }`}>
            <Timer className={`w-6 h-6 ${fairlaunchPhase === 'pre-launch' ? 'text-blue-400' :
              fairlaunchPhase === 'active' ? 'text-green-400' :
                'text-purple-400'
              }`} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {fairlaunchPhase === 'pre-launch' ? '🚀 Lanzamiento en:' :
                fairlaunchPhase === 'active' ? '🔥 Finaliza en:' :
                  '✅ Fairlaunch Finalizado'}
            </h3>
            <p className="text-sm text-gray-400">
              {fairlaunchPhase === 'pre-launch' ? 'Prepárate para el despegue' :
                fairlaunchPhase === 'active' ? '¡Última oportunidad para participar!' :
                  'Gracias por tu participación'}
            </p>
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold mb-1 text-white font-mono">
            {fairlaunchPhase !== 'completed' ? formatTimeLeft() : 'COMPLETADO'}
          </div>
          <div className="text-sm text-gray-400">
            {fairlaunchPhase === 'pre-launch' && `Inicio: ${fairlaunchDetailsRef.current.startDate.toLocaleDateString()}`}
            {fairlaunchPhase === 'active' && `Final: ${fairlaunchDetailsRef.current.endDate.toLocaleDateString()}`}
          </div>
        </div>

        <div className={`px-4 py-2 rounded-full text-sm font-bold ${fairlaunchPhase === 'pre-launch' ? 'bg-blue-500 text-white' :
          fairlaunchPhase === 'active' ? 'bg-green-500 text-white' :
            'bg-purple-500 text-white'
          }`}>
          {fairlaunchPhase === 'pre-launch' ? 'PRÓXIMAMENTE' :
            fairlaunchPhase === 'active' ? 'EN CURSO 🔥' :
              'FINALIZADO ✅'}
        </div>
      </div>

      {/* 🔋 BARRA DE ENERGÍA TEMPORAL */}
      <div className="mt-6">
        <div className="flex justify-between text-xs mb-1 font-semibold">
          <span className={timePercentage < 20 ? "text-red-500 animate-pulse" : "text-green-400"}>
            TIEMPO RESTANTE
          </span>
          <span className="text-gray-400">{Math.floor(timePercentage)}%</span>
        </div>
        <div className="h-4 w-full bg-gray-900/50 rounded-full border border-gray-700 overflow-hidden relative shadow-inner">
          {/* Fondo de alerta roja cuando está bajo */}
          <div className={`absolute inset-0 bg-red-900/20 ${timePercentage < 10 ? 'animate-pulse' : 'hidden'}`}></div>

          <motion.div
            className={`h-full rounded-full transition-all duration-1000 ${timePercentage > 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                timePercentage > 20 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                  'bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'
              }`}
            style={{ width: `${timePercentage}%` }}
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/pattern-stripes.png')] opacity-20 animate-slide-bg"></div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  ), [fairlaunchPhase, formatTimeLeft, timePercentage]);

  const TokenInfoCard = useMemo(() => (
    <motion.div
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Package className="w-6 h-6 mr-2 text-yellow-400" />
        Detalles del Token CROC
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <DetailItem icon={DollarSign} label="Precio inicial:" value={`$${tokenPrice.toFixed(4)}`} color="text-green-400" />
          <DetailItem icon={Coins} label="Tokens en venta:" value="40,000,000 CROC" color="text-yellow-400" />
          <DetailItem icon={Percent} label="Porcentaje:" value="40%" color="text-blue-400" />
          <DetailItem icon={Network} label="Red:" value="Optimism" color="text-purple-400" />
          <DetailItem icon={Cpu} label="Estándar:" value="ERC-20" color="text-gray-400" />
        </div>

        <div className="space-y-3">
          <DetailItem icon={LockKeyhole} label="Liquidity Lock:" value="12 meses" color="text-green-400" />
          <DetailItem icon={CalendarDays} label="Vesting equipo:" value="6 meses lineal" color="text-yellow-400" />
          <DetailItem icon={BadgeCheck} label="Auditoría:" value="En progreso" color="text-blue-400" />
          <DetailItem icon={Key} label="Contrato:" value={`${fairlaunchDetailsRef.current.contractAddress.substring(0, 6)}...`} color="text-purple-400" />
          <DetailItem icon={Wallet} label="Moneda aceptada:" value="USDC, ETH" color="text-cyan-400" />
        </div>
      </div>
    </motion.div>
  ), [tokenPrice]);

  const ParticipationSimulation = useMemo(() => {
    if (!showSimulation) return null;

    const potentialReturn = calculatePotentialReturn(simulationAmount);

    return (
      <motion.div
        className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-700/50 mb-6"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-300 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Simulación de Participación
          </h3>
          <Button
            onClick={() => setShowSimulation(false)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Monto de Participación (USD)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="10000"
                step="50"
                value={simulationAmount}
                onChange={(e) => setSimulationAmount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xl font-bold text-yellow-400 w-24 text-right">
                ${simulationAmount}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Mín: $50</span>
              <span>Máx: $10,000</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-900/30 rounded-lg">
              <div className="text-sm text-blue-300 mb-1">Tokens recibidos</div>
              <div className="text-xl font-bold text-white">
                {simulationTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC
              </div>
            </div>

            <div className="p-3 bg-green-900/30 rounded-lg">
              <div className="text-sm text-green-300 mb-1">Precio por token</div>
              <div className="text-xl font-bold text-white">
                ${tokenPrice.toFixed(4)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg border border-yellow-700/30">
            <h4 className="font-semibold text-yellow-300 mb-2 text-sm">Rendimiento potencial:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xs text-gray-400">Conservador</div>
                <div className="font-bold text-green-400">${potentialReturn.conservative.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Moderado</div>
                <div className="font-bold text-yellow-400">${potentialReturn.moderate.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Agresivo</div>
                <div className="font-bold text-red-400">${potentialReturn.aggressive.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>

          <Button
            onClick={handleParticipate}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Confirmar Participación Simulada
          </Button>
        </div>
      </motion.div>
    );
  }, [showSimulation, simulationAmount, simulationTokens, tokenPrice, handleParticipate, calculatePotentialReturn]);

  /* 🔐 ADM Check helper (Duplicate purely for UI logic if needed, or rely on prop if passed) */
  const isAdmin = user && (user.email === 'admin@cocodrilo.com' || user.email === 'horaciowalterortiz@gmail.com');

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div
          className="text-center mb-8 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isAdmin && (
            <Button
              variant="outline"
              className="absolute top-0 right-0 border-red-500 text-red-400 hover:bg-red-900/20"
              onClick={() => onNavigate('admin')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Panel Admin
            </Button>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <Rocket className="w-8 h-8 mr-3 text-purple-400" />
            Fairlaunch del Token CROC en Optimism
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Únete al lanzamiento justo y descentralizado del token CROC. Obtén tokens al precio más bajo antes del listing en exchanges.
          </p>
        </motion.div>

        {/* ⏰ Contador regresivo */}
        {CountdownCard}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 Panel izquierdo - Información clave */}
          <div className="lg:col-span-2 space-y-6">
            {/* 📈 Barra de progreso */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
                  Progreso del Fairlaunch
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Recaudación</div>
                  <div className="text-xl font-bold text-green-400">
                    ${participationStatsRef.current.totalRaised.toLocaleString()} / ${fairlaunchDetailsRef.current.hardCap.toLocaleString()}
                  </div>
                </div>
              </div>

              {ProgressBar}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-xs text-blue-300">Progreso</div>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    ${fairlaunchDetailsRef.current.softCap.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-300">Soft Cap</div>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    ${fairlaunchDetailsRef.current.hardCap.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-300">Hard Cap</div>
                </div>
              </div>
            </motion.div>

            {/* 📋 Información del token */}
            {TokenInfoCard}

            {/* 🎯 Beneficios */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2 text-purple-400" />
                Incentivos y Recompensas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BenefitCard
                  icon={ListChecks}
                  title="Completa Misiones"
                  description="Cada misión completada te da tokens extra para el Fairlaunch."
                  color="green"
                />
                <BenefitCard
                  icon={UserPlus}
                  title="Invita Amigos"
                  description="Gana 50 CROC extra por cada amigo que invites y participe."
                  color="blue"
                />
                <BenefitCard
                  icon={Target}
                  title="Early Birds"
                  description="Los primeros 100 participantes reciben un bono adicional del 10%."
                  color="yellow"
                />
                <BenefitCard
                  icon={TrendingUp}
                  title="Listing en Exchanges"
                  description="Listado garantizado en Uniswap V3, SushiSwap y más exchanges."
                  color="purple"
                />
              </div>
            </motion.div>
          </div>

          {/* 🎮 Panel derecho - Participación (WEB3 REAL pero DESHABILITADO) */}
          <div className="space-y-6">
            {/* 💰 Tu participación */}
            <motion.div
              className="stats-card rounded-xl p-6 relative overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Overlay de bloqueo */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 text-center p-6">
                <Lock className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Pre-venta No Iniciada</h3>
                <p className="text-sm text-gray-300 mb-4">
                  La compra de tokens se habilitará cerca de la fecha de despliegue oficial.
                </p>
                <div className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-200 text-xs font-bold animate-pulse">
                  ⚠️ MANTENTE ATENTO
                </div>
              </div>

              <h3 className="text-xl font-bold mb-4 flex items-center opacity-50">
                <Wallet className="w-6 h-6 mr-2 text-green-400" />
                Compra WEB3
              </h3>

              <div className="space-y-4 opacity-50 pointer-events-none">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Monto a invertir (USDT)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="100"
                      className="bg-gray-900 border border-gray-700 rounded p-2 w-full text-white"
                      disabled
                    />
                  </div>
                </div>

                <Button className="w-full bg-blue-600 text-white font-bold py-3 mb-2" disabled>
                  <WalletCards className="w-5 h-5 mr-2" />
                  Conectar Wallet
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="border-green-500/30 text-green-400" disabled>
                    Comprar con USDT
                  </Button>
                  <Button variant="outline" className="border-purple-500/30 text-purple-400" disabled>
                    Comprar con ETH
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* ⚠️ Misión Actual: COMPARTIR */}
            <motion.div
              className="stats-card rounded-xl p-6 border-2 border-blue-500/40 bg-gradient-to-br from-blue-900/20 to-cyan-900/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-full animate-pulse">
                  <Share2 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">TU MISIÓN ACTUAL</h3>
                  <p className="text-xs text-blue-300">Apoya el proyecto para el lanzamiento</p>
                </div>
              </div>

              <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                Para asegurar el éxito del token, necesitamos hacer ruido. Tu tarea ahora es
                <strong> seguirnos y compartir</strong> nuestro contenido en todas las redes.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="border-blue-500/50 hover:bg-blue-500/20"
                  onClick={() => window.open('https://twitter.com/cocodrilokombat', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Twitter / X
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/50 hover:bg-red-500/20"
                  onClick={() => window.open('https://youtube.com/@cocodrilokombat', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  YouTube
                </Button>
                <Button
                  variant="outline"
                  className="border-blue-400/50 hover:bg-blue-400/20"
                  onClick={() => window.open('https://t.me/cocodrilokombat', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Telegram
                </Button>
                <Button
                  variant="outline"
                  className="border-pink-500/50 hover:bg-pink-500/20"
                  onClick={() => window.open('https://instagram.com/cocodrilokombat', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Instagram
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 Subcomponentes optimizados
const DetailItem = React.memo(({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center">
      <Icon className={`w-4 h-4 mr-2 ${color || 'text-gray-400'}`} />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <span className={`font-semibold text-sm ${color || 'text-white'}`}>
      {value}
    </span>
  </div>
));

const BenefitCard = React.memo(({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300',
    blue: 'bg-blue-900/20 border-blue-700/30 text-blue-300',
    green: 'bg-green-900/20 border-green-700/30 text-green-300',
    purple: 'bg-purple-900/20 border-purple-700/30 text-purple-300'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" />
        <h4 className="font-bold text-sm">{title}</h4>
      </div>
      <p className="text-xs opacity-80">{description}</p>
    </div>
  );
});