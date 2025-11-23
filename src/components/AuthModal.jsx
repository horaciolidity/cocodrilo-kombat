// src/components/AuthModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lock, Mail, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    playSound?.("uiClick");

    try {
      let data, error;

      if (mode === "register") {
        // 🧾 CREAR CUENTA - SOLO AUTH, NO CREAR JUGADOR AQUÍ
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
        }));
        if (error) throw error;

        console.log("✅ Usuario registrado en Auth, jugador se creará automáticamente");
        
        toast({
          title: "✅ Cuenta creada",
          description: "Revisa tu correo para confirmar y luego inicia sesión.",
          duration: 5000,
        });
        playSound?.("reward");
        
        // 🎯 IMPORTANTE: Limpiar formulario y cambiar a login
        setEmail("");
        setPassword("");
        setMode("login");
        
      } else {
        // 🔐 INICIAR SESIÓN
        ({ data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
        if (error) throw error;

        const user = data?.user;
        if (user) {
          setUser(user);
          localStorage.setItem("cocodriloKombatUser", JSON.stringify(user));

          toast({
            title: "🎮 ¡Bienvenido de nuevo!",
            description: "Sesión iniciada correctamente.",
            duration: 3000,
          });
          playSound?.("reward");
          setShowAuth(false);
        }
      }
    } catch (err) {
      console.error("❌ Error en AuthModal:", err);
      
      // Mensajes de error más específicos
      let errorMessage = err.message || "Error al autenticarte";
      if (err.message.includes("Invalid login credentials")) {
        errorMessage = "Correo o contraseña incorrectos";
      } else if (err.message.includes("Email not confirmed")) {
        errorMessage = "Confirma tu correo electrónico antes de iniciar sesión";
      } else if (err.message.includes("User already registered")) {
        errorMessage = "Este correo ya está registrado";
      }
      
      toast({
        title: "⚠️ Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
      playSound?.("error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowAuth(false);
    setEmail("");
    setPassword("");
    playSound?.("uiClose");
  };

  // 🎯 OBTENER Y VALIDAR CÓDIGO DE REFERIDO DE LA URL
  const getReferralCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    // Validar que sea un código seguro (8 chars alfanum en minúscula)
    if (refCode && /^[a-z0-9]{8}$/.test(refCode)) {
      return refCode;
    }
    
    // Si es un UUID (código antiguo), ignorarlo por seguridad
    if (refCode && refCode.length === 36) {
      console.warn("⚠️ Código de referido UUID detectado - ignorando por seguridad");
      return null;
    }
    
    return null;
  };

  const referralCode = getReferralCode();

  if (!showAuth) return null;

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose} // Cerrar al hacer clic fuera
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md bg-gradient-to-br from-card to-card/80 shadow-2xl border border-border/50"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()} // Prevenir cierre al hacer clic dentro
      >
        {/* 🔹 Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "login" 
                ? "Ingresá a tu cuenta para continuar" 
                : "Unite a la comunidad de Cocodrilo Kombat"
              }
            </p>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full mobile-button hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 🎯 BANNER DE REFERIDO MEJORADO */}
        {mode === "register" && referralCode && (
          <motion.div 
            className="mb-4 p-3 bg-gradient-to-r from-green-900/80 to-emerald-800/80 border border-green-500/50 rounded-lg backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-green-100 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">
                ¡Invitación Especial! 🐊
              </span>
            </div>
            <p className="text-xs text-green-200">
              Estás siendo invitado a jugar. Al registrarte recibirás <strong>bonos exclusivos</strong> por ser referido.
            </p>
          </motion.div>
        )}

        {/* 🔹 Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@gmail.com"
              required
              disabled={loading}
              className="w-full bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
              className="w-full bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
            {mode === "register" && (
              <p className="text-xs text-muted-foreground">
                Mínimo 6 caracteres - recomendamos usar una contraseña segura
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 transition-all duration-200"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Procesando...
              </>
            ) : mode === "login" ? (
              <>
                <Lock className="w-4 h-4 mr-2" /> 
                Iniciar Sesión
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" /> 
                Crear Mi Cuenta
              </>
            )}
          </Button>

          {/* 🎯 INFO MEJORADA DE REFERIDOS */}
          {mode === "register" && (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                🐊 Al registrarte aceptas nuestros{' '}
                <button type="button" className="text-primary hover:underline font-medium">
                  términos y condiciones
                </button>
              </p>
              {referralCode && (
                <div className="flex items-center justify-center gap-2 text-xs text-green-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Bonos de referido activos</span>
                </div>
              )}
            </div>
          )}

          {/* 🔄 Switch entre Login y Register */}
          <div className="text-center pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {mode === "login" ? (
                <>
                  ¿No tenés cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      playSound?.("uiClick");
                    }}
                    className="text-primary font-semibold hover:underline transition-all"
                  >
                    Registrate
                  </button>
                </>
              ) : (
                <>
                  ¿Ya tenés cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      playSound?.("uiClick");
                    }}
                    className="text-primary font-semibold hover:underline transition-all"
                  >
                    Iniciar sesión
                  </button>
                </>
              )}
            </p>
          </div>
        </form>

        {/* 🔐 Información de seguridad */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-center text-muted-foreground/70">
            🔒 Tus datos están protegidos y encriptados
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}