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
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef(0);
  const priceSeedRef = useRef(0.05); // Semilla para simulación consistente

  // 📊 CARGAR PRECIO REAL DESDE SUPABASE
  const loadPriceFromSupabase = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    try {
      const now = Date.now();
      // Evitar llamadas demasiado frecuentes (mínimo 10 segundos)
      if (!force && now - lastUpdateRef.current < 10000) {
        return;
      }
      
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
        // No es error crítico
      } else if (data) {
        const newPrice = Number(data.price) || 0.05;
        const newLiquidity = Number(data.liquidity) || 50000;
        
        console.log(`✅ Precio cargado: $${newPrice}, Liquidez: $${newLiquidity}`);
        
        // Actualizar solo si hay cambio significativo
        if (Math.abs(newPrice - tokenPrice) > 0.0001) {
          setTokenPrice(newPrice);
          priceSeedRef.current = newPrice; // Actualizar semilla
        }
        
        if (Math.abs(newLiquidity - liquidity) > 1000) {
          setLiquidity(newLiquidity);
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
  }, [tokenPrice, liquidity]);

  // 📈 SIMULACIÓN DE PRECIO REALISTA
  const runPriceSimulation = useCallback(() => {
    if (!isMountedRef.current) return;
    
    // Factores de simulación más realistas
    const volatility = 0.015; // 1.5% de volatilidad
    const drift = 0.0008; // Tendencia ligeramente alcista
    const momentum = 0.3; // Inercia del precio
    
    // Movimiento browniano con momentum
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const deterministicChange = drift + (priceSeedRef.current > tokenPrice ? momentum : -momentum) * 0.001;
    
    const change = randomChange + deterministicChange;
    const newPrice = Math.max(0.001, tokenPrice * (1 + change));
    const roundedPrice = parseFloat(newPrice.toFixed(6));
    
    // Actualizar estado local
    setTokenPrice(roundedPrice);
    priceSeedRef.current = roundedPrice;
    
    // Simular liquidez correlacionada
    const liquidityChange = (Math.random() - 0.45) * 5000 * (change > 0 ? 1.2 : 0.8);
    const newLiquidity = Math.max(10000, liquidity + liquidityChange);
    setLiquidity(Math.floor(newLiquidity));
    
    // Actualizar historial
    setPriceHistory(prev => {
      const newHistory = [...prev];
      const timestamp = new Date().toISOString();
      const dataPoint = {
        timestamp,
        price: roundedPrice,
        name: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Mantener solo últimos 50 puntos
      if (newHistory.length >= 50) {
        newHistory.shift();
      }
      newHistory.push(dataPoint);
      
      return newHistory;
    });
    
    console.log(`📈 Simulación: $${roundedPrice.toFixed(6)} (+${(change*100).toFixed(2)}%)`);
  }, [tokenPrice, liquidity]);

  // 💾 SINCRONIZAR CON SUPABASE
  const syncPriceToSupabase = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      const now = Date.now();
      // Sincronizar máximo cada 15 segundos
      if (now - lastUpdateRef.current < 15000) {
        return;
      }
      
      console.log('💾 Sincronizando precio con Supabase...');
      
      const { error } = await supabase
        .from('token_prices')
        .insert([
          { 
            token_symbol: 'CROC', 
            price: tokenPrice, 
            liquidity: liquidity,
            last_updated: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('❌ Error insertando precio:', error);
        // Intentar upsert como fallback
        await supabase
          .from('token_prices')
          .upsert({
            token_symbol: 'CROC',
            price: tokenPrice,
            liquidity: liquidity,
            last_updated: new Date().toISOString()
          }, { onConflict: 'token_symbol' });
      }
      
      lastUpdateRef.current = now;
      console.log('✅ Precio sincronizado con Supabase');
      
    } catch (err) {
      console.error('❌ Error en sincronización:', err);
    }
  }, [tokenPrice, liquidity]);

  // ⚡ INICIALIZAR SISTEMA DE PRECIO
  useEffect(() => {
    isMountedRef.current = true;
    
    console.log('🚀 Inicializando sistema de precio CROC...');
    
    // 1. Cargar precio inicial
    loadPriceFromSupabase(true);
    
    // 2. Iniciar simulación local (cada 8 segundos)
    simulationIntervalRef.current = setInterval(() => {
      runPriceSimulation();
    }, 8000);
    
    // 3. Sincronizar con Supabase periódicamente (cada 20 segundos)
    syncIntervalRef.current = setInterval(() => {
      syncPriceToSupabase();
    }, 20000);
    
    // 4. Recargar desde Supabase periódicamente (cada 40 segundos)
    const reloadInterval = setInterval(() => {
      loadPriceFromSupabase();
    }, 40000);
    
    return () => {
      isMountedRef.current = false;
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      clearInterval(reloadInterval);
    };
  }, [loadPriceFromSupabase, runPriceSimulation, syncPriceToSupabase]);

  // 📊 OBTENER DATOS PARA GRÁFICO
  const getChartData = useCallback(() => {
    // Si hay historial, usarlo
    if (priceHistory.length > 0) {
      return priceHistory.slice(-30).map((point, index) => ({
        name: `T${index + 1}`,
        price: point.price,
        timestamp: point.timestamp
      }));
    }
    
    // Si no, generar datos iniciales basados en precio actual
    const initialData = [];
    let simulatedPrice = tokenPrice;
    
    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.5) * 0.02;
      simulatedPrice = Math.max(0.001, simulatedPrice * (1 + change));
      
      initialData.unshift({
        name: `T${30 - i}`,
        price: parseFloat(simulatedPrice.toFixed(4)),
        timestamp: new Date(Date.now() - (30 - i) * 60000).toISOString()
      });
    }
    
    return initialData;
  }, [priceHistory, tokenPrice]);

  // 📈 OBTENER ESTADÍSTICAS
  const getPriceStats = useCallback(() => {
    if (priceHistory.length < 2) {
      return {
        change24h: 0,
        high: tokenPrice,
        low: tokenPrice,
        volume: liquidity * 0.8,
        marketCap: (tokenPrice * 10000000).toFixed(0) // Suposición: 10M tokens
      };
    }
    
    const recentPrices = priceHistory.slice(-24).map(p => p.price);
    const change24h = ((tokenPrice - recentPrices[0]) / recentPrices[0]) * 100;
    
    return {
      change24h: parseFloat(change24h.toFixed(2)),
      high: Math.max(...recentPrices, tokenPrice),
      low: Math.min(...recentPrices, tokenPrice),
      volume: liquidity * 0.8,
      marketCap: (tokenPrice * 10000000).toFixed(0)
    };
  }, [priceHistory, tokenPrice, liquidity]);

  // 🔄 REFRESCAR MANUALMENTE
  const refreshPrice = useCallback(async () => {
    await loadPriceFromSupabase(true);
  }, [loadPriceFromSupabase]);

  // 🔧 ACTUALIZAR PRECIO MANUALMENTE (admin)
  const updatePrice = useCallback(async (newPrice, newLiquidity) => {
    if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice <= 0) {
      throw new Error('Precio inválido');
    }
    
    setTokenPrice(newPrice);
    priceSeedRef.current = newPrice;
    
    if (newLiquidity !== undefined) {
      setLiquidity(newLiquidity);
    }
    
    // Sincronizar inmediatamente
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
    formatPrice: (value = tokenPrice) => `$${value.toFixed(6)}`,
    formatLiquidity: () => `$${liquidity.toLocaleString()}`,
    
    // ℹ️ INFORMACIÓN
    lastUpdated: lastUpdateRef.current ? new Date(lastUpdateRef.current) : null,
    isSimulating: !!simulationIntervalRef.current
  };
}
