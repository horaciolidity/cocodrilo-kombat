import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Copy,
  Share2,
  RefreshCw,
  Download,
  TrendingDown,
  ChevronRight,
  Star,
  Eye,
  ShoppingBag,
  MessageSquare,
  Users as UsersIcon,
  Trophy,
  BarChart,
  Send,
  ArrowRight,
  ShieldCheck,
  Layers,
  Calendar,
  CreditCard,
  FileText
} from 'lucide-react';

export function FairlaunchView({ 
  toast, 
  tokenPrice = 0.05,
  setTokenPrice,
  updatePriceInSupabase,
  gameState,
  referralStats,
  getReferralLink,
  player,
  user,
  missions
}) {
  // 🎯 Estados principales
  const [timeLeft, setTimeLeft] = useState({});
  const [participationPhase, setParticipationPhase] = useState('pre-launch');
  const [totalRaised, setTotalRaised] = useState(0);
  const [userParticipation, setUserParticipation] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState(100);
  const [simulationTokens, setSimulationTokens] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // 🎯 Contador regresivo de 3 MESES
  const launchDate = new Date();
  launchDate.setMonth(launchDate.getMonth() + 3); // 3 meses desde hoy
  
  // 🎯 Datos del fairlaunch
  const fairlaunchDetails = {
    startDate: launchDate.toISOString(),
    endDate: new Date(launchDate.getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 días después
    totalTokens: 100000000,
    tokensForSale: 40000000,
    hardCap: 2000000,
    softCap: 500000,
    pricePerToken: tokenPrice,
    minContribution: 50,
    maxContribution: 10000,
    platform: "PinkSale",
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e0E3F3e4C3b",
    liquidityLock: "12 meses",
    vestingPeriod: "6 meses lineal",
    network: "BNB Smart Chain",
    tokenomics: {
      fairlaunch: 40,
      team: 15,
      marketing: 10,
      liquidity: 25,
      ecosystem: 10
    }
  };

  // 🎯 Calcular misiones completadas
  const calculateCompletedMissions = useCallback(() => {
    if (!missions) return 0;
    return Object.values(missions).filter(mission => mission.completed).length;
  }, [missions]);

  const completedMissions = calculateCompletedMissions();
  const totalMissions = missions ? Object.keys(missions).length : 0;
  const missionCompletionPercentage = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  // ⏰ Contador regresivo de 3 meses
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const startDate = new Date(fairlaunchDetails.startDate);
      const endDate = new Date(fairlaunchDetails.endDate);
      
      if (now < startDate) {
        setParticipationPhase('pre-launch');
        const difference = startDate.getTime() - now.getTime();
        setTimeLeft({
          months: Math.floor(difference / (1000 * 60 * 60 * 24 * 30)),
          days: Math.floor((difference / (1000 * 60 * 60 * 24)) % 30),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else if (now >= startDate && now <= endDate) {
        setParticipationPhase('active');
        const difference = endDate.getTime() - now.getTime();
        setTimeLeft({
          months: 0,
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setParticipationPhase('completed');
        setTimeLeft({ months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [fairlaunchDetails.startDate, fairlaunchDetails.endDate]);

  // 📈 Simulación de participación
  useEffect(() => {
    if (simulationAmount > 0) {
      const tokens = simulationAmount / tokenPrice;
      setSimulationTokens(tokens);
    }
  }, [simulationAmount, tokenPrice]);

  // 🚀 Simular compra de tokens
  const simulatePurchase = useCallback(async () => {
    setLoading(true);
    
    // Simulación de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tokens = simulationAmount / tokenPrice;
    
    toast({
      title: "🎉 ¡Reserva Confirmada!",
      description: `Has reservado $${simulationAmount} por ${tokens.toLocaleString()} tokens CROC. Los tokens se distribuirán en el lanzamiento.`,
      duration: 5000,
    });
    
    setUserParticipation(prev => prev + simulationAmount);
    setTotalRaised(prev => prev + simulationAmount);
    setShowSimulation(false);
    setSimulationAmount(100);
    setLoading(false);
  }, [simulationAmount, tokenPrice, toast]);

  // 💰 Función de retiro a exchange (simulada)
  const handleWithdrawToExchange = useCallback(async () => {
    if (!user) {
      toast({
        title: "🔒 Acceso Restringido",
        description: "Debes iniciar sesión para retirar tokens a un exchange",
        duration: 3000,
      });
      return;
    }

    if ((gameState?.nativeTokenBalance || 0) < 10) {
      toast({
        title: "💰 Saldo Insuficiente",
        description: "Necesitas al menos 10 CROC tokens para retirar a exchange",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    
    // Simulación de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "🔄 Retiro Procesado",
      description: `Se han enviado ${gameState?.nativeTokenBalance || 0} CROC tokens a tu wallet conectada.`,
      duration: 5000,
    });
    
    setLoading(false);
  }, [user, gameState?.nativeTokenBalance, toast]);

  // 📊 Calcular porcentajes
  const progressPercentage = Math.min(100, (totalRaised / fairlaunchDetails.hardCap) * 100);
  const softCapPercentage = (fairlaunchDetails.softCap / fairlaunchDetails.hardCap) * 100;

  // 🎯 Componente de cuenta regresiva principal
  const CountdownDisplay = () => (
    <div className="bg-gradient-to-br from-purple-900/90 to-indigo-800/90 border-2 border-purple-500/60 rounded-xl p-8 backdrop-blur-sm shadow-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 px-4 py-2 rounded-full border border-purple-500/30">
          <Rocket className="w-4 h-4 text-purple-300" />
          <span className="text-sm text-purple-300">LANZAMIENTO EN</span>
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-2">
          {timeLeft.months > 0 ? `${timeLeft.months} MESES` : `${timeLeft.days} DÍAS`}
        </h2>
        <p className="text-gray-300">
          El fairlaunch comenzará el {new Date(fairlaunchDetails.startDate).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-6">
        {timeLeft.months > 0 ? (
          <>
            <TimeUnit value={timeLeft.months} label="Meses" />
            <TimeUnit value={timeLeft.days} label="Días" />
            <TimeUnit value={timeLeft.hours} label="Horas" />
            <TimeUnit value={timeLeft.minutes} label="Minutos" />
            <TimeUnit value={timeLeft.seconds} label="Segundos" />
          </>
        ) : (
          <>
            <TimeUnit value={timeLeft.days} label="Días" />
            <TimeUnit value={timeLeft.hours} label="Horas" />
            <TimeUnit value={timeLeft.minutes} label="Minutos" />
            <TimeUnit value={timeLeft.seconds} label="Segundos" />
            <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-300">🔥</div>
              <div className="text-xs text-red-200 mt-1">¡Pronto!</div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-700/30">
        <p className="text-sm text-purple-200 text-center">
          <Sparkles className="w-4 h-4 inline mr-2" />
          <strong>¡Aprovecha el tiempo!</strong> Completa misiones y acumula tokens antes del lanzamiento.
        </p>
      </div>
    </div>
  );

  // 🎯 Componente de progreso de preventa
  const PresaleProgress = () => (
    <div className="bg-gradient-to-br from-blue-900/90 to-cyan-800/90 border-2 border-blue-500/60 rounded-xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-blue-100">📈 Progreso de la Preventa</h3>
          <p className="text-sm text-blue-200">Reservas acumuladas</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            ${totalRaised.toLocaleString()}
          </div>
          <div className="text-sm text-blue-300">de ${fairlaunchDetails.hardCap.toLocaleString()}</div>
        </div>
      </div>

      <div className="relative mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400">Soft Cap: ${fairlaunchDetails.softCap.toLocaleString()}</span>
          <span className="text-yellow-400">Hard Cap: ${fairlaunchDetails.hardCap.toLocaleString()}</span>
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
            className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 relative overflow-hidden"
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

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-blue-800/30 rounded-lg border border-blue-700/30">
          <div className="text-lg font-bold text-blue-300">
            {Math.round(progressPercentage)}%
          </div>
          <div className="text-xs text-blue-200">Progreso</div>
        </div>
        <div className="p-3 bg-green-800/30 rounded-lg border border-green-700/30">
          <div className="text-lg font-bold text-green-300">
            {userParticipation > 0 ? `$${userParticipation}` : '$0'}
          </div>
          <div className="text-xs text-green-200">Tu reserva</div>
        </div>
        <div className="p-3 bg-purple-800/30 rounded-lg border border-purple-700/30">
          <div className="text-lg font-bold text-purple-300">
            {fairlaunchDetails.tokensForSale.toLocaleString()}
          </div>
          <div className="text-xs text-purple-200">Tokens en venta</div>
        </div>
      </div>
    </div>
  );

  // 🎯 Componente de misión y airdrop
  const MissionAirdropSection = () => (
    <div className="bg-gradient-to-br from-green-900/90 to-emerald-800/90 border-2 border-green-500/60 rounded-xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-700/50 rounded-xl">
            <Trophy className="w-6 h-6 text-green-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-100">🏆 Programa de Airdrop por Misiones</h3>
            <p className="text-sm text-green-200">Completa misiones, gana tokens</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 text-white text-sm px-3 py-1.5 rounded-full">
          {completedMissions}/{totalMissions}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-300">Progreso de misiones</span>
          <span className="text-yellow-300">{missionCompletionPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-green-900/50 rounded-full h-3">
          <div 
            className="h-3 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500"
            style={{ width: `${missionCompletionPercentage}%` }}
          />
        </div>
        
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 bg-green-800/40 px-3 py-1 rounded-full">
            <Award className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-yellow-300">
              {completedMissions >= totalMissions 
                ? "🎉 ¡Todas las misiones completadas!" 
                : `${totalMissions - completedMissions} misiones restantes`}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gradient-to-r from-yellow-900/30 to-amber-800/30 rounded-lg border border-yellow-600/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-yellow-700/40 rounded-lg">
              <Star className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h4 className="font-bold text-yellow-300 text-lg">¡Los más activos serán recompensados!</h4>
              <p className="text-sm text-yellow-200 mt-1">
                Los usuarios que completen el <strong>máximo de misiones posibles</strong> recibirán bonificaciones especiales en el airdrop.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center">
              <div className="text-xs text-yellow-300">Misiones Completas</div>
              <div className="font-bold text-white text-lg">{completedMissions}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-yellow-300">Bonificación</div>
              <div className="font-bold text-green-400 text-lg">
                +{(completedMissions * 5).toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-yellow-300">Tokens Extra</div>
              <div className="font-bold text-blue-400 text-lg">
                ~{Math.floor(completedMissions * 10)} CROC
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-green-800/40 rounded-lg border border-green-600/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-green-300" />
            <p className="text-sm text-green-200">
              <strong>Nota:</strong> El airdrop se distribuirá proporcionalmente según el progreso de misiones al momento del lanzamiento.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => window.location.hash = "#missions"}
        className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3"
      >
        <Target className="w-5 h-5 mr-2" />
        Ver Mis Misiones
      </Button>
    </div>
  );

  // 🎯 Componente de simulación de compra
  const PurchaseSimulation = () => (
    <AnimatePresence>
      {showSimulation && (
        <motion.div 
          className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowSimulation(false)}
        >
          <motion.div 
            className="modal-content rounded-xl p-6 w-full max-w-md bg-gradient-to-br from-card to-card/80 shadow-2xl border border-border/50"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                Reservar Tokens CROC
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
                  Monto a reservar (USD)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="10000"
                    step="50"
                    value={simulationAmount}
                    onChange={(e) => setSimulationAmount(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-bold text-yellow-400 w-32 text-right">
                    ${simulationAmount}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Mín: ${fairlaunchDetails.minContribution}</span>
                  <span>Máx: ${fairlaunchDetails.maxContribution}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-700/30">
                  <div className="text-sm text-purple-300 mb-1">Tokens a recibir</div>
                  <div className="text-2xl font-bold text-white">
                    {simulationTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC
                  </div>
                </div>
                
                <div className="p-4 bg-blue-900/30 rounded-lg border border-blue-700/30">
                  <div className="text-sm text-blue-300 mb-1">Precio por token</div>
                  <div className="text-2xl font-bold text-white">
                    ${tokenPrice.toFixed(6)}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg border border-yellow-700/30">
                <h4 className="font-semibold text-yellow-300 mb-3 text-sm">📈 Proyección de valorización</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">1 año</div>
                    <div className="font-bold text-green-400">${(simulationTokens * tokenPrice * 5).toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">2 años</div>
                    <div className="font-bold text-blue-400">${(simulationTokens * tokenPrice * 10).toLocaleString()}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-400">3 años</div>
                    <div className="font-bold text-purple-400">${(simulationTokens * tokenPrice * 20).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={simulatePurchase}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-4 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Procesando reserva...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-2" />
                    Confirmar Reserva
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  Esta es una simulación. Los tokens reales se distribuirán en el lanzamiento.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 🎯 Componente de retiro a exchange
  const WithdrawToExchange = () => (
    <div className="bg-gradient-to-br from-red-900/90 to-orange-800/90 border-2 border-red-500/60 rounded-xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-700/50 rounded-xl">
            <Send className="w-6 h-6 text-red-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-100">💸 Retirar a Exchange</h3>
            <p className="text-sm text-red-200">Envía tus tokens CROC a tu wallet</p>
          </div>
        </div>
        <div className="bg-red-600 text-white text-sm px-3 py-1.5 rounded-full">
          Beta
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-red-800/40 rounded-lg border border-red-600/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-red-300">Balance disponible:</span>
            <span className="text-2xl font-bold text-yellow-300">
              {gameState?.nativeTokenBalance?.toLocaleString() || 0} CROC
            </span>
          </div>
          <div className="text-sm text-red-200">
            Valor actual: <span className="font-bold text-green-400">
              ${((gameState?.nativeTokenBalance || 0) * tokenPrice).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-200">Mínimo para retiro:</span>
            <span className="font-bold text-yellow-300">10 CROC</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-200">Comisión de red:</span>
            <span className="font-bold text-blue-300">0.5%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-200">Tiempo estimado:</span>
            <span className="font-bold text-green-300">2-5 minutos</span>
          </div>
        </div>

        <Button
          onClick={handleWithdrawToExchange}
          disabled={loading || (gameState?.nativeTokenBalance || 0) < 10}
          className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold py-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Procesando...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5 mr-2" />
              Retirar a mi Wallet
            </>
          )}
        </Button>

        <div className="p-3 bg-red-900/30 rounded-lg border border-red-700/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-300 mt-0.5" />
            <p className="text-xs text-yellow-200">
              <strong>Nota:</strong> Esta función está en fase beta. Los tokens solo se pueden retirar a wallets conectadas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // 🎯 Tokenomics Chart mejorado
  const TokenomicsChart = () => (
    <div className="p-5 bg-gradient-to-br from-gray-900/80 to-black/80 rounded-xl border-2 border-gray-700/50">
      <h4 className="font-bold text-xl mb-4 text-white flex items-center gap-2">
        <PieChart className="w-5 h-5 text-purple-400" />
        Distribución de Tokens
      </h4>
      <div className="space-y-4">
        {Object.entries(fairlaunchDetails.tokenomics).map(([key, value]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  key === 'fairlaunch' ? 'bg-blue-500' :
                  key === 'team' ? 'bg-purple-500' :
                  key === 'marketing' ? 'bg-green-500' :
                  key === 'liquidity' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-300 capitalize">{key}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      key === 'fairlaunch' ? 'bg-blue-500' :
                      key === 'team' ? 'bg-purple-500' :
                      key === 'marketing' ? 'bg-green-500' :
                      key === 'liquidity' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-10">{value}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 🎯 PieChart icon
  const PieChart = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* 🏁 Encabezado principal */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 mb-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 px-6 py-3 rounded-full border border-purple-500/30">
            <Sparkles className="w-5 h-5 text-purple-300" />
            <span className="text-lg text-purple-300 font-bold">FAIRLAUNCH EXCLUSIVO</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            🚀 Fairlaunch $CROC
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Únete al lanzamiento descentralizado del token oficial de Cocodrilo Kombat. 
            <span className="text-yellow-400 font-bold"> ¡Reserva ahora y sé parte de la revolución!</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 Columna izquierda */}
          <div className="space-y-8">
            {/* ⏰ Cuenta regresiva */}
            <CountdownDisplay />
            
            {/* 🎯 Progreso de preventa */}
            <PresaleProgress />
            
            {/* 💰 Retiro a exchange */}
            <WithdrawToExchange />
          </div>

          {/* 📈 Columna central */}
          <div className="space-y-8">
            {/* 🎮 Misión y airdrop */}
            <MissionAirdropSection />
            
            {/* 📊 Tokenomics */}
            <TokenomicsChart />
            
            {/* 📋 Detalles técnicos */}
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 border-2 border-gray-700/60 rounded-xl p-6 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Detalles Técnicos
              </h3>
              
              <div className="space-y-3">
                <DetailItem 
                  icon={Globe}
                  label="Red Blockchain:" 
                  value={fairlaunchDetails.network}
                  color="text-blue-400"
                />
                <DetailItem 
                  icon={Lock}
                  label="Liquidez bloqueada:" 
                  value={fairlaunchDetails.liquidityLock}
                  color="text-green-400"
                />
                <DetailItem 
                  icon={Calendar}
                  label="Vesting equipo:" 
                  value={fairlaunchDetails.vestingPeriod}
                  color="text-yellow-400"
                />
                <DetailItem 
                  icon={CreditCard}
                  label="Plataforma:" 
                  value={fairlaunchDetails.platform}
                  color="text-purple-400"
                />
                <DetailItem 
                  icon={DollarSign}
                  label="Precio por token:" 
                  value={`$${tokenPrice.toFixed(6)}`}
                  color="text-green-400"
                />
                <DetailItem 
                  icon={ShieldCheck}
                  label="Contrato auditado:" 
                  value="Próximamente"
                  color="text-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* 🚀 Columna derecha */}
          <div className="space-y-8">
            {/* 🎯 Beneficios de participación */}
            <div className="bg-gradient-to-br from-blue-900/90 to-cyan-800/90 border-2 border-blue-500/60 rounded-xl p-6 backdrop-blur-sm shadow-xl">
              <h3 className="text-xl font-bold text-blue-100 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                Beneficios Exclusivos
              </h3>
              
              <div className="space-y-4">
                <BenefitItem 
                  icon={Zap}
                  title="Precio más bajo"
                  description="Obtén CROC al precio más bajo posible antes del listing público"
                  color="yellow"
                />
                <BenefitItem 
                  icon={Users}
                  title="Comunidad fundadora"
                  description="Acceso exclusivo a votaciones y decisiones del proyecto"
                  color="blue"
                />
                <BenefitItem 
                  icon={TrendingUp}
                  title="Potencial de crecimiento"
                  description="Históricamente, los fairlaunches ofrecen los mayores retornos"
                  color="green"
                />
                <BenefitItem 
                  icon={Gift}
                  title="Bonos por misiones"
                  description="+5% extra de tokens por cada misión completada"
                  color="purple"
                />
              </div>
            </div>

            {/* 🎮 CTA Principal */}
            <div className="bg-gradient-to-br from-purple-900/90 to-pink-800/90 border-2 border-purple-500/60 rounded-xl p-6 backdrop-blur-sm shadow-xl text-center">
              <div className="mb-6">
                <div className="text-4xl mb-2">🎮</div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Tu Aventura Comienza Aquí!</h3>
                <p className="text-gray-300">
                  Juega, completa misiones y acumula tokens antes del lanzamiento
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setShowSimulation(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-4 text-lg sparkle-effect"
                >
                  <ShoppingBag className="w-6 h-6 mr-2" />
                  Reservar Tokens Ahora
                </Button>
                
                <Button
                  onClick={() => window.location.hash = "#game"}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white py-3"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Ir a Jugar
                </Button>
                
                <Button
                  onClick={() => window.open('https://t.me/yourchannel', '_blank')}
                  className="w-full bg-gradient-to-r from-[#0088cc] to-[#0077b3] hover:from-[#0077b3] hover:to-[#006699] text-white py-3"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Unirse al Telegram
                </Button>
              </div>
            </div>

            {/* 💡 Consejos rápidos */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-amber-800/20 border-2 border-yellow-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Maximiza tu Participación
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Completa todas las misiones</strong> para maximizar tu bonificación en el airdrop
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Reserva temprano</strong> para asegurar el precio más bajo
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Mantén tus tokens</strong> para participar en staking futuro
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 📊 Métricas finales */}
        <motion.div 
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <MetricCard 
            icon={Clock}
            value={`${timeLeft.months > 0 ? `${timeLeft.months}M` : `${timeLeft.days}D`}`}
            label="Hasta el lanzamiento"
            color="purple"
          />
          <MetricCard 
            icon={Coins}
            value={((completedMissions / totalMissions) * 100).toFixed(0) + "%"}
            label="Progreso de misiones"
            color="yellow"
          />
          <MetricCard 
            icon={DollarSign}
            value={`$${totalRaised.toLocaleString()}`}
            label="Reservas totales"
            color="green"
          />
          <MetricCard 
            icon={Users}
            value={(totalRaised / tokenPrice).toLocaleString()}
            label="Tokens reservados"
            color="blue"
          />
        </motion.div>
      </div>

      {/* 🎯 Modal de simulación de compra */}
      <PurchaseSimulation />
    </div>
  );
}

// 🎨 Subcomponentes
const TimeUnit = ({ value, label }) => (
  <div className="bg-gradient-to-br from-purple-800/50 to-pink-800/50 rounded-lg p-4 text-center">
    <div className="text-3xl font-bold text-white font-mono">{value.toString().padStart(2, '0')}</div>
    <div className="text-xs text-purple-200 mt-1">{label}</div>
  </div>
);

const BenefitItem = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300',
    blue: 'bg-blue-900/20 border-blue-700/30 text-blue-300',
    green: 'bg-green-900/20 border-green-700/30 text-green-300',
    purple: 'bg-purple-900/20 border-purple-700/30 text-purple-300'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue} flex items-start gap-3`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs opacity-80">{description}</p>
      </div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center">
      <Icon className={`w-4 h-4 mr-2 ${color || 'text-gray-400'}`} />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <span className={`font-semibold text-sm ${color || 'text-white'}`}>
      {value}
    </span>
  </div>
);

const MetricCard = ({ icon: Icon, value, label, color }) => {
  const colorClasses = {
    green: 'from-green-900/30 to-emerald-800/30 border-green-700/30 text-green-400',
    yellow: 'from-yellow-900/30 to-amber-800/30 border-yellow-700/30 text-yellow-400',
    blue: 'from-blue-900/30 to-cyan-800/30 border-blue-700/30 text-blue-400',
    purple: 'from-purple-900/30 to-pink-800/30 border-purple-700/30 text-purple-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-5 border text-center`}>
      <Icon className="w-8 h-8 mx-auto mb-3" />
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
};