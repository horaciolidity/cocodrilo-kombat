import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Palette, Gem, Zap, Check } from 'lucide-react';
import { SHOP_ITEMS } from '@/config/gameConfig';

export function ShopView({ buyShopItem, coins, ownedItems, activeSkin }) {
  const [selectedTab, setSelectedTab] = useState("skins");

  const getItemStatus = (item) => {
    if (item.type === 'skin') {
      if (activeSkin === item.id)
        return { text: 'Equipada', disabled: true, variant: 'outline' };
      if (ownedItems.includes(item.id))
        return { text: 'Equipar', disabled: false, variant: 'default' };
    } else if (item.type === 'item' || item.type === 'consumable') {
      if (ownedItems.includes(item.id))
        return { text: 'Comprado', disabled: true, variant: 'outline' };
    }
    return {
      text: `Comprar (${item.price.toLocaleString()}💰)`,
      disabled: coins < item.price,
      variant: 'default',
    };
  };

  const filteredItems = (type) => SHOP_ITEMS.filter((item) => item.type === type);

  const ItemCard = ({ item }) => {
    const status = getItemStatus(item);
    const Icon = item.icon;
    return (
      <div className="stats-card rounded-xl p-4 flex flex-col justify-between hover-lift transition-all duration-200">
        <div>
          <div className="flex items-center mb-3">
            <Icon
              className={`w-10 h-10 p-2 rounded-lg mr-3 ${
                item.type === 'skin'
                  ? 'bg-purple-500/20 text-purple-400'
                  : item.type === 'item'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            />
            <div>
              <h3 className="text-md font-semibold">{item.name}</h3>
              {item.type === 'skin' && activeSkin === item.id && (
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

        <Button
          onClick={() => buyShopItem(item.id)}
          disabled={status.disabled}
          className={`w-full mobile-button ${
            status.disabled && status.text !== 'Equipada' && status.text !== 'Comprado'
              ? 'bg-gray-600 cursor-not-allowed'
              : status.text === 'Equipar'
              ? 'bg-primary hover:bg-primary/90'
              : ''
          }`}
        >
          {status.text.includes('Comprar') ? (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" /> {status.text}
            </>
          ) : status.text === 'Equipar' ? (
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
    );
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding fade-in">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center gradient-text flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 mr-3 text-pink-400" /> Tienda del Pantano
        </h1>

        <div className="text-center mb-8 text-lg font-semibold">
          Monedas: <span className="text-yellow-400">{coins.toLocaleString()}</span> 💰
        </div>

        {/* ✅ Fix: reemplazo TabsContent por condicionales normales para evitar pointer-events bloqueados */}
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

          <div className="relative z-20">
            {selectedTab === "skins" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems('skin').map((item) => (
                  <ItemCard item={item} key={item.id} />
                ))}
              </div>
            )}

            {selectedTab === "items" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems('item').map((item) => (
                  <ItemCard item={item} key={item.id} />
                ))}
              </div>
            )}

            {selectedTab === "consumables" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems('consumable').map((item) => (
                  <ItemCard item={item} key={item.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
