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
  const upgradesDataRef = useRef(null);
  const dailyRewardsDataRef = useRef(null);
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

 // REEMPLAZAR la función getReferralStats con esta versión corregida:
const getReferralStats = useCallback(async (playerId) => {
  if (!playerId) return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };

  try {
    console.log("🔍 Buscando referidos para player:", playerId);
    
    const { data: referrals, error: refError } = await supabase
      .from('players')
      .select('id, username, created_at, referred_by')
      .eq('referred_by', playerId);

    if (refError) {
      console.error("❌ Error contando referidos:", refError);
      return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
    }

    const referralsCount = referrals?.length || 0;
    
    console.log("📊 Referidos encontrados:", referrals);

    // ✅ CÁLCULO SIMPLIFICADO Y ESTABLE - 10 CROC por referido
    const crocFromRefs = referralsCount * 10;
    const coinsFromRefs = referralsCount * 1000;

    console.log("🎯 Stats de referidos calculados:", { 
      referralsCount,
      crocFromRefs, 
      coinsFromRefs,
      referidos: referrals?.map(r => r.username) 
    });

    return {
      referralsCount,
      crocFromRefs,
      coinsFromRefs
    };

  } catch (error) {
    console.error("❌ Error en getReferralStats:", error);
    return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
  }
}, []);

