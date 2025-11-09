import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Palette, Gem, Zap, Check } from 'lucide-react';
import { SHOP_ITEMS } from '@/config/gameConfig';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ShopView({ buyShopItem, coins, ownedItems, activeSkin }) {
  const [selectedTab, setSelectedTab] = useState("skins");
  const [refresh, setRefresh] = useState(0); // 🔄 Forzar re-render tras compras

  const getItemStatus = (item) => {
    if (item.type === 'skin') {
      if (activeSkin === item.id)
        return { text: 'Equipada', disabled: true, variant: 'outline' };
      if (ownedItems.includes(item.id))
        return { text: 'Equipar', disabled: false, variant: 'default' };
    } else if (item.type === 'item') {
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

  const ItemCard = ({ item, index }) => {
    const status = getItemStatus(item);
    const Icon = item.icon;
    return (
      <motion.div
        key={item.id}
        className="stats-card rounded-xl p-4 flex flex-col justify-between hover-lift"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div>
          <div className="flex items-center mb-3">
            <Icon
              className={`w-10 h-10 p-2 rounded-lg mr-3 ${
                item.type === 'skin'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-yellow-500/20 text-yellow-400'
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
          onClick={() => {
            buyShopItem(item.id);
            setRefresh((r) => r + 1); // 🔄 Forzar refresco
          }}
          disabled={status.disabled}
          variant={
            status.variant === 'outline'
              ? 'outline'
              : coins < item.price &&
                !ownedItems.includes(item.id) &&
                activeSkin !== item.id
              ? 'secondary'
              : 'default'
          }
          className={`w-full mobile-button ${
            status.disabled &&
            status.text !== 'Equipada' &&
            status.text !== 'Comprado'
              ? 'bg-gray-600'
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
              <Check className="w-4 h-4 mr-2 text-green-400" />
              {status.text}
            </>
          )}
        </Button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center gradient-text flex items-center justify-center">
          <ShoppingCart className="w-8 h-8 mr-3 text-pink-400" /> Tienda del
          Pantano
        </h1>
        <div className="text-center mb-8 text-lg font-semibold">
          Monedas: <span className="text-yellow-400">{coins.toLocaleString()}</span> 💰
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="skins">
              <Palette className="w-4 h-4 mr-2 inline-block" /> Skins
            </TabsTrigger>
            <TabsTrigger value="items">
              <Gem className="w-4 h-4 mr-2 inline-block" /> Ítems
            </TabsTrigger>
            <TabsTrigger value="consumables">
              <Zap className="w-4 h-4 mr-2 inline-block" /> Consumibles
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {selectedTab === 'skins' && (
              <motion.div
                key="skins"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <TabsContent value="skins" key={refresh}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems('skin').map((item, index) => (
                      <ItemCard item={item} index={index} key={item.id} />
                    ))}
                  </div>
                </TabsContent>
              </motion.div>
            )}

            {selectedTab === 'items' && (
              <motion.div
                key="items"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <TabsContent value="items" key={refresh}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems('item').map((item, index) => (
                      <ItemCard item={item} index={index} key={item.id} />
                    ))}
                  </div>
                </TabsContent>
              </motion.div>
            )}

            {selectedTab === 'consumables' && (
              <motion.div
                key="consumables"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <TabsContent value="consumables" key={refresh}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems('consumable').map((item, index) => (
                      <ItemCard item={item} index={index} key={item.id} />
                    ))}
                  </div>
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
