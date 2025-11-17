// src/hooks/useShopData.js
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useShopData(userId) {
  const [coins, setCoins] = useState(0);
  const [ownedItems, setOwnedItems] = useState([]);
  const [activeSkin, setActiveSkin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const { data: wallet } = await supabase
        .from("player_wallets")
        .select("coins, active_skin")
        .eq("user_id", userId)
        .single();

      const { data: items } = await supabase
        .from("player_items")
        .select("item_id");

      setCoins(wallet?.coins || 0);
      setActiveSkin(wallet?.active_skin || null);
      setOwnedItems(items?.map((i) => i.item_id) || []);
      setLoading(false);
    };
    load();
  }, [userId]);

  const refresh = async () => {
    if (!userId) return;
    const { data: wallet } = await supabase
      .from("player_wallets")
      .select("coins, active_skin")
      .eq("user_id", userId)
      .single();

    setCoins(wallet?.coins || 0);
    setActiveSkin(wallet?.active_skin || null);
  };

  return { coins, ownedItems, activeSkin, loading, refresh };
}
