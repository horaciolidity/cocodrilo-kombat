import React, { useState, useEffect } from 'react';
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
  ListChecks
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useGameData } from '@/hooks/useGameData';

export function FairlaunchView({ 
  toast, 
  tokenPrice = 0.05,
  setTokenPrice,
  updatePriceInSupabase
}) {
  const { toast: uiToast } = useToast();
  const gameData = useGameData();
  
  // 🎯 ESTADOS REALES DEL FAIRLAUNCH
  const [fairlaunchPhase, setFairlaunchPhase] = useState('pre-launch'); // pre-launch, live, completed
  const [timeLeft, setTimeLeft] = useState({});
  const [participationStats, setParticipationStats] = useState({
    totalRaised: 0,
    participants: 0,
    progress: 0
  });
  const [userParticipation, setUserParticipation] = useState({
    amount: 0,
    tokens: 0,
    rank: null
  });
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyAmount, setBuyAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🎯 CONFIGURACIÓN DEL FAIRLAUNCH (REAL)
  const fairlaunchConfig = {
    // Fechas reales (ajustar según necesidad)
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 días desde ahora
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días desde ahora
    
    // Detalles del token
    tokenName: "CROC",
    tokenSymbol: "CROC",
    totalSupply: "100,000,000",
    tokensForSale: "40,000,000 (40%)",
    initialPrice: 0.05,
    
    // Límites de participación
    minBuy: 50, // USD mínimo
    maxBuy: 10000, // USD máximo
    softCap: 500000, // $500K
    hardCap: 2000000, // $2M
    
    // Información técnica
    network: "Optimism",
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e0E3F3e4C3b",
    tokenStandard: "ERC-20",
    vesting: "6 meses lineal",
    liquidityLock: "12 meses en Uniswap V3",
    auditStatus: "En progreso (CertiK)",
    
    // Exchanges confirmados
    exchanges: [
      { name: "Uniswap V3", status: "Confirmado", launch: "Día 1" },
      { name: "SushiSwap", status: "Confirmado", launch: "Día 1" },
      { name: "MEXC", status: "En negociación", launch: "Semana 2" },
      { name: "Gate.io", status: "En negociación", launch: "Semana 2" },
      { name: "KuCoin", status: "En conversaciones", launch: "Mes 1" }
    ],
    
    // Bonos por etapas
    bonuses: [
      { phase: "Primera hora", bonus: "25%" },
      { phase: "Primer día", bonus: "20%" },
      { phase: "Primera semana", bonus: "15%" },
      { phase: "Segunda semana", bonus: "10%" },
      { phase: "Tercera semana", bonus: "5%" }
    ]
  };

  // 🎯 CARGAR DATOS REALES DEL FAIRLAUNCH
  useEffect(() => {
    loadFairlaunchData();
    const interval = setInterval(loadFairlaunchData, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadFairlaunchData = async () => {
    try {
      // 1. Cargar estadísticas desde Supabase
      const { data: stats } = await supabase
        .from('fairlaunch_stats')
        .select('*')
        .single();
      
      if (stats) {
        setParticipationStats({
          totalRaised: stats.total_raised || 0,
          participants: stats.participants || 0,
          progress: stats.progress || 0
        });
      }

      // 2. Cargar participación del usuario
      if (gameData.player?.id) {
        const { data: userData } = await supabase
          .from('fairlaunch_participations')
          .select('*')
          .eq('player_id', gameData.player.id)
          .single();
        
        if (userData) {
          setUserParticipation({
            amount: userData.amount_usd || 0,
            tokens: userData.tokens_allocated || 0,
            rank: userData.leaderboard_rank || null
          });
        }
      }

      // 3. Determinar fase actual
      const now = new Date();
      if (now < fairlaunchConfig.startDate) {
        setFairlaunchPhase('pre-launch');
      } else if (now >= fairlaunchConfig.startDate && now <= fairlaunchConfig.endDate) {
        setFairlaunchPhase('live');
      } else {
        setFairlaunchPhase('completed');
      }

    } catch (error) {
      console.error('Error cargando datos del fairlaunch:', error);
    }
  };

  // ⏰ CALCULAR CUENTA REGRESIVA
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      let targetDate;
      
      if (fairlaunchPhase === 'pre-launch') {
        targetDate = fairlaunchConfig.startDate;
      } else if (fairlaunchPhase === 'live') {
        targetDate = fairlaunchConfig.endDate;
      } else {
        return;
      }
      
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        // Forzar recarga de fase
        loadFairlaunchData();
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [fairlaunchPhase]);

  // 🎯 CALCULAR BONO ACTUAL
  const getCurrentBonus = () => {
    if (fairlaunchPhase !== 'live') return 0;
    
    const now = new Date();
    const start = fairlaunchConfig.startDate;
    const elapsedHours = (now - start) / (1000 * 60 * 60);
    
    if (elapsedHours < 1) return 25; // Primera hora
    if (elapsedHours < 24) return 20; // Primer día
    if (elapsedHours < 24 * 7) return 15; // Primera semana
    if (elapsedHours < 24 * 14) return 10; // Segunda semana
    return 5; // Tercera semana
  };

  // 💰 MANEJAR COMPRA DE TOKENS
  const handleBuyTokens = async () => {
    if (!gameData.player) {
      toast({
        title: "🔐 Inicia sesión",
        description: "Debes iniciar sesión para participar en el Fairlaunch",
        duration: 3000,
      });
      return;
    }

    if (fairlaunchPhase !== 'live') {
      toast({
        title: "⏳ No disponible",
        description: `El Fairlaunch ${fairlaunchPhase === 'pre-launch' ? 'comienza pronto' : 'ha finalizado'}`,
        duration: 3000,
      });
      return;
    }

    if (buyAmount < fairlaunchConfig.minBuy || buyAmount > fairlaunchConfig.maxBuy) {
      toast({
        title: "❌ Monto inválido",
        description: `El monto debe estar entre $${fairlaunchConfig.minBuy} y $${fairlaunchConfig.maxBuy}`,
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Calcular tokens con bono
      const bonus = getCurrentBonus();
      const baseTokens = buyAmount / tokenPrice;
      const bonusTokens = baseTokens * (bonus / 100);
      const totalTokens = baseTokens + bonusTokens;
      
      // 2. Simular transacción (en producción se integraría con contrato)
      const transactionData = {
        player_id: gameData.player.id,
        amount_usd: buyAmount,
        tokens_allocated: totalTokens,
        bonus_percentage: bonus,
        transaction_hash: `0x${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      // 3. Guardar en Supabase
      const { error } = await supabase
        .from('fairlaunch_participations')
        .insert([transactionData]);
      
      if (error) throw error;
      
      // 4. Actualizar estadísticas
      const newTotalRaised = participationStats.totalRaised + buyAmount;
      const newParticipants = participationStats.participants + 1;
      const newProgress = Math.min(100, (newTotalRaised / fairlaunchConfig.hardCap) * 100);
      
      await supabase
        .from('fairlaunch_stats')
        .upsert({
          total_raised: newTotalRaised,
          participants: newParticipants,
          progress: newProgress,
          updated_at: new Date().toISOString()
        });
      
      // 5. Actualizar estado local
      setParticipationStats({
        totalRaised: newTotalRaised,
        participants: newParticipants,
        progress: newProgress
      });
      
      setUserParticipation({
        amount: userParticipation.amount + buyAmount,
        tokens: userParticipation.tokens + totalTokens,
        rank: newParticipants // Ranking temporal
      });
      
      // 6. Mostrar confirmación
      toast({
        title: "✅ ¡Participación Exitosa!",
        description: `Has adquirido ${totalTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC tokens (incluye ${bonus}% de bono)`,
        duration: 6000,
      });
      
      setShowBuyModal(false);
      setBuyAmount(100);
      
    } catch (error) {
      console.error('Error en compra:', error);
      toast({
        title: "❌ Error",
        description: "No se pudo procesar la transacción. Intenta nuevamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 🎯 CALCULAR RECOMPENSAS POR MISIÓN Y REFERIDOS
  const calculateMissionRewards = () => {
    const missions = gameData.missions || {};
    const completedMissions = Object.values(missions).filter(m => m.completed).length;
    const referralCount = gameData.referralStats?.referralsCount || 0;
    
    return {
      missionBonus: completedMissions * 100, // +100 tokens por misión completada
      referralBonus: referralCount * 50, // +50 tokens por referido
      totalExtraTokens: (completedMissions * 100) + (referralCount * 50)
    };
  };

  const missionRewards = calculateMissionRewards();

  // 📊 FORMATO DE TIEMPO
  const formatTimeLeft = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
  };

  // 🎨 COMPONENTES

  const CountdownCard = () => (
    <motion.div 
      className={`p-6 rounded-xl border-2 mb-6 ${
        fairlaunchPhase === 'pre-launch' 
          ? 'border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-cyan-900/20' 
          : fairlaunchPhase === 'live'
          ? 'border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20 animate-pulse border-opacity-70'
          : 'border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${
            fairlaunchPhase === 'pre-launch' ? 'bg-blue-600/30' :
            fairlaunchPhase === 'live' ? 'bg-green-600/30' :
            'bg-purple-600/30'
          }`}>
            <Timer className={`w-6 h-6 ${
              fairlaunchPhase === 'pre-launch' ? 'text-blue-400' :
              fairlaunchPhase === 'live' ? 'text-green-400' :
              'text-purple-400'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {fairlaunchPhase === 'pre-launch' ? '🚀 Lanzamiento en:' :
               fairlaunchPhase === 'live' ? '🔥 Finaliza en:' :
               '✅ Fairlaunch Finalizado'}
            </h3>
            <p className="text-sm text-gray-400">
              {fairlaunchPhase === 'pre-launch' ? 'Prepárate para el despegue' :
               fairlaunchPhase === 'live' ? '¡Última oportunidad para participar!' :
               'Gracias por tu participación'}
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold mb-1 text-white font-mono">
            {fairlaunchPhase !== 'completed' ? formatTimeLeft() : 'FINALIZADO'}
          </div>
          <div className="text-sm text-gray-400">
            {fairlaunchPhase === 'pre-launch' && `Inicio: ${fairlaunchConfig.startDate.toLocaleDateString()}`}
            {fairlaunchPhase === 'live' && `Final: ${fairlaunchConfig.endDate.toLocaleDateString()}`}
          </div>
        </div>
        
        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
          fairlaunchPhase === 'pre-launch' ? 'bg-blue-500 text-white' :
          fairlaunchPhase === 'live' ? 'bg-green-500 text-white' :
          'bg-purple-500 text-white'
        }`}>
          {fairlaunchPhase === 'pre-launch' ? 'PRÓXIMAMENTE' :
           fairlaunchPhase === 'live' ? 'EN CURSO 🔥' :
           'FINALIZADO ✅'}
        </div>
      </div>
    </motion.div>
  );

  const ProgressBar = () => {
    const softCapPercent = (fairlaunchConfig.softCap / fairlaunchConfig.hardCap) * 100;
    
    return (
      <div className="relative mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-green-400">
            Recaudado: ${participationStats.totalRaised.toLocaleString()}
          </span>
          <span className="text-yellow-400">
            Soft Cap: ${fairlaunchConfig.softCap.toLocaleString()}
          </span>
          <span className="text-red-400">
            Hard Cap: ${fairlaunchConfig.hardCap.toLocaleString()}
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-4 shadow-inner relative">
          {/* Línea Soft Cap */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-yellow-400"
            style={{ left: `${softCapPercent}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-yellow-400 whitespace-nowrap">
              Soft Cap
            </div>
          </div>
          
          {/* Barra de progreso */}
          <motion.div 
            className="h-4 rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-400 relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${participationStats.progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {/* Efecto de brillo */}
            <motion.div 
              className="absolute top-0 left-0 bottom-0 w-8 bg-white/30"
              animate={{ x: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            />
          </motion.div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0%</span>
          <span>{Math.round(participationStats.progress)}%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  const TokenInfoCard = () => (
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
          <DetailItem icon={DollarSign} label="Precio inicial:" value={`$${fairlaunchConfig.initialPrice}`} />
          <DetailItem icon={Coins} label="Tokens en venta:" value={fairlaunchConfig.tokensForSale} />
          <DetailItem icon={Percent} label="Porcentaje en venta:" value="40%" />
          <DetailItem icon={Network} label="Red:" value={fairlaunchConfig.network} />
          <DetailItem icon={Cpu} label="Estándar:" value={fairlaunchConfig.tokenStandard} />
        </div>
        
        <div className="space-y-3">
          <DetailItem icon={LockKeyhole} label="Liquidity Lock:" value={fairlaunchConfig.liquidityLock} />
          <DetailItem icon={CalendarDays} label="Vesting equipo:" value={fairlaunchConfig.vesting} />
          <DetailItem icon={BadgeCheck} label="Auditoría:" value={fairlaunchConfig.auditStatus} />
          <DetailItem icon={Key} label="Contrato:" value={`${fairlaunchConfig.contractAddress.substring(0, 6)}...${fairlaunchConfig.contractAddress.substring(fairlaunchConfig.contractAddress.length - 4)}`} />
          <DetailItem icon={Wallet} label="Moneda aceptada:" value="USDC, ETH" />
        </div>
      </div>
    </motion.div>
  );

  const ExchangesCard = () => (
    <motion.div 
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Globe className="w-6 h-6 mr-2 text-blue-400" />
        Listados en Exchanges
      </h3>
      
      <div className="space-y-3">
        {fairlaunchConfig.exchanges.map((exchange, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                exchange.status === 'Confirmado' ? 'bg-green-500' :
                exchange.status === 'En negociación' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <div>
                <div className="font-semibold">{exchange.name}</div>
                <div className="text-xs text-gray-400">{exchange.status}</div>
              </div>
            </div>
            <div className="text-sm text-gray-300">Lanzamiento: {exchange.launch}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const BonusesCard = () => (
    <motion.div 
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Gift className="w-6 h-6 mr-2 text-purple-400" />
        Bonos por Etapa {fairlaunchPhase === 'live' && `(Actual: ${getCurrentBonus()}%)`}
      </h3>
      
      <div className="space-y-2">
        {fairlaunchConfig.bonuses.map((bonus, index) => (
          <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
            fairlaunchPhase === 'live' && index === 0 
              ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/50' 
              : 'bg-gray-800/30'
          }`}>
            <div className="flex items-center gap-3">
              <Award className={`w-5 h-5 ${
                fairlaunchPhase === 'live' && index === 0 ? 'text-purple-400' : 'text-gray-500'
              }`} />
              <div>
                <div className="font-semibold">{bonus.phase}</div>
                <div className="text-xs text-gray-400">
                  {index === 0 ? 'Mayor bono disponible' : 'Bono decreciente'}
                </div>
              </div>
            </div>
            <div className={`text-lg font-bold ${
              fairlaunchPhase === 'live' && index === 0 ? 'text-purple-400' : 'text-yellow-400'
            }`}>
              +{bonus.bonus}
            </div>
          </div>
        ))}
      </div>
      
      {fairlaunchPhase === 'live' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-700/30">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-400" />
            <p className="text-sm text-green-300">
              <strong>¡Oferta limitada!</strong> El bono actual de {getCurrentBonus()}% solo está disponible por tiempo limitado.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );

  const ParticipationCard = () => (
    <motion.div 
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Wallet className="w-6 h-6 mr-2 text-green-400" />
        Tu Participación
      </h3>
      
      <div className="space-y-4">
        {/* Estadísticas del usuario */}
        {userParticipation.amount > 0 ? (
          <>
            <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-700/30">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-green-300 mb-1">Invertido</div>
                  <div className="text-xl font-bold text-white">
                    ${userParticipation.amount.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-green-300 mb-1">Tokens asignados</div>
                  <div className="text-xl font-bold text-white">
                    {userParticipation.tokens.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
            
            {userParticipation.rank && (
              <div className="p-3 bg-gradient-to-r from-yellow-900/20 to-amber-900/20 rounded-lg border border-yellow-700/30">
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-300">
                    Ranking actual: <strong>#{userParticipation.rank}</strong> de {participationStats.participants} participantes
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-700/30 text-center">
            <p className="text-blue-300 mb-3">Aún no has participado en el Fairlaunch</p>
            <p className="text-sm text-blue-200">
              Únete a los {participationStats.participants} participantes que ya han invertido
            </p>
          </div>
        )}
        
        {/* Botón para participar */}
        <Button
          onClick={() => setShowBuyModal(true)}
          disabled={fairlaunchPhase !== 'live'}
          className={`w-full ${
            fairlaunchPhase === 'live'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white sparkle-effect'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          } py-3`}
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          {fairlaunchPhase === 'live' 
            ? 'Participar Ahora' 
            : fairlaunchPhase === 'pre-launch'
            ? 'Próximamente'
            : 'Finalizado'}
        </Button>
        
        {/* Información de límites */}
        <div className="p-3 bg-gray-800/30 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Mínimo:</span>
            <span className="text-green-400 font-semibold">${fairlaunchConfig.minBuy}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Máximo:</span>
            <span className="text-green-400 font-semibold">${fairlaunchConfig.maxBuy}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const BoostCard = () => (
    <motion.div 
      className="stats-card rounded-xl p-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-amber-900/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
        <Zap className="w-6 h-6 mr-2" />
        ¡Potencia tu Inversión!
      </h3>
      
      <div className="space-y-4">
        {/* Bonos por misiones */}
        <div className="p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ListChecks className="w-4 h-4 text-green-400" />
            <h4 className="font-semibold text-green-300">Completa Misiones</h4>
          </div>
          <p className="text-sm text-green-200 mb-3">
            Completa misiones en el juego para ganar tokens extra para el Fairlaunch
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Misiones completadas:</span>
            <span className="font-bold text-yellow-400">
              {missionRewards.missionBonus} tokens extra
            </span>
          </div>
        </div>
        
        {/* Bonos por referidos */}
        <div className="p-3 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-blue-300">Invita Amigos</h4>
          </div>
          <p className="text-sm text-blue-200 mb-3">
            Cada amigo que invites te da tokens adicionales para el Fairlaunch
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">Referidos activos:</span>
            <span className="font-bold text-yellow-400">
              {missionRewards.referralBonus} tokens extra
            </span>
          </div>
        </div>
        
        {/* Total de bonos */}
        <div className="p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-purple-300">Bonos totales disponibles</div>
              <div className="text-xs text-purple-200">
                Se añaden automáticamente a tu compra
              </div>
            </div>
            <div className="text-xl font-bold text-yellow-400">
              +{missionRewards.totalExtraTokens} CROC
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Button
            variant="outline"
            className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500/10"
            onClick={() => {
              // Navegar a misiones
              toast({
                title: "🎯 Ve a Misiones",
                description: "Completa misiones para ganar más tokens para el Fairlaunch",
                duration: 4000,
              });
            }}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Ir a Misiones para Ganar Más
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const BuyModal = () => (
    <AnimatePresence>
      {showBuyModal && (
        <motion.div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isProcessing && setShowBuyModal(false)}
        >
          <motion.div 
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-yellow-400" />
                Participar en Fairlaunch
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => !isProcessing && setShowBuyModal(false)}
                disabled={isProcessing}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Monto de inversión */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Monto de inversión (USD)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={fairlaunchConfig.minBuy}
                    max={fairlaunchConfig.maxBuy}
                    step="50"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(Number(e.target.value))}
                    className="flex-1"
                    disabled={isProcessing}
                  />
                  <div className="text-right w-32">
                    <div className="text-2xl font-bold text-yellow-400">
                      ${buyAmount}
                    </div>
                    <div className="text-xs text-gray-400">
                      {fairlaunchConfig.minBuy} - {fairlaunchConfig.maxBuy}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detalles de la compra */}
              <div className="p-4 bg-gray-800/50 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Precio por token:</span>
                  <span className="text-white">${tokenPrice.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tokens base:</span>
                  <span className="text-white">
                    {(buyAmount / tokenPrice).toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bono ({getCurrentBonus()}%):</span>
                  <span className="text-green-400">
                    +{((buyAmount / tokenPrice) * (getCurrentBonus() / 100)).toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bonos por misiones/referidos:</span>
                  <span className="text-blue-400">
                    +{missionRewards.totalExtraTokens} CROC
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-yellow-300">Total tokens:</span>
                    <span className="text-green-400">
                      {((buyAmount / tokenPrice) * (1 + getCurrentBonus() / 100) + missionRewards.totalExtraTokens).toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Información de red */}
              <div className="p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-300">Red Optimism</span>
                </div>
                <p className="text-xs text-blue-200">
                  La transacción se procesará en la red Optimism. Necesitarás ETH para gas fees.
                </p>
              </div>
              
              {/* Botones */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowBuyModal(false)}
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300"
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBuyTokens}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Compra
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <Rocket className="w-8 h-8 mr-3 text-purple-400" /> 
            Fairlaunch del Token CROC en Optimism
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Únete al lanzamiento justo y descentralizado del token CROC. Obtén tokens al precio más bajo antes del listing en exchanges.
          </p>
        </motion.div>

        {/* Cuenta regresiva */}
        <CountdownCard />
        
        {/* Barra de progreso */}
        <motion.div 
          className="stats-card rounded-xl p-6 mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
              Progreso del Fairlaunch
            </h3>
            <div className="text-right">
              <div className="text-sm text-gray-400">Participantes</div>
              <div className="text-xl font-bold text-blue-400">
                {participationStats.participants.toLocaleString()}
              </div>
            </div>
          </div>
          
          <ProgressBar />
          
          <div className="grid grid-cols-3 gap-4 text-center mt-6">
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                ${participationStats.totalRaised.toLocaleString()}
              </div>
              <div className="text-xs text-blue-300">Recaudado</div>
            </div>
            <div className="p-3 bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {Math.round(participationStats.progress)}%
              </div>
              <div className="text-xs text-green-300">Progreso</div>
            </div>
            <div className="p-3 bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                ${fairlaunchConfig.hardCap.toLocaleString()}
              </div>
              <div className="text-xs text-purple-300">Hard Cap</div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            <TokenInfoCard />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ExchangesCard />
              <BonusesCard />
            </div>
            
            <BoostCard />
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">
            <ParticipationCard />
            
            {/* Información de red */}
            <motion.div 
              className="stats-card rounded-xl p-6 border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-cyan-900/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-blue-400">
                <Network className="w-6 h-6 mr-2" />
                Red Optimism
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-blue-900/30 rounded-lg">
                  <Zap className="w-4 h-4 text-blue-300" />
                  <div>
                    <div className="font-semibold text-blue-200">Transacciones ultrarrápidas</div>
                    <div className="text-xs text-blue-300">~2 segundos por transacción</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-900/30 rounded-lg">
                  <DollarSign className="w-4 h-4 text-blue-300" />
                  <div>
                    <div className="font-semibold text-blue-200">Costos mínimos</div>
                    <div className="text-xs text-blue-300">Gas fees 90% más bajos que Ethereum</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-blue-900/30 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-300" />
                  <div>
                    <div className="font-semibold text-blue-200">Seguridad de Ethereum</div>
                    <div className="text-xs text-blue-300">Base de seguridad de Ethereum L1</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong>💡 Nota:</strong> Necesitarás ETH en la red Optimism para pagar las tarifas de gas. 
                  Puedes conseguir ETH en Optimism mediante puentes desde otras redes.
                </p>
              </div>
            </motion.div>
            
            {/* Advertencia */}
            <motion.div 
              className="stats-card rounded-xl p-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-amber-900/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
                <AlertCircle className="w-6 h-6 mr-2" />
                Importante
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    Los criptoactivos son inversiones de alto riesgo. Solo invierte dinero que estés dispuesto a perder.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    Verifica siempre las direcciones de contrato en los canales oficiales antes de realizar transacciones.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    Los tokens adquiridos en el Fairlaunch estarán sujetos a un período de vesting de 6 meses.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  Última actualización: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <BuyModal />
    </div>
  );
}

// Componente auxiliar
const DetailItem = ({ icon: Icon, label, value, color = "text-white" }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center">
      <Icon className="w-4 h-4 mr-2 text-gray-400" />
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <span className={`font-semibold text-sm ${color}`}>
      {value}
    </span>
  </div>
);