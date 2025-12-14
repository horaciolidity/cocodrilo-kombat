// src/components/AuthModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lock, Mail, Sparkles, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // 🎯 OBTENER Y VALIDAR CÓDIGO DE REFERIDO DE LA URL
  const getReferralCode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    // Validar que sea un código seguro (8 chars alfanum en minúscula)
    if (refCode && /^[a-z0-9]{8}$/.test(refCode)) {
      return refCode;
    }
    
    return null;
  };

  const referralCode = getReferralCode();

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!email || !password) return;

  setLoading(true);
  playSound?.("uiClick");

  try {
    let data, error;

    if (mode === "register") {
      // 🎯 OBTENER CÓDIGO DE REFERIDO DE MÚLTIPLES FUENTES
      let referralCode = null;
      
      // 1. De la URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      
      // 2. De localStorage (si viene de URL anterior)
      const localRefCode = localStorage.getItem('referral_code');
      
      // Preferencia: URL > localStorage
      referralCode = refCode || localRefCode;
      
      if (referralCode) {
        console.log("🎯 Referral code encontrado para registro:", referralCode);
        
        // Guardar temporalmente en localStorage para que useGameData.js lo use
        localStorage.setItem('pending_referral_code', referralCode);
        
        // Limpiar URL y localStorage después de usar
        localStorage.removeItem('referral_code');
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Crear cuenta con metadata
      const signUpData = {
        email,
        password,
        options: {
          data: {
            referral_code: referralCode || null,
            referred_at: new Date().toISOString()
          }
        }
      };

      ({ data, error } = await supabase.auth.signUp(signUpData));
      
      if (error) throw error;
      
      console.log("✅ Usuario registrado. Metadata:", data.user?.user_metadata);
      

        const user = data?.user;
        if (user) {
          setUser(user);
          
          // 🎯 useGameData.js manejará el código de referido desde user_metadata
          console.log("🔍 Metadata del usuario al iniciar sesión:", user.user_metadata);

          toast({
            title: "🎮 ¡Bienvenido de nuevo!",
            description: "Sesión iniciada correctamente. Tus datos se están sincronizando.",
            duration: 3000,
          });
          playSound?.("reward");
          setShowAuth(false);
        }
      }
    } catch (err) {
      console.error("❌ Error en AuthModal:", err);
      
      let errorMessage = err.message || "Error al autenticarte";
      if (err.message.includes("Invalid login credentials")) {
        errorMessage = "Correo o contraseña incorrectos";
      } else if (err.message.includes("Email not confirmed")) {
        errorMessage = "Confirma tu correo electrónico antes de iniciar sesión";
      } else if (err.message.includes("User already registered")) {
        errorMessage = "Este correo ya está registrado";
      } else if (err.message.includes("Password should be at least 6 characters")) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres";
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
    setRegistrationSuccess(false);
    playSound?.("uiClose");
  };

  if (!showAuth) return null;

  return (
    <motion.div
      className="fixed inset-0 modal-backdrop flex items-center justify-center p-4 z-50 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="modal-content rounded-xl p-6 w-full max-w-md bg-gradient-to-br from-card to-card/80 shadow-2xl border border-border/50"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
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

        {/* 🎯 BANNER DE REGISTRO EXITOSO */}
        {mode === "register" && registrationSuccess && (
          <motion.div 
            className="mb-4 p-3 bg-gradient-to-r from-green-900/80 to-emerald-800/80 border border-green-500/50 rounded-lg backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-green-100 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">
                ¡Registro Exitoso! ✅
              </span>
            </div>
            <p className="text-xs text-green-200">
              Te enviamos un correo de confirmación a <strong>{email}</strong>. 
              Revisa tu bandeja de entrada y spam, luego inicia sesión.
            </p>
          </motion.div>
        )}

        {/* 🎯 BANNER DE REFERIDO */}
        {mode === "register" && referralCode && !registrationSuccess && (
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
              Estás siendo invitado por un amigo. Al registrarte recibirás <strong>+10 CROC tokens y +1000 monedas</strong> de bonificación.
            </p>
            <div className="mt-2 pt-2 border-t border-green-500/30">
              <p className="text-[10px] text-green-300">
                Código de referido: <code className="bg-black/30 px-2 py-1 rounded">{referralCode}</code>
              </p>
            </div>
          </motion.div>
        )}

        {/* 🔹 Formulario */}
        {!registrationSuccess ? (
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
        ) : (
          // 🎯 PANTALLA DE REGISTRO EXITOSO
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-green-400 mb-2">¡Cuenta Creada Exitosamente!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Te hemos enviado un correo de confirmación a <strong>{email}</strong>. 
                Por favor, verifica tu bandeja de entrada y sigue las instrucciones.
              </p>
            </div>

            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300">
                💡 <strong>Importante:</strong> Debes confirmar tu correo antes de poder iniciar sesión.
              </p>
            </div>

            <Button
              onClick={() => {
                setMode("login");
                setRegistrationSuccess(false);
                playSound?.("uiClick");
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Lock className="w-4 h-4 mr-2" />
              Ir a Iniciar Sesión
            </Button>
          </div>
        )}

        {/* 🔐 Información de seguridad */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-xs text-center text-muted-foreground/70">
            🔒 Tus datos están protegidos con encriptación de última generación
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}