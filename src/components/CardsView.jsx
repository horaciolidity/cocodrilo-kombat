import React from 'react';
import { Layers, Star, Zap, Shield, Feather, Diamond, Eye, Crown as CrownIcon, Sparkles } from 'lucide-react';
import { CARDS_DATA } from '@/config/gameConfig';
import { motion } from 'framer-motion';

export function CardsView({ ownedCards }) {
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Común': return 'border-slate-600 text-slate-400 shadow-slate-900/50';
      case 'Poco Común': return 'border-emerald-500/50 text-emerald-400 shadow-emerald-900/50';
      case 'Rara': return 'border-cyan-500/50 text-cyan-400 shadow-cyan-900/50';
      case 'Épica': return 'border-violet-500/50 text-violet-400 shadow-violet-900/50';
      case 'Legendaria': return 'border-amber-500/50 text-amber-400 shadow-amber-900/50';
      case 'Mítica': return 'border-rose-500/50 text-rose-400 shadow-rose-900/50';
      default: return 'border-slate-700 text-slate-500';
    }
  };

  const getRarityBg = (rarity) => {
    switch (rarity) {
      case 'Común': return 'bg-slate-900/40';
      case 'Poco Común': return 'bg-emerald-950/30';
      case 'Rara': return 'bg-cyan-950/30';
      case 'Épica': return 'bg-violet-950/30';
      case 'Legendaria': return 'bg-amber-950/30';
      case 'Mítica': return 'bg-rose-950/30';
      default: return 'bg-slate-950/30';
    }
  };

  const allCardsWithOwnership = CARDS_DATA.map(card => ({
    ...card,
    isOwned: ownedCards.includes(card.id)
  }));

  const ownedCount = allCardsWithOwnership.filter(card => card.isOwned).length;
  const totalCount = allCardsWithOwnership.length;

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding bg-[url('/images/tech-grid.png')] bg-fixed bg-cover">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado Tech */}
        <motion.div
          className="text-center mb-10 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent -z-10"></div>
          <div className="inline-block bg-black/80 backdrop-blur-md px-8 py-2 rounded-full border border-cyan-500/30">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text flex items-center justify-center tracking-wider">
              <Layers className="w-8 h-8 mr-3 text-cyan-400" />
              SISTEMA DE CARTAS
            </h1>
          </div>
          <p className="text-cyan-200/60 mt-4 font-mono text-sm tracking-widest">
            MÓDULOS DE MEJORA // NIVEL DE ACCESO: {ownedCount}/{totalCount}
          </p>
        </motion.div>

        {/* Barra de progreso Hexagonal */}
        <div className="max-w-3xl mx-auto mb-12 p-1 bg-cyan-900/20 rounded-full border border-cyan-500/20">
          <div className="relative w-full h-4 bg-black/50 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${(ownedCount / totalCount) * 100}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
            >
              <div className="absolute top-0 right-0 w-full h-full bg-[url('/images/pattern-stripes.png')] opacity-30 animate-slide-bg"></div>
            </motion.div>
          </div>
          <div className="flex justify-between px-2 mt-1 text-[10px] font-mono text-cyan-500/70 uppercase">
            <span>Iniciando...</span>
            <span>Sincronización: {Math.round((ownedCount / totalCount) * 100)}%</span>
            <span>Completo</span>
          </div>
        </div>

        {allCardsWithOwnership.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-cyan-900/50 rounded-3xl bg-black/20">
            <Layers className="w-24 h-24 mx-auto mb-6 text-cyan-900/50" />
            <p className="text-2xl text-cyan-700/50 font-mono">SIN DATOS DE CARTAS</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allCardsWithOwnership.map((card, index) => {
              const themeColor = getRarityColor(card.rarity);
              const themeBg = getRarityBg(card.rarity);

              return (
                <motion.div
                  key={card.id}
                  className={`group relative rounded-t-2xl rounded-br-2xl border-l-2 border-t-2 border-b border-r max-w-sm mx-auto w-full flex flex-col overflow-hidden backdrop-blur-sm transition-all duration-300 ${themeBg} ${themeColor.split(' ')[0]} ${!card.isOwned ? 'opacity-80' : 'hover:-translate-y-2 hover:shadow-2xl ' + themeColor.split(' ')[2]}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Decorative Tech Corners */}
                  <div className="absolute top-0 right-0 p-3 opacity-30">
                    <Zap className="w-12 h-12" />
                  </div>

                  {/* HEADER */}
                  <div className="p-5 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <div className={`p-2 rounded-lg bg-black/40 border border-white/5`}>
                        <card.icon className={`w-8 h-8 ${themeColor.split(' ')[1]}`} />
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-black/40 border ${themeColor.split(' ')[0]}`}>
                          {card.rarity}
                        </span>
                      </div>
                    </div>

                    <h3 className={`text-lg font-bold font-mono leading-tight mb-1 ${card.isOwned ? 'text-white' : 'text-gray-400'}`}>
                      {card.name}
                    </h3>

                    {/* Status Badge */}
                    <div className="mb-4">
                      {card.isOwned ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          Bloqueado
                        </span>
                      )}
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4"></div>

                    {/* Effect Section */}
                    <div className={`p-3 rounded bg-black/20 border border-white/5 mb-4 ${!card.isOwned ? 'blur-[2px] select-none opacity-50' : ''}`}>
                      <div className="flex justify-between items-center text-xs text-gray-400 mb-1 font-mono">
                        <span>EFECTO</span>
                        <Zap className="w-3 h-3" />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-bold ${themeColor.split(' ')[1]}`}>
                          +{card.effect.value}{card.effect.type.includes('percent') ? '%' : ''}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase truncate max-w-[120px]">
                          {card.effect.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Unlock Requirement (Only if locked) */}
                    {!card.isOwned && card.unlockRequirement && (
                      <div className="bg-rose-950/40 border border-rose-500/30 rounded p-3 relative overflow-hidden group-hover:bg-rose-900/50 transition-colors">
                        <div className="absolute inset-0 bg-[url('/images/diagonal-lines.png')] opacity-10"></div>
                        <div className="relative z-10 flex items-start gap-2">
                          <Shield className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-bold text-rose-300 uppercase mb-0.5">Requisito de Desbloqueo</p>
                            <p className="text-xs text-rose-100 font-medium">
                              {card.unlockRequirement.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Tech ID */}
                  <div className="mt-auto bg-black/40 border-t border-white/5 p-2 flex justify-between items-center text-[10px] font-mono text-gray-600">
                    <span>ID: {card.id.substring(5, 12).toUpperCase()}</span>
                    <span>VER. 2.0</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}