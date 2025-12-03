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
  Heart
} from 'lucide-react';

export function FairlaunchView({ 
  toast, 
  tokenPrice = 0.05,
  setTokenPrice 
}) {
  const [timeLeft, setTimeLeft] = useState({});
  const [participationPhase, setParticipationPhase] = useState('pre-launch');
  const [totalRaised, setTotalRaised] = useState(125000);
  const [participationGoal, setParticipationGoal] = useState(500000);
  const [userParticipation, setUserParticipation] = useState(0);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationAmount, setSimulationAmount] = useState(100);
  const [simulationTokens, setSimulationTokens] = useState(0);

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

  // ⏰ Contador regresivo - MEJORADO
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

  // 🎮 Manejar participación
  const handleParticipate = () => {
    if (participationPhase === 'pre-launch') {
      toast({
        title: "⏳ Fairlaunch no iniciado",
        description: `El Fairlaunch comienza el ${new Date(fairlaunchDetails.startDate).toLocaleDateString()}.`,
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
      conservative: tokens * (tokenPrice * 2),
      moderate: tokens * (tokenPrice * 5),
      aggressive: tokens * (tokenPrice * 10)
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

  // 📊 Renderizar barra de progreso
  const renderProgressBar = () => (
    <div className="relative mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-green-400">Recaudado: ${totalRaised.toLocaleString()}</span>
        <span className="text-yellow-400">Soft Cap: ${fairlaunchDetails.softCap.toLocaleString()}</span>
        <span className="text-red-400">Hard Cap: ${fairlaunchDetails.hardCap.toLocaleString()}</span>
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
        <span>{Math.round(progressPercentage)}%</span>
        <span>100%</span>
      </div>
    </div>
  );

  // 💰 Renderizar simulación de participación
  const renderParticipationSimulation = () => (
    <AnimatePresence>
      {showSimulation && (
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
                <span>Mín: ${fairlaunchDetails.minContribution}</span>
                <span>Máx: ${fairlaunchDetails.maxContribution}</span>
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
                {Object.entries(calculatePotentialReturn(simulationAmount)).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-gray-400 capitalize">{key}</div>
                    <div className="font-bold text-green-400">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                ))}
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
      )}
    </AnimatePresence>
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
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <Rocket className="w-8 h-8 mr-3 text-purple-400" /> 
            Fairlaunch del Token CROC
          </h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Únete al lanzamiento justo y descentralizado del token CROC. Sé parte de la comunidad fundadora y potencia tu juego.
          </p>
        </motion.div>

        {/* ⏰ Contador regresivo */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className={`p-6 rounded-xl border-2 ${
            participationPhase === 'pre-launch' ? 'border-blue-500/50 bg-gradient-to-r from-blue-900/20 to-cyan-900/20' :
            participationPhase === 'active' ? 'border-green-500/50 bg-gradient-to-r from-green-900/20 to-emerald-900/20' :
            'border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  participationPhase === 'pre-launch' ? 'bg-blue-600/30' :
                  participationPhase === 'active' ? 'bg-green-600/30' :
                  'bg-purple-600/30'
                }`}>
                  <Timer className={`w-6 h-6 ${
                    participationPhase === 'pre-launch' ? 'text-blue-400' :
                    participationPhase === 'active' ? 'text-green-400' :
                    'text-purple-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {participationPhase === 'pre-launch' ? '⏳ Inicia en:' :
                     participationPhase === 'active' ? '🔥 Finaliza en:' :
                     '✅ Fairlaunch Finalizado'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {participationPhase === 'pre-launch' ? 'Preparando el despegue...' :
                     participationPhase === 'active' ? '¡Únete ahora!' :
                     'Gracias por participar'}
                  </p>
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-3xl md:text-4xl font-bold mb-1 text-white font-mono">
                  {participationPhase !== 'completed' ? formatTimeLeft() : 'COMPLETADO'}
                </div>
                <div className="text-sm text-gray-400">
                  {participationPhase === 'pre-launch' && `Inicio: ${new Date(fairlaunchDetails.startDate).toLocaleDateString()}`}
                  {participationPhase === 'active' && `Final: ${new Date(fairlaunchDetails.endDate).toLocaleDateString()}`}
                  {participationPhase === 'completed' && `Concluido el ${new Date(fairlaunchDetails.endDate).toLocaleDateString()}`}
                </div>
              </div>
              
              <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                participationPhase === 'pre-launch' ? 'bg-blue-500 text-white' :
                participationPhase === 'active' ? 'bg-green-500 text-white animate-pulse' :
                'bg-purple-500 text-white'
              }`}>
                {participationPhase === 'pre-launch' ? 'PRÓXIMAMENTE' :
                 participationPhase === 'active' ? 'EN CURSO 🔥' :
                 'FINALIZADO ✅'}
              </div>
            </div>
          </div>
        </motion.div>

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
                    ${totalRaised.toLocaleString()} / ${fairlaunchDetails.hardCap.toLocaleString()}
                  </div>
                </div>
              </div>
              
              {renderProgressBar()}
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-xs text-blue-300">Progreso</div>
                </div>
                <div className="p-3 bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    ${fairlaunchDetails.softCap.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-300">Soft Cap</div>
                </div>
                <div className="p-3 bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    ${fairlaunchDetails.hardCap.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-300">Hard Cap</div>
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
                  Detalles del Token
                </h3>
                
                <div className="space-y-3">
                  <DetailItem 
                    icon={DollarSign}
                    label="Precio por token:" 
                    value={`$${tokenPrice.toFixed(4)}`}
                    color="text-green-400"
                  />
                  <DetailItem 
                    icon={Coins}
                    label="Tokens en venta:" 
                    value={`${fairlaunchDetails.tokensForSale.toLocaleString()} CROC`}
                    color="text-yellow-400"
                  />
                  <DetailItem 
                    icon={Percent}
                    label="Porcentaje en venta:" 
                    value={`${((fairlaunchDetails.tokensForSale / fairlaunchDetails.totalTokens) * 100).toFixed(1)}%`}
                    color="text-blue-400"
                  />
                  <DetailItem 
                    icon={Globe}
                    label="Red:" 
                    value={fairlaunchDetails.network}
                    color="text-purple-400"
                  />
                  <DetailItem 
                    icon={Wallet}
                    label="Contrato:" 
                    value={`${fairlaunchDetails.contractAddress.substring(0, 6)}...${fairlaunchDetails.contractAddress.substring(fairlaunchDetails.contractAddress.length - 4)}`}
                    color="text-gray-400"
                    isAddress={true}
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
                  <Shield className="w-6 h-6 mr-2 text-blue-400" />
                  Seguridad y Transparencia
                </h3>
                
                <div className="space-y-3">
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
                    icon={CheckCircle}
                    label="Auditoría:" 
                    value="En progreso"
                    color="text-blue-400"
                  />
                  <DetailItem 
                    icon={Target}
                    label="KYC:" 
                    value="Completado"
                    color="text-purple-400"
                  />
                  <DetailItem 
                    icon={ExternalLink}
                    label="Plataforma:" 
                    value={fairlaunchDetails.platform}
                    color="text-cyan-400"
                  />
                </div>
              </motion.div>
            </div>

            {/* 🎯 Beneficios */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Award className="w-6 h-6 mr-2 text-purple-400" />
                Beneficios de Participar
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BenefitCard 
                  icon={Zap}
                  title="Precio más bajo"
                  description="Obtén CROC al precio más bajo posible antes del listing público."
                  color="yellow"
                />
                <BenefitCard 
                  icon={Users}
                  title="Comunidad fundadora"
                  description="Forma parte del grupo inicial que dará forma al ecosistema CROC."
                  color="blue"
                />
                <BenefitCard 
                  icon={TrendingUp}
                  title="Potencial de crecimiento"
                  description="Históricamente, los fairlaunches ofrecen los mayores retornos."
                  color="green"
                />
                <BenefitCard 
                  icon={Heart}
                  title="Apoya el proyecto"
                  description="Tu participación directa financia el desarrollo continuo."
                  color="red"
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
                      style={{ width: `${participationPercentage}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    {userParticipation > 0 
                      ? `${((userParticipation / fairlaunchDetails.maxContribution) * 100).toFixed(1)}% de tu límite máximo`
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
                    disabled={participationPhase !== 'active'}
                    className={`w-full ${
                      participationPhase === 'active'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white sparkle-effect'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    } py-3`}
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    {participationPhase === 'active' 
                      ? 'Participar Ahora' 
                      : participationPhase === 'pre-launch'
                      ? 'Próximamente'
                      : 'Finalizado'}
                  </Button>
                </div>
              </div>
            </motion.div>

            {renderParticipationSimulation()}

            {/* ⚠️ Advertencias importantes */}
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
                    Los criptoactivos son inversiones de alto riesgo. Nunca inviertas más de lo que estás dispuesto a perder.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    Este es un ejemplo educativo. Para detalles reales del fairlaunch, consulta los canales oficiales.
                  </p>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-yellow-200">
                    Verifica siempre las direcciones de contrato y plataformas oficiales antes de cualquier transacción.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-gray-800/50 to-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400 text-center">
                  Última actualización: {new Date().toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎨 Subcomponentes
const DetailItem = ({ icon: Icon, label, value, color, isAddress = false }) => (
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

const BenefitCard = ({ icon: Icon, title, description, color }) => {
  const colorClasses = {
    yellow: 'bg-yellow-900/20 border-yellow-700/30 text-yellow-300',
    blue: 'bg-blue-900/20 border-blue-700/30 text-blue-300',
    green: 'bg-green-900/20 border-green-700/30 text-green-300',
    red: 'bg-red-900/20 border-red-700/30 text-red-300',
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
};

// 🆕 Componente Calculator (no estaba importado)
const Calculator = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);