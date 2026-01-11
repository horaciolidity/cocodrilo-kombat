// src/components/WalletView.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Wallet,
  Zap,
  Link,
  Copy,
  Check,
  Coins,
  Gift,
  Lock,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Shield,
  TrendingUp,
  RefreshCw,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useWeb3 } from '@/contexts/Web3Context';

export function WalletView({
  toast,
  playSound,
  nativeTokenBalance = 0,
  tokenPrice = 0.05,
  user,
  referralStats
}) {
  const { account, chainId, connectWallet, disconnectWallet, isConnected, isConnecting } = useWeb3();

  // Local states for other features
  const [stakeAmount, setStakeAmount] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // ✅ Valor proyectado de tokens CROC
  const projectedValue = nativeTokenBalance * tokenPrice;

  // ✅ Simular actualización de balance (en producción vendría del hook central)
  useEffect(() => {
    // En la arquitectura centralizada, el balance viene directamente de gameData
    // No necesitamos leer localStorage
    console.log('💰 Balance de tokens CROC actualizado:', nativeTokenBalance);
  }, [nativeTokenBalance]);

  /* ================================
     🔌 Conexión de Wallet - REAL (Web3Context)
  ================================= */
  // Logic handled by hook

  /* ================================
     📋 Copiar dirección - MEJORADO
  ================================= */
  const copyAddress = () => {
    if (!isConnected) return;

    // Use real account
    navigator.clipboard.writeText(account);
    setIsCopied(true);
    playSound('uiClick');

    toast({
      title: "📋 Dirección copiada",
      description: "Dirección de wallet copiada al portapapeles",
    });

    setTimeout(() => setIsCopied(false), 2000);
  };

  /* ================================
     🎯 Lógica de Stake - INTEGRADA
  ================================= */
  const handleStake = () => {
    if (nativeTokenBalance < 10) {
      toast({
        title: "💰 Saldo insuficiente",
        description: "Necesitas al menos 10 CROC para hacer stake",
        variant: "destructive",
      });
      playSound('error');
      return;
    }

    const amount = Math.min(10, nativeTokenBalance);
    setStakeAmount(prev => prev + amount);

    // En producción, aquí llamarías a updateGameState para restar del balance
    toast({
      title: "🔒 Stake realizado",
      description: `${amount} CROC bloqueados para generar recompensas`,
    });
    playSound('success');
  };

  const handleClaimRewards = () => {
    if (pendingRewards <= 0) {
      toast({
        title: "😅 Sin recompensas",
        description: "Todavía no hay recompensas disponibles",
      });
      playSound('uiClick');
      return;
    }

    // En producción, aquí sumarías al balance central
    const claimedAmount = pendingRewards;
    setPendingRewards(0);

    toast({
      title: "🎁 Recompensas reclamadas",
      description: `+${claimedAmount.toFixed(3)} CROC añadidos a tu balance`,
    });
    playSound('reward');
  };

  const handleUnstake = () => {
    if (stakeAmount <= 0) {
      toast({
        title: "📉 Sin stake activo",
        description: "No tienes tokens bloqueados",
      });
      playSound('uiClick');
      return;
    }

    // En producción, aquí devolverías al balance central
    const unstakeAmount = stakeAmount;
    setStakeAmount(0);
    setPendingRewards(0);

    toast({
      title: "🔓 Stake retirado",
      description: `${unstakeAmount} CROC devueltos a tu balance`,
    });
    playSound('success');
  };

  // Simulación de acumulación de recompensas
  useEffect(() => {
    if (stakeAmount > 0) {
      const interval = setInterval(() => {
        setPendingRewards(prev => {
          const newRewards = parseFloat((prev + stakeAmount * 0.0001).toFixed(4));
          return newRewards;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [stakeAmount]);

  // 📊 Información de la red
  const networkInfo = {
    name: chainId === '0x1' ? "Ethereum Mainnet" : (chainId ? `Chain ID: ${chainId}` : "Desconectado"),
    chainId: chainId,
    rpcUrl: "N/A",
    explorer: "https://etherscan.io",
    stakingAPY: "15-25%"
  };


  // WalletView.jsx - AGREGAR EN EL COMPONENTE
  const [crocPrice, setCrocPrice] = useState(tokenPrice || 0.05);

  // 🔄 Actualizar precio periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular fluctuación suave ±10%
      const fluctuation = 1 + (Math.random() * 0.2 - 0.1); // ±10%
      const newPrice = tokenPrice * fluctuation;
      setCrocPrice(parseFloat(newPrice.toFixed(6)));
    }, 8000);

    return () => clearInterval(interval);
  }, [tokenPrice]);

  // 💰 Calcular valores actualizados
  const updatedProjectedValue = nativeTokenBalance * crocPrice;
  const updatedStakeValue = stakeAmount * crocPrice;
  const updatedRewardsValue = pendingRewards * crocPrice;


  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        {/* 🏁 Encabezado */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Wallet className="w-8 h-8 mr-3 text-primary" />
            Dashboard de Wallet
          </motion.h1>
          <p className="text-muted-foreground">
            Gestiona tus tokens CROC, haz stake y sigue tus recompensas
          </p>
        </div>

        {/* 💰 Panel de Balance Principal */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Balance de Tokens */}
            <div className="stats-card rounded-xl p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full mb-4">
                  <Coins className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-sm text-muted-foreground mb-2">Tokens CROC</h3>
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  ${updatedProjectedValue.toFixed(2)}
                </div>
                <div className="text-sm text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {nativeTokenBalance.toLocaleString()} CROC @ ${crocPrice.toFixed(6)}
                </div>
              </div>
            </div>

            {/* Stake Activo */}
            <div className="stats-card rounded-xl p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full mb-4">
                  <Lock className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-sm text-muted-foreground mb-2">Stake Activo</h3>
                <div className="text-3xl font-bold text-emerald-400 mb-2">
                  {stakeAmount.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tokens bloqueados
                </div>
              </div>
            </div>

            {/* Recompensas Pendientes */}
            <div className="stats-card rounded-xl p-6 text-center">
              <div className="flex flex-col items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full mb-4">
                  <Gift className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-sm text-muted-foreground mb-2">Recompensas</h3>
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {pendingRewards.toFixed(4)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pendientes por claim
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 🎨 Panel Izquierdo - Conexión y Estado */}
          <div className="space-y-6">
            {/* Estado de Conexión */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-blue-400" />
                Estado de Wallet
              </h3>

              {isConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg border border-green-700/30">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-semibold text-green-400">Conectado</p>
                        <p className="text-xs text-green-300">Wallet lista para usar</p>
                      </div>
                    </div>
                    <Button
                      onClick={disconnectWallet}
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-700 hover:bg-red-900/30"
                    >
                      Desconectar
                    </Button>
                  </div>

                  {/* Dirección de Wallet */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tu dirección:</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg border border-gray-700/50">
                      <code className="text-xs font-mono text-gray-300 flex-1 truncate">
                        {account}
                      </code>
                      <Button
                        onClick={copyAddress}
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Información de la Red */}
                  <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <p className="text-sm text-blue-300 mb-1">Red conectada:</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{networkInfo.name}</span>
                      <span className="text-xs text-blue-400">APY: {networkInfo.stakingAPY}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h4 className="text-lg font-semibold mb-2">Wallet no conectada</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Conecta tu wallet para gestionar tus tokens CROC
                  </p>
                  <Button
                    onClick={connectWallet}
                    size="lg"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <Link className="w-5 h-5 mr-2" />
                        Conectar Wallet
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Usa MetaMask, WalletConnect u otra billetera compatible
                  </p>
                </div>
              )}
            </motion.div>

            {/* 🎯 Panel de Información de Token */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
                Información del Token
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Símbolo:</span>
                  <span className="font-bold text-yellow-400">CROC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Precio actual:</span>
                  <span className="font-bold text-green-400">${tokenPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Valor total:</span>
                  <span className="font-bold text-primary">${projectedValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">APY de Staking:</span>
                  <span className="font-bold text-purple-400">{networkInfo.stakingAPY}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 🎨 Panel Derecho - Stake y Acciones */}
          <div className="space-y-6">
            {/* Panel de Stake */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-emerald-400" />
                Sistema de Stake
              </h3>

              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/20 to-green-900/20 rounded-lg border border-emerald-700/30">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-emerald-400 mb-2">
                    APY {networkInfo.stakingAPY}
                  </div>
                  <p className="text-sm text-emerald-300">
                    Gana recompensas pasivas por hacer stake de tus CROC
                  </p>
                </div>

                {/* Balance disponible para stake */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Balance disponible:</span>
                    <span className="font-bold text-yellow-400">
                      {nativeTokenBalance.toLocaleString()} CROC
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (stakeAmount / (nativeTokenBalance || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={handleStake}
                    disabled={!isConnected || nativeTokenBalance < 10}
                    className="bg-emerald-600 hover:bg-emerald-700 mobile-button h-12"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Stake
                  </Button>

                  <Button
                    onClick={handleClaimRewards}
                    disabled={pendingRewards <= 0}
                    className="bg-yellow-600 hover:bg-yellow-700 mobile-button h-12"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Reclamar
                  </Button>

                  <Button
                    onClick={handleUnstake}
                    disabled={stakeAmount <= 0}
                    className="bg-gray-700 hover:bg-gray-600 mobile-button h-12"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Retirar
                  </Button>
                </div>
              </div>

              {/* Información de recompensas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Recompensas acumuladas</p>
                    <p className="text-lg font-bold text-purple-400">{pendingRewards.toFixed(4)} CROC</p>
                  </div>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor estimado</p>
                    <p className="text-lg font-bold text-green-400">
                      ${(pendingRewards * tokenPrice).toFixed(2)} USD
                    </p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
            </motion.div>

            {/* 🔗 Enlaces rápidos */}
            <motion.div
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <ExternalLink className="w-6 h-6 mr-2 text-blue-400" />
                Enlaces Rápidos
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "🔗 Explorador de Bloques",
                      description: "Redirigiendo al explorador...",
                    });
                    playSound('uiClick');
                  }}
                  className="mobile-button"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Explorador
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "🔄 Puente de Tokens",
                      description: "Funcionalidad en desarrollo",
                    });
                    playSound('uiClick');
                  }}
                  className="mobile-button"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Puente
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "📊 Análisis de Mercado",
                      description: "Funcionalidad en desarrollo",
                    });
                    playSound('uiClick');
                  }}
                  className="mobile-button"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "📚 Documentación",
                      description: "Redirigiendo a la documentación...",
                    });
                    playSound('uiClick');
                  }}
                  className="mobile-button"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Docs
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 🚀 PANEL DE REFERIDOS (FAIRLAUNCH) */}
        <motion.div
          className="mt-8 mb-8 stats-card rounded-xl p-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2 flex items-center text-cyan-400">
                <Users className="w-8 h-8 mr-3" />
                Sistema de Referidos Fairlaunch
              </h3>
              <p className="text-gray-300 mb-4">
                ¡Invita a amigos y gana el <strong className="text-yellow-400">10%</strong> de sus ingresos para siempre!
                Ayuda a crecer la comunidad del pantano.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-black/30 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-white">{referralStats?.referralsCount || 0}</div>
                  <div className="text-xs text-gray-400">Amigos</div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-emerald-400">{referralStats?.crocFromRefs || 0}</div>
                  <div className="text-xs text-gray-400">CROC Ganado</div>
                </div>
                <div className="bg-black/30 p-3 rounded-lg text-center">
                  <div className="text-lg font-bold text-yellow-400">{referralStats?.coinsFromRefs || 0}</div>
                  <div className="text-xs text-gray-400">Coins Ganadas</div>
                </div>
              </div>

              {/* Botón de copiar enlace */}
              <div className="flex gap-2">
                <div className="flex-1 bg-black/40 p-3 rounded-lg border border-cyan-500/20 font-mono text-xs text-cyan-200 truncate flex items-center">
                  https://cocodrilo.com?ref={user?.referral_code || '...'}
                </div>
                <Button
                  onClick={() => {
                    const link = `https://cocodrilo-kombat.vercel.app/?ref=${user?.referral_code}`;
                    navigator.clipboard.writeText(link);
                    toast({ title: "Enlace Copiado", description: "¡Compártelo con tus amigos!" });
                    playSound('uiClick');
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="hidden md:block w-48 h-48 bg-cyan-500/10 rounded-full flex items-center justify-center border-4 border-cyan-500/20 relative animate-pulse-slow">
              <Users className="w-24 h-24 text-cyan-400/80" />
              <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping opacity-20"></div>
            </div>
          </div>
        </motion.div>

        {/* 📜 Footer informativo */}
        <motion.div
          className="mt-8 p-4 bg-gradient-to-r from-gray-900/30 to-gray-800/30 rounded-xl border border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-300">Modo de demostración</p>
                <p className="text-xs text-gray-400">
                  Las funciones de wallet son una simulación. En producción se conectarán a contratos reales.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Fixed missing import or use of Sparkles if not available */}
              <Sparkles className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-300">Próximas funciones</p>
                <p className="text-xs text-gray-400">
                  Trading en DEX, NFTs coleccionables, gobernanza.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}