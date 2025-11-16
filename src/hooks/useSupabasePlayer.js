import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

/**
 * 🧩 Hook de sincronización avanzada con Supabase + Realtime
 * - Crea jugador y stats si no existen.
 * - Sincroniza coins, croc_tokens, level y clicks.
 * - Escucha cambios en tiempo real (tabla player_stats).
 * - Usa debounce (2s) para evitar escrituras excesivas.
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
      const { data: existingPlayer, error: playerError } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let playerRecord = existingPlayer;

      /* Crear si no existe */
      if (playerError?.code === "PGRST116" || !existingPlayer) {
        const baseName = user.email?.split("@")[0]?.slice(0, 12) || "croc";
        const username = generateUsername(baseName);
        const avatarUrl = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`;

        const { data: newPlayer, error: insertError } = await supabase
          .from("players")
          .insert([{ user_id: user.id, username, avatar_url: avatarUrl }])
          .select()
          .single();

        if (insertError) throw insertError;
        playerRecord = newPlayer;
        console.log("✅ Jugador creado:", username);
      } else if (playerError && playerError.code !== "PGRST116") {
        throw playerError;
      }

      setPlayer(playerRecord);

      /* 🪙 Buscar stats */
      const { data: existingStats, error: statsError } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerRecord.id)
        .single();

      /* Crear si no existen */
      if (statsError?.code === "PGRST116" || !existingStats) {
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
      } else if (statsError && statsError.code !== "PGRST116") {
        throw statsError;
      } else {
        setStats(existingStats);
        console.log("📥 Stats cargadas:", existingStats);
      }

      /* 🔊 Suscripción Realtime */
      if (playerRecord?.id) {
        // Cerrar canal anterior si existe
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
                  if (
                    JSON.stringify(prev) !== JSON.stringify(payload.new)
                  ) {
                    console.log("🔄 Realtime update:", payload.new);
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
  }, [user, generateUsername]);

  /* 🔄 Sincronizar stats a Supabase (debounce) */
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

          const { error: updateError } = await supabase
            .from("player_stats")
            .update(payload)
            .eq("player_id", player.id);

          if (updateError) throw updateError;
          console.log("✅ Stats sincronizadas:", payload);
        } catch (err) {
          console.error("⚠️ Error al sincronizar:", err.message);
        }
      }, 2000);
    },
    [player?.id]
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

  /* 📤 API pública */
  return {
    player,
    stats,
    setStats,
    loading,
    error,
    refresh: loadPlayerData,
    syncStatsToSupabase,
  };
}
