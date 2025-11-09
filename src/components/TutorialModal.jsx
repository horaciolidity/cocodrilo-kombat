import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const tutorialStepsContent = [
  { emoji: '🐊', title: '¡Bienvenido a Cocodrilo Kombat!', text: '¡Haz clic en el cocodrilo para ganar monedas! ¡Cada mordisco cuenta!' },
  { emoji: '🛒', title: 'Compra Mejoras', text: 'Usa tus monedas para comprar mejoras que aumenten tu poder de mordisco o generen monedas automáticamente.' },
  { emoji: '🎯', title: 'Completa Misiones', text: '¡Supera misiones para ganar recompensas especiales, incluyendo cartas de poder!' },
  { emoji: '🏆', title: 'Logros y Niveles', text: 'Completa logros y sube de nivel para desbloquear nuevas funciones. ¡Diviértete!' },
];

export function TutorialModal({ showTutorial, tutorialStep, nextTutorialStep, skipTutorial }) {
  if (!showTutorial) return null;

  const currentStepContent = tutorialStepsContent[tutorialStep];

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">🎮 Tutorial</h2>
          {currentStepContent && (
            <>
              <div className="text-6xl mb-4">{currentStepContent.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{currentStepContent.title}</h3>
              <p className="text-muted-foreground mb-4">{currentStepContent.text}</p>
            </>
          )}
          <div className="flex justify-between mt-6">
            <Button onClick={skipTutorial} variant="ghost" className="mobile-button">Saltar</Button>
            <Button onClick={nextTutorialStep} className="mobile-button bg-primary hover:bg-primary/90 text-primary-foreground">
              {tutorialStep === tutorialStepsContent.length - 1 ? 'Comenzar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}