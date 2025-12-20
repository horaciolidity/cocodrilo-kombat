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
  Link,
  UserPlus,
  TrendingDown,
  ChevronRight,
  Star,
  Eye,
  ShoppingBag,
  MessageSquare,
  Download,
  Users as UsersIcon,
  Trophy,
  BarChart
} from 'lucide-react';

export function FairlaunchView({ 
  toast, 
  tokenPrice = 0.05,
  setTokenPrice,
  updatePriceInSupabase,
  gameState,
  referralStats,
  refreshReferralStats,
  getReferralLink,
  player,
  user
}) {
  const [timeLeft, setTimeLeft] = useState({});
  const [participationPhase, setParticipationPhase] = useState('pre-launch');
  const [totalRaised, setTotalRaised] = useState(125000);
  const [participationGoal, setParticipationGoal] = useState(500000);
  const [userParticipation, setUserParticipation] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState(100);
  const [simulationTokens, setSimulationTokens] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userBalance, setUserBalance] = useState({
    crocTokens: 0,
    totalEarnedCroc: 0,
    totalEarnedCoins: 0
  });

  // 🎯 Obtener balance del usuario desde gameState
  useEffect(() => {
    if (gameState) {
      setUserBalance({
        crocTokens: gameState.nativeTokenBalance || 0,
        totalEarnedCroc: gameState.crocFromRefs || 0,
        totalEarnedCoins: gameState.coinsFromRefs || 0
      });
    }
  }, [gameState]);

  // 🎯 Referral stats del usuario
  const userReferralStats = referralStats || {
    referralsCount: 0,
    crocFromRefs: 0,
    coinsFromRefs: 0,
    currentBalance: 0,
    currentCoins: 0
  };

  // 🎯 Datos del fairlaunch - REALISTAS
  const fairlaunchDetails = {
    startDate: "2025-03-01T14:00:00Z",
    endDate: "2025-03-07T14:00:00Z",
    totalTokens: 100000000,
    tokensForSale: 40000000, // 40% del supply
    hardCap: 2000000, // $2M
    softCap: 500000,  // $500K
    pricePerToken: tokenPrice,
    minContribution: 50, // $50
    maxContribution: 10000, // $10,000
    platform: "PinkSale / GemPad",
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e0E3F3e4C3b",
    liquidityLock: "12 meses en Unicrypt",
    vestingPeriod: "6 meses lineal",
    network: "BNB Smart Chain",
    tokenomics: {
      team: 15,
      advisors: 5,
      marketing: 10,
      liquidity: 40,
      ecosystem: 20,
      reserves: 10
    }
  };

  // 📋 Funciones de referidos
  const copyReferralLink = useCallback(() => {
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
      setCopied(true);
      toast({
        title: '📋 ¡Enlace copiado!',
        description: '¡Comparte tu link y gana recompensas adicionales!',
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Error copiando enlace:', err);
      toast({
        title: '❌ Error',
        description: 'No se pudo copiar el enlace',
        duration: 3000,
      });
    });
  }, [getReferralLink, toast]);

  // 🚀 Simular compra de tokens (solo simulación)
  const simulatePurchase = useCallback(async () => {
    if (participationPhase !== 'active') {
      toast({
        title: "⏳ ¡Prepárate para el lanzamiento!",
        description: `La preventa de tokens estará disponible a partir del ${new Date(fairlaunchDetails.startDate).toLocaleDateString()}.`,
        duration: 4000,
      });
      return;
    }

    setLoading(true);
    
    // Simulación de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const tokens = simulationAmount / tokenPrice;
    
    toast({
      title: "🚀 ¡Simulación Exitosa!",
      description: `Has reservado $${simulationAmount} por ${tokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens CROC.`,
      duration: 5000,
    });
    
    setUserParticipation(prev => prev + simulationAmount);
    setTotalRaised(prev => prev + simulationAmount);
    setShowSimulation(false);
    setSimulationAmount(100);
    setLoading(false);
  }, [participationPhase, simulationAmount, tokenPrice, toast, fairlaunchDetails.startDate]);

  // ⏰ Contador regresivo - INTELIGENTE
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const startDate = new Date(fairlaunchDetails.startDate);
      const endDate = new Date(fairlaunchDetails.endDate);
      
      // Determinar fase actual
      if (now < startDate) {
        setParticipationPhase('pre-launch');
        const difference = startDate.getTime() - now.getTime();
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else if (now >= startDate && now <= endDate) {
        setParticipationPhase('active');
        const difference = endDate.getTime() - now.getTime();
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setParticipationPhase('completed');
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

  // 📊 Calcular porcentajes
  const progressPercentage = Math.min(100, (totalRaised / fairlaunchDetails.hardCap) * 100);
  const softCapPercentage = (fairlaunchDetails.softCap / fairlaunchDetails.hardCap) * 100;
  
  // 📈 Calcular rendimiento potencial
  const calculatePotentialReturn = (investment) => {
    const tokens = investment / tokenPrice;
    const potentialValues = {
      conservador: tokens * (tokenPrice * 2),
      moderado: tokens * (tokenPrice * 5),
      agresivo: tokens * (tokenPrice * 10)
    };
    return potentialValues;
  };

  // 🎨 Formatear tiempo
  const formatTimeLeft = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  // 🎯 Componente de balance del usuario
  const renderUserBalance = () => (
    <div className="bg-gradient-to-br from-blue-900/90 to-indigo-800/90 border-2 border-blue-500/60 rounded-xl p-5 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-700/50 rounded-xl">
            <Wallet className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-100">💰 Tu Balance</h3>
            <p className="text-sm text-blue-200">Tokens CROC acumulados</p>
          </div>
        </div>
        <div className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-full">
          {user ? '👤 Conectado' : '👥 Invitado'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-blue-800/60 rounded-lg p-3 text-center border border-blue-600/40">
          <div className="text-2xl font-bold text-yellow-300 mb-1">
            {userBalance.crocTokens.toLocaleString()}
          </div>
          <div className="text-xs text-blue-200">Tokens CROC</div>
        </div>
        <div className="bg-purple-800/60 rounded-lg p-3 text-center border border-purple-600/40">
          <div className="text-2xl font-bold text-purple-300 mb-1">
            ${(userBalance.crocTokens * tokenPrice).toFixed(2)}
          </div>
          <div className="text-xs text-purple-200">Valor Actual</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-200">CROC por referidos:</span>
          <span className="font-bold text-green-300">{userReferralStats.crocFromRefs || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-200">Monedas por referidos:</span>
          <span className="font-bold text-yellow-300">
            {(userReferralStats.coinsFromRefs || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-200">Precio CROC:</span>
          <span className="font-bold text-green-400">${tokenPrice.toFixed(6)}</span>
        </div>
      </div>

      {!user && (
        <div className="mt-4 p-3 bg-blue-800/40 rounded-lg border border-blue-600/30">
          <p className="text-sm text-blue-200 text-center">
            <UserPlus className="w-4 h-4 inline mr-2" />
            <strong>¡Regístrate para guardar tu progreso!</strong> Los tokens se acreditan automáticamente.
          </p>
        </div>
      )}
    </div>
  );

  // 🎯 Componente de progreso de referidos
  const renderReferralProgress = () => {
    return (
      <div className="bg-gradient-to-br from-green-900/90 to-emerald-800/90 border-2 border-green-500/60 rounded-xl p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-700/50 rounded-xl">
              <Users className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-100">🎁 Programa de Referidos</h3>
              <p className="text-sm text-green-200">Gana tokens invitando amigos</p>
            </div>
          </div>
          <div className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>¡Activo!</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-800/60 rounded-lg p-3 text-center border border-green-600/40">
            <div className="text-2xl font-bold text-green-300 mb-1">
              {userReferralStats.referralsCount || 0}
            </div>
            <div className="text-xs text-green-200">Referidos</div>
          </div>
          <div className="bg-yellow-800/60 rounded-lg p-3 text-center border border-yellow-600/40">
            <div className="text-2xl font-bold text-yellow-300 mb-1">
              {userReferralStats.crocFromRefs || 0}
            </div>
            <div className="text-xs text-yellow-200">CROC Ganados</div>
          </div>
          <div className="bg-blue-800/60 rounded-lg p-3 text-center border border-blue-600/40">
            <div className="text-2xl font-bold text-blue-300 mb-1">
              {(userReferralStats.coinsFromRefs || 0).toLocaleString()}
            </div>
            <div className="text-xs text-blue-200">Monedas</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-300">Progreso hacia bono</span>
            <span className="text-yellow-300">
              {userReferralStats.referralsCount || 0} / 10 referidos
            </span>
          </div>
          <div className="w-full bg-green-900/50 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              style={{ width: `${Math.min(100, ((userReferralStats.referralsCount || 0) / 10) * 100)}%` }}
            />
          </div>
          <div className="text-xs text-green-300 mt-2 text-center">
            {10 - (userReferralStats.referralsCount || 0)} referidos más para ganar +50 CROC bonus
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-200 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Recompensa por referido
            </span>
            <span className="font-bold text-yellow-300">10 CROC + 1000 monedas</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-200 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Bono por 10+ referidos
            </span>
            <span className="font-bold text-purple-300">+50 CROC extra</span>
          </div>
        </div>

        <Button
          onClick={copyReferralLink}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3"
          disabled={!user}
        >
          <Copy className={`w-5 h-5 mr-2 ${copied ? 'text-yellow-300' : ''}`} />
          {copied ? '¡Enlace Copiado! 🎉' : 'Copiar Enlace de Referido'}
        </Button>

        {!user && (
          <div className="mt-3 p-3 bg-yellow-800/30 rounded-lg border border-yellow-600/30">
            <p className="text-sm text-yellow-200 text-center">
              <UserPlus className="w-4 h-4 inline mr-2" />
              ¡Regístrate para habilitar tu enlace de referidos!
            </p>
          </div>
        )}
      </div>
    );
  };

  // 🎯 Renderizar simulación de compra
  const renderPurchaseSimulation = () => (
    <AnimatePresence>
      {showSimulation && (
        <motion.div 
          className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border-2 border-purple-700/50 mb-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-purple-300 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Simulación de Compra CROC
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
                Monto a invertir (USD)
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
                <span className="text-xl font-bold text-yellow-400 w-24 text-right">
                  ${simulationAmount}
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Mín: ${fairlaunchDetails.minContribution}</span>
                <span>Máx: ${fairlaunchDetails.maxContribution}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-purple-900/30 rounded-lg">
                <div className="text-sm text-purple-300 mb-1">Tokens recibidos</div>
                <div className="text-xl font-bold text-white">
                  {simulationTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC
                </div>
              </div>
              
              <div className="p-3 bg-green-900/30 rounded-lg">
                <div className="text-sm text-green-300 mb-1">Precio por token</div>
                <div className="text-xl font-bold text-white">
                  ${tokenPrice.toFixed(6)}
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg border border-yellow-700/30">
              <h4 className="font-semibold text-yellow-300 mb-2 text-sm">Proyección de ganancias:</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(calculatePotentialReturn(simulationAmount)).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-gray-400 capitalize">{key}</div>
                    <div className="font-bold text-green-400">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <Button
              onClick={simulatePurchase}
              disabled={loading || participationPhase !== 'active'}
              className={`w-full ${
                participationPhase === 'active'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 sparkle-effect'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } text-white font-bold py-3`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Procesando...
                </>
              ) : participationPhase === 'active' ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Simular Compra
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 mr-2" />
                  Próximamente
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // 🎯 Tokenomics Chart
  const TokenomicsChart = () => (
    <div className="p-4 bg-gray-900/50 rounded-xl">
      <h4 className="font-bold text-lg mb-3 text-white">📊 Tokenomics</h4>
      <div className="space-y-3">
        {Object.entries(fairlaunchDetails.tokenomics).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-300 capitalize">{key}:</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-sm font-bold text-white w-10">{value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 mb-3 bg-gradient-to-r from-yellow-900/30 to-amber-800/30 px-4 py-2 rounded-full border border-yellow-500/30">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-yellow-300">FASE PRE-LANZAMIENTO</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <Rocket className="w-8 h-8 mr-3 text-purple-400" /> 
            Fairlaunch $CROC 🐊
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            <span className="text-yellow-400 font-bold">¡Prepárate para el despegue!</span> Invita amigos y acumula recompensas antes del lanzamiento.
          </p>
          
          {/* Banner informativo */}
          <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-2 border-blue-500/30 rounded-xl p-4 mb-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <div className="bg-blue-600/20 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-300" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-blue-300">⚠️ Preventa Próximamente</h3>
                <p className="text-sm text-blue-200">
                  La compra de tokens CROC estará habilitada cuando el proyecto complete sus objetivos de comunidad. 
                  ¡Invita amigos para acelerar el proceso!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 Panel izquierdo */}
          <div className="lg:col-span-2 space-y-6">
            {/* 🎯 Balance del usuario */}
            {renderUserBalance()}

            {/* 📈 Progreso del fairlaunch */}
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
                    ${totalRaised.toLocaleString()} / ${fairlaunchDetails.hardCap.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="relative mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">Soft Cap: ${fairlaunchDetails.softCap.toLocaleString()}</span>
                  <span className="text-yellow-400">Hard Cap: ${fairlaunchDetails.hardCap.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-4 shadow-inner relative">
                  {/* Línea de Soft Cap */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-yellow-400"
                    style={{ left: `${softCapPercentage}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 whitespace-nowrap">
                      Soft Cap
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
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

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {timeLeft.days || 0}
                  </div>
                  <div className="text-xs text-blue-300">Días restantes</div>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-xs text-green-300">Progreso</div>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {fairlaunchDetails.tokensForSale.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-300">Tokens en venta</div>
                </div>
              </div>
            </motion.div>

            {/* 🎯 Programa de referidos */}
            {renderReferralProgress()}
          </div>

          {/* 🎮 Panel derecho */}
          <div className="space-y-6">
            {/* ⏰ Contador regresivo */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Clock className="w-6 h-6 mr-2 text-purple-400" />
                {participationPhase === 'pre-launch' ? 'Comienza en' : 'Finaliza en'}
              </h3>
              
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-2 font-mono">
                  {formatTimeLeft()}
                </div>
                <div className="text-lg text-gray-300">
                  {participationPhase === 'pre-launch' 
                    ? `Inicio: ${new Date(fairlaunchDetails.startDate).toLocaleDateString()}`
                    : `Final: ${new Date(fairlaunchDetails.endDate).toLocaleDateString()}`}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center mb-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white font-mono">{timeLeft.days || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Días</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white font-mono">{timeLeft.hours || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Horas</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white font-mono">{timeLeft.minutes || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Minutos</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white font-mono">{timeLeft.seconds || 0}</div>
                  <div className="text-xs text-gray-400 mt-1">Segundos</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-700/30">
                <p className="text-sm text-purple-200 text-center">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  <strong>¡Aprovecha ahora!</strong> Invita amigos antes del inicio para maximizar tus ganancias.
                </p>
              </div>
            </motion.div>

            {/* 📋 Detalles técnicos */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-blue-400" />
                Detalles Técnicos
              </h3>
              
              <div className="space-y-3">
                <DetailItem 
                  icon={Globe}
                  label="Red:" 
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
                  icon={Timer}
                  label="Vesting equipo:" 
                  value={fairlaunchDetails.vestingPeriod}
                  color="text-yellow-400"
                />
                <DetailItem 
                  icon={Package}
                  label="Tokens en venta:" 
                  value={`${((fairlaunchDetails.tokensForSale / fairlaunchDetails.totalTokens) * 100).toFixed(1)}%`}
                  color="text-purple-400"
                />
                <DetailItem 
                  icon={DollarSign}
                  label="Precio por token:" 
                  value={`$${tokenPrice.toFixed(6)}`}
                  color="text-green-400"
                />
              </div>

              {/* Tokenomics Chart */}
              <div className="mt-6">
                <TokenomicsChart />
              </div>
            </motion.div>

            {/* 🎮 Acciones */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-400" />
                Acciones Disponibles
              </h3>
              
              <div className="space-y-3">
                <Button
                  onClick={() => setShowSimulation(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3"
                  disabled={participationPhase === 'completed'}
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  {participationPhase === 'active' 
                    ? 'Simular Compra de Tokens' 
                    : participationPhase === 'pre-launch'
                    ? 'Preventa Próximamente'
                    : 'Fairlaunch Finalizado'}
                </Button>
                
                <Button
                  onClick={copyReferralLink}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white py-3"
                  disabled={!user}
                >
                  <Copy className="w-5 h-5 mr-2" />
                  {user ? 'Copiar Enlace de Referidos' : 'Regístrate para Habilitar'}
                </Button>
                
                <Button
                  onClick={() => window.open('https://t.me/yourchannel', '_blank')}
                  className="w-full bg-gradient-to-r from-[#0088cc] to-[#0077b3] hover:from-[#0077b3] hover:to-[#006699] text-white py-3"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Unirse a Telegram
                </Button>
              </div>
            </motion.div>

            {/* 💡 Información importante */}
            <motion.div 
              className="stats-card rounded-xl p-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-amber-900/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
                <AlertCircle className="w-6 h-6 mr-2" />
                Información Importante
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Preventa próxima:</strong> La compra de tokens estará disponible al alcanzar 1,000 miembros en la comunidad.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Tokens reales:</strong> Los CROC que ganas por referidos son tokens reales que recibirás al lanzamiento.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Registro requerido:</strong> Solo usuarios registrados pueden acumular tokens por referidos.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 🎯 Simulación de compra */}
        {renderPurchaseSimulation()}

        {/* 📊 Sección de métricas */}
        <motion.div 
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <MetricCard 
            icon={UsersIcon}
            value={userReferralStats.referralsCount || 0}
            label="Referidos Totales"
            color="green"
          />
          <MetricCard 
            icon={Coins}
            value={((userReferralStats.referralsCount || 0) * 10).toLocaleString()}
            label="CROC Potenciales"
            color="yellow"
          />
          <MetricCard 
            icon={DollarSign}
            value={`$${(((userReferralStats.referralsCount || 0) * 10) * tokenPrice).toFixed(2)}`}
            label="Valor Potencial"
            color="blue"
          />
          <MetricCard 
            icon={BarChart}
            value={`${progressPercentage.toFixed(1)}%`}
            label="Progreso Fairlaunch"
            color="purple"
          />
        </motion.div>

        {/* 📋 CTA Final */}
        <motion.div 
          className="mt-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border-2 border-blue-500/30 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-2xl font-bold text-white mb-3">🚀 ¡Sé Parte del Lanzamiento!</h3>
          <p className="text-gray-300 mb-4 max-w-2xl mx-auto">
            Invita amigos, acumula tokens CROC y prepárate para el fairlaunch. 
            Los primeros participantes recibirán beneficios exclusivos.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              onClick={copyReferralLink}
              className="bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white"
              size="lg"
              disabled={!user}
            >
              <Copy className="w-5 h-5 mr-2" />
              {user ? 'Copiar Enlace de Invitación' : 'Regístrate Primero'}
            </Button>
            
            <Button
              onClick={() => window.open('https://t.me/yourchannel', '_blank')}
              className="bg-gradient-to-r from-[#0088cc] to-[#0077b3] hover:from-[#0077b3] hover:to-[#006699] text-white"
              size="lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Unirse a la Comunidad
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// 🎨 Subcomponentes
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
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border text-center`}>
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
};