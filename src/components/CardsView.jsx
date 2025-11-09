
import React from 'react';
import { Layers, Star, Zap, Shield, Feather, Diamond, Eye, Crown as CrownIcon } from 'lucide-react';
import { CARDS_DATA } from '@/config/gameConfig';
import { motion } from 'framer-motion';

export function CardsView({ ownedCards }) {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Común': return 'border-gray-500 text-gray-400';
      case 'Poco Común': return 'border-green-500 text-green-400';
      case 'Rara': return 'border-blue-500 text-blue-400';
      case 'Épica': return 'border-purple-500 text-purple-400';
      case 'Legendaria': return 'border-yellow-500 text-yellow-400';
      default: return 'border-gray-700';
    }
  };
  
  const allCardsWithOwnership = CARDS_DATA.map(card => ({
    ...card,
    isOwned: ownedCards.includes(card.id)
  }));

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text flex items-center justify-center">
          <Layers className="w-8 h-8 mr-3 text-indigo-400" /> Mis Cartas Potenciadoras
        </h1>

        {allCardsWithOwnership.length === 0 ? (
          <div className="text-center py-10 stats-card rounded-xl">
            <Layers className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground">No tienes cartas aún.</p>
            <p className="text-sm text-muted-foreground">Completa misiones para obtener cartas y potenciar a tu cocodrilo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCardsWithOwnership.map((card, index) => (
              <motion.div
                key={card.id}
                className={`relative rounded-xl p-5 border-2 glass-effect hover-lift ${getRarityColor(card.rarity)} ${!card.isOwned ? 'opacity-50 filter grayscale' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {!card.isOwned && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl z-10">
                        <Layers className="w-12 h-12 text-gray-400" />
                    </div>
                )}
                <div className="flex items-center mb-3">
                  <card.icon className={`w-7 h-7 mr-3 ${card.color || getRarityColor(card.rarity).split(' ')[1]}`} />
                  <h3 className="text-lg font-semibold flex-grow">{card.name}</h3>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRarityColor(card.rarity).split(' ')[0].replace('border-', 'bg-')}/20`}>
                    {card.rarity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3 h-12 overflow-hidden">{card.description}</p>
                <div className="border-t border-border/50 pt-3">
                  <p className="text-xs font-medium text-primary">Efecto:</p>
                  <p className="text-xs text-muted-foreground">{card.effect.type.replace(/_/g, ' ')}: {card.effect.value}{card.effect.type.includes('percent') ? '%' : ''}</p>
                </div>
                {card.isOwned && (
                    <div className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        Obtenida
                    </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
