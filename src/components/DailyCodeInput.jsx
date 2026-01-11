import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Key, Sparkles, Check, X } from 'lucide-react';

export function DailyCodeInput({ claimDailyCode, toast, playSound }) {
    const [code, setCode] = useState('');
    const [claiming, setClaiming] = useState(false);

    const handleClaim = async () => {
        if (!code || code.length < 4) {
            toast({
                title: "⚠️ Código inválido",
                description: "El código debe tener al menos 4 caracteres",
                variant: "destructive"
            });
            return;
        }

        setClaiming(true);
        try {
            const result = await claimDailyCode(code);

            if (result.success) {
                playSound?.('success');
                toast({
                    title: "🎉 ¡Código Reclamado!",
                    description: `+${result.reward_coins.toLocaleString()} 💰${result.reward_croc > 0 ? ` +${result.reward_croc} CROC` : ''}`,
                    duration: 5000
                });
                setCode(''); // Clear input on success
            } else {
                playSound?.('error');
                toast({
                    title: "❌ Error",
                    description: result.error || "Código inválido o ya reclamado",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                title: "❌ Error",
                description: "Ocurrió un error al reclamar el código",
                variant: "destructive"
            });
        } finally {
            setClaiming(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleClaim();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="w-6 h-6 text-purple-400" />
                        Código Secreto Diario
                    </CardTitle>
                    <CardDescription>
                        Encuentra códigos secretos en nuestros videos de YouTube y canjéalos aquí por recompensas especiales
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                type="text"
                                placeholder="Ingresa el código..."
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                onKeyPress={handleKeyPress}
                                disabled={claiming}
                                className="pr-10 bg-black/30 border-purple-500/50 focus:border-purple-400 text-lg font-mono uppercase"
                                maxLength={20}
                            />
                            {code && (
                                <button
                                    onClick={() => setCode('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <Button
                            onClick={handleClaim}
                            disabled={claiming || !code}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[120px]"
                        >
                            {claiming ? (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                <>
                                    <Gift className="w-4 h-4 mr-2" />
                                    Canjear
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-700/30">
                        <div className="flex items-start gap-2 text-sm">
                            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <div className="text-purple-200">
                                <p className="font-semibold mb-1">¿Dónde encontrar códigos?</p>
                                <p className="text-xs text-purple-300">
                                    Suscríbete a nuestro canal de YouTube y activa las notificaciones.
                                    Compartimos códigos secretos en cada video con recompensas exclusivas.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
