import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Award, Zap, TrendingUp, Share2, Users, Gift } from 'lucide-react';

export function MilestoneReachedModal({ isOpen, onClose, milestone, onShareReferral, player }) {
  if (!isOpen || !milestone) return null;

  // Función para compartir referido
  const handleShareReferral = () => {
    if (onShareReferral) {
      onShareReferral();
    }
    // También puedes cerrar el modal después de compartir si quieres
    // onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // Cerrar al hacer clic fuera
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md text-center bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-emerald-900/90 border border-purple-500/50 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()} // Prevenir cierre al hacer clic dentro
      >
        {/* Header con botón cerrar */}
        <div className="flex justify-end mb-2">
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full mobile-button hover:bg-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Imagen de celebración */}
        <div className="relative mb-4">
          <img 
            src="/images/crocodile-celebration.jpeg" 
            alt="Cocodrilo celebrando"
            className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 shadow-lg object-cover"
            onError={(e) => {
              // Fallback si la imagen no carga
              e.target.style.display = 'none';
              const fallback = document.createElement('div');
              fallback.className = 'w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 shadow-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center';
              fallback.innerHTML = '🎉🐊';
              e.target.parentNode.appendChild(fallback);
            }}
          />
          <div className="absolute -top-2 -right-2">
            <Award className="w-10 h-10 text-yellow-400 animate-bounce" />
          </div>
        </div>
        
        {/* Título principal */}
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          ¡Hito Alcanzado!
        </h2>
        
        {/* Nombre del hito */}
        <p className="text-xl font-semibold mb-3 text-white">{milestone.name}</p>
        
        {/* Recompensa principal */}
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-4 border border-white/20">
          <p className="text-white/80 mb-2">Has farmeado <strong className="text-yellow-400">{milestone.coinsRequired.toLocaleString()}</strong> monedas</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold text-green-400 my-2">
              +{milestone.tokenReward.toLocaleString()} CROC
            </p>
            <span className="text-2xl">🐊</span>
          </div>
          <p className="text-sm text-green-300 font-semibold">
            ¡Tokens asegurados para el Fairlaunch!
          </p>
        </div>

        {/* Sección de referidos - NUEVA */}
        <motion.div 
          className="bg-gradient-to-r from-green-900/80 to-emerald-800/80 border border-green-500/50 rounded-lg p-4 mb-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-300" />
            <h3 className="text-lg font-bold text-green-100">¡Multiplica tus Ganancias!</h3>
          </div>
          
          <p className="text-sm text-green-200 mb-3">
            <strong>Comparte tu enlace de referido</strong> y gana <strong className="text-yellow-400">+10 CROC extra</strong> por cada amigo que se una
          </p>

          <div className="grid grid-cols-2 gap-2 text-center mb-3">
            <div className="bg-green-800/40 rounded p-2">
              <div className="text-green-300 text-xs">Por Referido</div>
              <div className="text-white font-bold text-lg">+10 CROC</div>
            </div>
            <div className="bg-green-800/40 rounded p-2">
              <div className="text-green-300 text-xs">Bonificación</div>
              <div className="text-white font-bold text-lg">+1000 🪙</div>
            </div>
          </div>

          <Button
            onClick={handleShareReferral}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-2.5 transition-all duration-200 shadow-lg"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir Mi Enlace
          </Button>
        </motion.div>

        {/* Mensaje motivacional */}
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-white/80">
            <strong className="text-yellow-400">¡Sigue farmeando!</strong> Cuantas más monedas consigas antes del Fairlaunch, más tokens CROC podrás reclamar.
          </p>
        </motion.div>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={onClose} 
            className="flex-1 mobile-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5"
          >
            <TrendingUp className="w-4 h-4 mr-2" /> 
            Seguir Farmeando
          </Button>
          
          <Button 
            onClick={handleShareReferral}
            variant="outline" 
            className="flex-1 mobile-button border-green-500 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-200"
          >
            <Gift className="w-4 h-4 mr-2" />
            Invitar Amigos
          </Button>
        </div>

        {/* Footer con info adicional */}
        <motion.div 
          className="mt-4 pt-3 border-t border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-white/60">
            🎯 Próximo hito: {milestone.nextMilestone || '¡Sigue avanzando!'}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}