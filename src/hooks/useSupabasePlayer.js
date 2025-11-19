import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * 🧩 Hook de sincronización avanzada con Supabase + Realtime
 * - Crea jugador y stats si no existen.
 * - Sincroniza coins, croc_tokens, level y clicks.
 * - Escucha cambios en tiempo real (tabla player_stats).
 * - Usa debounce (2s) para evitar escrituras excesivas.
 * - GESTIÓN DE DUPLICADOS INTEGRADA
 */

export function useSupabasePlayer(user) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const updateTimeout = useRef(null);
  const realtimeChannel = useRef(null);

  /* 🧠 Generador de nombre aleatorio */
  const generateUsername = useCallback((base = "croc") => {
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return `${base}${suffix}`;
  }, []);

  /* 🧹 FUNCIÓN PARA LIMPIAR DUPLICADOS */
  const cleanDuplicateStats = useCallback(async (playerId) => {
    try {
      // Buscar todos los registros duplicados para este player
      const { data: duplicates, error: dupError } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerId)
        .order("updated_at", { ascending: false }); // Más reciente primero

      if (dupError) throw dupError;

      // Si hay más de un registro, mantener solo el más reciente
      if (duplicates && duplicates.length > 1) {
        console.log(`🧹 Encontrados ${duplicates.length} registros duplicados para player:`, playerId);
        
        const latestStats = duplicates[0]; // El más reciente
        const idsToDelete = duplicates.slice(1).map(d => d.id);
        
        // Eliminar duplicados
        const { error: deleteError } = await supabase
          .from("player_stats")
          .delete()
          .in("id", idsToDelete);
        
        if (deleteError) {
          console.warn("⚠️ Error eliminando duplicados:", deleteError);
        } else {
          console.log(`✅ ${idsToDelete.length} duplicados eliminados, manteniendo stats más recientes`);
          return latestStats; // Retornar el registro que se mantuvo
        }
      }
      
      return duplicates?.[0] || null;
    } catch (err) {
      console.error("❌ Error en cleanDuplicateStats:", err);
      return null;
    }
  }, []);

  /* 📦 Cargar o crear jugador + estadísticas CON CONTROL DE DUPLICADOS */
  const loadPlayerData = useCallback(async () => {
    if (!user) {
      setPlayer(null);
      setStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /* 🧍 Buscar jugador - EVITAR DUPLICADOS EN players */
      const { data: existingPlayers, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id);

      if (playersError) throw playersError;

      let playerRecord = existingPlayers?.[0]; // Tomar el primero si hay múltiples

      /* Crear si no existe */
      if (!playerRecord || existingPlayers.length === 0) {
        const baseName = user.email?.split("@")[0]?.slice(0, 12) || "croc";
        const username = generateUsername(baseName);
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`;

        const { data: newPlayer, error: insertError } = await supabase
          .from("players")
          .insert([{ user_id: user.id, username, avatar_url: avatarUrl }])
          .select()
          .single();

        if (insertError) {
          // Si falla por duplicado, intentar recuperar el existente
          if (insertError.code === '23505') {
            const { data: recoveredPlayer } = await supabase
              .from("players")
              .select("*")
              .eq("user_id", user.id)
              .single();
            playerRecord = recoveredPlayer;
          } else {
            throw insertError;
          }
        } else {
          playerRecord = newPlayer;
        }
        console.log("✅ Jugador creado/recuperado:", playerRecord.username);
      } 
      /* 🚨 Si hay múltiples jugadores para el mismo user_id, limpiar */
      else if (existingPlayers.length > 1) {
        console.warn(`⚠️ Múltiples jugadores encontrados para user ${user.id}, limpiando...`);
        
        // Mantener el más reciente
        const latestPlayer = existingPlayers.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0];
        
        playerRecord = latestPlayer;
        
        // Eliminar duplicados (opcional - descomenta si quieres limpiar automáticamente)
        // const idsToDelete = existingPlayers.slice(1).map(p => p.id);
        // await supabase.from("players").delete().in("id", idsToDelete);
      }

      setPlayer(playerRecord);

      /* 🪙 GESTIÓN ROBUSTA DE STATS CON CONTROL DE DUPLICADOS */
      if (playerRecord?.id) {
        // Primero limpiar duplicados
        const cleanStats = await cleanDuplicateStats(playerRecord.id);
        
        if (cleanStats) {
          setStats(cleanStats);
          console.log("📥 Stats limpias cargadas:", cleanStats);
        } else {
          // Si no hay stats después de limpiar, crear nuevas
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

          if (insertStatsError) throw insertStatsError;
          setStats(newStats);
          console.log("✅ Stats iniciales creadas");
        }

        /* 🔊 Suscripción Realtime MEJORADA */
        if (realtimeChannel.current) {
          supabase.removeChannel(realtimeChannel.current);
        }

        const channel = supabase
          .channel(`player_stats_changes_${playerRecord.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "player_stats",
              filter: `player_id=eq.${playerRecord.id}`,
            },
            (payload) => {
              if (payload.new) {
                setStats((prev) => {
                  // Evita sobrescribir valores locales más recientes
                  if (JSON.stringify(prev) !== JSON.stringify(payload.new)) {
                    console.log("🔄 Realtime update recibido:", payload.new);
                    return payload.new;
                  }
                  return prev;
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log(`🟢 Escuchando cambios Realtime del jugador ${playerRecord.id}`);
            } else if (status === "CHANNEL_ERROR") {
              console.error("🔴 Error en canal realtime");
            }
          });

        realtimeChannel.current = channel;
      }
    } catch (err) {
      console.error("❌ useSupabasePlayer error:", err);
      setError(err.message || "Error al cargar jugador o estadísticas");
    } finally {
      setLoading(false);
    }
  }, [user, generateUsername, cleanDuplicateStats]);

  /* 🔄 Sincronizar stats a Supabase (debounce) - MEJORADO */
  const syncStatsToSupabase = useCallback(
    async (newStats) => {
      if (!player?.id || !newStats) return;
      if (updateTimeout.current) clearTimeout(updateTimeout.current);

      updateTimeout.current = setTimeout(async () => {
        try {
          const payload = {
            coins: Math.floor(newStats.coins || 0),
            croc_tokens: newStats.croc_tokens || 0,
            level: newStats.level || 1,
            clicks: newStats.clicks || 0,
            updated_at: new Date().toISOString(),
          };

          // Verificar primero si existe el registro
          const { data: existing } = await supabase
            .from("player_stats")
            .select("id")
            .eq("player_id", player.id)
            .single();

          let result;
          if (existing) {
            // Actualizar existente
            result = await supabase
              .from("player_stats")
              .update(payload)
              .eq("player_id", player.id);
          } else {
            // Crear nuevo
            result = await supabase
              .from("player_stats")
              .insert([{ ...payload, player_id: player.id }]);
          }

          if (result.error) throw result.error;
          console.log("✅ Stats sincronizadas:", payload);
        } catch (err) {
          console.error("⚠️ Error al sincronizar:", err.message);
          // Intentar limpiar duplicados y reintentar
          if (err.message.includes("duplicate") || err.code === '23505') {
            console.log("🔄 Detectado error de duplicado, limpiando...");
            await cleanDuplicateStats(player.id);
          }
        }
      }, 2000);
    },
    [player?.id, cleanDuplicateStats]
  );

  /* 🧩 Carga inicial */
  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  /* 🧹 Limpieza del canal Realtime */
  useEffect(() => {
    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
        realtimeChannel.current = null;
      }
      if (updateTimeout.current) clearTimeout(updateTimeout.current);
    };
  }, []);

  /* 📤 API pública MEJORADA */
  return {
    player,
    stats,
    setStats,
    loading,
    error,
    refresh: loadPlayerData,
    syncStatsToSupabase,
    cleanDuplicateStats: () => player?.id ? cleanDuplicateStats(player.id) : Promise.resolve(),
  };
}