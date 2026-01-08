// useTokenPrice.js - OPTIMIZADA (Read-Only + Realtime)
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useTokenPrice() {
  // 🎯 ESTADOS PRINCIPALES
  const [tokenPrice, setTokenPrice] = useState(0.05);
  const [liquidity, setLiquidity] = useState(50000);
  const [priceHistory, setPriceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 🔥 REFERENCIAS
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef(0);
  
  // 📊 CARGAR PRECIO INICIAL
  const fetchPrice = useCallback(async () => {
    try {
      if (!isMountedRef.current) return;
      setIsLoading(true);
      
      const { data, error: fetchError } = await supabase
        .from('token_prices')
        .select('price, liquidity, last_updated')
        .eq('token_symbol', 'CROC')
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (data) {
        setTokenPrice(Number(data.price) || 0.05);
        setLiquidity(Number(data.liquidity) || 50000);
        lastUpdateRef.current = new Date(data.last_updated).getTime();
      }
    } catch (err) {
      console.error('❌ Error fetching price:', err.message);
      setError(err.message);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  // 👂 SUSCRIPCIÓN EN TIEMPO REAL (Evita polling)
  useEffect(() => {
    isMountedRef.current = true;
    fetchPrice();

    const channel = supabase
      .channel('public:token_prices')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'token_prices', filter: 'token_symbol=eq.CROC' }, 
        (payload) => {
          console.log('⚡ Precio actualizado (Realtime):', payload.new.price);
          setTokenPrice(Number(payload.new.price));
          setLiquidity(Number(payload.new.liquidity));
          lastUpdateRef.current = Date.now();
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchPrice]);

  // 📉 HISTORIAL (Mocleado visualmente por ahora para no saturar DB con reads)
  // En el futuro, esto debería leerse de una tabla 'token_price_history' solo al abrir la gráfica.
  const getChartData = useCallback(() => {
    // Generar una gráfica visual estable basada en el precio actual
    // para que la UI no se vea vacía.
    const data = [];
    const now = Date.now();
    const basePrice = tokenPrice;
    
    for (let i = 29; i >= 0; i--) {
        const time = new Date(now - i * 60000); // Cada minuto
        // Pequeña variación visual aleatoria alrededor del precio actual
        // Esto es solo estético para el cliente
        const noise = (Math.sin(i) * 0.005) * basePrice; 
        
        data.push({
            name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: basePrice + noise,
            timestamp: time.toISOString(),
            change: 0
        });
    }
    // El último punto es el precio real actual
    data[data.length - 1].price = basePrice;
    
    return data;
  }, [tokenPrice]);

  const getPriceStats = useCallback(() => {
    return {
      change24h: 0, // Calcular esto requeriría leer historial histórico real
      high: tokenPrice * 1.05,
      low: tokenPrice * 0.95,
      volume: liquidity * 0.5,
      marketCap: (tokenPrice * 10000000).toFixed(0)
    };
  }, [tokenPrice, liquidity]);

  return {
    tokenPrice,
    liquidity,
    priceHistory,
    isLoading,
    error,
    getChartData,
    getPriceStats,
    // refreshPrice se mantiene por compatibilidad, pero ya no es tan necesario con Realtime
    refreshPrice: fetchPrice, 
    // updatePrice eliminado (Seguridad)
    // formatters
    formatPrice: (val = tokenPrice) => `$${val.toFixed(6)}`,
    formatLiquidity: () => `$${liquidity.toLocaleString()}`,
  };
}