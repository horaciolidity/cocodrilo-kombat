import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Award, Zap, TrendingUp, Share2, Users, Gift, Copy } from 'lucide-react';

export function MilestoneReachedModal({ 
  isOpen, 
  onClose, 
  milestone, 
  getReferralLink, // ✅ Recibir función desde useGameData
  toast, // ✅ Recibir toast para notificaciones
  playSound // ✅ Recibir playSound para efectos
}) {
  if (!isOpen || !milestone) return null;

  // Función para compartir referido MEJORADA
  const handleShareReferral = () => {
    if (!getReferralLink) {
      console.error("❌ Función getReferralLink no disponible");
      return;
    }

    const referralLink = getReferralLink();
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(referralLink).then(() => {
      if (toast) {
        toast({
          title: "📋 Enlace copiado",
          description: "¡Comparte tu enlace de referido y gana recompensas!",
          duration: 3000,
        });
      }
      
      if (playSound) {
        playSound("uiClick");
      }

      // Intentar compartir en redes sociales (si está disponible)
      if (navigator.share) {
        navigator.share({
          title: '¡Únete a Cocodrilo Kombat! 🐊',
          text: `¡Estoy jugando a Cocodrilo Kombat y ya gané ${milestone.tokenReward} tokens CROC! Únete usando mi enlace:`,
          url: referralLink,
        }).catch((err) => {
          console.log("❌ Error compartiendo:", err);
        });
      }
    }).catch(err => {
      console.error('Error copiando enlace:', err);
      if (toast) {
        toast({
          title: "❌ Error",
          description: "No se pudo copiar el enlace",
          variant: "destructive",
          duration: 3000,
        });
      }
    });
  };

  // Función para continuar farmeando
  const handleContinueFarming = () => {
    if (playSound) {
      playSound("uiClick");
    }
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleContinueFarming} // Cerrar al hacer clic fuera
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
            onClick={handleContinueFarming}
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 rounded-full mobile-button hover:bg-white/10 text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Imagen de celebración */}
        <div className="relative mb-4">
          <div className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-400 shadow-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <span className="text-5xl">🎉</span>
            <span className="text-5xl absolute">🐊</span>
          </div>
          <div className="absolute -top-2 -right-2">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Award className="w-10 h-10 text-yellow-400" />
            </motion.div>
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
          <p className="text-white/80 mb-2">Has farmeado <strong className="text-yellow-400">{milestone.coinsRequired?.toLocaleString() || "0"}</strong> monedas</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-3xl font-bold text-green-400 my-2">
              +{milestone.tokenReward?.toLocaleString() || "0"} CROC
            </p>
            <span className="text-2xl">🐊</span>
          </div>
          <p className="text-sm text-green-300 font-semibold">
            ¡Tokens asegurados para el Fairlaunch!
          </p>
        </div>

        {/* Sección de referidos - SOLO si hay función getReferralLink */}
        {getReferralLink && (
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
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-2.5 transition-all duration-200 shadow-lg flex items-center justify-center"
              size="lg"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir Mi Enlace
            </Button>
          </motion.div>
        )}

        {/* Mensaje motivacional */}
        <motion.div 
          className="text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-white/80">
            <strong className="text-yellow-400">¡Sigue farmeando!</strong> Cuantas más monedas consigas, más tokens CROC podrás reclamar.
          </p>
        </motion.div>
        
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleContinueFarming}
            className="flex-1 mobile-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-2.5 flex items-center justify-center"
          >
            <TrendingUp className="w-4 h-4 mr-2" /> 
            Seguir Farmeando
          </Button>
          
          {getReferralLink && (
            <Button 
              onClick={handleShareReferral}
              variant="outline" 
              className="flex-1 mobile-button border-green-500 text-green-400 hover:bg-green-500 hover:text-white transition-all duration-200 flex items-center justify-center"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Enlace
            </Button>
          )}
        </div>

        {/* Footer con info adicional */}
        <motion.div 
          className="mt-4 pt-3 border-t border-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-xs text-white/60">
            🎯 ¡Sigue avanzando para alcanzar el próximo hito!
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}