// src/components/AuthModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" | "register"

  // Genera nombre de usuario único
  const generateUsername = (base = "croc") =>
    `${base}${Math.floor(Math.random() * 9000 + 1000)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    playSound?.("uiClick");

    try {
      let data, error;

      if (mode === "register") {
        // 🧾 Crear cuenta con email + password
        ({ data, error } = await supabase.auth.signUp({
          email,
          password,
        }));
        if (error) throw error;

        // Crear jugador en tabla players
        const userId = data.user?.id;
        if (userId) {
          const username = generateUsername(email.split("@")[0]);
          const { error: insertError } = await supabase.from("players").insert([
            {
              user_id: userId,
              username,
              avatar_url: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${username}`,
            },
          ]);
          if (insertError) console.error("Error al crear perfil:", insertError);
        }

        toast({
          title: "✅ Cuenta creada",
          description: "Ya podés iniciar sesión con tu correo y contraseña.",
          duration: 4000,
        });
        playSound?.("reward");
        setMode("login");
      } else {
        // 🔐 Iniciar sesión
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
            title: "🎮 Bienvenido de nuevo",
            description: "Sesión iniciada correctamente.",
            duration: 3000,
          });
          playSound?.("reward");
          setShowAuth(false);
        }
      }
    } catch (err) {
      console.error("❌ Error en AuthModal:", err);
      toast({
        title: "⚠️ Error",
        description: err.message || "Error al autenticarte",
        variant: "destructive",
        duration: 4000,
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
        {/* 🔹 Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
          </h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="mobile-button"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 🔹 Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Correo electrónico
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@gmail.com"
              required
              disabled={loading}
              className="w-full bg-input border border-border text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">
              Contraseña
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="w-full bg-input border border-border text-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {loading ? (
              <>
                <Mail className="w-4 h-4 mr-2 animate-pulse" />
                Procesando...
              </>
            ) : mode === "login" ? (
              <>
                <Lock className="w-4 h-4 mr-2" /> Iniciar Sesión
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" /> Registrarme
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground mt-3">
            {mode === "login" ? (
              <>
                ¿No tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-primary font-medium hover:underline"
                >
                  Registrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary font-medium hover:underline"
                >
                  Iniciar sesión
                </button>
              </>
            )}
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
