// src/components/ShopView.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Palette, Gem, Zap, Check, Eye } from "lucide-react";
import { SHOP_ITEMS } from "@/config/gameConfig";

export function ShopView({
  buyShopItem,
  equipSkin,
  coins = 0,
  ownedItems = [],
  activeSkin,
}) {
  const [selectedTab, setSelectedTab] = useState("skins");
  const [previewSkin, setPreviewSkin] = useState(activeSkin);

  // ✅ Previene errores si SHOP_ITEMS no existe o está vacío
  const safeItems = Array.isArray(SHOP_ITEMS) ? SHOP_ITEMS.filter(Boolean) : [];

  const filteredItems = (type) =>
    safeItems.filter((item) => item?.type === type);

  const getItemStatus = (item) => {
    if (!item) return { text: "Error", disabled: true };

    if (item.type === "skin") {
      if (activeSkin === item.id)
        return { text: "Equipada", disabled: true, variant: "outline" };
      if (ownedItems.includes(item.id))
        return { text: "Equipar", disabled: false, variant: "default" };
    } else if (item.type === "item" || item.type === "consumable") {
      if (ownedItems.includes(item.id))
        return { text: "Comprado", disabled: true, variant: "outline" };
    }

    return {
      text: `Comprar (${item.price?.toLocaleString?.() || 0}💰)`,
      disabled: coins < (item.price || 0),
      variant: "default",
    };
  };

  const handlePreview = (skinId) => {
    setPreviewSkin(skinId);
  };

  const ItemCard = ({ item }) => {
    if (!item) return null;
    const status = getItemStatus(item);
    const Icon = item.icon || ShoppingCart;

    const handleAction = () => {
      if (status.text === "Equipar") equipSkin?.(item.id);
      else buyShopItem?.(item.id);
    };

    return (
      <div className="stats-card rounded-xl p-4 flex flex-col justify-between hover-lift transition-all duration-200">
        <div>
          <div className="flex items-center mb-3">
            <Icon
              className={`w-10 h-10 p-2 rounded-lg mr-3 ${
                item.type === "skin"
                  ? "bg-purple-500/20 text-purple-400"
                  : item.type === "item"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            />
            <div>
              <h3 className="text-md font-semibold">{item.name}</h3>
              {item.type === "skin" && activeSkin === item.id && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                  Equipada
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-3 h-10 overflow-hidden">
            {item.description}
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          {item.type === "skin" && (
            <Button
              onClick={() => handlePreview(item.id)}
              variant="outline"
              size="sm"
              className="flex-1 mobile-button border-border"
            >
              <Eye className="w-4 h-4 mr-1" /> Ver
            </Button>
          )}

          <Button
            onClick={handleAction}
            disabled={status.disabled}
            className={`flex-1 mobile-button ${
              status.disabled &&
              status.text !== "Equipada" &&
              status.text !== "Comprado"
                ? "bg-gray-600 cursor-not-allowed"
                : status.text === "Equipar"
                ? "bg-primary hover:bg-primary/90"
                : ""
            }`}
          >
            {status.text.includes("Comprar") ? (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" /> {status.text}
              </>
            ) : status.text === "Equipar" ? (
              <>
                <Palette className="w-4 h-4 mr-2" /> {status.text}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2 text-green-400" /> {status.text}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const previewSkinData = safeItems.find((i) => i.id === previewSkin);
  const previewImage =
    previewSkinData?.image ||
    `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${previewSkin ||
      activeSkin ||
      "default"}`;

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding fade-in">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center gradient-text flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 mr-3 text-pink-400" /> Tienda del
          Pantano
        </h1>

        {/* 🐊 PREVISUALIZACIÓN DE SKIN */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="relative">
            <img
              src={previewImage}
              alt="Skin Preview"
              className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border-4 border-primary/60 shadow-lg bg-card/80 p-3 backdrop-blur-md"
            />
            <span className="absolute bottom-2 right-3 text-xs bg-primary/80 text-white px-2 py-0.5 rounded-full">
              {previewSkinData?.name || "Skin activa"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Previsualizando skin actual
          </p>
        </div>

        <div className="text-center mb-8 text-lg font-semibold">
          Monedas:{" "}
          <span className="text-yellow-400">
            {coins.toLocaleString("es-AR")}
          </span>{" "}
          💰
        </div>

        {/* ✅ Tabs manuales, sin dependencias externas */}
        <div className="w-full relative z-10">
          <div className="grid w-full grid-cols-3 mb-6 bg-card/60 backdrop-blur-md border border-border rounded-lg">
            <button
              onClick={() => setSelectedTab("skins")}
              className={`py-2 text-sm font-semibold rounded-l-lg transition-colors ${
                selectedTab === "skins"
                  ? "bg-primary text-white"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Palette className="w-4 h-4 mr-2 inline-block" /> Skins
            </button>
            <button
              onClick={() => setSelectedTab("items")}
              className={`py-2 text-sm font-semibold transition-colors ${
                selectedTab === "items"
                  ? "bg-primary text-white"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Gem className="w-4 h-4 mr-2 inline-block" /> Ítems
            </button>
            <button
              onClick={() => setSelectedTab("consumables")}
              className={`py-2 text-sm font-semibold rounded-r-lg transition-colors ${
                selectedTab === "consumables"
                  ? "bg-primary text-white"
                  : "hover:bg-muted text-muted-foreground"
              }`}
            >
              <Zap className="w-4 h-4 mr-2 inline-block" /> Consumibles
            </button>
          </div>

          {/* 🛍️ Items por categoría */}
          <div className="relative z-20">
            {selectedTab === "skins" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems("skin")?.length > 0 ? (
                  filteredItems("skin").map((item) => (
                    <ItemCard item={item} key={item?.id || Math.random()} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    Sin skins disponibles
                  </p>
                )}
              </div>
            )}

            {selectedTab === "items" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems("item")?.length > 0 ? (
                  filteredItems("item").map((item) => (
                    <ItemCard item={item} key={item?.id || Math.random()} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    Sin ítems disponibles
                  </p>
                )}
              </div>
            )}

            {selectedTab === "consumables" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems("consumable")?.length > 0 ? (
                  filteredItems("consumable").map((item) => (
                    <ItemCard item={item} key={item?.id || Math.random()} />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">
                    Sin consumibles disponibles
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