// Agregar esta función en useSupabasePlayer.js
const fixReferralData = useCallback(async () => {
  if (!player?.id) return;
  
  try {
    console.log("🔧 Reparando datos de referidos...");
    
    // Forzar actualización de stats de referidos
    const refStats = await getReferralStats(player.id);
    setReferralStats(refStats);
    
    // Sincronizar con Supabase
    if (syncStatsToSupabase) {
      await syncStatsToSupabase({
        croc_from_refs: refStats.crocFromRefs,
        coins_from_refs: refStats.coinsFromRefs,
        referrals_count: refStats.referralsCount
      });
    }
    
    console.log("✅ Datos de referidos reparados:", refStats);
  } catch (error) {
    console.error("❌ Error reparando datos de referidos:", error);
  }
}, [player?.id, getReferralStats, syncStatsToSupabase]);


 const refreshReferralStats = useCallback(async () => {
  if (!player?.id) return;
  
  try {
    const stats = await getReferralStats(player.id);
    setReferralStats(stats);
    
    // ✅ ACTUALIZAR LA BASE DE DATOS CON LOS NUEVOS STATS DE REFERIDOS
    if (supabasePlayerData?.syncStatsToSupabase) {
      const updatedStats = {
        croc_from_refs: stats.crocFromRefs,
        coins_from_refs: stats.coinsFromRefs,
        referrals_count: stats.referralsCount
      };
      supabasePlayerData.syncStatsToSupabase(updatedStats);
    }
  } catch (error) {
    console.error("❌ Error actualizando stats de referidos:", error);
  }
}, [player?.id, getReferralStats, supabasePlayerData]);




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

  // 🎯 FUNCIÓN DE SINCRONIZACIÓN UNIFICADA Y CORREGIDA - MEJORADA
  const syncStatsToSupabase = useCallback(async (newStats = null, upgradesData = null, dailyRewardsData = null, otherData = null) => {
    if (!player?.id) {
      console.log("⏸️ Sync pausado: no hay player.id");
      return;
    }

    const statsToSync = newStats || pendingSyncRef.current || stats;
    
    // ✅ MANEJO SEGURO DE UPGRADES DATA
    let upgradesToSync = null;
    if (upgradesData !== undefined && upgradesData !== null) {
      upgradesToSync = upgradesData;
    } else if (upgradesDataRef.current !== null) {
      upgradesToSync = upgradesDataRef.current;
    }

    // ✅ MANEJO SEGURO DE DAILY REWARDS DATA
    let dailyRewardsToSync = null;
    if (dailyRewardsData !== undefined && dailyRewardsData !== null) {
      dailyRewardsToSync = dailyRewardsData;
    } else if (dailyRewardsDataRef.current !== null) {
      dailyRewardsToSync = dailyRewardsDataRef.current;
    }
    
    if (!statsToSync && !upgradesToSync && !dailyRewardsToSync && !otherData) {
      console.log("⏸️ Sync pausado: no hay datos para sincronizar");
      return;
    }

    const now = Date.now();
    
    if (now - lastSyncRef.current < 2000) {
      console.log("⏸️ Sync muy rápido, agendando...");
      pendingSyncRef.current = statsToSync;
      
      if (upgradesData !== undefined && upgradesData !== null) {
        upgradesDataRef.current = upgradesData;
      }

      if (dailyRewardsData !== undefined && dailyRewardsData !== null) {
        dailyRewardsDataRef.current = dailyRewardsData;
      }
      
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        syncStatsToSupabase();
      }, 2000 - (now - lastSyncRef.current));
      return;
    }

    try {
      // 🎯 CONSTRUIR PAYLOAD COMPLETO CON TODOS LOS CAMPOS
      const payload = {
        player_id: player.id,
        coins: Math.floor(statsToSync?.coins || 0),
        croc_tokens: Math.floor(statsToSync?.nativeTokenBalance || statsToSync?.croc_tokens || 0),
        native_token_balance: Math.floor(statsToSync?.nativeTokenBalance || statsToSync?.croc_tokens || 0),
        level: statsToSync?.level || 1,
        clicks: statsToSync?.clicks || statsToSync?.totalClicks || 0,
        energy: statsToSync?.energy || 100,
        max_energy: statsToSync?.max_energy || statsToSync?.maxEnergy || 100,
        click_power: statsToSync?.click_power || statsToSync?.clickPower || 1,
        coins_per_second: statsToSync?.coins_per_second || statsToSync?.coinsPerSecond || 0,
        experience: statsToSync?.experience || 0,
        total_coins: statsToSync?.total_coins || statsToSync?.totalCoins || 0,
        // ✅ SINCRONIZAR DATOS DE REFERIDOS
        croc_from_refs: statsToSync?.crocFromRefs || 0,
        coins_from_refs: statsToSync?.coinsFromRefs || 0,
        referrals_count: statsToSync?.referralsCount || 0,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // ✅ AGREGAR UPGRADES SI ESTÁN DISPONIBLES
      if (upgradesToSync) {
        payload.upgrades = upgradesToSync;
        console.log("🔄 Incluyendo upgrades en la sincronización:", upgradesToSync);
      }

      // ✅ AGREGAR DAILY REWARDS SI ESTÁN DISPONIBLES
      if (dailyRewardsToSync) {
        payload.daily_rewards = dailyRewardsToSync;
        console.log("🔄 Incluyendo daily rewards en la sincronización:", dailyRewardsToSync);
      }

      // ✅ AGREGAR OTROS DATOS SI ESTÁN DISPONIBLES
      if (otherData) {
        Object.assign(payload, otherData);
        console.log("🔄 Incluyendo otros datos en la sincronización:", otherData);
      }

      console.log("🔄 Sincronizando stats COMPLETAS a Supabase:", payload);

      const { error: updateError } = await supabase
        .from("player_stats")
        .update(payload)
        .eq('player_id', player.id);

      if (updateError) {
        console.error("❌ Error en update:", updateError);
        
        const { error: upsertError } = await supabase
          .from("player_stats")
          .upsert(payload, { onConflict: 'player_id' });

        if (upsertError) {
          console.error("❌ Error crítico en upsert:", upsertError);
          throw upsertError;
        } else {
          console.log("✅ Stats sincronizados (upsert fallback)");
        }
      } else {
        console.log("✅ Stats actualizados correctamente");
      }

      lastSyncRef.current = Date.now();
      pendingSyncRef.current = null;
      upgradesDataRef.current = null;
      dailyRewardsDataRef.current = null;
      
    } catch (err) {
      console.error("🚨 Error en syncStatsToSupabase:", err);
      setTimeout(() => syncStatsToSupabase(statsToSync, upgradesToSync, dailyRewardsToSync, otherData), 5000);
    }
  }, [player?.id, stats]);

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
        .update(payload)
        .eq('player_id', player.id);

      if (error) {
        console.error("❌ Error sincronizando upgrades:", error);
        
        // Intentar con upsert como fallback
        const { error: upsertError } = await supabase
          .from("player_stats")
          .upsert(payload, { onConflict: 'player_id' });

        if (upsertError) {
          console.error("❌ Error crítico en upsert de upgrades:", upsertError);
          throw upsertError;
        } else {
          console.log("✅ Upgrades sincronizados (upsert fallback)");
        }
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
        .update(payload)
        .eq('player_id', player.id);

      if (error) {
        console.error("❌ Error sincronizando daily rewards:", error);
        
        // Intentar con upsert como fallback
        const { error: upsertError } = await supabase
          .from("player_stats")
          .upsert(payload, { onConflict: 'player_id' });

        if (upsertError) {
          console.error("❌ Error crítico en upsert de daily rewards:", upsertError);
          throw upsertError;
        } else {
          console.log("✅ Daily rewards sincronizados (upsert fallback)");
        }
      } else {
        console.log("✅ Daily rewards sincronizados correctamente");
      }
      
    } catch (err) {
      console.error("🚨 Error en syncDailyRewardsToSupabase:", err);
      setTimeout(() => syncDailyRewardsToSupabase(dailyRewardsData), 5000);
    }
  }, [player?.id]);

  // ✅ FUNCIÓN ESPECÍFICA PARA SINCRONIZAR DATOS ADICIONALES
  const syncAdditionalDataToSupabase = useCallback(async (dataType, data) => {
    if (!player?.id || !data) {
      console.log(`⏸️ Sync ${dataType} pausado: no hay player.id o datos`);
      return;
    }

    try {
      const payload = {
        player_id: player.id,
        [dataType]: data,
        updated_at: new Date().toISOString(),
      };

      console.log(`🔄 Sincronizando ${dataType} a Supabase:`, payload);

      const { error } = await supabase
        .from("player_stats")
        .update(payload)
        .eq('player_id', player.id);

      if (error) {
        console.error(`❌ Error sincronizando ${dataType}:`, error);
        
        // Intentar con upsert como fallback
        const { error: upsertError } = await supabase
          .from("player_stats")
          .upsert(payload, { onConflict: 'player_id' });

        if (upsertError) {
          console.error(`❌ Error crítico en upsert de ${dataType}:`, upsertError);
          throw upsertError;
        } else {
          console.log(`✅ ${dataType} sincronizados (upsert fallback)`);
        }
      } else {
        console.log(`✅ ${dataType} sincronizados correctamente`);
      }
      
    } catch (err) {
      console.error(`🚨 Error en sync${dataType}:`, err);
      setTimeout(() => syncAdditionalDataToSupabase(dataType, data), 5000);
    }
  }, [player?.id]);

  // Actualización unificada de stats
  const updateStats = useCallback((newStats) => {
    if (!isMounted.current) return;
    
    console.log("📝 Actualizando stats locales:", newStats);
    
    const convertedStats = {
      ...newStats,
      coins: newStats.coins || 0,
      level: newStats.level || 1,
      clicks: newStats.totalClicks || newStats.clicks || 0,
      energy: newStats.energy || 100,
      max_energy: newStats.maxEnergy || newStats.max_energy || 100,
      click_power: newStats.clickPower || newStats.click_power || 1,
      coins_per_second: newStats.coinsPerSecond || newStats.coins_per_second || 0,
      experience: newStats.experience || 0,
      total_coins: newStats.totalCoins || newStats.total_coins || 0,
      native_token_balance: newStats.nativeTokenBalance || newStats.native_token_balance || 0,
      croc_tokens: newStats.nativeTokenBalance || newStats.croc_tokens || 0,
      croc_from_refs: newStats.crocFromRefs || newStats.croc_from_refs || 0,
      coins_from_refs: newStats.coinsFromRefs || newStats.coins_from_refs || 0,
      referrals_count: newStats.referralsCount || newStats.referrals_count || 0,
    };
    
    setStats(convertedStats);
    
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

          // ✅ CARGAR UPGRADES DESDE LA BASE DE DATOS SI EXISTEN
          if (cleanStats.upgrades && typeof cleanStats.upgrades === 'object') {
            console.log("🔄 Upgrades cargados desde BD:", cleanStats.upgrades);
          }

          // ✅ CARGAR DAILY REWARDS DESDE LA BASE DE DATOS SI EXISTEN
          if (cleanStats.daily_rewards && typeof cleanStats.daily_rewards === 'object') {
            console.log("🔄 Daily rewards cargados desde BD:", cleanStats.daily_rewards);
          }
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
            native_token_balance: 0,
            croc_from_refs: 0,
            coins_from_refs: 0,
            referrals_count: 0
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
      }, 1000);
      
      return () => clearTimeout(initialSync);
    }
  }, [stats, player?.id, syncStatsToSupabase]);

  // Actualizar stats de referidos periódicamente
  useEffect(() => {
    if (!player?.id) return;

    const interval = setInterval(() => {
      refreshReferralStats();
    }, 30000);

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
        if (pendingSyncRef.current || upgradesDataRef.current || dailyRewardsDataRef.current) {
          syncStatsToSupabase(pendingSyncRef.current, upgradesDataRef.current, dailyRewardsDataRef.current);
        }
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
    syncAdditionalDataToSupabase, // ✅ NUEVA FUNCIÓN PARA DATOS ADICIONALES
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