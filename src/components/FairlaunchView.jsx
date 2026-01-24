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
      const targetDate = fairlaunchDetailsRef.current.startDate;
      const difference = targetDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setFairlaunchPhase('active');
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

  // 🎯 FUNCIONES MEMOIZADAS
  const handleParticipate = useCallback(() => {
    if (fairlaunchPhase === 'pre-launch') {
      toast({
        title: "⏳ Fairlaunch no iniciado",
        description: `El Fairlaunch comienza en ${timeLeft.days} días, ${timeLeft.hours} horas`,
        duration: 4000,
      });
      return;
    }

    const newParticipation = userParticipation + simulationAmount;
    setUserParticipation(newParticipation);

    // Actualizar ref sin causar re-render
    participationStatsRef.current.totalRaised += simulationAmount;

    toast({
      title: "🚀 ¡Participación Exitosa!",
      description: `Has participado con $${simulationAmount} (${simulationTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC)`,
      duration: 6000,
    });

    setShowSimulation(false);
    setSimulationAmount(100);
  }, [fairlaunchPhase, userParticipation, simulationAmount, simulationTokens, toast, timeLeft]);

  const formatTimeLeft = useCallback(() => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  }, [timeLeft]);

  const calculatePotentialReturn = useCallback((investment) => {
    const tokens = investment / tokenPrice;
    return {
      conservative: tokens * (tokenPrice * 2),
      moderate: tokens * (tokenPrice * 5),
      aggressive: tokens * (tokenPrice * 10)
    };
  }, [tokenPrice]);

  // 🎯 COMPONENTES MEMOIZADOS
  const ProgressBar = useMemo(() => {
    const stats = participationStatsRef.current;

    return (
      <div className="relative mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400">
            Recaudado: ${stats.totalRaised.toLocaleString()}
          </span>
          <span className="text-yellow-400">
            Soft Cap: ${fairlaunchDetailsRef.current.softCap.toLocaleString()}
          </span>
          <span className="text-red-400">
            Hard Cap: ${fairlaunchDetailsRef.current.hardCap.toLocaleString()}
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-4 shadow-inner relative">
          <div
            className="absolute top-0 bottom-0 w-1 bg-yellow-400"
            style={{ left: `${softCapPercentage}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 whitespace-nowrap">
              Soft Cap
            </div>
          </div>

          <motion.div
            className="h-4 rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-400 relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <motion.div
              className="absolute top-0 left-0 bottom-0 w-8 bg-white/30"
              animate={{ x: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </motion.div>
        </div>

        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>{Math.round(progressPercentage)}%</span>
          <span>100%</span>
        </div>
      </div>
    );
  }, [progressPercentage, softCapPercentage]);

  const CountdownCard = useMemo(() => (
    <motion.div
      className={`p-6 rounded-xl border-2 mb-6 ${fairlaunchPhase === 'pre-launch'
        ? 'border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-cyan-900/20'
        : fairlaunchPhase === 'active'
          ? 'border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20'
          : 'border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20'
        }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
    </motion.div>
  ), [fairlaunchPhase, formatTimeLeft]);

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

          {/* 🎮 Panel derecho - Participación */}
          <div className="space-y-6">
            {/* 💰 Tu participación */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Wallet className="w-6 h-6 mr-2 text-green-400" />
                Tu Participación
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-700/30">
                  <div className="text-center mb-2">
                    <div className="text-3xl font-bold text-green-400">
                      ${userParticipation.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-300">Total invertido</div>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                      style={{ width: `${Math.min(100, (userParticipation / 10000) * 100)}%` }}
                    />
                  </div>

                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {userParticipation > 0
                      ? `${((userParticipation / 10000) * 100).toFixed(1)}% de tu límite máximo`
                      : 'Aún no has participado'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => setShowSimulation(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Simular Participación
                  </Button>

                  <Button
                    onClick={handleParticipate}
                    disabled={fairlaunchPhase !== 'active'}
                    className={`w-full ${fairlaunchPhase === 'active'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white sparkle-effect'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      } py-3`}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    {fairlaunchPhase === 'active'
                      ? 'Participar Ahora'
                      : fairlaunchPhase === 'pre-launch'
                        ? 'Próximamente'
                        : 'Finalizado'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Simulación de participación */}
            {ParticipationSimulation}

            {/* ⚠️ Advertencias importantes */}
            <motion.div
              className="stats-card rounded-xl p-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-amber-900/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
                <AlertCircle className="w-6 h-6 mr-2" />
                Información Importante
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Red Optimism:</strong> Todas las transacciones se procesarán en la red Optimism.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Mínimo/Máximo:</strong> Participación mínima $50, máxima $10,000 por wallet.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Vesting:</strong> Los tokens del equipo tienen vesting de 6 meses.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Exchanges confirmados:</strong> Uniswap V3, SushiSwap (Día 1), más exchanges en negociación.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  Fairlaunch activo del {fairlaunchDetailsRef.current.startDate.toLocaleDateString()} al {fairlaunchDetailsRef.current.endDate.toLocaleDateString()}
                </p>
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