import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSupabasePlayer(user) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralStats, setReferralStats] = useState({
    referralsCount: 0,
    crocFromRefs: 0,
    coinsFromRefs: 0
  });

  const syncTimeout = useRef(null);
  const lastSyncRef = useRef(0);
  const pendingSyncRef = useRef(null);
  const isMounted = useRef(true);

  // Generador de nombre aleatorio
  const generateUsername = useCallback((base = "croc") => {
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return `${base}${suffix}`;
  }, []);

  // Generador de código de referido seguro
  const generateSecureReferralCode = useCallback(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  // Capturar referido con código seguro
  const captureReferral = useCallback(async (playerId) => {
    if (!playerId) return null;
    
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (!referralCode) {
        console.log("📭 No hay código de referido en la URL");
        return null;
      }

      console.log("🎯 Código de referido detectado:", referralCode);

      const codeRegex = /^[a-z0-9]{8}$/;
      if (!codeRegex.test(referralCode)) {
        console.error("❌ Formato de código de referido inválido");
        return null;
      }

      const { data: referrer, error: referrerError } = await supabase
        .from('players')
        .select('id, username, referral_code')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        console.error("❌ Código de referido no válido:", referralCode);
        return null;
      }

      if (referrer.id === playerId) {
        console.warn("⚠️ No puedes autoreferenciarte");
        return null;
      }

      console.log("✅ Referido válido encontrado:", referrer.username);

      const { error: updateError } = await supabase
        .from('players')
        .update({ referred_by: referrer.id })
        .eq('id', playerId);

      if (updateError) {
        console.error("❌ Error asignando referido:", updateError);
        return null;
      }

      console.log("🎉 Referido asignado correctamente");
      return referrer;

    } catch (error) {
      console.error("❌ Error en captureReferral:", error);
      return null;
    }
  }, []);

  // Obtener estadísticas de referidos
 // EN getReferralStats, CORREGIR el cálculo:
const getReferralStats = useCallback(async (playerId) => {
  if (!playerId) return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };

  try {
    const { data: referrals, error: refError } = await supabase
      .from('players')
      .select('id, created_at')
      .eq('referred_by', playerId);

    if (refError) {
      console.error("❌ Error contando referidos:", refError);
      return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
    }

    const referralsCount = referrals?.length || 0;
    
    // ✅ CORREGIDO: 10 CROC por referido activo (30 días)
    const activeReferrals = referrals?.filter(ref => {
      const refDate = new Date(ref.created_at);
      const daysSinceRef = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceRef <= 30;
    }).length || 0;

    const crocFromRefs = activeReferrals * 10;
    const coinsFromRefs = referralsCount * 1000;

    console.log("📊 Referidos calculados:", { 
      total: referralsCount, 
      activos: activeReferrals,
      croc: crocFromRefs, 
      coins: coinsFromRefs 
    });

    return { referralsCount, crocFromRefs, coinsFromRefs };

  } catch (error) {
    console.error("❌ Error en getReferralStats:", error);
    return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
  }
}, []);

  // Actualizar estadísticas de referidos
  const refreshReferralStats = useCallback(async () => {
    if (!player?.id) return;
    
    try {
      const stats = await getReferralStats(player.id);
      setReferralStats(stats);
    } catch (error) {
      console.error("❌ Error actualizando stats de referidos:", error);
    }
  }, [player?.id, getReferralStats]);

  // Función para limpiar duplicados en stats
  const cleanDuplicateStats = useCallback(async (playerId) => {
    if (!playerId) return null;

    try {
      console.log("🧹 Buscando duplicados para player:", playerId);

      const { data: duplicates, error: dupError } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerId)
        .order("updated_at", { ascending: false });

      if (dupError) {
        console.warn("⚠️ Error buscando duplicados:", dupError);
        return null;
      }

      if (!duplicates || duplicates.length === 0) {
        console.log("📭 No hay stats para este player");
        return null;
      }

      if (duplicates.length === 1) {
        console.log("✅ Stats únicas encontradas");
        return duplicates[0];
      }

      console.log(`⚠️ Encontrados ${duplicates.length} registros, limpiando...`);

      const latestStats = duplicates[0];
      const idsToDelete = duplicates.slice(1).map((d) => d.id);

      const { error: deleteError } = await supabase
        .from("player_stats")
        .delete()
        .in("id", idsToDelete);

      if (deleteError) {
        console.warn("⚠️ No se pudieron eliminar duplicados:", deleteError);
        return latestStats;
      }

      console.log(`✅ ${idsToDelete.length} duplicados eliminados`);
      return latestStats;
    } catch (err) {
      console.error("❌ Error en cleanDuplicateStats:", err);
      return null;
    }
  }, []);

  // 🎯 FUNCIÓN DE SINCRONIZACIÓN UNIFICADA Y OPTIMIZADA
