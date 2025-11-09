import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Zap, Link, Copy, Check, Coins, Gift, Lock } from 'lucide-react';

export function WalletView({ toast, playSound }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [nativeTokenBalance, setNativeTokenBalance] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [stakeAmount, setStakeAmount] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);

  /* ================================
     🔌 Conexión de Wallet
  ================================= */
  const connectWallet = async () => {
    playSound('uiClick');
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        toast({
          title: "✅ Wallet Conectada",
          description: `Dirección: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
        });
        playSound('success');
      } catch (error) {
        console.error("Error conectando wallet:", error);
        toast({
          title: "❌ Error al conectar",
          description: "No se pudo conectar la billetera. Asegúrate de tener MetaMask activa.",
          variant: "destructive",
        });
        playSound('error');
      }
    } else {
      toast({
        title: "🦊 MetaMask no detectado",
        description: "Instala la extensión de MetaMask o una billetera Web3 compatible.",
        variant: "destructive",
      });
      playSound('error');
    }
  };

  /* ================================
     💰 Carga y actualización del balance
  ================================= */
  useEffect(() => {
    const updateBalance = () => {
      const stored = localStorage.getItem('cocodriloKombatGameState');
      if (stored) {
        try {
          const gameState = JSON.parse(stored);
          const balance = gameState?.nativeTokenBalance ?? 0;
          setNativeTokenBalance(balance);
        } catch (err) {
          console.error("Error leyendo gameState:", err);
          setNativeTokenBalance(0);
        }
      }
    };
    updateBalance();
    const interval = setInterval(updateBalance, 2000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  /* ================================
     📋 Copiar dirección
  ================================= */
  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setIsCopied(true);
    playSound('uiClick');
    toast({
      title: "📋 Dirección copiada",
      description: "La dirección se copió al portapapeles.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  /* ================================
     🎯 Lógica simulada de Stake
  ================================= */
  const handleStake = () => {
    if (nativeTokenBalance < 10) {
      toast({
        title: "💰 Saldo insuficiente",
        description: "Necesitas al menos 10 CROC para hacer stake.",
        variant: "destructive",
      });
      playSound('error');
      return;
    }
    const amount = Math.min(10, nativeTokenBalance);
    setStakeAmount(stakeAmount + amount);
    setNativeTokenBalance(nativeTokenBalance - amount);
    toast({
      title: "🔒 Stake realizado",
      description: `Has bloqueado ${amount} CROC para generar recompensas.`,
    });
    playSound('success');
  };

  const handleClaimRewards = () => {
    if (pendingRewards <= 0) {
      toast({
        title: "😅 Sin recompensas",
        description: "Todavía no hay recompensas disponibles.",
      });
      playSound('uiClick');
      return;
    }
    setNativeTokenBalance(nativeTokenBalance + pendingRewards);
    toast({
      title: "🎁 Recompensas reclamadas",
      description: `+${pendingRewards.toFixed(2)} CROC añadidos a tu balance.`,
    });
    playSound('reward');
    setPendingRewards(0);
  };

  const handleUnstake = () => {
    if (stakeAmount <= 0) {
      toast({
        title: "📉 Sin stake activo",
        description: "No tienes tokens bloqueados.",
      });
      playSound('uiClick');
      return;
    }
    setNativeTokenBalance(nativeTokenBalance + stakeAmount);
    toast({
      title: "🔓 Stake retirado",
      description: `${stakeAmount} CROC devueltos a tu balance.`,
    });
    playSound('success');
    setStakeAmount(0);
    setPendingRewards(0);
  };

  // Simula acumulación de recompensas mientras haya stake activo
  useEffect(() => {
    if (stakeAmount > 0) {
      const interval = setInterval(() => {
        setPendingRewards(prev => parseFloat((prev + stakeAmount * 0.001).toFixed(3)));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [stakeAmount]);

  /* ================================
     🖥️ Render
  ================================= */
  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Wallet className="w-8 h-8 mr-3 text-primary" /> Dashboard de Wallet
        </h1>

        <div className="wallet-dashboard rounded-xl p-6 space-y-6">
          {walletAddress ? (
            <>
              {/* Wallet conectada */}
              <div>
                <h2 className="text-xl font-semibold mb-2 text-green-400">Wallet conectada</h2>
                <div className="flex items-center justify-between bg-input p-3 rounded-lg">
                  <span className="text-sm font-mono truncate text-muted-foreground">
                    {walletAddress}
                  </span>
                  <Button onClick={copyAddress} size="sm" variant="ghost" className="ml-2">
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Balance */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Token Nativo (CROC 🐊)</h3>
                <div className="stats-card p-4 rounded-lg border border-green-600/30 bg-green-950/20">
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-400 to-lime-300 bg-clip-text text-transparent drop-shadow-md">
                    {nativeTokenBalance.toLocaleString()} CROC
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Balance sincronizado con tus recompensas del juego
                  </p>
                </div>
              </div>

              {/* Stake */}
              <div className="rounded-xl p-4 border border-emerald-700/40 bg-emerald-900/10 shadow-inner">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-emerald-400" /> Stake CROC
                </h3>

                <div className="grid grid-cols-2 text-center mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Stake Activo</p>
                    <p className="text-lg font-bold text-emerald-400">{stakeAmount.toFixed(2)} CROC</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recompensas Pendientes</p>
                    <p className="text-lg font-bold text-yellow-400">{pendingRewards.toFixed(3)} CROC</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button onClick={handleStake} className="bg-emerald-600 hover:bg-emerald-700 mobile-button">
                    <Zap className="w-4 h-4 mr-2" /> Stake
                  </Button>
                  <Button onClick={handleClaimRewards} className="bg-yellow-600 hover:bg-yellow-700 mobile-button">
                    <Gift className="w-4 h-4 mr-2" /> Reclamar
                  </Button>
                  <Button onClick={handleUnstake} className="bg-gray-700 hover:bg-gray-600 mobile-button">
                    <Coins className="w-4 h-4 mr-2" /> Retirar
                  </Button>
                </div>
              </div>

              {/* Enlaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => toast({ title: "🔗 Proximamente DEX" })} className="mobile-button">
                  <Link className="w-4 h-4 mr-2" /> Ver Transacciones
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-primary opacity-60" />
              <p className="text-muted-foreground mb-6">
                Conecta tu billetera Web3 para acceder a tu balance y stake de CROC.
              </p>
              <Button
                onClick={connectWallet}
                size="lg"
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground mobile-button"
              >
                <Link className="w-5 h-5 mr-2" /> Conectar Wallet
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Compatible con MetaMask y otras billeteras Web3.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Este dashboard sincroniza tu progreso del juego con tu billetera Web3.
            El módulo de stake es una simulación visual que pronto se conectará con el contrato real. 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
