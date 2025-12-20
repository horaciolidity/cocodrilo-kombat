// src/components/AuthModal.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lock, Mail, Sparkles, CheckCircle, Gift, Coins, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  const [showReferralBonus, setShowReferralBonus] = useState(false);

  // 🔍 OBTENER CÓDIGO DE REFERIDO DE LA URL Y LOCALSTORAGE
  useEffect(() => {
    // Primero buscar en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode && /^[A-Z0-9]{8}$/i.test(refCode)) {
      const cleanCode = refCode.toUpperCase();
      console.log('🎯 Código de referencia detectado en URL:', cleanCode);
      
      // Guardar en localStorage
      localStorage.setItem('referral_code_to_process', cleanCode);
      setReferralCode(cleanCode);
      setShowReferralBonus(true);
      
      // Limpiar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Si no hay en URL, verificar en localStorage
      const storedRefCode = localStorage.getItem('referral_code_to_process');
      if (storedRefCode && /^[A-Z0-9]{8}$/.test(storedRefCode)) {
        console.log('🎯 Código de referencia encontrado en localStorage:', storedRefCode);
        setReferralCode(storedRefCode);
        setShowReferralBonus(true);
      }
    }
  }, []);

  // Cuando cambia el modo a registro, verificar si hay código de referido
  useEffect(() => {
    if (mode === "register") {
      const storedRefCode = localStorage.getItem('referral_code_to_process');
      if (storedRefCode && /^[A-Z0-9]{8}$/.test(storedRefCode)) {
        setReferralCode(storedRefCode);
        setShowReferralBonus(true);
      }
    } else {
      setShowReferralBonus(false);
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    playSound?.("uiClick");

    try {
      let data, error;

      if (mode === "register") {
        console.log("🎯 Intentando registro con código de referencia:", referralCode);
        
        // Preparar metadata para el registro
        const metadata = {};
        if (referralCode) {
          metadata.referral_code = referralCode;
          metadata.referred_at = new Date().toISOString();
          console.log("📝 Metadata enviada a Supabase Auth:", metadata);
          
          // Guardar también en localStorage como respaldo
          localStorage.setItem('pending_referral_code', referralCode);
        }

        // Crear cuenta con metadata
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: `${window.location.origin}/`
          }
        }));
        
        if (error) throw error;
        
        console.log("✅ Usuario registrado. Metadata en user:", data.user?.user_metadata);
        console.log("🔍 Datos completos de registro:", data);
        
        // Mostrar éxito
        setRegistrationSuccess(true);
        
        // Mostrar toast con información de bonificaciones si hay código de referido
        if (referralCode) {
          toast({
            title: "🎉 ¡Registro Exitoso con Bonificaciones!",
            description: "Revisa tu correo para confirmar la cuenta. Recibirás +10 CROC y +1000 monedas al confirmar.",
            duration: 6000,
          });
        } else {
          toast({
            title: "🎉 ¡Registro Exitoso!",
            description: "Revisa tu correo para confirmar la cuenta.",
            duration: 5000,
          });
        }
        
        playSound?.("reward");
        
      } else {
        // Modo LOGIN
        ({ data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        }));
        
        if (error) throw error;
        
        const user = data?.user;
        if (user) {
          setUser(user);
          
          // 🎯 Verificar si hay código de referencia pendiente
          const pendingRefCode = localStorage.getItem('pending_referral_code');
          if (pendingRefCode && /^[A-Z0-9]{8}$/.test(pendingRefCode)) {
            console.log("🔗 Código de referencia pendiente encontrado en login:", pendingRefCode);
            
            // Aquí podrías aplicar la lógica para procesar el código si es necesario
            // Por ahora solo lo removemos
            localStorage.removeItem('pending_referral_code');
          }
          
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
    setReferralCode(null);
    setShowReferralBonus(false);
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

        {/* 🎯 BANNER DE REFERIDO - MOSTRAR CUANDO HAY CÓDIGO */}
        {mode === "register" && showReferralBonus && referralCode && !registrationSuccess && (
          <motion.div 
            className="mb-4 p-4 bg-gradient-to-r from-green-900/90 to-emerald-800/90 border-2 border-green-500/60 rounded-xl backdrop-blur-sm shadow-lg"
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-300" />
                <h3 className="text-lg font-bold text-yellow-100">
                  🎁 ¡Invitación Especial!
                </h3>
              </div>
              <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                Código: {referralCode}
              </div>
            </div>
            
            <p className="text-sm text-green-100 mb-3">
              Estás siendo invitado por un amigo. Al crear tu cuenta recibirás:
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-green-800/60 rounded-lg p-3 border border-green-600/40 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-4 h-4 text-yellow-300" />
                  <div className="text-yellow-300 text-sm font-bold">+1,000</div>
                </div>
                <div className="text-xs text-green-200">Monedas de Bienvenida</div>
              </div>
              <div className="bg-green-800/60 rounded-lg p-3 border border-green-600/40 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-emerald-300" />
                  <div className="text-emerald-300 text-sm font-bold">+10 CROC</div>
                </div>
                <div className="text-xs text-green-200">Tokens Gratis</div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-green-500/30">
              <p className="text-xs text-green-300">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Estas bonificaciones se acreditarán automáticamente al confirmar tu correo.
              </p>
            </div>
          </motion.div>
        )}

        {/* 🎯 BANNER DE REGISTRO EXITOSO CON BONIFICACIONES */}
        {mode === "register" && registrationSuccess && (
          <motion.div 
            className="mb-4 p-4 bg-gradient-to-r from-green-900/90 to-emerald-800/90 border-2 border-green-500/60 rounded-xl backdrop-blur-sm"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-green-100 mb-3">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-lg font-bold">
                ¡Registro Exitoso! ✅
              </span>
            </div>
            
            <p className="text-sm text-green-200 mb-3">
              Te enviamos un correo de confirmación a <strong className="text-yellow-300">{email}</strong>. 
            </p>
            
            {referralCode && (
              <>
                <div className="my-3 pt-3 border-t border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm font-bold text-yellow-300">
                      ¡Bonificaciones por Invitación Activas!
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-green-800/50 rounded p-2 text-center">
                      <div className="text-yellow-300 text-xs mb-1">💰 Monedas</div>
                      <div className="text-white font-bold text-sm">+1,000</div>
                    </div>
                    <div className="bg-green-800/50 rounded p-2 text-center">
                      <div className="text-yellow-300 text-xs mb-1">🐊 CROC Tokens</div>
                      <div className="text-white font-bold text-sm">+10</div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-green-300">
                    Estas bonificaciones se acreditarán automáticamente cuando confirmes tu correo.
                  </p>
                </div>
              </>
            )}
            
            <div className="mt-3 pt-3 border-t border-green-500/30">
              <p className="text-xs text-green-300">
                💡 <strong>Importante:</strong> Debes confirmar tu correo antes de poder iniciar sesión.
              </p>
            </div>
          </motion.div>
        )}

        {/* 🔹 Formulario (solo si no está en éxito de registro) */}
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

            {/* Mostrar código de referido si existe */}
            {mode === "register" && referralCode && (
              <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-blue-300">Código de referido detectado</span>
                  </div>
                  <code className="text-xs font-bold bg-black/30 px-2 py-1 rounded text-blue-100">
                    {referralCode}
                  </code>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 transition-all duration-200 shadow-lg"
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
                  Crear Mi Cuenta {referralCode && "con Bonificaciones 🎁"}
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
          // 🎯 PANTALLA DE REGISTRO EXITOSO (alternativa)
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

            {referralCode && (
              <div className="p-3 bg-gradient-to-r from-green-900/40 to-emerald-800/40 rounded-lg border border-green-600/30">
                <p className="text-sm text-green-300 mb-2">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  <strong>¡Bonificaciones activadas!</strong>
                </p>
                <p className="text-xs text-green-200">
                  Al confirmar tu correo recibirás <strong>+10 CROC tokens y +1,000 monedas</strong>.
                </p>
              </div>
            )}

            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <p className="text-xs text-blue-300">
                💡 <strong>Importante:</strong> Debes confirmar tu correo antes de poder iniciar sesión.
              </p>
            </div>

            <Button
              onClick={() => {
                setMode("login");
                setRegistrationSuccess(false);
                setReferralCode(null);
                setShowReferralBonus(false);
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