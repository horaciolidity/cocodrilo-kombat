import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin, // redirige al mismo dominio luego del login
        },
      });

      if (error) {
        toast({
          title: "❌ Error de inicio de sesión",
          description: error.message,
          duration: 3000,
          variant: "destructive",
        });
        playSound?.("error");
      } else {
        toast({
          title: "📧 Verifica tu correo",
          description: "Te enviamos un enlace mágico para iniciar sesión.",
          duration: 5000,
        });
        playSound?.("reward");
        setShowAuth(false);
      }
    } catch (err) {
      toast({
        title: "⚠️ Error inesperado",
        description: err.message,
        duration: 3000,
        variant: "destructive",
      });
      playSound?.("error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowAuth(false);
    playSound?.("uiClose");
  };

  if (!showAuth) return null;

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md bg-card shadow-xl border border-border"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="mobile-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Correo electrónico
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@gmail.com"
              required
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground mobile-button"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full mobile-button bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Mail className="w-4 h-4 mr-2" />
            {loading ? "Enviando enlace..." : "Enviar enlace mágico"}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-2">
            Recibirás un enlace para acceder sin contraseña.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
