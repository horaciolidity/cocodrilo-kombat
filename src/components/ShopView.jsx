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
  Info,
  Star,
  DollarSign,
  Users
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
    
    // Si está deshabilitado y no es consumible, no hacer nada
    if (status.disabled && item.type !== "consumable") {
      playSound("error");
      return;
    }
    
    // Si es skin y ya está comprada, equiparla
    if (item.type === "skin" && status.text === "Equipar") {
      if (equipSkin) {
        equipSkin(item.id);
        playSound("equip");
      }
    } else {
      // Comprar el item
      buyShopItem(item.id);
      playSound("buy");
    }
  };

  // 📊 Calcular descuento por colección
  const calculateCollectionDiscount = () => {
    if (stats.totalSkins === 0) return 0;
    return Math.min(20, Math.floor((stats.ownedSkins / stats.totalSkins) * 20));
  };

  // 🎨 Componente de tarjeta de item MEJORADO
  const ItemCard = ({ item, index }) => {
    if (!item) return null;
    
    const status = getItemStatus(item);
    const Icon = item.icon || ShoppingCart;
    const discount = calculateCollectionDiscount();
    const finalPrice = Math.floor(item.price * (1 - discount/100));
    const isSkin = item.type === "skin";

    return (
      <motion.div
        className={`stats-card rounded-xl overflow-hidden flex flex-col hover-lift transition-all duration-200 relative ${
          isSkin ? "border-2 border-purple-500/30" : ""
        }`}
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

        {/* 🖼️ Imagen de portada para skins */}
        {isSkin && item.image && (
          <div className="relative h-32 md:h-40 overflow-hidden bg-gradient-to-br from-purple-900/30 to-pink-900/30">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${item.id}`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Etiqueta de skin */}
            <div className="absolute top-2 right-2 bg-purple-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Palette className="w-3 h-3" />
              <span>Skin</span>
            </div>
          </div>
        )}

        <div className="p-4 flex flex-col justify-between flex-1">
          {/* 🎨 Icono y header */}
          <div className="flex items-start mb-3">
            {!isSkin && (
              <div className={`p-2 rounded-lg mr-3 ${
                item.type === "item" ? "bg-yellow-500/20" :
                "bg-blue-500/20"
              }`}>
                <Icon className={`w-6 h-6 ${
                  item.type === "item" ? "text-yellow-400" :
                  "text-blue-400"
                }`} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-bold truncate ${isSkin ? 'text-lg' : 'text-md'}`}>
                  {item.name}
                </h3>
                
                {/* Rarity badge para skins */}
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
                
                {/* 🔥 Efecto especial para skins */}
                {isSkin && (
                  <div className="flex items-center gap-1 text-xs text-purple-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Exclusivo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 📝 Descripción */}
          <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
            {item.description}
          </p>

          {/* 🎮 Botones de acción */}
          <div className="flex gap-2 mt-auto">
            {/* Botón de preview para skins */}
            {isSkin && (
              <Button
                onClick={() => handlePreview(item.id)}
                variant="outline"
                size="sm"
                className="flex-1 mobile-button border-purple-600 text-purple-400 hover:bg-purple-600/20"
              >
                <Eye className="w-4 h-4 mr-1" /> Vista Previa
              </Button>
            )}

            {/* Botón principal */}
            <Button
              onClick={() => handleBuyItem(item)}
              disabled={status.disabled && item.type !== "consumable"}
              className={`flex-1 mobile-button font-semibold ${
                status.disabled && item.type !== "consumable" 
                  ? "bg-gray-600 cursor-not-allowed" 
                  : status.text === "Equipar" 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    : "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {status.text === "Equipar" && <Palette className="w-4 h-4" />}
                {status.text === "Comprar" && <ShoppingCart className="w-4 h-4" />}
                <span className="text-sm">{status.text}</span>
              </div>
            </Button>
          </div>
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
          <p className="text-muted-foreground">
            Vuelve más tarde para ver nuevos productos
          </p>
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
            Tienda del Pantano 🐊
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Personaliza tu cocodrilo, potencia tu juego y colecciona items exclusivos
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
            <div className="stats-card rounded-xl p-4 text-center hover-lift">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">
                  {coins.toLocaleString("es-AR")} 💰
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Saldo disponible</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center hover-lift">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-5 h-5 mr-2 text-purple-400" />
                <span className="text-lg font-bold text-purple-400">
                  {stats.ownedSkins}/{stats.totalSkins}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Skins coleccionadas</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center hover-lift">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-5 h-5 mr-2 text-blue-400" />
                <span className="text-lg font-bold text-blue-400">
                  {calculateCollectionDiscount()}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Descuento por colección</p>
            </div>
            
            <div className="stats-card rounded-xl p-4 text-center hover-lift">
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
          {/* 🎨 Panel izquierdo - Preview y Estadísticas */}
          <div className="lg:col-span-1 space-y-6">
            {/* 🐊 Preview de skin */}
            <motion.div 
              className="stats-card rounded-xl p-6 hover-lift"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Eye className="w-6 h-6 mr-2 text-blue-400" />
                Vista Previa de Skin
              </h3>
              
              <div className="flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-64 h-64 rounded-full border-4 border-primary/60 shadow-2xl bg-card/80 p-4 overflow-hidden flex items-center justify-center">
                    <img
                      src={previewImage}
                      alt="Skin Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${previewSkin || "croc"}`;
                      }}
                    />
                  </div>
                  
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {previewSkinData?.name || "Skin por defecto"}
                  </div>
                </div>
                
                <div className="text-center space-y-3 w-full">
                  {previewSkinData && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {previewSkinData.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <div className="text-xs text-primary/80 mb-1">Tipo</div>
                          <div className="font-semibold text-primary">Skin</div>
                        </div>
                        <div className="bg-purple-500/10 p-3 rounded-lg">
                          <div className="text-xs text-purple-400/80 mb-1">Precio</div>
                          <div className="font-semibold text-purple-400">
                            {previewSkinData.price?.toLocaleString() || "0"} 💰
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 📊 Estadísticas de colección */}
            {selectedTab === "skins" && (
              <motion.div 
                className="stats-card rounded-xl p-6 hover-lift"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
                  Tu Colección
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progreso de skins</span>
                      <span className="font-semibold text-green-400">
                        {stats.ownedSkins}/{stats.totalSkins}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-900/20 to-emerald-800/20 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-300">Descuento activo:</span>
                      <span className="font-bold text-green-400 text-lg">
                        {calculateCollectionDiscount()}%
                      </span>
                    </div>
                    <p className="text-xs text-green-300/70 mt-1">
                      Por cada skin que colecciones, obtienes un descuento adicional
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
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
                  <Button
                    key={tab.id}
                    onClick={() => {
                      setSelectedTab(tab.id);
                      playSound("uiClick");
                    }}
                    variant={selectedTab === tab.id ? "default" : "outline"}
                    className={`flex items-center gap-2 ${
                      selectedTab === tab.id 
                        ? `bg-${tab.color}-600 hover:bg-${tab.color}-700` 
                        : ""
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === "skins" && stats.totalSkins > 0 && (
                      <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
                        {stats.totalSkins}
                      </span>
                    )}
                  </Button>
                ))}
              </div>

              {/* 📊 Información de la categoría */}
              <div className="mb-6 p-4 bg-gradient-to-r from-gray-800/30 to-gray-900/30 rounded-xl border border-gray-700/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">
                      {selectedTab === "skins" && "🎨 Skins Exclusivas"}
                      {selectedTab === "items" && "🛡️ Ítems de Potencia"}
                      {selectedTab === "consumables" && "⚡ Consumibles"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTab === "skins" && "Personaliza la apariencia de tu cocodrilo"}
                      {selectedTab === "items" && "Mejoras permanentes para tu juego"}
                      {selectedTab === "consumables" && "Boosters temporales para potenciar tu farmeo"}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Saldo disponible</div>
                    <div className="text-lg font-bold text-yellow-400 flex items-center">
                      <Coins className="w-4 h-4 mr-1" />
                      {coins.toLocaleString()} 💰
                    </div>
                  </div>
                </div>
              </div>

              {/* 📦 Contenido de la pestaña */}
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* 🔥 Banner de promoción */}
      <motion.div 
        className="mt-12 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-600/30 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <div className="text-left">
              <h4 className="font-bold text-purple-300">🎯 Consejo de Compra</h4>
              <p className="text-sm text-purple-200/80">
                Las skins no solo cambian la apariencia, ¡también aumentan tu moral de juego!
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setSelectedTab("skins");
              playSound("uiClick");
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Palette className="w-4 h-4 mr-2" />
            Ver todas las skins
          </Button>
        </div>
      </motion.div>
    </div>
  );
}