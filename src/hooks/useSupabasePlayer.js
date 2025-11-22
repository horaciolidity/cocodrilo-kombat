import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * 🧩 Hook de sincronización avanzada con Supabase 
 * - Control de duplicados integrado
 * - Sin recursión (stack depth)
 * - Manejo robusto de errores RLS
 */

export function useSupabasePlayer(user) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const updateTimeout = useRef(null);
  const lastSyncRef = useRef(null);
  const isMounted = useRef(true);

  /* 🧠 Generador de nombre aleatorio */
  const generateUsername = useCallback((base = "croc") => {
    const suffix = Math.floor(Math.random() * 9000 + 1000);
    return `${base}${suffix}`;
  }, []);

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

  /* 📦 Cargar o crear jugador + estadísticas */
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
      /* 🧍 Buscar jugador */
      const { data: existingPlayers, error: playersError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id);

      if (playersError) throw playersError;

      let playerRecord = existingPlayers?.[0];

      /* Crear jugador si no existe */
      if (!playerRecord) {
        const baseName = user.email?.split("@")[0]?.slice(0, 12) || "croc";
        const username = generateUsername(baseName);
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`;

        const { data: newPlayer, error: insertError } = await supabase
          .from("players")
          .insert([
            {
              user_id: user.id,
              username,
              avatar_url: avatarUrl,
            },
          ])
          .select()
          .single();

        if (insertError) {
          // Intentar recuperar
          const { data: recovered } = await supabase
            .from("players")
            .select("*")
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
          console.log("✅ Jugador creado:", newPlayer.username);
        }
      } else {
        console.log("✅ Jugador existente:", playerRecord.username);
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
      }
    } catch (err) {
      console.error("❌ Error en loadPlayerData:", err);
      setError(err.message || "Error al cargar datos del jugador");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [user, generateUsername, cleanDuplicateStats]);



  const syncStatsToSupabase = useCallback(
  async (newStats) => {
    if (!player?.id || !newStats) return;

    const now = Date.now();
    if (lastSyncRef.current && now - lastSyncRef.current < 2000) {
      return;
    }

    if (updateTimeout.current) clearTimeout(updateTimeout.current);

    updateTimeout.current = setTimeout(async () => {
      if (!isMounted.current) return;

      try {
        const payload = {
          coins: Math.floor(newStats.coins || 0),
          croc_tokens: newStats.croc_tokens || 0,
          level: newStats.level || 1,
          clicks: newStats.clicks || 0,
          updated_at: new Date().toISOString(),
        };

        console.log("🔄 Sincronizando stats:", payload);

        // ✅ PRIMERO INTENTAR UPDATE
        const { error: updateError } = await supabase
          .from("player_stats")
          .update(payload)
          .eq("player_id", player.id);

        if (updateError) {
          console.log("⚠️ Update falló, intentando insert...");
          
          // ✅ LUEGO INSERT SI NO EXISTE
          const { error: insertError } = await supabase
            .from("player_stats")
            .insert([{ player_id: player.id, ...payload }]);

          if (insertError) {
            console.error("❌ Error insertando stats:", insertError);
          } else {
            console.log("✅ Stats insertadas correctamente");
          }
        } else {
          console.log("✅ Stats actualizadas correctamente");
        }

        lastSyncRef.current = Date.now();
      } catch (err) {
        console.warn("⚠️ Error en sincronización:", err.message);
      }
    }, 2000); // Reducido a 2 segundos
  },
  [player?.id]
);

  /* 🧩 Carga inicial */
  useEffect(() => {
    isMounted.current = true;
    loadPlayerData();

    return () => {
      isMounted.current = false;
      if (updateTimeout.current) clearTimeout(updateTimeout.current);
    };
  }, [loadPlayerData]);

  /* 📤 API pública */
  return {
    player,
    stats,
    setStats: (newStats) => {
      if (!isMounted.current) return;
      setStats(newStats);
      syncStatsToSupabase(newStats);
    },
    loading,
    error,
    refresh: loadPlayerData,
    syncStatsToSupabase,
    cleanDuplicateStats: () =>
      player?.id ? cleanDuplicateStats(player.id) : Promise.resolve(),
  };
}
