import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useSupabasePlayer(user) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadPlayer = async () => {
      // Buscar jugador
      const { data: playerData, error } = await supabase
        .from("players")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        // No existe, crear nuevo jugador
        const username = user.email?.split("@")[0] || "Cocodrilo";
        const { data: newPlayer } = await supabase
          .from("players")
          .insert([{ user_id: user.id, username }])
          .select()
          .single();
        setPlayer(newPlayer);
      } else {
        setPlayer(playerData);
      }

      // Cargar stats
      const { data: statsData } = await supabase
        .from("player_stats")
        .select("*")
        .eq("player_id", playerData?.id)
        .single();

      if (!statsData) {
        await supabase.from("player_stats").insert([{ player_id: playerData.id }]);
        setStats({ coins: 0, croc_tokens: 0, level: 1 });
      } else {
        setStats(statsData);
      }
    };

    loadPlayer();
  }, [user]);

  return { player, stats, setStats };
}
