import React from 'react';
import { Layers, Star, Zap, Shield, Feather, Diamond, Eye, Crown as CrownIcon, Sparkles } from 'lucide-react';
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

  const getRarityBgColor = (rarity) => {
    switch (rarity) {
      case 'Común': return 'bg-gray-900/30';
      case 'Poco Común': return 'bg-green-900/20';
      case 'Rara': return 'bg-blue-900/20';
      case 'Épica': return 'bg-purple-900/20';
      case 'Legendaria': return 'bg-yellow-900/20';
      default: return 'bg-gray-900/30';
    }
  };
  
  const allCardsWithOwnership = CARDS_DATA.map(card => ({
    ...card,
    isOwned: ownedCards.includes(card.id)
  }));

  const ownedCount = allCardsWithOwnership.filter(card => card.isOwned).length;
  const totalCount = allCardsWithOwnership.length;

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado con estadísticas */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text flex items-center justify-center">
            <Layers className="w-8 h-8 mr-3 text-indigo-400" /> Colección de Cartas
          </h1>
          <p className="text-muted-foreground mb-4">
            Cartas potenciadoras que mejoran a tu cocodrilo
          </p>
          
          <div className="inline-flex items-center justify-center gap-6 p-4 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-700/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">{ownedCount}</div>
              <div className="text-xs text-indigo-300">Cartas Obtenidas</div>
            </div>
            <div className="h-8 w-px bg-indigo-700/50"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{totalCount}</div>
              <div className="text-xs text-purple-300">Total de Cartas</div>
            </div>
            <div className="h-8 w-px bg-indigo-700/50"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{Math.round((ownedCount / totalCount) * 100)}%</div>
              <div className="text-xs text-yellow-300">Completado</div>
            </div>
          </div>
        </motion.div>

        {/* Barra de progreso */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso de la colección</span>
            <span className="font-bold text-primary">{ownedCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <motion.div 
              className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(ownedCount / totalCount) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {allCardsWithOwnership.length === 0 ? (
          <div className="text-center py-16 stats-card rounded-xl">
            <Layers className="w-20 h-20 mx-auto mb-6 text-muted-foreground opacity-30" />
            <p className="text-2xl text-muted-foreground mb-3">¡Tu colección está vacía!</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Completa misiones y alcanza hitos para obtener cartas potenciadoras que mejorarán a tu cocodrilo.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-primary bg-primary/10 px-4 py-2 rounded-full">
              <Sparkles className="w-3 h-3" />
              <span>Las cartas se obtienen completando misiones</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allCardsWithOwnership.map((card, index) => (
              <motion.div
                key={card.id}
                className={`relative rounded-xl p-5 border-2 ${getRarityBgColor(card.rarity)} ${getRarityColor(card.rarity)} transition-all duration-300 ${!card.isOwned ? 'opacity-60 grayscale' : 'hover:scale-[1.02] hover:shadow-xl'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                {/* Indicador de obtenida */}
                {card.isOwned && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>OBTENIDA</span>
                  </div>
                )}

                {/* Encabezado de la carta */}
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg ${getRarityBgColor(card.rarity)} mr-3`}>
                    <card.icon className={`w-6 h-6 ${card.color || getRarityColor(card.rarity).split(' ')[1]}`} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-lg truncate">{card.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getRarityColor(card.rarity).split(' ')[0].replace('border-', 'bg-')}/20`}>
                        {card.rarity}
                      </span>
                      {!card.isOwned && (
                        <span className="text-xs text-muted-foreground">No obtenida</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-sm text-muted-foreground mb-4 min-h-[3.5rem]">{card.description}</p>

                {/* Efecto */}
                <div className="border-t border-border/30 pt-4">
                  <p className="text-xs font-semibold text-primary mb-1">EFECTO DE CARTA</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {card.effect.type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-lg font-bold ${getRarityColor(card.rarity).split(' ')[1]}`}>
                      +{card.effect.value}{card.effect.type.includes('percent') ? '%' : ''}
                    </span>
                  </div>
                </div>

                {/* Pie de carta */}
                <div className="mt-4 pt-3 border-t border-border/20">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Potenciador</span>
                    <span>#{index + 1}</span>
                  </div>
                </div>

                {/* Overlay para cartas no obtenidas */}
                {!card.isOwned && (
                  <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                    <div className="text-center p-4">
                      <Layers className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm font-medium text-gray-300">No obtenida</p>
                      <p className="text-xs text-gray-400 mt-1">Completa misiones para desbloquear</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Leyenda de rarezas */}
        <div className="mt-10 p-4 bg-gradient-to-r from-gray-900/30 to-gray-800/30 rounded-xl border border-gray-700/50">
          <h3 className="text-sm font-bold mb-3 text-center">🎴 Leyenda de Rarezas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['Común', 'Poco Común', 'Rara', 'Épica', 'Legendaria'].map((rarity) => (
              <div key={rarity} className="flex items-center justify-center gap-2 text-xs">
                <div className={`w-3 h-3 rounded-full ${getRarityColor(rarity).split(' ')[0].replace('border-', 'bg-')}`} />
                <span className={getRarityColor(rarity).split(' ')[1]}>{rarity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Consejos */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            💡 Las cartas se obtienen automáticamente al completar misiones. ¡Revisa la sección de Misiones!
          </p>
        </div>
      </div>
    </div>
  );
}