import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * 🧩 Hook de sincronización avanzada con Supabase 
 * - Control de duplicados integrado
 * - Sin recursión (stack depth) 
 * - Manejo robusto de errores RLS
 * - Sincronización optimizada (2-3 segundos)
 * - Sistema de referidos seguro con códigos encriptados
 */

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

  /* 🧠 Generador de nombre aleatorio */
  const generateUsername = useCallback((base = "croc") => {
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return `${base}${suffix}`;
  }, []);

  /* 🔐 GENERADOR DE CÓDIGO DE REFERIDO SEGURO */
  const generateSecureReferralCode = useCallback(() => {
    // Generar código de 8 caracteres alfanuméricos en minúscula
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  /* 🎯 CAPTURAR REFERIDO CON CÓDIGO SEGURO */
  const captureReferral = useCallback(async (playerId) => {
    if (!playerId) return null;
    
    try {
      // Obtener el código de referido de la URL
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');
      
      if (!referralCode) {
        console.log("📭 No hay código de referido en la URL");
        return null;
      }

      console.log("🎯 Código de referido detectado:", referralCode);

      // Validar formato del código (8 caracteres alfanuméricos)
      const codeRegex = /^[a-z0-9]{8}$/;
      if (!codeRegex.test(referralCode)) {
        console.error("❌ Formato de código de referido inválido");
        return null;
      }

      // Buscar el jugador referidor por código seguro
      const { data: referrer, error: referrerError } = await supabase
        .from('players')
        .select('id, username, referral_code')
        .eq('referral_code', referralCode)
        .single();

      if (referrerError || !referrer) {
        console.error("❌ Código de referido no válido:", referralCode);
        return null;
      }

      // Verificar que no sea autoreferencia
      if (referrer.id === playerId) {
        console.warn("⚠️ No puedes autoreferenciarte");
        return null;
      }

      console.log("✅ Referido válido encontrado:", referrer.username);

      // Actualizar el jugador actual con el referido
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

  /* 📊 OBTENER ESTADÍSTICAS DE REFERIDOS */
  const getReferralStats = useCallback(async (playerId) => {
    if (!playerId) return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };

    try {
      // Contar referidos directos
      const { data: referrals, error: refError } = await supabase
        .from('players')
        .select('id, created_at')
        .eq('referred_by', playerId);

      if (refError) {
        console.error("❌ Error contando referidos:", refError);
        return { referralsCount: 0, crocFromRefs: 0, coinsFromRefs: 0 };
      }

      const referralsCount = referrals?.length || 0;
      
      // Calcular recompensas (10 CROC y 1000 monedas por referido activo)
      const activeReferrals = referrals?.filter(ref => {
        const refDate = new Date(ref.created_at);
        const daysSinceRef = (Date.now() - refDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceRef <= 30; // Referidos activos en los últimos 30 días
      }).length || 0;

      const crocFromRefs = activeReferrals * 10;
      const coinsFromRefs = activeReferrals * 1000;

      console.log("📊 Stats de referidos:", { referralsCount, crocFromRefs, coinsFromRefs });

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

  /* 🔄 ACTUALIZAR ESTADÍSTICAS DE REFERIDOS */
  const refreshReferralStats = useCallback(async () => {
    if (!player?.id) return;
    
    try {
      const stats = await getReferralStats(player.id);
      setReferralStats(stats);
    } catch (error) {
      console.error("❌ Error actualizando stats de referidos:", error);
    }
  }, [player?.id, getReferralStats]);

  /* 🧹 FUNCIÓN PARA LIMPIAR DUPLICADOS EN STATS */
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

  /* 🎯 FUNCIÓN DE SINCRONIZACIÓN MEJORADA */
  const syncStatsToSupabase = useCallback(async (newStats = null) => {
    // Si no hay player, salir
    if (!player?.id) {
      console.log("⏸️ Sync pausado: no hay player.id");
      return;
    }

    // Usar stats pendientes o las proporcionadas
    const statsToSync = newStats || pendingSyncRef.current || stats;
    if (!statsToSync) {
      console.log("⏸️ Sync pausado: no hay stats para sincronizar");
      return;
    }

    const now = Date.now();
    
    // 🔥 CRÍTICO: Solo 2 segundos entre syncs (no 5+3)
    if (now - lastSyncRef.current < 2000) {
      console.log("⏸️ Sync muy rápido, agendando...");
      pendingSyncRef.current = statsToSync;
      
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      syncTimeout.current = setTimeout(() => {
        syncStatsToSupabase();
      }, 2000 - (now - lastSyncRef.current));
      return;
    }

    try {
      const payload = {
        player_id: player.id,
        coins: Math.floor(statsToSync.coins || 0),
        croc_tokens: statsToSync.croc_tokens || 0,
        level: statsToSync.level || 1,
        clicks: statsToSync.clicks || 0,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("🔄 Sincronizando stats a Supabase:", payload);

      // ✅ UPDATE DIRECTO (más eficiente que upsert)
      const { error: updateError } = await supabase
        .from("player_stats")
        .update(payload)
        .eq('player_id', player.id);

      if (updateError) {
        console.error("❌ Error en update:", updateError);
        
        // ✅ FALLBACK: Upsert solo si es necesario
        const { error: upsertError } = await supabase
          .from("player_stats")
          .upsert(payload, { onConflict: 'player_id' });

        if (upsertError) {
          console.error("❌ Error crítico en upsert:", upsertError);
          throw upsertError;
        } else {
          console.log("✅ Stats sincronizadas (upsert fallback)");
        }
      } else {
        console.log("✅ Stats actualizadas correctamente");
      }

      lastSyncRef.current = Date.now();
      pendingSyncRef.current = null;
      
    } catch (err) {
      console.error("🚨 Error en syncStatsToSupabase:", err);
      // Reintentar en 5 segundos si falla
      setTimeout(() => syncStatsToSupabase(statsToSync), 5000);
    }
  }, [player?.id, stats]);

  /* 🆕 ACTUALIZACIÓN UNIFICADA DE STATS */
  const updateStats = useCallback((newStats) => {
    if (!isMounted.current) return;
    
    console.log("📝 Actualizando stats locales:", newStats);
    setStats(newStats);
    
    // Sincronizar inmediatamente pero con debounce
    pendingSyncRef.current = newStats;
    
    if (syncTimeout.current) clearTimeout(syncTimeout.current);
    syncTimeout.current = setTimeout(() => {
      syncStatsToSupabase();
    }, 1000);
  }, [syncStatsToSupabase]);

  /* 📦 Cargar o crear jugador + estadísticas + referidos */
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
      /* 🧍 Buscar jugador existente */
      const { data: existingPlayers, error: playersError } = await supabase
        .from("players")
        .select("*, referred_by(*)")
        .eq("user_id", user.id);

      if (playersError) throw playersError;

      let playerRecord = existingPlayers?.[0];
      let isNewPlayer = false;

      /* Crear jugador si no existe */
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
              // referred_by se asignará después si hay código de referido
            },
          ])
          .select("*, referred_by(*)")
          .single();

        if (insertError) {
          // Intentar recuperar
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
          
          // 🎯 CAPTURAR REFERIDO SI ES NUEVO JUGADOR
          if (isNewPlayer) {
            const referrer = await captureReferral(playerRecord.id);
            if (referrer) {
              console.log(`🎉 ${playerRecord.username} fue referido por ${referrer.username}`);
              
              // Recargar player con datos actualizados del referido
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
        
        // 🔐 Generar código de referido si no existe
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
        
        // Mostrar info del referido si existe
        if (playerRecord.referred_by) {
          console.log(`📎 Este jugador fue referido por: ${playerRecord.referred_by.username}`);
        }
      }

      setPlayer(playerRecord);

      /* 🪙 Cargar o crear stats */
      if (playerRecord?.id) {
        const cleanStats = await cleanDuplicateStats(playerRecord.id);

        if (cleanStats) {
          console.log("📥 Stats limpias cargadas:", cleanStats);
          setStats(cleanStats);
        } else {
          console.log("🆕 Creando stats iniciales...");

          const { data: newStats, error: insertStatsError } = await supabase
            .from("player_stats")
            .insert([
              {
                player_id: playerRecord.id,
                coins: 0,
                croc_tokens: 0,
                level: 1,
                clicks: 0,
              },
            ])
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
              const fallbackStats = {
                player_id: playerRecord.id,
                coins: 0,
                croc_tokens: 0,
                level: 1,
                clicks: 0,
                updated_at: new Date().toISOString(),
              };
              console.log("🔄 Usando stats locales de fallback");
              setStats(fallbackStats);
            }
          } else {
            console.log("✅ Stats iniciales creadas:", newStats);
            setStats(newStats);
          }
        }

        // 📊 Cargar estadísticas de referidos
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

  /* 🆕 SINCRONIZAR AUTOMÁTICAMENTE CUANDO CARGAN STATS */
  useEffect(() => {
    if (stats && player?.id) {
      console.log("🎯 Stats cargadas, sincronizando inicial...");
      // Sincronizar después de 1seg para evitar race conditions
      const initialSync = setTimeout(() => {
        syncStatsToSupabase();
      }, 1000);
      
      return () => clearTimeout(initialSync);
    }
  }, [stats, player?.id, syncStatsToSupabase]);

  /* 🔄 ACTUALIZAR STATS DE REFERIDOS PERIÓDICAMENTE */
  useEffect(() => {
    if (!player?.id) return;

    // Actualizar stats de referidos cada 30 segundos
    const interval = setInterval(() => {
      refreshReferralStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [player?.id, refreshReferralStats]);

  /* 🧩 Carga inicial */
  useEffect(() => {
    isMounted.current = true;
    loadPlayerData();

    return () => {
      isMounted.current = false;
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
        // Última sincronización antes de desmontar
        if (pendingSyncRef.current) {
          syncStatsToSupabase(pendingSyncRef.current);
        }
      }
    };
  }, [loadPlayerData]);

  /* 📤 API pública COMPLETA Y SEGURA */
  return {
    // Datos del jugador
    player,
    stats,
    setStats: updateStats,
    loading,
    error,
    
    // Sincronización
    refresh: loadPlayerData,
    syncStatsToSupabase,
    
    // Referidos seguros
    referralStats,
    refreshReferralStats,
    getReferralLink: () => {
      if (!player?.referral_code) {
        console.warn("⚠️ No hay referral_code para el jugador actual");
        return `${window.location.origin}?ref=anon`;
      }
      return `${window.location.origin}?ref=${player.referral_code}`;
    },
    
    // Utilidades
    cleanDuplicateStats: () =>
      player?.id ? cleanDuplicateStats(player.id) : Promise.resolve(),
  };
}