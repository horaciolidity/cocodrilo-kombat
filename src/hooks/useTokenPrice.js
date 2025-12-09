import { useState, useEffect, useRef } from 'react';

export function useTokenPrice(initialPrice = 0.05) {
  const [tokenPrice, setTokenPrice] = useState(() => {
    // Intentar cargar precio guardado
    const savedPrice = localStorage.getItem('croc_token_price');
    return savedPrice ? parseFloat(savedPrice) : initialPrice;
  });
  
  const [priceHistory, setPriceHistory] = useState(() => {
    // Intentar cargar historial guardado
    const savedHistory = localStorage.getItem('croc_price_history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  
  const [liquidity, setLiquidity] = useState(() => {
    const savedLiquidity = localStorage.getItem('croc_liquidity');
    return savedLiquidity ? parseFloat(savedLiquidity) : 50000;
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const simulationRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());
  const updateCountRef = useRef(0);

  // 🔄 Inicializar desde localStorage
  useEffect(() => {
    if (isInitialized) return;
    
    console.log('💰 Inicializando precio CROC desde localStorage');
    
    try {
      const savedPrice = localStorage.getItem('croc_token_price');
      const savedHistory = localStorage.getItem('croc_price_history');
      const savedLiquidity = localStorage.getItem('croc_liquidity');
      
      if (savedPrice) {
        const price = parseFloat(savedPrice);
        if (!isNaN(price)) {
          setTokenPrice(price);
        }
      }
      
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        if (Array.isArray(history)) {
          setPriceHistory(history);
        }
      }
      
      if (savedLiquidity) {
        const liq = parseFloat(savedLiquidity);
        if (!isNaN(liq)) {
          setLiquidity(liq);
        }
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Error cargando precio CROC:', error);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 🔄 Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('croc_token_price', tokenPrice.toString());
    console.log(`💰 Precio CROC guardado: $${tokenPrice}`);
  }, [tokenPrice, isInitialized]);
  
  useEffect(() => {
    if (!isInitialized) return;
    
    if (priceHistory.length > 0) {
      localStorage.setItem('croc_price_history', JSON.stringify(priceHistory.slice(-100)));
    }
  }, [priceHistory, isInitialized]);
  
  useEffect(() => {
    if (!isInitialized) return;
    
    localStorage.setItem('croc_liquidity', liquidity.toString());
  }, [liquidity, isInitialized]);

  // 🔄 SIMULACIÓN DE MERCADO CENTRALIZADA
  useEffect(() => {
    if (!isInitialized) return;
    
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }

    simulationRef.current = setInterval(() => {
      updateCountRef.current += 1;
      
      // Factores de simulación más realistas
      const volatility = 0.02; // 2% de volatilidad
      const drift = 0.0005; // Tendencia ligeramente alcista
      
      // Movimiento browniano geométrico
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const deterministicChange = drift;
      
      const change = randomChange + deterministicChange;
      const newPrice = Math.max(0.001, tokenPrice * (1 + change));
      const roundedPrice = parseFloat(newPrice.toFixed(6));
      
      // Actualizar precio
      setTokenPrice(roundedPrice);
      
      // Actualizar historial
      setPriceHistory(prev => {
        const newHistory = [...prev];
        const timestamp = new Date().toISOString();
        const dataPoint = {
          timestamp,
          price: roundedPrice,
          name: `T${updateCountRef.current}`
        };
        
        // Mantener solo últimos 30 puntos para gráfico
        if (newHistory.length >= 30) {
          newHistory.shift();
        }
        newHistory.push(dataPoint);
        
        return newHistory;
      });
      
      // Actualizar liquidez aleatoriamente
      const liquidityChange = (Math.random() - 0.5) * 2000 * (roundedPrice / tokenPrice);
      setLiquidity(prev => Math.max(10000, prev + liquidityChange));
      
      lastUpdateRef.current = Date.now();
      
    }, 8000); // Actualizar cada 8 segundos

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [tokenPrice, isInitialized]);

  // 📊 Obtener datos para gráfico
  const getChartData = () => {
    if (priceHistory.length === 0) {
      // Generar datos iniciales si no hay historial
      const initialData = [];
      let price = tokenPrice;
      for (let i = 0; i < 30; i++) {
        initialData.push({
          name: `T${i + 1}`,
          price: parseFloat(price.toFixed(4)),
          timestamp: new Date(Date.now() - (30 - i) * 8000).toISOString()
        });
        price *= (1 + (Math.random() - 0.5) * 0.03);
      }
      return initialData;
    }
    
    return priceHistory.slice(-30);
  };

  // 📈 Obtener estadísticas
  const getPriceStats = () => {
    if (priceHistory.length < 2) return { change24h: 0, high: tokenPrice, low: tokenPrice };
    
    const last24h = priceHistory.slice(-24);
    const prices = last24h.map(p => p.price);
    
    return {
      change24h: ((tokenPrice - prices[0]) / prices[0]) * 100,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: liquidity * 0.8
    };
  };

  return {
    tokenPrice,
    setTokenPrice,
    priceHistory,
    liquidity,
    getChartData,
    getPriceStats,
    isInitialized,
    // Función para sincronizar con otros componentes
    syncPrice: (newPrice) => {
      if (typeof newPrice === 'number' && !isNaN(newPrice)) {
        setTokenPrice(newPrice);
        return true;
      }
      return false;
    },
    // Función para reiniciar (solo para desarrollo)
    resetPrice: () => {
      setTokenPrice(initialPrice);
      setPriceHistory([]);
      setLiquidity(50000);
      localStorage.removeItem('croc_token_price');
      localStorage.removeItem('croc_price_history');
      localStorage.removeItem('croc_liquidity');
    }
  };
}