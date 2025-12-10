import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useTokenPrice(initialPrice = 0.05) {
  const [tokenPrice, setTokenPrice] = useState(initialPrice);
  const [priceHistory, setPriceHistory] = useState([]);
  const [liquidity, setLiquidity] = useState(50000);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const simulationRef = useRef(null);
  const updateCountRef = useRef(0);
  const lastFetchRef = useRef(0);

  // 🔄 CARGAR PRECIO DESDE SUPABASE
  const loadPriceFromSupabase = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('💰 Buscando precio CROC en Supabase...');
      
      const { data, error: fetchError } = await supabase
        .from('token_prices')
        .select('price, liquidity, last_updated')
        .eq('token_symbol', 'CROC')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.log('⚠️ No se encontró precio en Supabase, usando valor por defecto');
        setTokenPrice(initialPrice);
        setLiquidity(50000);
        setIsLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Precio CROC cargado desde Supabase:', data.price);
        setTokenPrice(Number(data.price) || initialPrice);
        setLiquidity(Number(data.liquidity) || 50000);
        lastFetchRef.current = Date.now();
      }
    } catch (err) {
      console.error('❌ Error cargando precio desde Supabase:', err);
      setError(err.message);
      setTokenPrice(initialPrice);
      setLiquidity(50000);
    } finally {
      setIsLoading(false);
    }
  }, [initialPrice]);

  // 🔄 ACTUALIZAR PRECIO EN SUPABASE
  const updatePriceInSupabase = useCallback(async (newPrice, newLiquidity) => {
    const now = Date.now();
    
    // Solo actualizar cada 30 segundos para evitar sobrecarga
    if (now - lastFetchRef.current < 30000) {
      return;
    }

    try {
      console.log('💾 Guardando precio CROC en Supabase:', newPrice);
      
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

      if (updateError) throw updateError;
      
      lastFetchRef.current = now;
      console.log('✅ Precio CROC guardado en Supabase');
    } catch (err) {
      console.error('❌ Error guardando precio en Supabase:', err);
    }
  }, []);

  // 📊 SIMULACIÓN LOCAL + SINCRONIZACIÓN
  useEffect(() => {
    // Cargar precio inicial
    loadPriceFromSupabase();

    // Iniciar simulación
    simulationRef.current = setInterval(() => {
      updateCountRef.current += 1;
      
      // Factores de simulación
      const volatility = 0.02;
      const drift = 0.0005;
      
      // Movimiento browniano geométrico
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const deterministicChange = drift;
      
      const change = randomChange + deterministicChange;
      const newPrice = Math.max(0.001, tokenPrice * (1 + change));
      const roundedPrice = parseFloat(newPrice.toFixed(6));
      
      // Actualizar estado local
      setTokenPrice(roundedPrice);
      
      // Actualizar historial local
      setPriceHistory(prev => {
        const newHistory = [...prev];
        const timestamp = new Date().toISOString();
        const dataPoint = {
          timestamp,
          price: roundedPrice,
          name: `T${updateCountRef.current}`
        };
        
        if (newHistory.length >= 30) {
          newHistory.shift();
        }
        newHistory.push(dataPoint);
        
        return newHistory;
      });
      
      // Actualizar liquidez
      const liquidityChange = (Math.random() - 0.5) * 2000 * (roundedPrice / tokenPrice);
      const newLiquidity = Math.max(10000, liquidity + liquidityChange);
      setLiquidity(newLiquidity);
      
      // Sincronizar con Supabase periódicamente
      if (updateCountRef.current % 10 === 0) {
        updatePriceInSupabase(roundedPrice, newLiquidity);
      }
      
    }, 8000); // Actualizar cada 8 segundos

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [tokenPrice, liquidity, loadPriceFromSupabase, updatePriceInSupabase]);

  // 🔄 REFRESCAR PRECIO DESDE SUPABASE
  const refreshPrice = useCallback(async () => {
    await loadPriceFromSupabase();
  }, [loadPriceFromSupabase]);

  // 📊 Obtener datos para gráfico
  const getChartData = useCallback(() => {
    if (priceHistory.length === 0) {
      // Generar datos iniciales
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
  }, [priceHistory, tokenPrice]);

  // 📈 Obtener estadísticas
  const getPriceStats = useCallback(() => {
    if (priceHistory.length < 2) return { change24h: 0, high: tokenPrice, low: tokenPrice, volume: 0 };
    
    const prices = priceHistory.slice(-24).map(p => p.price);
    
    return {
      change24h: ((tokenPrice - prices[0]) / prices[0]) * 100,
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: liquidity * 0.8
    };
  }, [priceHistory, tokenPrice, liquidity]);

  return {
    tokenPrice,
    setTokenPrice,
    priceHistory,
    liquidity,
    isLoading,
    error,
    getChartData,
    getPriceStats,
    refreshPrice,
    updatePrice: updatePriceInSupabase
  };
}