import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useTokenPrice(initialPrice = 0.05) {
  // 🎯 ESTADOS PRINCIPALES
  const [tokenPrice, setTokenPrice] = useState(initialPrice);
  const [priceHistory, setPriceHistory] = useState([]);
  const [liquidity, setLiquidity] = useState(50000);
  const [marketSentiment, setMarketSentiment] = useState(0); // -1 a 1 (bajista/alcista)
  const [tradingVolume, setTradingVolume] = useState(1000000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // 🔥 REFERENCIAS PARA OPTIMIZACIÓN
  const simulationRef = useRef(null);
  const updateCountRef = useRef(0);
  const lastFetchRef = useRef(0);
  const priceCacheRef = useRef(new Map());
  const isMountedRef = useRef(true);

  // 📈 CONFIGURACIÓN DE MERCADO REALISTA
  const MARKET_CONFIG = useMemo(() => ({
    // Volatilidad basada en el momento del día (simula mercados más activos)
    baseVolatility: 0.015,
    peakHoursMultiplier: 1.5, // Horas pico (14:00-18:00 UTC)
    
    // Tendencias del mercado
    longTermDrift: 0.0003, // Tendencia alcista a largo plazo
    shortTermMeanReversion: 0.002, // Fuerza que devuelve al precio a la media
    
    // Liquidez y volumen
    minLiquidity: 10000,
    maxLiquidity: 500000,
    volumeVolatility: 0.25,
    
    // Eventos de mercado
    eventProbability: 0.05, // 5% de probabilidad de evento
    eventTypes: {
      pump: { multiplier: 1.15, duration: 3, probability: 0.3 },
      dump: { multiplier: 0.88, duration: 2, probability: 0.2 },
      stability: { multiplier: 1.0, duration: 5, probability: 0.5 }
    }
  }), []);

  // 🎯 CALCULAR VOLATILIDAD DINÁMICA
  const calculateDynamicVolatility = useCallback(() => {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Más volatilidad en horarios de mercado activos
    let timeFactor = 1.0;
    if ((hour >= 14 && hour <= 18) || (hour >= 22 && hour <= 2)) {
      timeFactor = MARKET_CONFIG.peakHoursMultiplier;
    }
    
    // Más volatilidad con baja liquidez
    const liquidityFactor = Math.max(0.5, Math.min(2.0, 100000 / liquidity));
    
    // Aumentar volatilidad con sentimiento extremo
    const sentimentFactor = 1 + Math.abs(marketSentiment) * 0.5;
    
    return MARKET_CONFIG.baseVolatility * timeFactor * liquidityFactor * sentimentFactor;
  }, [liquidity, marketSentiment, MARKET_CONFIG]);

  // 🎯 SIMULAR EVENTO DE MERCADO
  const simulateMarketEvent = useCallback((currentPrice) => {
    if (Math.random() > MARKET_CONFIG.eventProbability) return currentPrice;
    
    const events = Object.entries(MARKET_CONFIG.eventTypes);
    const event = events.reduce((acc, [key, data]) => {
      const rand = Math.random();
      if (rand < data.probability) return { type: key, ...data };
      return acc;
    }, events[0]);
    
    console.log(`🎯 Evento de mercado: ${event.type} (x${event.multiplier})`);
    
    // Aplicar efecto gradual
    const newPrice = currentPrice * event.multiplier;
    
    // Actualizar sentimiento del mercado
    const sentimentChange = event.multiplier > 1 ? 0.2 : -0.3;
    setMarketSentiment(prev => Math.max(-1, Math.min(1, prev + sentimentChange)));
    
    return newPrice;
  }, [MARKET_CONFIG]);

  // 📊 MODELO DE MERCADO HÍPER-REALISTA
  const simulateMarketUpdate = useCallback((currentPrice, currentLiquidity) => {
    const now = new Date();
    updateCountRef.current += 1;
    
    // 1. CALCULAR VOLATILIDAD DINÁMICA
    const volatility = calculateDynamicVolatility();
    
    // 2. MOVIMIENTO BROWNIANO GEOMÉTRICO MEJORADO
    const randomWalk = (Math.random() - 0.5) * 2 * volatility;
    
    // 3. DRIFT A LARGO PLAZO + REVERSIÓN A LA MEDIA
    const longTermDrift = MARKET_CONFIG.longTermDrift;
    const meanReversion = MARKET_CONFIG.shortTermMeanReversion * 
                         (0.05 - currentPrice) / 0.05; // Revertir hacia $0.05
    
    // 4. INFLUENCIA DEL SENTIMIENTO DEL MERCADO
    const sentimentEffect = marketSentiment * volatility * 0.3;
    
    // 5. EFECTO DE VOLUMEN (mayor volumen = menos volatilidad)
    const volumeEffect = (1000000 / tradingVolume) * volatility * 0.1;
    
    // 6. COMBINAR TODOS LOS FACTORES
    const totalChange = randomWalk + longTermDrift + meanReversion + 
                       sentimentEffect + volumeEffect;
    
    // 7. APLICAR CAMBIO
    let newPrice = currentPrice * (1 + totalChange);
    
    // 8. SIMULAR EVENTO DE MERCADO (PUMP/DUMP)
    newPrice = simulateMarketEvent(newPrice);
    
    // 9. LIMITES REALISTAS
    newPrice = Math.max(0.001, Math.min(10.0, newPrice));
    const roundedPrice = parseFloat(newPrice.toFixed(6));
    
    // 10. ACTUALIZAR LIQUIDEZ REALISTA
    const liquidityChange = (Math.random() - 0.5) * 5000 * 
                           (roundedPrice / currentPrice) * 
                           (1 + Math.abs(marketSentiment));
    
    let newLiquidity = currentLiquidity + liquidityChange;
    newLiquidity = Math.max(MARKET_CONFIG.minLiquidity, 
                           Math.min(MARKET_CONFIG.maxLiquidity, newLiquidity));
    
    // 11. ACTUALIZAR VOLUMEN DE TRADING
    const volumeChange = (Math.random() - 0.5) * MARKET_CONFIG.volumeVolatility * 
                        tradingVolume * (roundedPrice / currentPrice);
    
    const newVolume = Math.max(100000, tradingVolume + volumeChange);
    
    // 12. ACTUALIZAR SENTIMIENTO (evolución natural)
    const sentimentDrift = (Math.random() - 0.5) * 0.1;
    const newSentiment = Math.max(-1, Math.min(1, marketSentiment + sentimentDrift));
    
    return {
      price: roundedPrice,
      liquidity: newLiquidity,
      volume: newVolume,
      sentiment: newSentiment,
      timestamp: now.toISOString(),
      updateId: updateCountRef.current
    };
  }, [calculateDynamicVolatility, MARKET_CONFIG, marketSentiment, tradingVolume, simulateMarketEvent]);

  // 🔄 CARGAR PRECIO DESDE SUPABASE CON CACHÉ INTELIGENTE
  const loadPriceFromSupabase = useCallback(async (forceRefresh = false) => {
    if (!isMountedRef.current) return;
    
    const CACHE_KEY = 'croc_price';
    const CACHE_DURATION = 15000; // 15 segundos
    
    try {
      setIsLoading(true);
      
      // Verificar caché local
      const cached = priceCacheRef.current.get(CACHE_KEY);
      const now = Date.now();
      
      if (!forceRefresh && cached && (now - cached.timestamp < CACHE_DURATION)) {
        console.log('💰 Usando precio CROC en caché:', cached.data.price);
        setTokenPrice(cached.data.price);
        setLiquidity(cached.data.liquidity);
        setLastSyncTime(new Date(cached.data.last_updated));
        setIsLoading(false);
        return;
      }
      
      console.log('💰 Cargando precio CROC desde Supabase...');
      
      const { data, error: fetchError } = await supabase
        .from('token_prices')
        .select('price, liquidity, last_updated')
        .eq('token_symbol', 'CROC')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.warn('⚠️ No se encontró precio en Supabase, usando simulación local');
        // No establecer error, usar simulación local
        priceCacheRef.current.delete(CACHE_KEY);
      } else if (data) {
        console.log('✅ Precio CROC cargado desde Supabase:', data.price);
        
        const priceData = {
          price: Number(data.price) || initialPrice,
          liquidity: Number(data.liquidity) || 50000,
          last_updated: data.last_updated
        };
        
        // Actualizar caché
        priceCacheRef.current.set(CACHE_KEY, {
          data: priceData,
          timestamp: now
        });
        
        setTokenPrice(priceData.price);
        setLiquidity(priceData.liquidity);
        setLastSyncTime(new Date(priceData.last_updated));
        lastFetchRef.current = now;
      }
    } catch (err) {
      console.error('❌ Error cargando precio desde Supabase:', err);
      setError(err.message);
      // Continuar con simulación local en caso de error
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [initialPrice]);

  // 🔄 SINCRONIZAR PRECIO CON SUPABASE (OPTIMIZADO)
  const updatePriceInSupabase = useCallback(async (newPrice, newLiquidity) => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    const MIN_SYNC_INTERVAL = 30000; // 30 segundos mínimo entre syncs
    
    // Throttling para evitar sobrecarga
    if (now - lastFetchRef.current < MIN_SYNC_INTERVAL) {
      return;
    }
    
    try {
      console.log('💾 Sincronizando precio CROC con Supabase:', newPrice);
      
      const { error: updateError } = await supabase
        .from('token_prices')
        .insert([
          { 
            token_symbol: 'CROC', 
            price: newPrice, 
            liquidity: newLiquidity,
            last_updated: new Date().toISOString()
          }
        ]);

      if (updateError) {
        // Si es error de duplicado, intentar update
        if (updateError.code === '23505') {
          const { error: upsertError } = await supabase
            .from('token_prices')
            .upsert({
              token_symbol: 'CROC',
              price: newPrice,
              liquidity: newLiquidity,
              last_updated: new Date().toISOString()
            });
          
          if (upsertError) throw upsertError;
        } else {
          throw updateError;
        }
      }
      
      lastFetchRef.current = now;
      setLastSyncTime(new Date());
      console.log('✅ Precio CROC sincronizado con Supabase');
      
      // Invalidar caché
      priceCacheRef.current.delete('croc_price');
      
    } catch (err) {
      console.error('❌ Error sincronizando precio:', err);
      // No propagar error para no interrumpir simulación local
    }
  }, []);

  // 📈 SIMULACIÓN EN TIEMPO REAL CON ACTUALIZACIÓN SUPABASE
  useEffect(() => {
    isMountedRef.current = true;
    
    // Cargar precio inicial
    loadPriceFromSupabase();
    
    // Iniciar simulación de mercado
    simulationRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      
      const marketUpdate = simulateMarketUpdate(tokenPrice, liquidity);
      
      // Actualizar estados
      setTokenPrice(marketUpdate.price);
      setLiquidity(marketUpdate.liquidity);
      setTradingVolume(marketUpdate.volume);
      setMarketSentiment(marketUpdate.sentiment);
      
      // Actualizar historial
      setPriceHistory(prev => {
        const newHistory = [...prev];
        const dataPoint = {
          timestamp: marketUpdate.timestamp,
          price: marketUpdate.price,
          liquidity: marketUpdate.liquidity,
          volume: marketUpdate.volume,
          sentiment: marketUpdate.sentiment,
          name: `T${marketUpdate.updateId}`
        };
        
        // Mantener solo últimos 100 puntos
        if (newHistory.length >= 100) {
          newHistory.shift();
        }
        newHistory.push(dataPoint);
        
        return newHistory;
      });
      
      // Sincronizar con Supabase cada 10 actualizaciones (≈80 segundos)
      if (marketUpdate.updateId % 10 === 0) {
        updatePriceInSupabase(marketUpdate.price, marketUpdate.liquidity);
      }
      
    }, 8000); // Actualizar cada 8 segundos

    return () => {
      isMountedRef.current = false;
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [tokenPrice, liquidity, loadPriceFromSupabase, simulateMarketUpdate, updatePriceInSupabase]);

  // 🔄 REFRESCAR PRECIO MANUALMENTE
  const refreshPrice = useCallback(async () => {
    await loadPriceFromSupabase(true); // Forzar refresh
  }, [loadPriceFromSupabase]);

  // 📊 GENERAR DATOS PARA GRÁFICO (OPTIMIZADO)
  const getChartData = useCallback((limit = 30) => {
    if (priceHistory.length === 0) {
      // Generar datos históricos simulados
      const initialData = [];
      let price = tokenPrice;
      let liq = liquidity;
      
      for (let i = 0; i < limit; i++) {
        const simulated = simulateMarketUpdate(price, liq);
        price = simulated.price;
        liq = simulated.liquidity;
        
        initialData.unshift({
          name: `H-${limit - i}`,
          price: parseFloat(price.toFixed(4)),
          liquidity: liq,
          volume: simulated.volume,
          timestamp: new Date(Date.now() - (limit - i) * 8000).toISOString()
        });
      }
      return initialData;
    }
    
    return priceHistory.slice(-limit).map((point, index) => ({
      ...point,
      name: `T${point.updateId || index + 1}`
    }));
  }, [priceHistory, tokenPrice, liquidity, simulateMarketUpdate]);

  // 📈 OBTENER ESTADÍSTICAS DETALLADAS
  const getPriceStats = useCallback(() => {
    if (priceHistory.length < 2) {
      return {
        change24h: 0,
        change7d: 0,
        high: tokenPrice,
        low: tokenPrice,
        volume24h: tradingVolume,
        marketCap: liquidity * tokenPrice,
        sentiment: marketSentiment,
        volatility: calculateDynamicVolatility()
      };
    }
    
    // Últimas 24 horas (aproximadamente)
    const recentPoints = priceHistory.slice(-24);
    const prices = recentPoints.map(p => p.price);
    const volumes = recentPoints.map(p => p.volume || 0);
    
    // Cambio 24h
    const change24h = recentPoints.length > 1 ? 
      ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0;
    
    // Cambio 7 días (si hay datos)
    const weeklyChange = priceHistory.length >= 168 ? 
      ((tokenPrice - priceHistory[0].price) / priceHistory[0].price) * 100 : 0;
    
    return {
      change24h,
      change7d: weeklyChange,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume24h: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      marketCap: liquidity * tokenPrice,
      sentiment: marketSentiment,
      volatility: calculateDynamicVolatility(),
      supportLevel: Math.min(...prices) * 0.98,
      resistanceLevel: Math.max(...prices) * 1.02
    };
  }, [priceHistory, tokenPrice, liquidity, tradingVolume, marketSentiment, calculateDynamicVolatility]);

  // 💰 SIMULAR COMPRA/VENTA (PARA TESTING)
  const simulateTrade = useCallback((type, amount) => {
    // type: 'buy' o 'sell'
    // amount: porcentaje del volumen (0-1)
    
    const impact = type === 'buy' ? 0.001 : -0.001;
    const volumeImpact = amount * 0.5;
    
    const newPrice = tokenPrice * (1 + impact * amount);
    const newLiquidity = liquidity * (1 + volumeImpact);
    const newVolume = tradingVolume * (1 + volumeImpact);
    const newSentiment = marketSentiment + (type === 'buy' ? 0.05 : -0.05);
    
    setTokenPrice(newPrice);
    setLiquidity(newLiquidity);
    setTradingVolume(newVolume);
    setMarketSentiment(newSentiment);
    
    return {
      executedPrice: newPrice,
      impact: impact * amount * 100,
      newLiquidity,
      newVolume
    };
  }, [tokenPrice, liquidity, tradingVolume, marketSentiment]);

  return {
    // 📊 DATOS DEL MERCADO
    tokenPrice,
    liquidity,
    tradingVolume,
    marketSentiment,
    priceHistory,
    lastSyncTime,
    
    // 🔧 ESTADO DEL SISTEMA
    isLoading,
    error,
    
    // 📈 FUNCIONES DE DATOS
    getChartData,
    getPriceStats,
    
    // 🔄 FUNCIONES DE SINCRO
    refreshPrice,
    updatePrice: updatePriceInSupabase,
    
    // 🎮 FUNCIONES DE SIMULACIÓN (para desarrollo/testing)
    simulateTrade,
    
    // 📱 FUNCIONES DE UTILIDAD
    formatPrice: (value = tokenPrice) => `$${value.toFixed(6)}`,
    formatVolume: (value = tradingVolume) => `$${(value / 1000000).toFixed(2)}M`,
    formatMarketCap: () => `$${(liquidity * tokenPrice / 1000000).toFixed(2)}M`,
    
    // 🎯 MÉTRICAS EN TIEMPO REAL
    metrics: {
      isBullish: marketSentiment > 0.2,
      isBearish: marketSentiment < -0.2,
      isVolatile: calculateDynamicVolatility() > 0.02,
      liquidityScore: (liquidity / 50000) * 100, // Porcentaje respecto a base
      confidence: Math.abs(marketSentiment) * 100 // Confianza del mercado
    }
  };
}