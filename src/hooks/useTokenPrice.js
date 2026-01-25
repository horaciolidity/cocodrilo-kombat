// useTokenPrice.js - Dinámica de Precio Simulada (Mock Fluctuations)
import { useState, useEffect, useCallback, useRef } from 'react';

// Constantes de mercado simulado
const BASE_PRICE = 0.055;
const VOLATILITY = 0.002; // Cambio máximo por tick (0.2%)
const MAX_RANGE = 0.10; // 10% de fluctuación máxima respecto al base
const UPDATE_INTERVAL = 15000; // Actualizar cada 15 segundos

export function useTokenPrice() {
  // 🎯 Recuperar precio inicial de localStorage o usar base
  const getInitialPrice = () => {
    const saved = localStorage.getItem('croc_token_price');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return BASE_PRICE;
  };

  const [tokenPrice, setTokenPrice] = useState(getInitialPrice);
  const [liquidity, setLiquidity] = useState(75420); // Liquidez simulada
  const [lastDirection, setLastDirection] = useState('up');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const priceRef = useRef(tokenPrice);

  // 📈 Lógica de fluctuación coordinada
  const updateSimulatedPrice = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();

    // 1. Calcular tendencia basada en la hora (Market Cycles)
    // Usamos una onda seno para simular picos de actividad según la hora del día
    const timeCycle = Math.sin((hours * Math.PI) / 12); // Oscila entre -1 y 1 durante el día

    // 2. Ruido aleatorio (Fluctuación sutil)
    const randomDrift = (Math.random() - 0.5) * 2 * VOLATILITY;

    // 3. Aplicar cambio al precio actual
    // La tendencia horaria empuja suavemente hacia arriba o abajo
    const trendWeight = 0.0005 * timeCycle;
    let newPrice = priceRef.current * (1 + randomDrift + trendWeight);

    // 4. Clamping (No permitir que se aleje más del 10% del precio base)
    const minPrice = BASE_PRICE * (1 - MAX_RANGE);
    const maxPrice = BASE_PRICE * (1 + MAX_RANGE);

    if (newPrice < minPrice) newPrice = minPrice + (Math.random() * 0.001);
    if (newPrice > maxPrice) newPrice = maxPrice - (Math.random() * 0.001);

    // 5. Determinar dirección visual
    setLastDirection(newPrice >= priceRef.current ? 'up' : 'down');

    // 6. Persistir y actualizar
    priceRef.current = newPrice;
    localStorage.setItem('croc_token_price', newPrice.toString());
    setTokenPrice(newPrice);

    // Liquidez fluctúa mínimamente con el precio
    setLiquidity(prev => prev + (newPrice > BASE_PRICE ? 10 : -5) * Math.random());
  }, []);

  // 🔄 Intervalo de actualización
  useEffect(() => {
    const interval = setInterval(updateSimulatedPrice, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updateSimulatedPrice]);

  // 📉 Generar datos para la gráfica (30 puntos pasados calculados determinísticamente)
  const getChartData = useCallback(() => {
    const data = [];
    const now = Date.now();

    // Generamos puntos hacia atrás basados en una semilla horaria 
    // para que la gráfica sea consistente entre pestañas
    for (let i = 29; i >= 0; i--) {
      const time = new Date(now - i * 300000); // Puntos cada 5 minutos
      const hourSeed = time.getHours() + (time.getMinutes() / 60);

      // Combinación de onda seno + pseudo-aleatorio basado en el índice
      const variation = Math.sin(hourSeed * 0.5) * 0.003 + (Math.cos(i * 0.2) * 0.002);
      const historicPrice = BASE_PRICE * (1 + variation);

      data.push({
        name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: i === 0 ? tokenPrice : historicPrice,
        timestamp: time.toISOString()
      });
    }

    return data;
  }, [tokenPrice]);

  const getPriceStats = useCallback(() => {
    const change = ((tokenPrice - BASE_PRICE) / BASE_PRICE) * 100;
    return {
      change24h: change.toFixed(2),
      high: BASE_PRICE * 1.10,
      low: BASE_PRICE * 0.90,
      volume: liquidity * 0.15,
      marketCap: (tokenPrice * 100000000).toFixed(0),
      direction: lastDirection
    };
  }, [tokenPrice, liquidity, lastDirection]);

  return {
    tokenPrice,
    liquidity,
    isLoading,
    error,
    getChartData,
    getPriceStats,
    lastDirection,
    refreshPrice: updateSimulatedPrice,
    formatPrice: (val = tokenPrice) => `$${parseFloat(val).toFixed(6)}`,
    formatLiquidity: () => `$${Math.floor(liquidity).toLocaleString()}`,
  };
}