// src/components/TutorialModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, Sparkles } from 'lucide-react';

const TUTORIAL_STEPS = [
  { 
    emoji: '🐊', 
    title: '¡Bienvenido a Cocodrilo Kombat!', 
    text: 'Haz clic en el cocodrilo para ganar monedas. Cada mordisco te acerca más a convertirte en el rey del pantano.',
    duration: 5000,
    highlight: 'game-area'
  },
  { 
    emoji: '🛒', 
    title: 'Compra Mejoras', 
    text: 'Usa tus monedas para comprar mejoras que aumenten tu poder de mordisco o generen monedas automáticamente.',
    duration: 6000,
    highlight: 'upgrades-panel'
  },
  { 
    emoji: '🎯', 
    title: 'Completa Misiones', 
    text: 'Supera misiones para ganar recompensas especiales, incluyendo cartas de poder y tokens CROC.',
    duration: 5500,
    highlight: 'missions-tab'
  },
  { 
    emoji: '🏆', 
    title: 'Alcanza Hitos', 
    text: 'Acumula monedas para desbloquear hitos de farmeo y ganar tokens CROC antes del lanzamiento oficial.',
    duration: 6000,
    highlight: 'milestones-tab'
  },
  { 
    emoji: '🎨', 
    title: 'Personaliza tu Cocodrilo', 
    text: 'Visita la tienda para comprar skins y ítems que mejoren tu farmeo y hagan único a tu cocodrilo.',
    duration: 5500,
    highlight: 'shop-tab'
  },
  { 
    emoji: '👥', 
    title: 'Invita Amigos', 
    text: 'Comparte tu enlace de referido para ganar recompensas cuando tus amigos se unan al juego.',
    duration: 5000,
    highlight: 'referrals-widget'
  },
  { 
    emoji: '📊', 
    title: 'Sigue tu Progreso', 
    text: 'Revisa tus estadísticas para ver cuánto has avanzado y planificar tu próxima estrategia.',
    duration: 5500,
    highlight: 'stats-tab'
  },
  { 
    emoji: '🚀', 
    title: 'Explora el Ecosistema', 
    text: 'Revisa el Fairlaunch y Whitepaper para aprender sobre el token CROC y el futuro del juego.',
    duration: 6000,
    highlight: 'fairlaunch-tab'
  },
];

export function TutorialModal({ 
  showTutorial, 
  tutorialStep, 
  nextTutorialStep, 
  skipTutorial 
}) {
  const currentStep = TUTORIAL_STEPS[tutorialStep];
  const isLastStep = tutorialStep === TUTORIAL_STEPS.length - 1;
  const progressPercentage = ((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100;

  if (!showTutorial) return null;

  return (
    <AnimatePresence>
      {showTutorial && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-br from-gray-900 to-gray-950 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* Fondo decorativo */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
            
            {/* Botón de cerrar */}
            <button
              onClick={skipTutorial}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Indicador de progreso */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-400">
                  Paso {tutorialStep + 1} de {TUTORIAL_STEPS.length}
                </span>
                <span className="text-sm text-primary font-semibold">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <motion.div 
                  className="bg-gradient-to-r from-primary to-purple-500 h-2 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Contenido del tutorial */}
            <div className="text-center relative z-10">
              {/* Emoji grande */}
              <div className="text-6xl mb-4 animate-bounce">
                {currentStep.emoji}
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {currentStep.title}
              </h2>

              {/* Texto descriptivo */}
              <p className="text-gray-300 mb-6 leading-relaxed">
                {currentStep.text}
              </p>

              {/* Indicador de área destacada */}
              {currentStep.highlight && (
                <div className="mb-6 flex items-center justify-center gap-2 text-sm text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>Revisa la sección: {currentStep.highlight}</span>
                </div>
              )}

              {/* Botones de navegación */}
              <div className="flex justify-between items-center mt-6">
                <Button
                  onClick={skipTutorial}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                >
                  Saltar tutorial
                </Button>

                <Button
                  onClick={nextTutorialStep}
                  className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 group"
                >
                  {isLastStep ? (
                    <>
                      <span>¡Empezar a jugar!</span>
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>

              {/* Indicadores de paso */}
              <div className="flex justify-center gap-2 mt-8">
                {TUTORIAL_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === tutorialStep
                        ? 'bg-primary w-6'
                        : index < tutorialStep
                        ? 'bg-green-500'
                        : 'bg-gray-700'
                    }`}
                  />
                ))}
              </div>

              {/* Nota */}
              <p className="text-xs text-gray-500 mt-6">
                Puedes volver a ver este tutorial en cualquier momento desde Configuración
              </p>
            </div>

            {/* Efectos decorativos */}
            <motion.div 
              className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 4,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}