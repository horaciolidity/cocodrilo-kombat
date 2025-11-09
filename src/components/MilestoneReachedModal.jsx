
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Award, Zap, TrendingUp } from 'lucide-react';

export function MilestoneReachedModal({ isOpen, onClose, milestone }) {
  if (!isOpen || !milestone) return null;

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex justify-end">
          <Button onClick={onClose} variant="ghost" size="sm" className="mobile-button">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-pulse" />
        
        <h2 className="text-2xl font-bold mb-3 gradient-text">¡Hito Alcanzado!</h2>
        <p className="text-lg font-semibold mb-2">{milestone.name}</p>
        
        <div className="bg-card/50 p-4 rounded-lg mb-4">
          <p className="text-muted-foreground">Has farmeado <strong className="text-yellow-400">{milestone.coinsRequired.toLocaleString()}</strong> monedas y reclamado:</p>
          <p className="text-2xl font-bold text-primary my-2">{milestone.tokenReward.toLocaleString()} CROC 🐊</p>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          ¡Sigue así! Cuantas más monedas farmees antes del Fairlaunch, ¡más tokens CROC podrás asegurar para maximizar tus ganancias!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onClose} className="flex-1 mobile-button bg-primary hover:bg-primary/90 text-primary-foreground">
                <TrendingUp className="w-4 h-4 mr-2" /> ¡A Seguir Farmeando!
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1 mobile-button">
                <Zap className="w-4 h-4 mr-2" /> Entendido
            </Button>
        </div>

      </motion.div>
    </motion.div>
  );
}
