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
  Copy,
  Share2,
  Link,
  UserPlus,
  TrendingDown,
  ChevronRight,
  Star
} from 'lucide-react';

export function FairlaunchView({ 
  toast, 
  tokenPrice = 0.05,
  setTokenPrice,
  getReferralLink,
  referralStats,
  refreshReferralStats,
  player
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

  // 🎯 Datos del fairlaunch - MEJORADO
  const fairlaunchDetails = {
    startDate: "2025-07-01T14:00:00Z",
    endDate: "2025-07-07T14:00:00Z",
    totalTokens: 100000000,
    tokensForSale: 40000000,
    hardCap: 2000000, // $2M
    softCap: 500000,  // $500K
    pricePerToken: tokenPrice,
    minContribution: 50, // $50
    maxContribution: 10000, // $10,000
    platform: "Pinksale / GemPad",
    contractAddress: "0x742d35Cc6634C0532925a3b844Bc9e0E3F3e4C3b",
    liquidityLock: "12 meses",
    vestingPeriod: "6 meses lineal",
    network: "BSC / Polygon / Arbitrum"
  };

  // 📋 Funciones de referidos
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
  };

  // 🚀 Compartir en redes sociales
  const shareFairlaunch = (platform) => {
    const message = `🚀 ¡Participa en el Fairlaunch de $CROC! 🐊\n\n💰 Obtén tokens al precio más bajo\n👥 Invita amigos y gana recompensas\n🎮 Usa tus tokens en Cocodrilo Kombat\n\n${getReferralLink ? getReferralLink() : window.location.origin}`;
    
    let url = '';
    switch(platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(message)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
      toast({
        title: '📤 Compartiendo...',
        description: `¡Compartiendo en ${platform}!`,
        duration: 2000,
      });
    }
  };

  // ⏰ Contador regresivo - MEJORADO
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const startDate = new Date(fairlaunchDetails.startDate);
      const endDate = new Date(fairlaunchDetails.endDate);
      
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

  // 🎮 Manejar participación
  const handleParticipate = () => {
    if (participationPhase === 'pre-launch') {
      toast({
        title: "⏳ ¡Prepárate para el lanzamiento!",
        description: `El Fairlaunch comienza el ${new Date(fairlaunchDetails.startDate).toLocaleDateString()}. ¡Invita amigos para ganar recompensas!`,
        duration: 4000,
      });
      return;
    }

    if (participationPhase === 'completed') {
      toast({
        title: "✅ Fairlaunch Finalizado",
        description: "El periodo de participación ha concluido. Los tokens serán distribuidos pronto.",
        duration: 4000,
      });
      return;
    }

    // Simulación de participación exitosa
    const newParticipation = userParticipation + simulationAmount;
    setUserParticipation(newParticipation);
    setTotalRaised(prev => prev + simulationAmount);
    
    toast({
      title: "🚀 ¡Participación Exitosa!",
      description: `Has participado con $${simulationAmount} (${simulationTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })} CROC) en el Fairlaunch.`,
      duration: 6000,
    });
    
    setShowSimulation(false);
    setSimulationAmount(100);
  };

  // 📊 Calcular porcentajes
  const progressPercentage = Math.min(100, (totalRaised / fairlaunchDetails.hardCap) * 100);
  const softCapPercentage = (fairlaunchDetails.softCap / fairlaunchDetails.hardCap) * 100;
  const participationPercentage = (totalRaised / participationGoal) * 100;
  
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
      return `${timeLeft.days}d ${timeLeft.horas}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    } else {
      return `${timeLeft.seconds}s`;
    }
  };

  // 🎯 Componente de progreso de referidos
  const renderReferralProgress = () => {
    const stats = referralStats || { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
    
    return (
      <div className="bg-gradient-to-br from-green-900/90 to-emerald-800/90 border-2 border-green-500/60 rounded-xl p-5 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-700/50 rounded-xl">
              <Users className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-green-100">🎁 Programa de Referidos</h3>
              <p className="text-sm text-green-200">Gana tokens CROC invitando amigos</p>
            </div>
          </div>
          <div className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>¡Activo!</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-green-800/60 rounded-lg p-3 text-center border border-green-600/40">
            <div className="text-2xl font-bold text-green-300 mb-1">{stats.referralsCount || 0}</div>
            <div className="text-xs text-green-200">Referidos</div>
          </div>
          <div className="bg-yellow-800/60 rounded-lg p-3 text-center border border-yellow-600/40">
            <div className="text-2xl font-bold text-yellow-300 mb-1">{stats.crocFromRefs || 0}</div>
            <div className="text-xs text-yellow-200">CROC Ganados</div>
          </div>
          <div className="bg-blue-800/60 rounded-lg p-3 text-center border border-blue-600/40">
            <div className="text-2xl font-bold text-blue-300 mb-1">
              {(stats.coinsFromRefs || 0).toLocaleString()}
            </div>
            <div className="text-xs text-blue-200">Monedas</div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-300">Progreso de referidos</span>
            <span className="text-yellow-300">
              {stats.referralsCount || 0} / 10 para bono extra
            </span>
          </div>
          <div className="w-full bg-green-900/50 rounded-full h-3">
            <div 
              className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
              style={{ width: `${Math.min(100, ((stats.referralsCount || 0) / 10) * 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
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
          className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-bold py-3"
        >
          <Copy className={`w-5 h-5 mr-2 ${copied ? 'text-yellow-300' : ''}`} />
          {copied ? '¡Enlace Copiado! 🎉' : 'Copiar Enlace de Referido'}
        </Button>

        {stats.referralsCount === 0 && (
          <div className="mt-3 p-3 bg-green-800/30 rounded-lg border border-green-600/30">
            <p className="text-sm text-green-200 text-center">
              <Sparkles className="w-4 h-4 inline mr-2" />
              ¡Invita a tu primer amigo y gana 10 CROC tokens gratis!
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* 🏁 Encabezado con énfasis en referidos */}
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
          
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Button
              onClick={() => shareFairlaunch('twitter')}
              className="bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir en X
            </Button>
            <Button
              onClick={() => shareFairlaunch('telegram')}
              className="bg-[#0088cc] hover:bg-[#0077b3] text-white"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Compartir en Telegram
            </Button>
            <Button
              onClick={() => shareFairlaunch('whatsapp')}
              className="bg-[#25D366] hover:bg-[#1da851] text-white"
              size="sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir en WhatsApp
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 📊 Panel izquierdo - Información clave */}
          <div className="lg:col-span-2 space-y-6">
            {/* 🎯 Panel de referidos PRINCIPAL */}
            {renderReferralProgress()}

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
                  Preparación para el Fairlaunch
                </h3>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Meta de comunidad</div>
                  <div className="text-xl font-bold text-green-400">
                    {referralStats?.referralsCount || 0} / 1,000 miembros
                  </div>
                </div>
              </div>
              
              <div className="relative mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400">Crecimiento de comunidad</span>
                  <span className="text-yellow-400">
                    {((referralStats?.referralsCount || 0) / 1000 * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-4 shadow-inner relative">
                  <motion.div 
                    className="h-4 rounded-full bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-400 relative overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: `${((referralStats?.referralsCount || 0) / 1000) * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    <motion.div 
                      className="absolute top-0 left-0 bottom-0 w-8 bg-white/30"
                      animate={{ x: ["0%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    />
                  </motion.div>
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
                    ${totalRaised.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-300">Interés anticipado</div>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {((referralStats?.referralsCount || 0) * 10).toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-300">CROC por referidos</div>
                </div>
              </div>
            </motion.div>

            {/* 📋 Información clave */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                className="stats-card rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Package className="w-6 h-6 mr-2 text-yellow-400" />
                  Beneficios por Invitar
                </h3>
                
                <div className="space-y-4">
                  <BenefitItem 
                    icon={Coins}
                    title="10 CROC por referido"
                    description="Por cada amigo que se registre con tu enlace"
                    color="yellow"
                  />
                  <BenefitItem 
                    icon={Star}
                    title="+1000 monedas de juego"
                    description="Bonificación adicional en monedas del juego"
                    color="blue"
                  />
                  <BenefitItem 
                    icon={Award}
                    title="Bono por volumen"
                    description="50 CROC extra al alcanzar 10 referidos"
                    color="purple"
                  />
                  <BenefitItem 
                    icon={TrendingUp}
                    title="Ventaja en el fairlaunch"
                    description="Acceso temprano y mejores posiciones"
                    color="green"
                  />
                </div>
              </motion.div>

              <motion.div 
                className="stats-card rounded-xl p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <CalendarDays className="w-6 h-6 mr-2 text-blue-400" />
                  Cronograma
                </h3>
                
                <div className="space-y-3">
                  <TimelineItem 
                    date="Hoy - Inicio"
                    title="Fase de Referidos"
                    description="Invita amigos y acumula recompensas"
                    active={true}
                  />
                  <TimelineItem 
                    date={new Date(fairlaunchDetails.startDate).toLocaleDateString()}
                    title="Inicio del Fairlaunch"
                    description="Comienza la venta de tokens CROC"
                    active={false}
                  />
                  <TimelineItem 
                    date={new Date(fairlaunchDetails.endDate).toLocaleDateString()}
                    title="Fin del Fairlaunch"
                    description="Distribución de tokens a participantes"
                    active={false}
                  />
                  <TimelineItem 
                    date="Post-lanzamiento"
                    title="Listing en DEX"
                    description="Disponible para trading público"
                    active={false}
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* 🎮 Panel derecho - Acciones */}
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
                Cuenta Regresiva
              </h3>
              
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white mb-2">
                  {participationPhase === 'pre-launch' 
                    ? '🚀 En Preparación' 
                    : participationPhase === 'active'
                    ? '🔥 ¡En Curso!'
                    : '✅ Completado'}
                </div>
                <div className="text-lg text-gray-300">
                  {participationPhase === 'pre-launch' 
                    ? `Inicio: ${new Date(fairlaunchDetails.startDate).toLocaleDateString()}`
                    : participationPhase === 'active'
                    ? `Finaliza: ${new Date(fairlaunchDetails.endDate).toLocaleDateString()}`
                    : 'Finalizado'}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center mb-4">
                <TimeUnit value={timeLeft.days || 0} label="Días" />
                <TimeUnit value={timeLeft.hours || 0} label="Horas" />
                <TimeUnit value={timeLeft.minutes || 0} label="Minutos" />
                <TimeUnit value={timeLeft.seconds || 0} label="Segundos" />
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-700/30">
                <p className="text-sm text-purple-200 text-center">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  <strong>¡Aprovecha ahora!</strong> Invita amigos antes del inicio para maximizar tus ganancias.
                </p>
              </div>
            </motion.div>

            {/* 🎯 Tu progreso */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Target className="w-6 h-6 mr-2 text-red-400" />
                Tu Progreso
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300">Referidos conseguidos</span>
                    <span className="font-bold text-white text-lg">
                      {referralStats?.referralsCount || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{ width: `${Math.min(100, ((referralStats?.referralsCount || 0) / 10) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {10 - (referralStats?.referralsCount || 0)} referidos más para el bono de 50 CROC
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-yellow-900/20 rounded-lg text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {referralStats?.crocFromRefs || 0}
                    </div>
                    <div className="text-xs text-yellow-300">CROC ganados</div>
                  </div>
                  <div className="p-3 bg-green-900/20 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-400">
                      ${((referralStats?.crocFromRefs || 0) * tokenPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-green-300">Valor actual</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 📱 Acciones rápidas */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-yellow-400" />
                Acciones Rápidas
              </h3>
              
              <div className="space-y-3">
                <Button
                  onClick={copyReferralLink}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white py-3"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copiar Enlace de Referido
                </Button>
                
                <Button
                  onClick={() => shareFairlaunch('twitter')}
                  className="w-full bg-gradient-to-r from-[#1DA1F2] to-[#1a8cd8] hover:from-[#1a8cd8] hover:to-[#167ab8] text-white py-3"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Compartir en X
                </Button>
                
                <Button
                  onClick={() => window.open('https://t.me/yourchannel', '_blank')}
                  className="w-full bg-gradient-to-r from-[#0088cc] to-[#0077b3] hover:from-[#0077b3] hover:to-[#006699] text-white py-3"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Unirse a Telegram
                </Button>
              </div>
            </motion.div>

            {/* 💡 Consejos */}
            <motion.div 
              className="stats-card rounded-xl p-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-900/10 to-amber-900/10"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-yellow-400">
                <Sparkles className="w-6 h-6 mr-2" />
                Estrategia Recomendada
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Invita 10 amigos</strong> para ganar el bono extra de 50 CROC
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Comparte en grupos</strong> de Telegram y WhatsApp para maximizar alcance
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Explica los beneficios</strong>: 10 CROC + 1000 monedas por registro
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    <strong>Monitorea tu progreso</strong> en esta sección regularmente
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 🎯 Sección de métricas */}
        <motion.div 
          className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <MetricCard 
            icon={Users}
            value={referralStats?.referralsCount || 0}
            label="Referidos Totales"
            color="green"
          />
          <MetricCard 
            icon={Coins}
            value={((referralStats?.crocFromRefs || 0) * 10).toLocaleString()}
            label="CROC Potenciales"
            color="yellow"
          />
          <MetricCard 
            icon={DollarSign}
            value={`$${(((referralStats?.crocFromRefs || 0) * 10) * tokenPrice).toFixed(2)}`}
            label="Valor Potencial"
            color="blue"
          />
          <MetricCard 
            icon={TrendingUp}
            value={`${((referralStats?.referralsCount || 0) * 1000).toLocaleString()}`}
            label="Monedas Potenciales"
            color="purple"
          />
        </motion.div>
      </div>
    </div>
  );
}

// 🎨 Subcomponentes
const BenefitItem = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300',
    blue: 'bg-blue-900/20 border-blue-700/30 text-blue-300',
    green: 'bg-green-900/20 border-green-700/30 text-green-300',
    purple: 'bg-purple-900/20 border-purple-700/30 text-purple-300'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color] || colorClasses.blue} flex items-start gap-3`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs opacity-80">{description}</p>
      </div>
    </div>
  );
};

const TimelineItem = ({ date, title, description, active }) => (
  <div className="flex items-start gap-3">
    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${active ? 'bg-green-500' : 'bg-gray-600'}`}></div>
    <div className="flex-1">
      <div className="flex justify-between items-start">
        <div>
          <h4 className={`font-bold text-sm ${active ? 'text-green-400' : 'text-gray-400'}`}>{title}</h4>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      {active && (
        <div className="mt-2 text-xs text-green-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>¡Activo ahora!</span>
        </div>
      )}
    </div>
  </div>
);

const TimeUnit = ({ value, label }) => (
  <div className="bg-gray-800/50 rounded-lg p-3">
    <div className="text-2xl font-bold text-white font-mono">{value.toString().padStart(2, '0')}</div>
    <div className="text-xs text-gray-400 mt-1">{label}</div>
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