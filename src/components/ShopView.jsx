// src/components/ShopView.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, 
  Palette, 
  Gem, 
  Zap, 
  Check, 
  Eye,
  Coins,
  Sparkles,
  Crown,
  Shield,
  Award,
  ShoppingBag,
  Package,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Info
} from "lucide-react";
import { SHOP_ITEMS } from "@/config/gameConfig";
import { useSound } from "@/hooks/useSound";

export function ShopView({
  coins = 0,
  ownedItems = [],
  activeSkin,
  buyShopItem,
  equipSkin,
}) {
  const { playSound } = useSound();
  
  const [selectedTab, setSelectedTab] = useState("skins");
  const [previewSkin, setPreviewSkin] = useState(activeSkin);
  const [stats, setStats] = useState({
    totalItems: 0,
    ownedSkins: 0,
    totalSkins: 0
  });

  // 🔍 Calcular estadísticas de la tienda
  useEffect(() => {
    if (!SHOP_ITEMS || !Array.isArray(SHOP_ITEMS)) return;
    
    const safeItems = SHOP_ITEMS.filter(item => item && item.id);
    
    // Calcular estadísticas
    const ownedSkins = ownedItems.filter(itemId => {
      const item = safeItems.find(i => i.id === itemId);
      return item && item.type === 'skin';
    }).length;
    
    const totalSkins = safeItems.filter(item => item.type === 'skin').length;
    const totalItems = safeItems.length;
    
    setStats({
      totalItems,
      ownedSkins,
      totalSkins,
      completionRate: totalSkins > 0 ? (ownedSkins / totalSkins) * 100 : 0
    });
  }, [ownedItems]);

  // ✅ Previene errores si SHOP_ITEMS no existe o está vacío
  const safeItems = Array.isArray(SHOP_ITEMS) 
    ? SHOP_ITEMS.filter(item => item && item.id)
    : [];

  const filteredItems = (type) =>
    safeItems.filter((item) => item.type === type);

  // 🎯 Obtener estado del item
  const getItemStatus = (item) => {
    if (!item) return { text: "Error", disabled: true };

    // Verificar si el item está en ownedItems
    const isOwned = ownedItems.some(owned => {
      if (typeof owned === 'string') return owned === item.id;
      if (typeof owned === 'object') return owned.id === item.id;
      return false;
    });

    // Para skins
    if (item.type === "skin") {
      if (activeSkin === item.id) {
        return { text: "Equipada", disabled: true };
      }
      if (isOwned) {
        return { text: "Equipar", disabled: false };
      }
    }
    
    // Para items no consumibles
    else if (item.type === "item") {
      if (isOwned) {
        return { text: "Comprado", disabled: true };
      }
    }
    
    // Item no poseído y se puede comprar
    return {
      text: `Comprar (${item.price?.toLocaleString() || 0}💰)`,
      disabled: coins < (item.price || 0),
    };
  };

  // 👁️ Manejar preview de skin
  const handlePreview = (skinId) => {
    setPreviewSkin(skinId);
    playSound("uiClick");
  };

  // 🛒 Manejar compra de item
  const handleBuyItem = (item) => {
    if (!buyShopItem) return;
    
    const status = getItemStatus(item);
    if (status.disabled && item.type !== "consumable") {
      playSound("error");
      return;
    }
    
    if (item.type === "skin" && status.text === "Equipar") {
      if (equipSkin) {
        equipSkin(item.id);
        playSound("equip");
      }
    } else {
      buyShopItem(item.id);
      playSound("buy");
    }
  };

  // 📊 Calcular descuento por colección
  const calculateCollectionDiscount = () => {
    if (stats.totalSkins === 0) return 0;
    return Math.min(20, Math.floor((stats.ownedSkins / stats.totalSkins) * 20));
  };

  // 🎨 Componente de tarjeta de item
  const ItemCard = ({ item, index }) => {
    if (!item) return null;
    
    const status = getItemStatus(item);
    const Icon = item.icon || ShoppingCart;
    const discount = calculateCollectionDiscount();
    const finalPrice = Math.floor(item.price * (1 - discount/100));

    return (
      <motion.div
        className="stats-card rounded-xl p-4 flex flex-col justify-between hover-lift transition-all duration-200 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.03 }}
      >
        {/* 🎯 Estado de equipado/comprado */}
        {status.text === "Equipada" && (
          <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Equipada</span>
          </div>
        )}

        {status.text === "Comprado" && (
          <div className="absolute top-2 left-2 bg-yellow-500/90 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Comprado</span>
          </div>
        )}

        <div>
          {/* 🖼️ Icono y header */}
          <div className="flex items-center mb-3">
            <div className={`p-3 rounded-lg mr-3 ${
              item.type === "skin" ? "bg-purple-500/20" :
              item.type === "item" ? "bg-yellow-500/20" :
              "bg-blue-500/20"
            }`}>
              <Icon className={`w-8 h-8 ${
                item.type === "skin" ? "text-purple-400" :
                item.type === "item" ? "text-yellow-400" :
                "text-blue-400"
              }`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">{item.name}</h3>
                {item.rarity && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.rarity === "legendary" ? "bg-yellow-900/30 text-yellow-400" :
                    item.rarity === "epic" ? "bg-purple-900/30 text-purple-400" :
                    item.rarity === "rare" ? "bg-blue-900/30 text-blue-400" :
                    "bg-gray-900/30 text-gray-400"
                  }`}>
                    {item.rarity}
                  </span>
                )}
              </div>
              
              {/* 📊 Información de precio */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-2">
                  {discount > 0 ? (
                    <>
                      <span className="text-sm line-through text-gray-400">
                        {item.price?.toLocaleString() || 0}💰
                      </span>
                      <span className="text-lg font-bold text-green-400">
                        {finalPrice.toLocaleString()}💰
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-yellow-400">
                      {item.price?.toLocaleString() || 0}💰
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 📝 Descripción */}
          <p className="text-xs text-muted-foreground mb-3 min-h-[40px]">
            {item.description}
          </p>
        </div>

        {/* 🎮 Botones de acción */}
        <div className="flex gap-2 mt-2">
          {/* Botón de preview para skins */}
          {item.type === "skin" && (
            <Button
              onClick={() => handlePreview(item.id)}
              variant="outline"
              size="sm"
              className="flex-1 mobile-button"
            >
              <Eye className="w-4 h-4 mr-1" /> Preview
            </Button>
          )}

          {/* Botón principal */}
          <Button
            onClick={() => handleBuyItem(item)}
            disabled={status.disabled && item.type !== "consumable"}
            className={`flex-1 mobile-button font-semibold ${
              status.disabled && item.type !== "consumable" 
                ? "bg-gray-600 cursor-not-allowed" 
                : status.text === "Equipar" ? "bg-blue-600" : "bg-primary"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {status.text === "Equipar" && <Palette className="w-4 h-4" />}
              {status.text === "Comprar" && <ShoppingCart className="w-4 h-4" />}
              <span>{status.text}</span>
            </div>
          </Button>
        </div>
      </motion.div>
    );
  };

  // 🎭 Obtener datos de la skin en preview
  const previewSkinData = safeItems.find((i) => i.id === previewSkin) || 
    safeItems.find((i) => i.id === activeSkin) ||
    safeItems.find((i) => i.type === "skin");
  
  const previewImage = previewSkinData?.image || 
    `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${previewSkin || activeSkin || "default"}`;

  // 🎯 Renderizar pestaña actual
  const renderTabContent = () => {
    const items = filteredItems(selectedTab);
    
    if (items.length === 0) {
      return (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Package className="w-20 h-20 mx-auto text-gray-500 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            No hay {selectedTab} disponibles
          </h3>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <ItemCard 
            key={item.id} 
            item={item} 
            index={index}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-7xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text">
            <ShoppingBag className="w-8 h-8 mr-3 inline text-pink-400" /> 
            Tienda del Pantano
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Personaliza tu cocodrilo y potencia tu juego
          </p>
        </motion.div>

        {/* 💰 Saldo y estadísticas */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">
                  {coins.toLocaleString("es-AR")} 💰
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Saldo actual</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-5 h-5 mr-2 text-purple-400" />
                <span className="text-lg font-bold text-purple-400">
                  {stats.ownedSkins}/{stats.totalSkins}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Skins</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-lg font-bold text-blue-400">
                  {calculateCollectionDiscount()}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Descuento</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                <span className="text-lg font-bold text-green-400">
                  {stats.totalItems}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Ítems</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🎨 Panel izquierdo - Preview */}
          <div className="lg:col-span-1 space-y-6">
            {/* 🐊 Preview de skin */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-blue-400" />
                Vista Previa
              </h3>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <img
                    src={previewImage}
                    alt="Skin Preview"
                    className="w-48 h-48 rounded-full border-4 border-primary/60 shadow-2xl bg-card/80 p-3"
                  />
                  
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {previewSkinData?.name || "Skin por defecto"}
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  {previewSkinData && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {previewSkinData.description}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* 🛍️ Panel derecho - Catálogo */}
          <div className="lg:col-span-2">
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* 🔖 Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: "skins", label: "Skins", icon: Palette },
                  { id: "items", label: "Ítems", icon: Gem },
                  { id: "consumables", label: "Consumibles", icon: Zap },
                ].map(tab => (
                  <Button
                    key={tab.id}
                    onClick={() => {
                      setSelectedTab(tab.id);
                      playSound("uiClick");
                    }}
                    variant={selectedTab === tab.id ? "default" : "outline"}
                    className="flex items-center gap-2"
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* 📦 Contenido de la pestaña */}
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}