import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  DollarSign,
  ShoppingBag,
  Package,
  Gift,
  AlertCircle,
  TrendingUp,
  Bolt,
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
  const [hoveredItem, setHoveredItem] = useState(null);
  const [justPurchased, setJustPurchased] = useState(null);
  const [stats, setStats] = useState({
    totalItems: 0,
    ownedSkins: 0,
    totalSkins: 0,
    totalValue: 0
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
    const totalValue = safeItems.reduce((sum, item) => sum + (item.price || 0), 0);
    
    setStats({
      totalItems,
      ownedSkins,
      totalSkins,
      totalValue,
      completionRate: totalSkins > 0 ? (ownedSkins / totalSkins) * 100 : 0
    });
  }, [ownedItems]);

  // ✅ Previene errores si SHOP_ITEMS no existe o está vacío
  const safeItems = Array.isArray(SHOP_ITEMS) 
    ? SHOP_ITEMS.filter(item => item && item.id)
    : [];

  const filteredItems = (type) =>
    safeItems.filter((item) => item.type === type);

  // 🎯 Obtener estado del item - OPTIMIZADO
  const getItemStatus = (item) => {
    if (!item) return { text: "Error", disabled: true, variant: "outline" };

    // Verificar si el item está en ownedItems (maneja tanto strings como objetos)
    const isOwned = ownedItems.some(owned => {
      if (typeof owned === 'string') return owned === item.id;
      if (typeof owned === 'object') return owned.id === item.id;
      return false;
    });

    // Para skins
    if (item.type === "skin") {
      if (activeSkin === item.id) {
        return { 
          text: "Equipada", 
          disabled: true, 
          variant: "outline",
          color: "text-green-400",
          bgColor: "bg-green-900/30",
          icon: Check
        };
      }
      if (isOwned) {
        return { 
          text: "Equipar", 
          disabled: false, 
          variant: "default",
          color: "text-blue-400",
          bgColor: "bg-blue-600",
          icon: Palette
        };
      }
    }
    
    // Para items no consumibles
    else if (item.type === "item") {
      if (isOwned) {
        return { 
          text: "Comprado", 
          disabled: true, 
          variant: "outline",
          color: "text-yellow-400",
          bgColor: "bg-yellow-900/30",
          icon: Check
        };
      }
    }
    
    // Para consumibles (siempre se pueden comprar más)
    else if (item.type === "consumable") {
      // Obtener cantidad actual si existe
      const ownedConsumable = ownedItems.find(owned => 
        typeof owned === 'object' && owned.id === item.id
      );
      const quantity = ownedConsumable?.quantity || 0;
      
      return { 
        text: `Comprar (${item.price?.toLocaleString() || 0}💰)`,
        textAfter: quantity > 0 ? `x${quantity}` : null,
        disabled: coins < (item.price || 0),
        variant: "default",
        color: coins >= (item.price || 0) ? "text-emerald-400" : "text-red-400",
        bgColor: coins >= (item.price || 0) ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-600 cursor-not-allowed",
        icon: ShoppingCart,
        hasQuantity: quantity > 0
      };
    }

    // Item no poseído y se puede comprar
    return {
      text: `Comprar (${item.price?.toLocaleString() || 0}💰)`,
      disabled: coins < (item.price || 0),
      variant: "default",
      color: coins >= (item.price || 0) ? "text-primary" : "text-red-400",
      bgColor: coins >= (item.price || 0) ? "bg-primary hover:bg-primary/90" : "bg-gray-600 cursor-not-allowed",
      icon: ShoppingCart
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
      setJustPurchased(item.id);
      setTimeout(() => setJustPurchased(null), 2000);
      playSound("buy");
    }
  };

  // 📊 Calcular descuento por colección
  const calculateCollectionDiscount = () => {
    if (stats.totalSkins === 0) return 0;
    const percentage = Math.min(20, Math.floor((stats.ownedSkins / stats.totalSkins) * 20));
    return percentage;
  };

  // 🎨 Componente de tarjeta de item
  const ItemCard = ({ item, index }) => {
    if (!item) return null;
    
    const status = getItemStatus(item);
    const Icon = item.icon || ShoppingCart;
    const isNew = index < 3 && item.type === "skin"; // Marcar skins recientes como "nuevas"
    const discount = calculateCollectionDiscount();
    const finalPrice = Math.floor(item.price * (1 - discount/100));

    return (
      <motion.div
        className={`stats-card rounded-xl p-4 flex flex-col justify-between hover-lift transition-all duration-200 relative overflow-hidden ${
          justPurchased === item.id ? "ring-2 ring-yellow-400 ring-offset-2" : ""
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.03 }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* 🔥 Indicador de "Nuevo" */}
        {isNew && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg rotate-12 z-10 shadow-lg">
            ¡NUEVO!
          </div>
        )}

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

        {/* 🔮 Efecto de brillo para items legendarios */}
        {item.rarity === "legendary" && (
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-orange-400/5 to-yellow-400/10 rounded-xl"
            animate={{
              x: ["0%", "100%", "0%"],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "linear"
            }}
          />
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
                      <span className="text-xs bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded">
                        -{discount}%
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-yellow-400">
                      {item.price?.toLocaleString() || 0}💰
                    </span>
                  )}
                </div>
                
                {/* Cantidad para consumibles */}
                {status.hasQuantity && (
                  <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-full">
                    x{status.textAfter}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 📝 Descripción */}
          <p className="text-xs text-muted-foreground mb-3 min-h-[40px]">
            {item.description}
          </p>

          {/* ⚡ Efecto del item */}
          {item.effect && (
            <div className="mb-3 p-2 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded border border-gray-700/30">
              <div className="flex items-center gap-2 text-xs">
                <Zap className="w-3 h-3 text-yellow-400" />
                <span className="font-semibold text-yellow-300">Efecto:</span>
                <span className="text-gray-300">
                  {item.effect.type === "click_boost" && `+${item.effect.value} monedas por clic`}
                  {item.effect.type === "cps_boost" && `+${item.effect.value} monedas por segundo`}
                  {item.effect.type === "energy_fill" && `+${item.effect.value} de energía`}
                  {item.effect.type === "lucky_chance" && `${item.effect.value}% de probabilidad de doble moneda`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 🎮 Botones de acción */}
        <div className="flex gap-2 mt-2">
          {/* Botón de preview para skins */}
          {item.type === "skin" && (
            <Button
              onClick={() => handlePreview(item.id)}
              variant="outline"
              size="sm"
              className="flex-1 mobile-button border-border hover:bg-gray-800/50"
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
                : status.bgColor || "bg-primary hover:bg-primary/90"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {status.icon && <status.icon className="w-4 h-4" />}
              <span>{status.text}</span>
              {status.textAfter && item.type !== "consumable" && (
                <span className="text-xs opacity-80 ml-1">{status.textAfter}</span>
              )}
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
          <p className="text-gray-500 max-w-md mx-auto">
            Vuelve más tarde para ver nuevos {selectedTab} añadidos a la tienda.
          </p>
        </motion.div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {items.map((item, index) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              index={index}
            />
          ))}
        </AnimatePresence>
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
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 mr-3 text-pink-400" /> 
            Tienda del Pantano
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Personaliza tu cocodrilo y potencia tu juego con skins, ítems y consumibles especiales
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
              <p className="text-xs text-muted-foreground">Skins coleccionadas</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-lg font-bold text-blue-400">
                  {calculateCollectionDiscount()}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Descuento por colección</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                <span className="text-lg font-bold text-green-400">
                  {stats.totalItems}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Ítems en tienda</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🎨 Panel izquierdo - Preview y info */}
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
                    className="w-48 h-48 rounded-full border-4 border-primary/60 shadow-2xl bg-card/80 p-3 backdrop-blur-md transition-all duration-300 hover:scale-105"
                  />
                  
                  {/* Efecto de brillo para skin equipada */}
                  {previewSkin === activeSkin && (
                    <motion.div 
                      className="absolute inset-0 rounded-full border-4 border-yellow-400/50"
                      animate={{ opacity: [0.5, 0.8, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                  
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                    {previewSkinData?.name || "Skin por defecto"}
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  {previewSkinData && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {previewSkinData.description || "Skin personalizada para tu cocodrilo"}
                      </p>
                      
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Palette className="w-4 h-4 text-purple-400" />
                          <span className="text-purple-300">Skin</span>
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-300">
                            {previewSkinData.price?.toLocaleString() || "0"}💰
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                  
                  {previewSkin === activeSkin && (
                    <motion.div 
                      className="mt-3 p-2 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-700/30"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                    >
                      <p className="text-xs text-green-300 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" />
                        Actualmente equipada
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 💡 Consejos de compra */}
            <motion.div 
              className="stats-card rounded-xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Info className="w-6 h-6 mr-2 text-yellow-400" />
                Consejos de Compra
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-2 rounded-lg bg-gradient-to-r from-blue-900/20 to-blue-800/20">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-blue-300">Descuentos por colección</p>
                    <p className="text-xs text-blue-200">
                      Obtén hasta 20% de descuento coleccionando todas las skins.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-2 rounded-lg bg-gradient-to-r from-green-900/20 to-emerald-800/20">
                  <Bolt className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-green-300">Consumibles estratégicos</p>
                    <p className="text-xs text-green-200">
                      Usa consumibles en momentos clave para maximizar tu farmeo.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-2 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-800/20">
                  <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm text-purple-300">Skins limitadas</p>
                    <p className="text-xs text-purple-200">
                      Algunas skins pueden ser edición limitada. ¡No te las pierdas!
                    </p>
                  </div>
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
                  { id: "skins", label: "Skins", icon: Palette, color: "purple" },
                  { id: "items", label: "Ítems", icon: Gem, color: "yellow" },
                  { id: "consumables", label: "Consumibles", icon: Zap, color: "blue" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelectedTab(tab.id);
                      playSound("uiClick");
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-semibold ${
                      selectedTab === tab.id
                        ? `bg-${tab.color}-600 text-white shadow-lg`
                        : "bg-card/60 text-muted-foreground hover:bg-gray-800/50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === "skins" && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {filteredItems("skin").length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 📊 Información de la pestaña */}
              <div className="mb-6 p-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1">
                      {selectedTab === "skins" && "🐊 Skins de Cocodrilo"}
                      {selectedTab === "items" && "✨ Ítens de Potenciación"}
                      {selectedTab === "consumables" && "⚡ Consumibles Energéticos"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTab === "skins" && "Personaliza la apariencia de tu cocodrilo con skins únicas."}
                      {selectedTab === "items" && "Mejora tu rendimiento con ítems permanentes."}
                      {selectedTab === "consumables" && "Usa consumibles para obtener ventajas temporales."}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Mostrando</div>
                    <div className="text-2xl font-bold text-primary">
                      {filteredItems(selectedTab).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* 📦 Contenido de la pestaña */}
              {renderTabContent()}
            </motion.div>
          </div>
        </div>

        {/* 📜 Footer informativo */}
        <motion.div 
          className="mt-8 p-4 bg-gradient-to-r from-gray-900/30 to-gray-800/30 rounded-xl border border-gray-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-sm font-semibold text-yellow-300">Política de reembolsos</p>
                <p className="text-xs text-gray-400">Las compras en la tienda no son reembolsables.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-semibold text-blue-300">Actualizaciones frecuentes</p>
                <p className="text-xs text-gray-400">Nuevos ítems añadidos regularmente.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-pink-400" />
              <div>
                <p className="text-sm font-semibold text-pink-300">Eventos especiales</p>
                <p className="text-xs text-gray-400">Skins exclusivas en eventos temporales.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}