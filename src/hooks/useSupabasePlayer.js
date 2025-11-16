import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSupabasePlayer(user) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadPlayer = async () => {
      // Buscar jugador existente
      const { data: playerData, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .single();

      let playerRecord = playerData;

      if (error && error.code === "PGRST116") {
        // No existe, crear jugador
        const username = user.email?.split("@")[0] || "Cocodrilo";
        const { data: newPlayer } = await supabase
          .from("players")
          .insert([{ user_id: user.id, username }])
          .select()
          .single();
        playerRecord = newPlayer;
      }

      setPlayer(playerRecord);

      // Buscar estadísticas
      const { data: statsData } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerRecord?.id)
        .single();

      if (!statsData) {
        const { data: newStats } = await supabase
          .from("player_stats")
          .insert([{ player_id: playerRecord.id }])
          .select()
          .single();
        setStats(newStats);
      } else {
        setStats(statsData);
      }
    };

    loadPlayer();
  }, [user]);

  return { player, stats, setStats };
}