// REEMPLAZAR la función syncStatsToSupabase completa:
const syncStatsToSupabase = useCallback(async (data = null) => {
  if (!player?.id) {
    console.log("⏸️ Sync pausado: no hay player.id");
    return;
  }

  const currentPending = pendingSyncRef.current || {};
  const newData = data || {};
  const mergedData = { ...currentPending, ...newData };
  
  const now = Date.now();
  
  // Throttling: mínimo 3 segundos entre sincronizaciones
  if (now - lastSyncRef.current < 3000) {
    pendingSyncRef.current = mergedData;
    
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      syncStatsToSupabase(pendingSyncRef.current);
    }, 3000 - (now - lastSyncRef.current));
    return;
  }

  try {
    // 🎯 PAYLOAD UNIFICADO Y CORREGIDO
    const payload = {
      player_id: player.id,
      // ✅ DATOS BÁSICOS - USAR SOLO mergedData
      coins: Math.floor(mergedData.coins || 0),
      croc_tokens: Math.floor(mergedData.nativeTokenBalance || mergedData.croc_tokens || 0),
      native_token_balance: Math.floor(mergedData.nativeTokenBalance || mergedData.croc_tokens || 0),
      level: mergedData.level || 1,
      clicks: mergedData.clicks || mergedData.totalClicks || 0,
      energy: mergedData.energy || 100,
      max_energy: mergedData.max_energy || mergedData.maxEnergy || 100,
      click_power: mergedData.click_power || mergedData.clickPower || 1,
      coins_per_second: mergedData.coins_per_second || mergedData.coinsPerSecond || 0,
      experience: mergedData.experience || 0,
      total_coins: mergedData.total_coins || mergedData.totalCoins || 0,
      
      // ✅ DATOS DE REFERIDOS
      croc_from_refs: Math.floor(mergedData.crocFromRefs || 0),
      coins_from_refs: Math.floor(mergedData.coinsFromRefs || 0),
      referrals_count: mergedData.referralsCount || 0,
      
      // ✅ DATOS ADICIONALES
      upgrades: mergedData.upgrades || {},
      missions: mergedData.missions || {},
      owned_cards: mergedData.owned_cards || mergedData.ownedCards || [],
      owned_items: mergedData.owned_items || mergedData.ownedItems || [],
      active_skin: mergedData.active_skin || mergedData.activeSkin || null,
      achievements_unlocked: mergedData.achievements_unlocked || mergedData.achievementsUnlocked || [],
      daily_rewards: mergedData.daily_rewards || mergedData.dailyRewards || { streak: 0, available: true, lastClaim: null },
      farming_milestones: mergedData.farming_milestones || mergedData.farmingMilestonesState || {},
      
      last_active: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("🔄 Enviando a Supabase:", {
      coins: payload.coins,
      croc: payload.croc_tokens,
      level: payload.level,
      upgrades: Object.keys(payload.upgrades).length
    });

    // 🎯 UPSERT DIRECTO SIN FALLBACKS COMPLEJOS
    const { error } = await supabase
      .from("player_stats")
      .upsert(payload, { 
        onConflict: 'player_id'
      });

    if (error) {
      console.error("❌ Error en sync:", error);
      
      // Intentar insert como fallback
      const { error: insertError } = await supabase
        .from("player_stats")
        .insert(payload);
        
      if (insertError) {
        console.error("❌ Error crítico en insert:", insertError);
      }
    } else {
      console.log("✅ Sync exitoso");
      // Actualizar stats locales
      setStats(payload);
    }

    lastSyncRef.current = Date.now();
    pendingSyncRef.current = null;
    
  } catch (err) {
    console.error("🚨 Error crítico:", err);
    setTimeout(() => syncStatsToSupabase(mergedData), 5000);
  }
}, [player?.id]); // ✅ SOLO player.id como dependencia

  // ✅ FUNCIÓN ESPECÍFICA PARA SINCRONIZAR UPGRADES
  const syncUpgradesToSupabase = useCallback(async (upgradesData) => {
    if (!player?.id || !upgradesData) {
      console.log("⏸️ Sync upgrades pausado: no hay player.id o upgrades");
      return;
    }

    try {
      const payload = {
        player_id: player.id,
        upgrades: upgradesData,
        updated_at: new Date().toISOString(),
      };

      console.log("🔄 Sincronizando upgrades a Supabase:", payload);

      const { error } = await supabase
        .from("player_stats")
        .upsert(payload, { onConflict: 'player_id' });

      if (error) {
        console.error("❌ Error sincronizando upgrades:", error);
        throw error;
      } else {
        console.log("✅ Upgrades sincronizados correctamente");
      }
      
    } catch (err) {
      console.error("🚨 Error en syncUpgradesToSupabase:", err);
      setTimeout(() => syncUpgradesToSupabase(upgradesData), 5000);
    }
  }, [player?.id]);

  // ✅ FUNCIÓN ESPECÍFICA PARA SINCRONIZAR DAILY REWARDS
  const syncDailyRewardsToSupabase = useCallback(async (dailyRewardsData) => {
    if (!player?.id || !dailyRewardsData) {
      console.log("⏸️ Sync daily rewards pausado: no hay player.id o dailyRewards");
      return;
    }

    try {
      const payload = {
        player_id: player.id,
        daily_rewards: dailyRewardsData,
        updated_at: new Date().toISOString(),
      };

      console.log("🔄 Sincronizando daily rewards a Supabase:", payload);

      const { error } = await supabase
        .from("player_stats")
        .upsert(payload, { onConflict: 'player_id' });

      if (error) {
        console.error("❌ Error sincronizando daily rewards:", error);
        throw error;
      } else {
        console.log("✅ Daily rewards sincronizados correctamente");
      }
      
    } catch (err) {
      console.error("🚨 Error en syncDailyRewardsToSupabase:", err);
      setTimeout(() => syncDailyRewardsToSupabase(dailyRewardsData), 5000);
    }
  }, [player?.id]);

  // Actualización unificada de stats
  const updateStats = useCallback((newStats) => {
    if (!isMounted.current) return;
    
    console.log("📝 Actualizando stats locales:", newStats);
    
    const convertedStats = {
      ...newStats,
      coins: newStats.coins,
      level: newStats.level,
      clicks: newStats.totalClicks,
      energy: newStats.energy,
      max_energy: newStats.maxEnergy,
      click_power: newStats.clickPower,
      coins_per_second: newStats.coinsPerSecond,
      experience: newStats.experience,
      total_coins: newStats.totalCoins,
      native_token_balance: newStats.nativeTokenBalance,
      croc_tokens: newStats.nativeTokenBalance || newStats.croc_tokens
    };
    
    setStats(convertedStats);
    
    // Programar sincronización con throttling
    pendingSyncRef.current = convertedStats;
    
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      syncStatsToSupabase();
    }, 1000);
  }, [syncStatsToSupabase]);

  // Cargar o crear jugador + estadísticas + referidos
  const loadPlayerData = useCallback(async () => {
    if (!user) {
      setPlayer(null);
      setStats(null);
      setReferralStats({ referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: existingPlayers, error: playersError } = await supabase
        .from("players")
        .select("*, referred_by(*)")
        .eq("user_id", user.id);

      if (playersError) throw playersError;

      let playerRecord = existingPlayers?.[0];
      let isNewPlayer = false;

      if (!playerRecord) {
        const baseName = user.email?.split("@")[0]?.slice(0, 12) || "croc";
        const username = generateUsername(baseName);
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`;
        const referralCode = generateSecureReferralCode();

        const { data: newPlayer, error: insertError } = await supabase
          .from("players")
          .insert([
            {
              user_id: user.id,
              username,
              avatar_url: avatarUrl,
              referral_code: referralCode,
            },
          ])
          .select("*, referred_by(*)")
          .single();

        if (insertError) {
          const { data: recovered } = await supabase
            .from("players")
            .select("*, referred_by(*)")
            .eq("user_id", user.id)
            .single();

          if (recovered) {
            playerRecord = recovered;
            console.log("✅ Jugador recuperado:", recovered.username);
          } else {
            throw insertError;
          }
        } else {
          playerRecord = newPlayer;
          isNewPlayer = true;
          console.log("✅ Jugador creado:", newPlayer.username, "Código:", referralCode);
          
          if (isNewPlayer) {
            const referrer = await captureReferral(playerRecord.id);
            if (referrer) {
              console.log(`🎉 ${playerRecord.username} fue referido por ${referrer.username}`);
              
              const { data: updatedPlayer } = await supabase
                .from("players")
                .select("*, referred_by(*)")
                .eq("id", playerRecord.id)
                .single();
              
              if (updatedPlayer) {
                playerRecord = updatedPlayer;
              }
            }
          }
        }
      } else {
        console.log("✅ Jugador existente:", playerRecord.username);
        
        if (!playerRecord.referral_code) {
          const newReferralCode = generateSecureReferralCode();
          console.log("🆕 Generando código de referido para jugador existente:", newReferralCode);
          
          const { error: updateError } = await supabase
            .from("players")
            .update({ referral_code: newReferralCode })
            .eq('id', playerRecord.id);
          
          if (!updateError) {
            playerRecord.referral_code = newReferralCode;
            console.log("✅ Código de referido asignado:", newReferralCode);
          }
        }
        
        if (playerRecord.referred_by) {
          console.log(`📎 Este jugador fue referido por: ${playerRecord.referred_by.username}`);
        }
      }

      setPlayer(playerRecord);

      if (playerRecord?.id) {
        const cleanStats = await cleanDuplicateStats(playerRecord.id);

        if (cleanStats) {
          console.log("📥 Stats limpias cargadas:", cleanStats);
          setStats(cleanStats);
        } else {
          console.log("🆕 Creando stats iniciales...");

          const initialStats = {
            player_id: playerRecord.id,
            coins: 0,
            croc_tokens: 0,
            level: 1,
            clicks: 0,
            energy: 100,
            max_energy: 100,
            click_power: 1,
            coins_per_second: 0,
            experience: 0,
            total_coins: 0,
            native_token_balance: 0
          };

          const { data: newStats, error: insertStatsError } = await supabase
            .from("player_stats")
            .insert([initialStats])
            .select()
            .single();

          if (insertStatsError) {
            console.error("❌ Error creando stats:", insertStatsError);

            const { data: existingStats } = await supabase
              .from("player_stats")
              .select("*")
              .eq("player_id", playerRecord.id)
              .single();

            if (existingStats) {
              console.log("📥 Stats existentes recuperadas:", existingStats);
              setStats(existingStats);
            } else {
              console.log("🔄 Usando stats locales de fallback");
              setStats(initialStats);
            }
          } else {
            console.log("✅ Stats iniciales creadas:", newStats);
            setStats(newStats);
          }
        }

        const refStats = await getReferralStats(playerRecord.id);
        setReferralStats(refStats);
      }
    } catch (err) {
      console.error("❌ Error en loadPlayerData:", err);
      setError(err.message || "Error al cargar datos del jugador");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user, generateUsername, cleanDuplicateStats, captureReferral, getReferralStats, generateSecureReferralCode]);

  // Sincronizar automáticamente cuando cargan stats
  useEffect(() => {
    if (stats && player?.id) {
      console.log("🎯 Stats cargadas, sincronizando inicial...");
      const initialSync = setTimeout(() => {
        syncStatsToSupabase();
      }, 2000); // Esperar 2 segundos para la sincronización inicial
      
      return () => clearTimeout(initialSync);
    }
  }, [stats, player?.id, syncStatsToSupabase]);

  // Actualizar stats de referidos periódicamente
  useEffect(() => {
    if (!player?.id) return;

    const interval = setInterval(() => {
      refreshReferralStats();
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [player?.id, refreshReferralStats]);

  // Carga inicial
  useEffect(() => {
    isMounted.current = true;
    loadPlayerData();

    return () => {
      isMounted.current = false;
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [loadPlayerData]);

  return {
    player,
    stats,
    setStats: updateStats,
    loading,
    error,
    refresh: loadPlayerData,
    syncStatsToSupabase,
    syncUpgradesToSupabase,
    syncDailyRewardsToSupabase,
    referralStats,
    refreshReferralStats,
    getReferralLink: () => {
      if (!player?.referral_code) {
        console.warn("⚠️ No hay referral_code para el jugador actual");
        return `${window.location.origin}?ref=anon`;
      }
      return `${window.location.origin}?ref=${player.referral_code}`;
    },
    cleanDuplicateStats: () =>
      player?.id ? cleanDuplicateStats(player.id) : Promise.resolve(),
    updateGameStats: (gameState) => {
      const supabaseStats = {
        coins: gameState.coins,
        level: gameState.level,
        clicks: gameState.totalClicks,
        energy: gameState.energy,
        max_energy: gameState.maxEnergy,
        click_power: gameState.clickPower,
        coins_per_second: gameState.coinsPerSecond,
        experience: gameState.experience,
        total_coins: gameState.totalCoins,
        native_token_balance: gameState.nativeTokenBalance,
        croc_tokens: gameState.nativeTokenBalance,
        croc_from_refs: gameState.crocFromRefs || 0,
        coins_from_refs: gameState.coinsFromRefs || 0,
        referrals_count: gameState.referralsCount || 0,
      };
      updateStats(supabaseStats);
    }
  };
}