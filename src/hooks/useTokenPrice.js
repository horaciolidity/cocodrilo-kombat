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
  
  const simulationRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // 🔄 Guardar datos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('croc_token_price', tokenPrice.toString());
  }, [tokenPrice]);
  
  useEffect(() => {
    if (priceHistory.length > 0) {
      localStorage.setItem('croc_price_history', JSON.stringify(priceHistory.slice(-100))); // Guardar últimos 100 puntos
    }
  }, [priceHistory]);
  
  useEffect(() => {
    localStorage.setItem('croc_liquidity', liquidity.toString());
  }, [liquidity]);

  // 🔄 SIMULACIÓN DE MERCADO (más realista)
  useEffect(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
    }

    simulationRef.current = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - lastUpdateRef.current;
      
      // Ajustar frecuencia según tiempo transcurrido
      const updateInterval = Math.max(5000, Math.min(30000, timeDiff));
      
      // Factores de simulación más realistas
      const volatility = 0.02; // 2% de volatilidad
      const drift = 0.0005; // Tendencia ligeramente alcista
      
      // Movimiento browniano geométrico (más realista)
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const deterministicChange = drift * (timeDiff / 1000); // Basado en tiempo
      
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
          name: `D${prev.length + 1}`
        };
        
        // Mantener solo últimos 30 puntos para gráfico
        if (newHistory.length >= 30) {
          newHistory.shift();
        }
        newHistory.push(dataPoint);
        
        return newHistory;
      });
      
      // Actualizar liquidez (relacionada con precio)
      const liquidityChange = (Math.random() - 0.5) * 2000 * (roundedPrice / tokenPrice);
      setLiquidity(prev => Math.max(10000, prev + liquidityChange));
      
      lastUpdateRef.current = now;
      
    }, 8000); // Actualizar cada 8 segundos

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [tokenPrice]);

  // 📊 Obtener datos para gráfico (últimos 30 días)
  const getChartData = () => {
    if (priceHistory.length === 0) {
      // Generar datos iniciales si no hay historial
      const initialData = [];
      let price = tokenPrice;
      for (let i = 0; i < 30; i++) {
        initialData.push({
          name: `D${i + 1}`,
          price: parseFloat(price.toFixed(4)),
          timestamp: new Date(Date.now() - (30 - i) * 86400000).toISOString()
        });
        price *= (1 + (Math.random() - 0.5) * 0.03);
      }
      return initialData;
    }
    
    // Si tenemos menos de 30 puntos, completar con datos simulados
    if (priceHistory.length < 30) {
      const needed = 30 - priceHistory.length;
      const filledHistory = [...priceHistory];
      let lastPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : tokenPrice;
      
      for (let i = 0; i < needed; i++) {
        lastPrice *= (1 + (Math.random() - 0.5) * 0.02);
        filledHistory.unshift({
          name: `D${needed - i}`,
          price: parseFloat(lastPrice.toFixed(4)),
          timestamp: new Date(Date.now() - (needed - i + 1) * 86400000).toISOString()
        });
      }
      return filledHistory;
    }
    
    return priceHistory.slice(-30);
  };

  // 📈 Obtener estadísticas
  const getPriceStats = () => {
    if (priceHistory.length < 2) return { change24h: 0, high: tokenPrice, low: tokenPrice };
    
    const last24h = priceHistory.slice(-24); // Últimas 24 actualizaciones
    const prices = last24h.map(p => p.price);
    
    return {
      change24h: ((tokenPrice - prices[0]) / prices[0]) * 100,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: liquidity * 0.8 // Volumen estimado
    };
  };

  return {
    tokenPrice,
    setTokenPrice,
    priceHistory,
    liquidity,
    getChartData,
    getPriceStats,
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