import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useTokenPrice() {
  const [tokenPrice, setTokenPrice] = useState(0.05);
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
      
      const { data, error: fetchError } = await supabase
        .from('token_prices')
        .select('price, liquidity, last_updated')
        .eq('token_symbol', 'CROC')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setTokenPrice(Number(data.price) || 0.05);
        setLiquidity(Number(data.liquidity) || 50000);
        lastFetchRef.current = Date.now();
        console.log('💰 Precio CROC cargado desde Supabase:', data.price);
      }
    } catch (err) {
      console.error('❌ Error cargando precio desde Supabase:', err);
      setError(err.message);
      
      // Crear precio inicial si no existe
      try {
        await supabase
          .from('token_prices')
          .insert([
            { 
              token_symbol: 'CROC', 
              price: 0.05, 
              liquidity: 50000 
            }
          ]);
      } catch (insertError) {
        console.error('❌ Error creando precio inicial:', insertError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🔄 ACTUALIZAR PRECIO EN SUPABASE (con throttling)
  const updatePriceInSupabase = useCallback(async (newPrice, newLiquidity) => {
    const now = Date.now();
    
    // Solo actualizar cada 30 segundos para evitar sobrecarga
    if (now - lastFetchRef.current < 30000) {
      return;
    }

    try {
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
      console.log('✅ Precio CROC actualizado en Supabase:', newPrice);
    } catch (err) {
      console.error('❌ Error actualizando precio en Supabase:', err);
    }
  }, []);

  // 📊 SIMULACIÓN LOCAL + SINCRONIZACIÓN CON SUPABASE
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
      if (updateCountRef.current % 10 === 0) { // Cada ~80 segundos
        updatePriceInSupabase(roundedPrice, newLiquidity);
      }
      
    }, 8000); // Actualizar cada 8 segundos

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
    };
  }, [tokenPrice, liquidity, loadPriceFromSupabase, updatePriceInSupabase]);

  // 🔄 REFRESCAR PRECIO DESDE SUPABASE (para otros usuarios)
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
    if (priceHistory.length < 2) return { change24h: 0, high: tokenPrice, low: tokenPrice };
    
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
    
    // Función para actualizar manualmente (solo admin)
    updatePrice: async (newPrice) => {
      if (typeof newPrice !== 'number' || isNaN(newPrice)) {
        throw new Error('Precio inválido');
      }
      
      await updatePriceInSupabase(newPrice, liquidity);
      setTokenPrice(newPrice);
    },
    
    // Función para reiniciar (solo desarrollo)
    resetPrice: async () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current);
      }
      
      const initialPrice = 0.05;
      const initialLiquidity = 50000;
      
      setTokenPrice(initialPrice);
      setLiquidity(initialLiquidity);
      setPriceHistory([]);
      
      try {
        await supabase
          .from('token_prices')
          .insert([
            { 
              token_symbol: 'CROC', 
              price: initialPrice, 
              liquidity: initialLiquidity 
            }
          ]);
      } catch (err) {
        console.error('❌ Error reiniciando precio:', err);
      }
    }
  };
}