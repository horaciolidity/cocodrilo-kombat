// useTokenPrice.js - VERSIÓN CORREGIDA Y OPTIMIZADA
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useTokenPrice() {
  // 🎯 ESTADOS PRINCIPALES
  const [tokenPrice, setTokenPrice] = useState(0.05);
  const [liquidity, setLiquidity] = useState(50000);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🔥 REFERENCIAS PARA CONTROL
  const simulationIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const reloadIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef(0);
  const priceSeedRef = useRef(0.05);
  const updateCountRef = useRef(0);
  
  // ✅ REFS PARA VALORES ACTUALES (evita dependencias en useCallback)
  const currentPriceRef = useRef(0.05);
  const currentLiquidityRef = useRef(50000);
  const currentHistoryRef = useRef([]);

  // 🔄 ACTUALIZAR REFS CUANDO CAMBIAN LOS ESTADOS
  useEffect(() => {
    currentPriceRef.current = tokenPrice;
    currentLiquidityRef.current = liquidity;
    currentHistoryRef.current = priceHistory;
  }, [tokenPrice, liquidity, priceHistory]);

  // 📊 CARGAR PRECIO DESDE SUPABASE (SOLO UNA VEZ AL INICIO)
  const loadPriceFromSupabase = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    const now = Date.now();
    // Evitar llamadas demasiado frecuentes
    if (now - lastUpdateRef.current < 10000) {
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('💰 Cargando precio CROC desde Supabase...');
      
      const { data, error: fetchError } = await supabase
        .from('token_prices')
        .select('price, liquidity, last_updated')
        .eq('token_symbol', 'CROC')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.log('⚠️ No hay datos en Supabase, usando simulación');
        return;
      }
      
      if (data) {
        const newPrice = Number(data.price) || 0.05;
        const newLiquidity = Number(data.liquidity) || 50000;
        
        console.log(`✅ Precio cargado: $${newPrice}, Liquidez: $${newLiquidity}`);
        
        // Actualizar estados
        setTokenPrice(newPrice);
        setLiquidity(newLiquidity);
        priceSeedRef.current = newPrice;
        
        // Inicializar historial
        if (currentHistoryRef.current.length === 0) {
          const initialHistory = [];
          for (let i = 0; i < 30; i++) {
            const timestamp = new Date(Date.now() - (30 - i) * 8000).toISOString();
            const timeLabel = new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            initialHistory.push({
              timestamp,
              price: newPrice * (1 + (Math.random() - 0.5) * 0.02),
              name: timeLabel,
              change: 0
            });
          }
          setPriceHistory(initialHistory);
        }
        
        lastUpdateRef.current = now;
      }
    } catch (err) {
      console.error('❌ Error cargando precio:', err.message);
      setError(err.message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // 📈 SIMULACIÓN DE PRECIO SÓLIDA Y CONTINUA
  const runPriceSimulation = useCallback(() => {
    if (!isMountedRef.current) return;
    
    updateCountRef.current += 1;
    
    const currentPrice = currentPriceRef.current;
    const currentLiquidity = currentLiquidityRef.current;
    const currentHistory = [...currentHistoryRef.current];
    
    // 📊 Simulación con fluctuaciones suaves ±10%
    const basePrice = priceSeedRef.current;
    const maxPrice = basePrice * 1.10;
    const minPrice = basePrice * 0.90;
    
    // Usar onda senoidal para cambios suaves
    const time = Date.now() * 0.001;
    const wave1 = Math.sin(time * 0.1) * 0.03; // Onda lenta
    const wave2 = Math.sin(time * 0.3) * 0.02; // Onda media
    const wave3 = Math.sin(time * 0.7) * 0.01; // Onda rápida
    const noise = (Math.random() - 0.5) * 0.02; // Ruido aleatorio
    
    const totalWave = wave1 + wave2 + wave3 + noise;
    const newPrice = Math.max(minPrice, Math.min(maxPrice, basePrice * (1 + totalWave)));
    const roundedPrice = parseFloat(newPrice.toFixed(6));
    
    // Calcular cambio porcentual
    const change = ((roundedPrice - currentPrice) / currentPrice) * 100;
    
    // Actualizar precio
    setTokenPrice(roundedPrice);
    
    // Actualizar liquidez correlacionada
    const liquidityMultiplier = (roundedPrice / basePrice) * 0.5 + 0.5;
    const liquidityChange = (Math.random() - 0.5) * 2000 * liquidityMultiplier;
    const newLiquidity = Math.max(10000, currentLiquidity + liquidityChange);
    setLiquidity(Math.floor(newLiquidity));
    
    // 🔄 Actualizar historial de forma continua
    const timestamp = new Date().toISOString();
    const timeLabel = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    
    const newDataPoint = {
      timestamp,
      price: roundedPrice,
      name: timeLabel,
      change: parseFloat(change.toFixed(2))
    };
    
    // Mantener historial fluido (últimos 30 puntos)
    const updatedHistory = [...currentHistory];
    if (updatedHistory.length >= 30) {
      updatedHistory.shift();
    }
    updatedHistory.push(newDataPoint);
    
    setPriceHistory(updatedHistory);
    
    // 📊 Log solo cada 5 actualizaciones para no saturar
    if (updateCountRef.current % 5 === 0) {
      console.log(`📈 Simulación: $${roundedPrice.toFixed(6)} (${change.toFixed(2)}%)`);
    }
    
  }, []);

  // 💾 SINCRONIZAR CON SUPABASE (con throttling)
  const syncPriceToSupabase = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const now = Date.now();
      // Sincronizar máximo cada 20 segundos
      if (now - lastUpdateRef.current < 20000) {
        return;
      }
      
      const currentPrice = currentPriceRef.current;
      const currentLiquidity = currentLiquidityRef.current;
      
      console.log('💾 Sincronizando precio con Supabase...');
      
      const { error } = await supabase
        .from('token_prices')
        .upsert({
          token_symbol: 'CROC',
          price: currentPrice,
          liquidity: currentLiquidity,
          last_updated: new Date().toISOString()
        }, { onConflict: 'token_symbol' });

      if (error) throw error;
      
      lastUpdateRef.current = now;
      console.log('✅ Precio sincronizado con Supabase');
      
    } catch (err) {
      console.error('❌ Error en sincronización:', err);
    }
  }, []);

  // 💾 GUARDAR EN HISTORIAL DE SUPABASE
  const savePriceToHistory = useCallback(async () => {
    try {
      const currentPrice = currentPriceRef.current;
      const currentLiquidity = currentLiquidityRef.current;
      
      await supabase
        .from('token_price_history')
        .insert([
          {
            token_symbol: 'CROC',
            price: currentPrice,
            liquidity: currentLiquidity,
            created_at: new Date().toISOString()
          }
        ]);
        
    } catch (error) {
      console.error('❌ Error guardando historial:', error);
    }
  }, []);

  // ⚡ INICIALIZAR UNA SOLA VEZ
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('🚀 Inicializando sistema de precio CROC...');
    
    // 1. Cargar precio inicial (una sola vez)
    loadPriceFromSupabase();
    
    // 2. Iniciar simulación (cada 4 segundos para más fluidez)
    simulationIntervalRef.current = setInterval(() => {
      runPriceSimulation();
    }, 4000);
    
    // 3. Sincronizar con Supabase cada 30 segundos
    syncIntervalRef.current = setInterval(() => {
      syncPriceToSupabase();
    }, 30000);
    
    // 4. Guardar en historial cada 60 segundos
    const historyInterval = setInterval(() => {
      savePriceToHistory();
    }, 60000);
    
    // 5. Recargar desde Supabase cada 2 minutos
    reloadIntervalRef.current = setInterval(() => {
      loadPriceFromSupabase();
    }, 120000);
    
    return () => {
      console.log('🛑 Limpiando sistema de precio CROC...');
      isMountedRef.current = false;
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (reloadIntervalRef.current) clearInterval(reloadIntervalRef.current);
      clearInterval(historyInterval);
    };
  }, [loadPriceFromSupabase, runPriceSimulation, syncPriceToSupabase, savePriceToHistory]);

  // 📊 OBTENER DATOS PARA GRÁFICO (optimizado)
  const getChartData = useCallback(() => {
    if (currentHistoryRef.current.length === 0) {
      // Generar datos iniciales si no hay
      const initialData = [];
      const basePrice = currentPriceRef.current || 0.05;
      
      for (let i = 0; i < 30; i++) {
        const timestamp = new Date(Date.now() - (30 - i) * 4000).toISOString();
        const timeLabel = new Date(timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });
        
        const wave = Math.sin(i * 0.3) * 0.03;
        const price = basePrice * (1 + wave);
        
        initialData.push({
          name: timeLabel,
          price: parseFloat(price.toFixed(6)),
          timestamp,
          change: parseFloat((wave * 100).toFixed(2))
        });
      }
      return initialData;
    }
    
    // Devolver últimos 30 puntos del historial actual
    return currentHistoryRef.current.slice(-30);
  }, []);

  // 📈 OBTENER ESTADÍSTICAS
  const getPriceStats = useCallback(() => {
    const currentPrice = currentPriceRef.current;
    const currentLiquidity = currentLiquidityRef.current;
    const history = currentHistoryRef.current;
    
    if (history.length < 2) {
      return {
        change24h: 0,
        high: currentPrice,
        low: currentPrice,
        volume: currentLiquidity * 0.8,
        marketCap: (currentPrice * 10000000).toFixed(0)
      };
    }
    
    const recentPrices = history.slice(-24).map(p => p.price);
    const change24h = ((currentPrice - recentPrices[0]) / recentPrices[0]) * 100;
    
    return {
      change24h: parseFloat(change24h.toFixed(2)),
      high: Math.max(...recentPrices, currentPrice),
      low: Math.min(...recentPrices, currentPrice),
      volume: currentLiquidity * 0.8,
      marketCap: (currentPrice * 10000000).toFixed(0)
    };
  }, []);

  // 🔄 REFRESCAR MANUALMENTE
  const refreshPrice = useCallback(async () => {
    await loadPriceFromSupabase();
  }, [loadPriceFromSupabase]);

  // 🔧 ACTUALIZAR PRECIO MANUALMENTE
  const updatePrice = useCallback(async (newPrice, newLiquidity) => {
    if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice <= 0) {
      throw new Error('Precio inválido');
    }
    
    setTokenPrice(newPrice);
    priceSeedRef.current = newPrice;
    
    if (newLiquidity !== undefined) {
      setLiquidity(newLiquidity);
    }
    
    await syncPriceToSupabase();
    
    console.log(`✅ Precio actualizado manualmente a $${newPrice}`);
  }, [syncPriceToSupabase]);

  return {
    // 💰 DATOS PRINCIPALES
    tokenPrice,
    liquidity,
    priceHistory,
    
    // 🔧 ESTADO
    isLoading,
    error,
    
    // 📊 FUNCIONES
    getChartData,
    getPriceStats,
    
    // 🔄 FUNCIONES DE CONTROL
    refreshPrice,
    updatePrice,
    
    // 📱 UTILIDADES
    formatPrice: (value = currentPriceRef.current) => `$${value.toFixed(6)}`,
    formatLiquidity: () => `$${currentLiquidityRef.current.toLocaleString()}`,
    
    // ℹ️ INFORMACIÓN
    lastUpdated: lastUpdateRef.current ? new Date(lastUpdateRef.current) : null,
    isSimulating: !!simulationIntervalRef.current,
    
    // ✅ DATOS PARA COMPONENTES
    getCurrentPrice: () => currentPriceRef.current,
    getCurrentLiquidity: () => currentLiquidityRef.current
  };
}