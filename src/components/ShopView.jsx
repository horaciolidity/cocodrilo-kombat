// src/components/ShopView.jsx - VERSIÓN CORREGIDA Y COMPLETA
import React, { useState, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ShoppingCart, Palette, Gem, Zap, Check, Eye,
  Coins, Sparkles, Crown, Shield, Award, ShoppingBag,
  Package, TrendingUp, RefreshCw, Info,
  Star, DollarSign, Users, Ticket, Percent, Clock,
  Gift, Heart, Target, ChevronRight, Flame,
  Battery, Rocket, Shield as ShieldIcon, Swords,
  Trophy, Zap as ZapIcon, Droplets, Sparkles as SparklesIcon,
  Clock as ClockIcon, Target as TargetIcon, Users as UsersIcon,
  Wallet, Layers, Brain, Cpu, Gem as GemIcon
} from "lucide-react";
import { SHOP_ITEMS } from "@/config/gameConfig";
import { useSound } from "@/hooks/useSound";
import { useToast } from "@/hooks/use-toast";

// 🎯 COMPONENTE ItemCard MEMOIZADO
const ItemCard = memo(function ItemCardComponent({ 
  item, 
  index, 
  isDailyOffer = false,
  onPreview,
  onBuyItem,
  onEquipSkin,
  ownedItems,
  activeSkin,
  coins,
  nativeTokenBalance,
  collectionDiscount,
  tokenPrice,
  playSound,
  toast
}) {
  if (!item) return null;
  
  // ✅ Obtener imagen con fallback
  const getItemImage = (item) => {
    if (item.image) return item.image;
    
    // Fallback por tipo
    const seed = item.id;
    switch(item.type) {
      case 'skin':
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=65c9ff,b6e3f4,c0aede,d1d4f9,ffd5dc`;
      case 'item':
        return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`;
      case 'boost':
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=ffd166,ef476f,06d6a0,118ab2`;
      case 'consumable':
        return `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}&backgroundColor=ffd166,ef476f`;
      default:
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
    }
  };

  // ✅ Determinar rareza
  const getRarityColor = useCallback((rarity) => {
    switch(rarity) {
      case 'legendary': return 'from-yellow-600 to-amber-600';
      case 'epic': return 'from-purple-600 to-pink-600';
      case 'rare': return 'from-blue-600 to-cyan-600';
      case 'uncommon': return 'from-green-600 to-emerald-600';
      default: return 'from-gray-600 to-gray-500';
    }
  }, []);

  // ✅ Obtener estado del item
  const getItemStatus = useCallback((item) => {
    const isOwned = ownedItems.some(owned => {
      if (typeof owned === 'string') return owned === item.id;
      if (typeof owned === 'object') return owned.id === item.id;
      return false;
    });

    if (item.type === "skin") {
      if (activeSkin === item.id) return { 
        text: "Equipada", 
        disabled: true,
        isEquipped: true 
      };
      if (isOwned) return { 
        text: "Equipar", 
        disabled: false,
        isOwned: true 
      };
    } else if (item.type === "item" || item.type === "boost") {
      if (isOwned) return { 
        text: "Comprado", 
        disabled: true,
        isOwned: true 
      };
    }
    
    return {
      text: `Comprar`,
      disabled: false,
      isOwned: false,
      price: item.price || 0,
      priceCroc: item.priceCroc || Math.floor((item.price || 0) * 0.1)
    };
  }, [ownedItems, activeSkin]);

  const status = getItemStatus(item);
  const discount = isDailyOffer ? (item.discount || 0) : collectionDiscount;
  const finalPrice = Math.floor((item.price || 0) * (1 - discount/100));
  const finalPriceCroc = Math.floor(((item.priceCroc || Math.floor((item.price || 0) * 0.1)) * (1 - discount/100)));
  const isSkin = item.type === "skin";
  const canAffordCoins = coins >= finalPrice;
  const canAffordCroc = nativeTokenBalance >= finalPriceCroc;

  // ✅ Obtener icono por tipo
  const getTypeIcon = (type) => {
    switch(type) {
      case 'skin': return Palette;
      case 'item': return Gem;
      case 'boost': return Zap;
      case 'consumable': return Gift;
      default: return ShoppingCart;
    }
  };

  const TypeIcon = getTypeIcon(item.type);

  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden flex flex-col hover-lift transition-all duration-300 ${
        isSkin ? "bg-gradient-to-br from-gray-900/50 to-gray-800/50" : "bg-gradient-to-br from-gray-800/50 to-gray-900/50"
      } ${isDailyOffer ? 'border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20' : 'border border-gray-700/30'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {/* 🎯 Estado de equipado/comprado */}
      {status.text === "Equipada" && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-lg">
          <Check className="w-3 h-3" />
          <span>Equipada</span>
        </div>
      )}

      {status.text === "Comprado" && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs px-3 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-lg">
          <Check className="w-3 h-3" />
          <span>Comprado</span>
        </div>
      )}

      {/* 🔥 Oferta diaria badge */}
      {isDailyOffer && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-xs px-3 py-1.5 rounded-full z-10 flex items-center gap-1 shadow-lg animate-pulse">
          <Ticket className="w-3 h-3" />
          <span>-{item.discount || 0}%</span>
        </div>
      )}

      {/* 🖼️ Imagen de portada para skins */}
      {isSkin && (
        <div className="relative pt-8 pb-4 flex items-center justify-center">
          <div className="relative w-48 h-48 rounded-full border-4 border-gradient bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-transparent p-2 shadow-2xl">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/10">
              <img
                src={getItemImage(item)}
                alt={item.name}
                className="w-full h-full object-cover scale-110 hover:scale-125 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${item.id}`;
                }}
              />
            </div>
            
            {/* Efecto de brillo */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none" />
          </div>
          
          {/* Rareza */}
          {item.rarity && (
            <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r ${getRarityColor(item.rarity)} text-white text-xs px-4 py-1 rounded-full shadow-lg`}>
              {item.rarity ? item.rarity.toUpperCase() : 'COMÚN'}
            </div>
          )}
        </div>
      )}

      {/* Para items no skins */}
      {!isSkin && (
        <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
          <img
            src={getItemImage(item)}
            alt={item.name}
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-300"
            onError={(e) => {
              e.target.src = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${item.id}`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Badge de tipo */}
          <div className="absolute top-3 right-3 bg-gray-800/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <TypeIcon className="w-3 h-3" />
            <span className="capitalize">{item.type || 'item'}</span>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col justify-between flex-1">
        {/* 🎨 Información */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className={`font-bold ${isSkin ? 'text-xl' : 'text-lg'} text-white`}>
              {item.name || 'Item sin nombre'}
            </h3>
            
            {/* Nivel requerido */}
            {item.requiredLevel > 1 && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                Nv. {item.requiredLevel}
              </span>
            )}
          </div>
          
          <p className="text-sm text-gray-300 mb-4 min-h-[40px]">
            {item.description || 'Sin descripción disponible'}
          </p>
          
          {/* 📊 Efectos */}
          {item.effect && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(item.effect).map(([key, value]) => {
                let displayText = `+${value}`;
                let displayKey = key;
                
                // Formatear textos de efecto
                switch(key) {
                  case 'clickMultiplier':
                    displayKey = 'Click Power';
                    displayText = `x${value}`;
                    break;
                  case 'cpsBoost':
                    displayKey = 'CPS';
                    displayText = `+${value}`;
                    break;
                  case 'energyRegen':
                    displayKey = 'Energy Regen';
                    displayText = `+${(value-1)*100}%`;
                    break;
                  case 'maxEnergy':
                    displayKey = 'Max Energy';
                    break;
                  case 'coinMultiplier':
                    displayKey = 'Coin Multiplier';
                    displayText = `x${value}`;
                    break;
                }
                
                return (
                  <span key={key} className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded">
                    {displayText} {displayKey}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 💰 Precios */}
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Precio en monedas */}
            <div className={`text-center p-2 rounded-lg ${discount > 0 ? 'bg-yellow-500/10' : 'bg-gray-800/50'} ${!canAffordCoins ? 'opacity-70' : ''}`}>
              <div className="text-xs text-gray-400 mb-1">Monedas</div>
              {discount > 0 ? (
                <>
                  <div className="text-sm line-through text-gray-500">
                    {(item.price || 0).toLocaleString()} 💰
                  </div>
                  <div className={`text-lg font-bold ${canAffordCoins ? 'text-yellow-400' : 'text-red-400'}`}>
                    {finalPrice.toLocaleString()} 💰
                  </div>
                </>
              ) : (
                <div className={`text-lg font-bold ${canAffordCoins ? 'text-yellow-400' : 'text-red-400'}`}>
                  {(item.price || 0).toLocaleString()} 💰
                </div>
              )}
            </div>
            
            {/* Precio en CROC */}
            <div className={`text-center p-2 rounded-lg bg-emerald-500/10 ${!canAffordCroc ? 'opacity-70' : ''}`}>
              <div className="text-xs text-gray-400 mb-1">CROC Tokens</div>
              {discount > 0 ? (
                <>
                  <div className="text-sm line-through text-gray-500">
                    {(item.priceCroc || Math.floor((item.price || 0) * 0.1)).toLocaleString()} 🪙
                  </div>
                  <div className={`text-lg font-bold ${canAffordCroc ? 'text-emerald-400' : 'text-red-400'}`}>
                    {finalPriceCroc.toLocaleString()} 🪙
                  </div>
                </>
              ) : (
                <div className={`text-lg font-bold ${canAffordCroc ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(item.priceCroc || Math.floor((item.price || 0) * 0.1)).toLocaleString()} 🪙
                </div>
              )}
            </div>
          </div>
          
          {/* Descuento */}
          {discount > 0 && (
            <div className="mt-2 text-center">
              <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full">
                🎯 {discount}% DE DESCUENTO
              </span>
            </div>
          )}
        </div>

        {/* 🎮 Botones de acción */}
        <div className="flex flex-col gap-2">
          {/* Botón de preview para skins */}
          {isSkin && (
            <Button
              onClick={() => onPreview(item.id)}
              variant="outline"
              size="sm"
              className="w-full border-purple-600/50 text-purple-400 hover:bg-purple-600/20 hover:text-white"
            >
              <Eye className="w-4 h-4 mr-2" /> Vista Previa
            </Button>
          )}

          {/* Botones de acción principal */}
          {status.text === "Equipar" ? (
            // Botón para equipar skin ya comprada
            <Button
              onClick={() => onEquipSkin(item.id)}
              className="w-full font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Palette className="w-4 h-4 mr-2" />
              Equipar Skin
            </Button>
          ) : status.text === "Comprado" ? (
            // Botón para item ya comprado
            <Button
              disabled
              className="w-full font-semibold bg-gray-700 cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              Ya Comprado
            </Button>
          ) : (
            // Botones de compra
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onBuyItem(item, false, discount)}
                disabled={!canAffordCoins || (status.disabled && item.type !== "consumable")}
                className={`w-full font-semibold ${
                  !canAffordCoins || (status.disabled && item.type !== "consumable")
                    ? "bg-gray-700 cursor-not-allowed" 
                    : "bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
                }`}
              >
                <Coins className="w-4 h-4 mr-2" />
                {item.currency === 'croc' ? 'N/A' : 'Monedas'}
              </Button>
              
              <Button
                onClick={() => onBuyItem(item, true, discount)}
                disabled={!canAffordCroc || (status.disabled && item.type !== "consumable") || item.currency === 'coins'}
                className={`w-full font-semibold ${
                  !canAffordCroc || (status.disabled && item.type !== "consumable") || item.currency === 'coins'
                    ? "bg-gray-700 cursor-not-allowed" 
                    : "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                CROC
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// 🛍️ COMPONENTE PRINCIPAL ShopView
export function ShopView({
  coins = 0,
  nativeTokenBalance = 0,
  ownedItems = [],
  activeSkin,
  buyShopItem,
  equipSkin,
  tokenPrice = 0.05,
  user,
  toast: toastProp,
  playSound: playSoundProp
}) {
  // 🔧 Inicializar hooks y props con fallbacks
  const soundHook = useSound();
  const toastHook = useToast();
  const { playSound: playSoundHook } = soundHook;
  const { toast: toastHookFn } = toastHook;
  
  // Usar props si están disponibles, de lo contrario usar hooks
  const playSound = playSoundProp || playSoundHook;
  const toast = toastProp || toastHookFn;
  
  // 🔍 Validaciones críticas
  if (!buyShopItem || typeof buyShopItem !== 'function') {
    console.error('❌ buyShopItem no está disponible o no es una función');
    return (
      <div className="min-h-screen game-bg p-4 md:p-6 flex items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-2xl font-bold mb-4">⚠️ Error en la tienda</h2>
          <p>La función de compra no está disponible</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Recargar página
          </Button>
        </div>
      </div>
    );
  }
  
  const [selectedTab, setSelectedTab] = useState("skins");
  const [previewSkin, setPreviewSkin] = useState(activeSkin);
  const [showConfirm, setShowConfirm] = useState(null);

  // ✅ CALCULAR ESTADÍSTICAS CON useMemo (SÍNCRONO)
  const stats = useMemo(() => {
    const safeItems = Array.isArray(SHOP_ITEMS) 
      ? SHOP_ITEMS.filter(item => item && item.id)
      : [];
    
    if (safeItems.length === 0) {
      return {
        totalItems: 0,
        ownedSkins: 0,
        totalSkins: 0,
        totalValue: 0,
        dailyOffers: [],
        completionRate: 0
      };
    }
    
    const ownedSkins = ownedItems.filter(itemId => {
      const item = safeItems.find(i => i.id === itemId);
      return item && item.type === 'skin';
    }).length;
    
    const totalSkins = safeItems.filter(item => item.type === 'skin').length;
    const totalItems = safeItems.length;
    
    const totalValue = ownedItems.reduce((sum, itemId) => {
      const item = safeItems.find(i => i.id === itemId);
      return sum + (item?.price || 0);
    }, 0);
    
    // ✅ OFERTAS DIARIAS DETERMINÍSTICAS (cambian una vez al día)
    const dayOfYear = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const seed = dayOfYear;
    
    // Generador pseudoaleatorio determinístico
    const seededRandom = (index) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    const dailyOffers = safeItems
      .filter(item => item.type === 'skin' || item.type === 'item')
      .sort((a, b) => {
        const indexA = safeItems.findIndex(i => i.id === a.id);
        const indexB = safeItems.findIndex(i => i.id === b.id);
        return seededRandom(indexA) - seededRandom(indexB);
      })
      .slice(0, 3)
      .map((item, index) => ({
        ...item,
        discount: Math.floor(seededRandom(index) * 30) + 10, // 10-40% descuento
        expiresIn: 24
      }));
    
    return {
      totalItems,
      ownedSkins,
      totalSkins,
      totalValue,
      dailyOffers,
      completionRate: totalSkins > 0 ? (ownedSkins / totalSkins) * 100 : 0
    };
  }, [ownedItems]);

  const safeItems = useMemo(() => 
    Array.isArray(SHOP_ITEMS) 
      ? SHOP_ITEMS.filter(item => item && item.id)
      : []
  , []);

  const collectionDiscount = useMemo(() => {
    if (stats.totalSkins === 0) return 0;
    const baseDiscount = Math.floor((stats.ownedSkins / stats.totalSkins) * 25);
    return Math.min(25, baseDiscount);
  }, [stats.ownedSkins, stats.totalSkins]);

  const filteredItems = useMemo(() => {
    if (selectedTab === "all") return safeItems;
    if (selectedTab === "items") {
      return safeItems.filter(item => item.type === 'item' || item.type === 'boost');
    }
    return safeItems.filter((item) => item.type === selectedTab);
  }, [selectedTab, safeItems]);

  // 🎭 Obtener datos de la skin en preview
  const previewSkinData = useMemo(() => 
    safeItems.find((i) => i.id === previewSkin) || 
    safeItems.find((i) => i.id === activeSkin) ||
    safeItems.find((i) => i.type === "skin")
  , [previewSkin, activeSkin, safeItems]);
  
  const getItemImage = (item) => {
    if (item?.image) return item.image;
    return `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${item?.id || "croc"}`;
  };

  const previewImage = useMemo(() => 
    getItemImage(previewSkinData)
  , [previewSkinData]);

  // ✅ FUNCIONES MEMOIZADAS
  const memoizedHandlePreview = useCallback((skinId) => {
    setPreviewSkin(skinId);
    if (playSound) playSound("uiClick");
    
    const skin = safeItems.find(i => i.id === skinId);
    if (skin && toast) {
      toast({
        title: `👁️ Vista Previa: ${skin.name}`,
        description: skin.description,
        duration: 3000,
      });
    }
  }, [playSound, toast, safeItems]);

  const memoizedHandleBuyItem = useCallback((item, useCroc = false, discount = 0) => {
    if (!buyShopItem) return;
    
    // Verificar saldo rápidamente
    const basePrice = useCroc 
      ? (item.priceCroc || Math.floor((item.price || 0) * 0.1))
      : (item.price || 0);
    
    const finalPrice = Math.floor(basePrice * (1 - discount / 100));
    const balance = useCroc ? nativeTokenBalance : coins;
    
    if (balance < finalPrice) {
      const needed = finalPrice - balance;
      const currencyName = useCroc ? 'CROC' : 'monedas';
      
      if (toast) {
        toast({ 
          title: `💰 ${currencyName} Insuficientes`, 
          description: `Necesitas ${needed} ${currencyName} más para "${item.name}".`, 
          duration: 3000 
        });
      }
      if (playSound) playSound("error");
      return;
    }

    // Mostrar confirmación para items costosos
    if (finalPrice > 10000 || (useCroc && finalPrice > 500)) {
      setShowConfirm({ item, useCroc, price: finalPrice, discount });
      if (playSound) playSound("uiClick");
      return;
    }

    // Comprar directamente
    buyShopItem(item.id, useCroc, discount);
  }, [buyShopItem, coins, nativeTokenBalance, playSound, toast]);

  const memoizedHandleEquipSkin = useCallback((skinId) => {
    if (equipSkin) {
      equipSkin(skinId);
      if (playSound) playSound("equip");
      if (toast) {
        toast({
          title: "🎨 Skin Equipada",
          description: "¡Skin cambiada exitosamente!",
          duration: 3000
        });
      }
    }
  }, [equipSkin, playSound, toast]);

  const confirmPurchase = useCallback(() => {
    if (!showConfirm || !buyShopItem) return;
    
    const { item, useCroc, discount } = showConfirm;
    
    try {
      buyShopItem(item.id, useCroc, discount);
      
      if (toast) {
        toast({ 
          title: "🎉 ¡Compra Exitosa!", 
          description: `Has adquirido "${item.name}" por ${showConfirm.price} ${useCroc ? 'CROC' : 'monedas'}${discount > 0 ? ` (${discount}% descuento)` : ''}`,
          duration: 4000 
        });
      }
      
      if (playSound) playSound("buy");
      setShowConfirm(null);
      
    } catch (error) {
      console.error('❌ Error en confirmPurchase:', error);
      if (toast) {
        toast({
          title: "❌ Error en la compra",
          description: "No se pudo completar la transacción. Intenta nuevamente.",
          duration: 3000,
        });
      }
      if (playSound) playSound("error");
    }
  }, [showConfirm, buyShopItem, toast, playSound]);

  // 🎯 Renderizar pestaña actual
  const renderTabContent = useCallback(() => {
    const items = filteredItems;
    
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => (
          <ItemCard 
            key={item.id} 
            item={item} 
            index={index}
            isDailyOffer={stats.dailyOffers.some(offer => offer.id === item.id)}
            onPreview={memoizedHandlePreview}
            onBuyItem={memoizedHandleBuyItem}
            onEquipSkin={memoizedHandleEquipSkin}
            ownedItems={ownedItems}
            activeSkin={activeSkin}
            coins={coins}
            nativeTokenBalance={nativeTokenBalance}
            collectionDiscount={collectionDiscount}
            tokenPrice={tokenPrice}
            playSound={playSound}
            toast={toast}
          />
        ))}
      </div>
    );
  }, [filteredItems, selectedTab, stats.dailyOffers, memoizedHandlePreview, 
      memoizedHandleBuyItem, memoizedHandleEquipSkin, ownedItems, activeSkin, 
      coins, nativeTokenBalance, collectionDiscount, tokenPrice, playSound, toast]);

  return (
    <div className="min-h-screen game-bg p-4 md:p-6">
      {/* Modal de confirmación */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(null)}
          >
            <motion.div 
              className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-white">🔐 Confirmar Compra</h3>
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas comprar <strong>{showConfirm.item.name}</strong> por 
                <span className={`font-bold ml-1 ${showConfirm.useCroc ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {showConfirm.price} {showConfirm.useCroc ? 'CROC' : 'monedas'}?
                </span>
                {showConfirm.discount > 0 && (
                  <div className="mt-2 text-sm text-green-400">
                    🎯 Ahorras {Math.floor((showConfirm.price / (1 - showConfirm.discount/100) - showConfirm.price))} {showConfirm.useCroc ? 'CROC' : 'monedas'} ({showConfirm.discount}% descuento)
                  </div>
                )}
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setShowConfirm(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmPurchase}
                  className={`flex-1 ${showConfirm.useCroc ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}
                >
                  Confirmar Compra
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            🛍️ TIENDA DEL PANTANO
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="stats-card rounded-xl p-5 text-center hover-lift bg-gradient-to-br from-yellow-900/30 to-amber-800/30 border border-yellow-700/30">
              <div className="flex items-center justify-center mb-2">
                <Coins className="w-6 h-6 mr-2 text-yellow-400" />
                <span className="text-xl font-bold text-yellow-400">
                  {coins.toLocaleString("es-AR")} 💰
                </span>
              </div>
              <p className="text-sm text-yellow-200/70">Saldo en monedas</p>
            </div>

            <div className="stats-card rounded-xl p-5 text-center hover-lift bg-gradient-to-br from-emerald-900/30 to-green-800/30 border border-emerald-700/30">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-6 h-6 mr-2 text-emerald-400" />
                <span className="text-xl font-bold text-emerald-400">
                  {nativeTokenBalance.toLocaleString("es-AR")} 🪙
                </span>
              </div>
              <p className="text-sm text-emerald-200/70">Saldo en CROC</p>
              <p className="text-xs text-emerald-300/50 mt-1">
                ≈ ${((nativeTokenBalance || 0) * tokenPrice).toFixed(2)} USD
              </p>
            </div>
            
            <div className="stats-card rounded-xl p-5 text-center hover-lift bg-gradient-to-br from-purple-900/30 to-pink-800/30 border border-purple-700/30">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 mr-2 text-purple-400" />
                <span className="text-xl font-bold text-purple-400">
                  {stats.ownedSkins}/{stats.totalSkins}
                </span>
              </div>
              <p className="text-sm text-purple-200/70">Skins coleccionadas</p>
              <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
            
            <div className="stats-card rounded-xl p-5 text-center hover-lift bg-gradient-to-br from-blue-900/30 to-cyan-800/30 border border-blue-700/30">
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 mr-2 text-blue-400" />
                <span className="text-xl font-bold text-blue-400">
                  {collectionDiscount}%
                </span>
              </div>
              <p className="text-sm text-blue-200/70">Descuento por colección</p>
              <p className="text-xs text-blue-300/50 mt-1">
                Ahorra en tu próxima compra
              </p>
            </div>
          </div>
        </motion.div>

        {/* 🔥 OFERTAS DIARIAS */}
        {stats.dailyOffers.length > 0 && (
          <motion.div 
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg">
                  <Ticket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">🔥 OFERTAS DIARIAS</h3>
                  <p className="text-sm text-gray-400">Descuentos exclusivos por tiempo limitado</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">24h restantes</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.dailyOffers.map((item, index) => (
                <ItemCard 
                  key={`daily-${item.id}`}
                  item={item} 
                  index={index}
                  isDailyOffer={true}
                  onPreview={memoizedHandlePreview}
                  onBuyItem={memoizedHandleBuyItem}
                  onEquipSkin={memoizedHandleEquipSkin}
                  ownedItems={ownedItems}
                  activeSkin={activeSkin}
                  coins={coins}
                  nativeTokenBalance={nativeTokenBalance}
                  collectionDiscount={collectionDiscount}
                  tokenPrice={tokenPrice}
                  playSound={playSound}
                  toast={toast}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 🎨 Panel izquierdo - Preview y Estadísticas */}
          <div className="lg:col-span-1 space-y-6">
            {/* 🐊 Preview de skin */}
            <motion.div 
              className="stats-card rounded-2xl p-6 hover-lift bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-white">
                <Eye className="w-6 h-6 mr-3 text-blue-400" />
                Vista Previa
              </h3>
              
              <div className="flex flex-col items-center">
                {/* BORDE OVALADO PARA LA SKIN */}
                <div className="relative mb-6">
                  <div className="w-48 h-48 rounded-full border-4 border-gradient bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-transparent p-3 shadow-2xl">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20">
                      <img
                        src={previewImage}
                        alt="Skin Preview"
                        className="w-full h-full object-cover scale-110"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${previewSkin || "croc"}`;
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    {previewSkinData?.name || "Skin por defecto"}
                  </div>
                </div>
                
                <div className="text-center space-y-3 w-full">
                  {previewSkinData && (
                    <>
                      <p className="text-sm text-gray-300">
                        {previewSkinData.description || "Sin descripción"}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/30">
                          <div className="text-xs text-gray-400 mb-1">Tipo</div>
                          <div className="font-semibold text-primary">Skin</div>
                        </div>
                        <div className="bg-purple-900/30 p-3 rounded-lg border border-purple-700/30">
                          <div className="text-xs text-purple-400 mb-1">Precio</div>
                          <div className="font-semibold text-purple-400">
                            {(previewSkinData.price || 0).toLocaleString()} 💰
                          </div>
                        </div>
                      </div>
                      
                      {/* Botón de equipar si ya está comprada */}
                      {ownedItems.includes(previewSkin) && activeSkin !== previewSkin && (
                        <Button
                          onClick={() => memoizedHandleEquipSkin(previewSkin)}
                          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Palette className="w-4 h-4 mr-2" />
                          Equipar esta skin
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 📊 Estadísticas de colección */}
            <motion.div 
              className="stats-card rounded-2xl p-6 hover-lift bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/30"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center text-white">
                <TrendingUp className="w-6 h-6 mr-3 text-green-400" />
                Tu Colección
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progreso de skins</span>
                    <span className="font-semibold text-green-400">
                      {stats.ownedSkins}/{stats.totalSkins}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-900/30 to-emerald-800/30 p-4 rounded-xl border border-green-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-green-300">Descuento activo:</span>
                    <span className="font-bold text-green-400 text-xl">
                      {collectionDiscount}%
                    </span>
                  </div>
                  <p className="text-xs text-green-300/70">
                    Por cada skin que colecciones, obtienes un descuento adicional en todas tus compras
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-900/30 to-cyan-800/30 p-4 rounded-xl border border-blue-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-300">Valor total:</span>
                    <span className="font-bold text-blue-400 text-xl">
                      {stats.totalValue.toLocaleString()} 💰
                    </span>
                  </div>
                  <p className="text-xs text-blue-300/70">
                    Valor aproximado de tu colección
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 🛍️ Panel derecho - Catálogo */}
          <div className="lg:col-span-3">
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* 🔖 Tabs */}
              <div className="flex flex-wrap gap-3 mb-8">
                {[
                  { id: "skins", label: "🎨 Skins", icon: Palette, color: "purple", count: stats.totalSkins },
                  { id: "items", label: "💎 Ítems", icon: Gem, color: "yellow" },
                  { id: "boosts", label: "⚡ Boosts", icon: Zap, color: "blue" },
                  { id: "consumables", label: "🧪 Consumibles", icon: Gift, color: "green" },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = selectedTab === tab.id;
                  return (
                    <Button
                      key={tab.id}
                      onClick={() => {
                        setSelectedTab(tab.id);
                        if (playSound) playSound("uiClick");
                      }}
                      variant={isActive ? "default" : "outline"}
                      className={`flex items-center gap-3 px-6 py-3 text-lg font-semibold rounded-xl ${
                        isActive 
                          ? `bg-gradient-to-r from-${tab.color}-600 to-${tab.color}-700 border-${tab.color}-600` 
                          : `border-gray-700 hover:border-${tab.color}-500 hover:bg-${tab.color}-900/20`
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          isActive ? 'bg-white/30' : 'bg-gray-800'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* 📊 Información de la categoría */}
              <div className="mb-8 p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700/30">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {selectedTab === "skins" && "🎨 Skins Exclusivas"}
                      {selectedTab === "items" && "💎 Ítems de Potencia"}
                      {selectedTab === "boosts" && "⚡ Boosts Temporales"}
                      {selectedTab === "consumables" && "🧪 Consumibles"}
                    </h3>
                    <p className="text-gray-300">
                      {selectedTab === "skins" && "Personaliza la apariencia de tu cocodrilo con skins únicas"}
                      {selectedTab === "items" && "Mejoras permanentes para potenciar tu juego"}
                      {selectedTab === "boosts" && "Boosters temporales para maximizar tus ganancias"}
                      {selectedTab === "consumables" && "Ítens consumibles para ayudarte en tu aventura"}
                    </p>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <div className="text-sm text-gray-400 mb-1">Saldo disponible</div>
                    <div className="text-2xl font-bold text-yellow-400 flex items-center gap-4">
                      <div className="flex items-center">
                        <Coins className="w-5 h-5 mr-2" />
                        {coins.toLocaleString()} 💰
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        {nativeTokenBalance.toLocaleString()} 🪙
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ≈ ${((coins * 0.001) + (nativeTokenBalance * tokenPrice)).toFixed(2)} USD
                    </p>
                  </div>
                </div>
              </div>

              {/* 📦 Contenido de la pestaña */}
              <div className="mb-10">
                {renderTabContent()}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 🔥 Banner de promoción */}
      <motion.div 
        className="mt-12 p-8 bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-purple-900/40 rounded-2xl border border-purple-600/30 text-center relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {/* Efecto de partículas */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h4 className="text-xl font-bold text-white mb-1">🎯 CONSEJO DEL DÍA</h4>
              <p className="text-purple-200">
                Las skins no solo cambian la apariencia, ¡también aumentan tu motivación y pueden darte 
                ventajas exclusivas en eventos especiales!
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setSelectedTab("skins");
              if (playSound) playSound("uiClick");
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-6 text-lg font-bold rounded-xl shadow-lg shadow-purple-500/30"
          >
            <Palette className="w-5 h-5 mr-3" />
            VER TODAS LAS SKINS
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}