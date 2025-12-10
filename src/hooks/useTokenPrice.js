import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useTokenPrice(initialPrice = 0.05) {
  // 🎯 ESTADOS SIMPLES
  const [tokenPrice, setTokenPrice] = useState(initialPrice);
  const [liquidity, setLiquidity] = useState(50000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🔥 REFERENCIAS
  const simulationRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef(0);
  const priceCacheRef = useRef({ price: initialPrice, timestamp: 0 });

  // 🔄 CARGAR PRECIO DESDE SUPABASE (FUENTE ÚNICA DE VERDAD)
  const loadPriceFromSupabase = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;
    
    try {
      // Evitar llamadas muy seguidas (mínimo 5 segundos)
      const now = Date.now();
      if (!force && now - lastUpdateRef.current < 5000) {
        return;
      }
      
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('token_prices')
        .select('price, liquidity, last_updated')
        .eq('token_symbol', 'CROC')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.log('⚠️ No se encontró precio en Supabase, usando simulación local');
        // No es error crítico, continuamos con simulación local
      } else if (data) {
        const newPrice = Number(data.price) || initialPrice;
        const newLiquidity = Number(data.liquidity) || 50000;
        
        console.log('✅ Precio CROC cargado:', newPrice);
        
        // Actualizar estado solo si cambió
        if (Math.abs(newPrice - tokenPrice) > 0.000001) {
          setTokenPrice(newPrice);
        }
        if (Math.abs(newLiquidity - liquidity) > 100) {
          setLiquidity(newLiquidity);
        }
        
        // Actualizar caché
        priceCacheRef.current = {
          price: newPrice,
          liquidity: newLiquidity,
          timestamp: now
        };
        
        lastUpdateRef.current = now;
      }
    } catch (err) {
      console.error('❌ Error cargando precio:', err);
      setError(err.message);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [initialPrice, tokenPrice, liquidity]);

  // 📈 SIMULACIÓN LOCAL SENCILLA (solo para este cliente)
  const runLocalSimulation = useCallback(() => {
    // Solo mover el precio un poco (máximo ±2%)
    const change = (Math.random() - 0.5) * 0.04; // -2% a +2%
    const newPrice = Math.max(0.001, tokenPrice * (1 + change));
    
    // Mover liquidez un poco
    const liqChange = (Math.random() - 0.5) * 1000;
    const newLiquidity = Math.max(10000, liquidity + liqChange);
    
    setTokenPrice(parseFloat(newPrice.toFixed(6)));
    setLiquidity(Math.floor(newLiquidity));
    
    console.log('📈 Simulación local:', newPrice.toFixed(6));
  }, [tokenPrice, liquidity]);

  // 🔄 SINCRONIZAR CON SUPABASE (todos los clientes escriben aquí)
  const syncPriceToSupabase = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      // Solo sincronizar cada 30 segundos máximo
      const now = Date.now();
      if (now - lastUpdateRef.current < 30000) {
        return;
      }
      
      console.log('💾 Sincronizando precio con Supabase:', tokenPrice);
      
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
        // Si falla, intentar UPSERT
        await supabase
          .from('token_prices')
          .upsert({
            token_symbol: 'CROC',
            price: tokenPrice,
            liquidity: liquidity,
            last_updated: new Date().toISOString()
          });
      }
      
      lastUpdateRef.current = now;
      console.log('✅ Precio sincronizado');
      
    } catch (err) {
      console.error('❌ Error sincronizando:', err);
    }
  }, [tokenPrice, liquidity]);

  // ⚡ INICIALIZAR Y CONFIGURAR INTERVALOS
  useEffect(() => {
    isMountedRef.current = true;
    
    // 1. Cargar precio inicial desde Supabase
    loadPriceFromSupabase();
    
    // 2. Configurar intervalo para cargar precio REAL cada 15 segundos
    const loadInterval = setInterval(() => {
      loadPriceFromSupabase();
    }, 15000);
    
    // 3. Configurar intervalo para simulación LOCAL (solo efecto visual)
    simulationRef.current = setInterval(() => {
      runLocalSimulation();
    }, 8000);
    
    // 4. Configurar intervalo para sincronizar con Supabase
    const syncInterval = setInterval(() => {
      syncPriceToSupabase();
    }, 30000);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(loadInterval);
      if (simulationRef.current) clearInterval(simulationRef.current);
      clearInterval(syncInterval);
    };
  }, [loadPriceFromSupabase, runLocalSimulation, syncPriceToSupabase]);

  // 📊 DATOS PARA GRÁFICO (simulados basados en precio actual)
  const getChartData = useCallback(() => {
    const data = [];
    let simulatedPrice = tokenPrice;
    
    // Generar 30 puntos de datos (simulados)
    for (let i = 0; i < 30; i++) {
      // Pequeña variación para cada punto histórico
      const change = (Math.random() - 0.5) * 0.03;
      simulatedPrice = Math.max(0.001, simulatedPrice * (1 + change));
      
      data.unshift({
        name: `${30 - i}m`,
        price: parseFloat(simulatedPrice.toFixed(4)),
        timestamp: new Date(Date.now() - (30 - i) * 60000).toISOString()
      });
    }
    
    return data;
  }, [tokenPrice]);

  // 📈 ESTADÍSTICAS SIMPLES
  const getPriceStats = useCallback(() => {
    // Simular estadísticas basadas en el precio actual
    const change24h = ((tokenPrice - initialPrice) / initialPrice) * 100;
    
    return {
      change24h: parseFloat(change24h.toFixed(2)),
      high: tokenPrice * 1.15, // +15%
      low: tokenPrice * 0.85,  // -15%
      volume: liquidity * 0.7
    };
  }, [tokenPrice, liquidity, initialPrice]);

  // 🔄 ACTUALIZAR PRECIO MANUALMENTE (para admin/testing)
  const updatePrice = useCallback(async (newPrice, newLiquidity) => {
    if (!isMountedRef.current) return;
    
    try {
      setTokenPrice(newPrice);
      if (newLiquidity !== undefined) setLiquidity(newLiquidity);
      
      // Sincronizar inmediatamente
      await supabase
        .from('token_prices')
        .insert([
          { 
            token_symbol: 'CROC', 
            price: newPrice, 
            liquidity: newLiquidity || liquidity,
            last_updated: new Date().toISOString()
          }
        ]);
      
      lastUpdateRef.current = Date.now();
      console.log('✅ Precio actualizado manualmente:', newPrice);
      
    } catch (err) {
      console.error('❌ Error actualizando precio:', err);
    }
  }, [liquidity]);

  return {
    // 💰 DATOS PRINCIPALES
    tokenPrice,
    liquidity,
    
    // 🔧 ESTADO
    isLoading,
    error,
    
    // 📊 FUNCIONES
    getChartData,
    getPriceStats,
    
    // 🔄 FUNCIONES DE CONTROL
    refreshPrice: () => loadPriceFromSupabase(true),
    updatePrice,
    
    // 📱 FORMATOS
    formatPrice: (value = tokenPrice) => `$${value.toFixed(4)}`,
    formatLiquidity: () => `$${liquidity.toLocaleString()}`,
    
    // ℹ️ INFO
    lastUpdated: lastUpdateRef.current ? new Date(lastUpdateRef.current) : null
  };
}