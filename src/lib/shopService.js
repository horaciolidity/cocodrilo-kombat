// src/lib/shopService.js
import { supabase } from "@/lib/supabaseClient";

/**
 * 🛒 Compra un ítem en la tienda y lo guarda en la base de datos
 */
export const buyShopItem = async (userId, itemId, itemPrice, type, toast) => {
  try {
    // 1️⃣ Verificar monedas disponibles
    const { data: wallet, error: walletError } = await supabase
      .from("player_wallets")
      .select("coins")
      .eq("user_id", userId)
      .single();

    if (walletError) throw walletError;

    if ((wallet?.coins || 0) < itemPrice) {
      toast({ title: "❌ Monedas insuficientes", duration: 3000 });
      return;
    }

    // 2️⃣ Registrar la compra del ítem
    const { error: insertError } = await supabase.from("player_items").insert([
      {
        user_id: userId,
        item_id: itemId,
        type,
      },
    ]);

    // Evita error si ya está comprado
    if (insertError && insertError.code !== "23505") throw insertError;

    // 3️⃣ Descontar monedas
    const { error: updateError } = await supabase
      .from("player_wallets")
      .update({ coins: wallet.coins - itemPrice })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    toast({
      title: "🛒 ¡Compra exitosa!",
      description: "El ítem fue agregado a tu inventario.",
      duration: 3000,
    });
  } catch (err) {
    console.error("Error al comprar:", err);
    toast({
      title: "⚠️ Error al comprar",
      description: err.message,
      variant: "destructive",
    });
  }
};

/**
 * 🎨 Equipa una skin (actualiza la skin activa del jugador)
 */
export const equipSkin = async (userId, skinId, toast) => {
  try {
    const { error } = await supabase
      .from("player_wallets")
      .update({ active_skin: skinId })
      .eq("user_id", userId);

    if (error) throw error;

    toast({
      title: "🎨 Skin equipada",
      description: "Tu nueva apariencia ha sido aplicada.",
      duration: 2500,
    });
  } catch (err) {
    console.error("Error al equipar skin:", err);
    toast({
      title: "⚠️ Error al equipar",
      description: err.message,
      variant: "destructive",
    });
  }
};
