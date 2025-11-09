
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Zap, Link, Copy, Check } from 'lucide-react';

export function WalletView({ toast, playSound }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [nativeTokenBalance, setNativeTokenBalance] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const connectWallet = async () => {
    playSound('uiClick');
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        toast({ title: "Wallet Conectada", description: `Dirección: ${accounts[0].substring(0,6)}...${accounts[0].substring(accounts[0].length - 4)}` });
        playSound('success');
        
      } catch (error) {
        console.error("Error conectando wallet:", error);
        toast({ title: "Error de Wallet", description: "No se pudo conectar la billetera. Asegúrate de tener una extensión como MetaMask.", variant: "destructive" });
        playSound('error');
      }
    } else {
      toast({ title: "MetaMask no detectado", description: "Por favor, instala MetaMask o una billetera compatible.", variant: "destructive" });
      playSound('error');
    }
  };

  useEffect(() => {
    if (walletAddress) {
      
      const storedBalance = localStorage.getItem('cocodriloKombatGameState');
      if (storedBalance) {
        try {
          const gameState = JSON.parse(storedBalance);
          setNativeTokenBalance(gameState.nativeTokenBalance || 0);
        } catch (e) {
          console.error("Error parsing gameState for token balance", e);
          setNativeTokenBalance(0);
        }
      } else {
        setNativeTokenBalance(0);
      }
    }
  }, [walletAddress]);

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setIsCopied(true);
      toast({ title: "Dirección Copiada", description: "La dirección de tu wallet ha sido copiada al portapapeles." });
      playSound('uiClick');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleFeatureNotImplemented = () => {
    playSound('uiClick');
    toast({
      title: "🚧 ¡Función en desarrollo!",
      description: "Esta característica aún no está implementada. ¡Pero no te preocupes! Puedes solicitarla en tu próximo mensaje. 🚀",
      duration: 5000,
    });
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Wallet className="w-8 h-8 mr-3 text-primary" /> Dashboard de Wallet
        </h1>

        <div className="wallet-dashboard rounded-xl p-6 space-y-6">
          {walletAddress ? (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-green-400">Wallet Conectada</h2>
                <div className="flex items-center justify-between bg-input p-3 rounded-lg">
                  <span className="text-sm font-mono truncate text-muted-foreground">
                    {walletAddress}
                  </span>
                  <Button onClick={copyAddress} size="sm" variant="ghost" className="ml-2">
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Token Nativo (CROC🐊)</h3>
                <div className="stats-card p-4 rounded-lg">
                  <p className="text-2xl font-bold gradient-text">{nativeTokenBalance.toLocaleString()} CROC</p>
                  <p className="text-xs text-muted-foreground">Tu balance de Cocodrilo Tokens</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleFeatureNotImplemented} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mobile-button">
                  <Zap className="w-4 h-4 mr-2" /> Stake Tokens
                </Button>
                <Button onClick={handleFeatureNotImplemented} variant="outline" className="w-full mobile-button">
                  <Link className="w-4 h-4 mr-2" /> Ver Transacciones
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
              <p className="text-muted-foreground mb-6">Conecta tu billetera Web3 para ver tu dashboard.</p>
              <Button onClick={connectWallet} size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground mobile-button">
                <Link className="w-5 h-5 mr-2" /> Conectar Wallet
              </Button>
              <p className="text-xs text-muted-foreground mt-4">Compatible con MetaMask y otras billeteras Web3.</p>
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Este es un dashboard de frontend para interactuar con tu wallet. Las funcionalidades de staking y transacciones son simuladas. El balance de CROC se basa en los hitos de farmeo completados en el juego.
          </p>
        </div>
      </div>
    </div>
  );
}
