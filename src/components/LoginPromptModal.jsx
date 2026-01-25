import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, LogIn, User, Shield, Trophy } from 'lucide-react';

export function LoginPromptModal({
    isOpen,
    onClose,
    onLogin,
    onGuest
}) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="bg-gradient-to-br from-indigo-950 to-gray-900 border border-indigo-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25 }}
                >
                    {/* Fondo decorativo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />

                    {/* Botón de cerrar */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center relative z-10">
                        {/* Icono Principal */}
                        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                            <Shield className="w-8 h-8 text-primary animate-pulse" />
                        </div>

                        {/* Título */}
                        <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            ¡Protege tu Progreso!
                        </h2>

                        {/* Texto persuasivo */}
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            Estás jugando en <strong>Modo Invitado</strong>. Si cierras el navegador o cambias de dispositivo, podrías perder todo tu avance, monedas y upgrades.
                        </p>

                        {/* Lista de beneficios */}
                        <div className="bg-black/20 rounded-xl p-4 mb-6 text-left space-y-3 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500/20 p-1.5 rounded-lg">
                                    <Shield className="w-4 h-4 text-green-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-200">Guardado en la Nube</h4>
                                    <p className="text-xs text-gray-400">Tu progreso seguro y accesible siempre.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-500/20 p-1.5 rounded-lg">
                                    <Trophy className="w-4 h-4 text-yellow-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-200">Compite en el Ranking</h4>
                                    <p className="text-xs text-gray-400">Aparece en la tabla de líderes mundial.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="bg-purple-500/20 p-1.5 rounded-lg">
                                    <User className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-sm text-gray-200">Gana Recompensas Reales</h4>
                                    <p className="text-xs text-gray-400">Solo usuarios registrados pueden retirar.</p>
                                </div>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="space-y-3">
                            <Button
                                onClick={onLogin}
                                className="w-full bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 text-white shadow-lg hover:shadow-green-500/20 transition-all duration-300 py-6 text-lg font-bold"
                            >
                                <LogIn className="w-5 h-5 mr-2" />
                                Registrarse / Iniciar Sesión
                            </Button>

                            <Button
                                onClick={onGuest}
                                variant="ghost"
                                className="w-full text-gray-400 hover:text-white hover:bg-white/5 text-sm"
                            >
                                Seguir como Invitado (Riesgoso)
                            </Button>
                        </div>
                    </div>

                    {/* Efectos decorativos */}
                    <motion.div
                        className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 5,
                            ease: "easeInOut"
                        }}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
