// src/lib/shopService.js
import { supabase } from "@/lib/supabaseClient";

/**
 * 🛒 Compra un ítem en la tienda y lo guarda en la base de datos
 * @param {string} playerId - El ID del jugador (player_id en player_stats)
 * @param {string} itemId - ID del ítem
 * @param {number} itemPrice - Precio del ítem
 * @param {string} type - Tipo de ítem ('skin', 'item', 'boost', 'consumable')
 * @param {function} toast - Función para mostrar notificaciones
 */
export const buyShopItem = async (playerId, itemId, itemPrice, type, toast) => {
  try {
    if (!playerId) throw new Error("ID de jugador no proporcionado");

    // 1️⃣ Verificar monedas disponibles y obtener inventario actual
    const { data: stats, error: statsError } = await supabase
      .from("player_stats")
      .select("coins, owned_items")
      .eq("player_id", playerId)
      .single();

    if (statsError) throw statsError;

    if ((stats?.coins || 0) < itemPrice) {
      toast({ title: "❌ Monedas insuficientes", duration: 3000 });
      return;
    }

    // 2️⃣ Preparar nuevo inventario
    const currentItems = stats.owned_items || [];

    // Verificar si ya tiene el ítem (si no es consumible)
    if (type !== 'consumable' && currentItems.some(item => item.item_id === itemId)) {
      toast({ title: "⚠️ Ya posees este ítem", duration: 3000 });
      return;
    }

    const newItem = {
      item_id: itemId,
      type,
      bought_at: new Date().toISOString()
    };

    const updatedItems = [...currentItems, newItem];

    // 3️⃣ Descontar monedas y actualizar inventario en una sola operación
    const { error: updateError } = await supabase
      .from("player_stats")
      .update({
        coins: stats.coins - itemPrice,
        owned_items: updatedItems,
        updated_at: new Date().toISOString()
      })
      .eq("player_id", playerId);

    if (updateError) throw updateError;

    toast({
      title: "🛒 ¡Compra exitosa!",
      description: "El ítem fue agregado a tu inventario.",
      duration: 3000,
    });

    return { success: true };
  } catch (err) {
    console.error("Error al comprar:", err);
    toast({
      title: "⚠️ Error al comprar",
      description: err.message,
      variant: "destructive",
    });
    return { success: false, error: err.message };
  }
};

/**
 * 🎨 Equipa una skin (actualiza la skin activa del jugador)
 * @param {string} playerId - El ID del jugador
 * @param {string} skinId - ID de la skin
 * @param {function} toast - Función para mostrar notificaciones
 */
export const equipSkin = async (playerId, skinId, toast) => {
  try {
    if (!playerId) throw new Error("ID de jugador no proporcionado");

    const { error } = await supabase
      .from("player_stats")
      .update({
        active_skin: skinId,
        updated_at: new Date().toISOString()
      })
      .eq("player_id", playerId);

    if (error) throw error;

    toast({
      title: "🎨 Skin equipada",
      description: "Tu nueva apariencia ha sido aplicada.",
      duration: 2500,
    });

    return { success: true };
  } catch (err) {
    console.error("Error al equipar skin:", err);
    toast({
      title: "⚠️ Error al equipar",
      description: err.message,
      variant: "destructive",
    });
    return { success: false, error: err.message };
  }
};
