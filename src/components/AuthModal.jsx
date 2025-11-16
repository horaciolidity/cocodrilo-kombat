import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function AuthModal({ showAuth, setShowAuth, setUser, toast, playSound }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("login"); // "login" o "register"

  // ✅ Genera un username único (por ejemplo: cocodrilo123)
  const generateUsername = (base = "player") =>
    `${base}${Math.floor(Math.random() * 9000 + 1000)}`;

  // 🔐 Maneja login o registro
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    playSound?.("uiClick");

    try {
      let data, error;

      if (mode === "register") {
        ({ data, error } = await supabase.auth.signUp({
          email,
          options: { emailRedirectTo: window.location.origin },
        }));

        if (error) throw error;

        // 🧍 Crear entrada en 'players'
        const userId = data.user?.id;
        if (userId) {
          const username = generateUsername("croc");
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
          title: "🐊 Cuenta creada",
          description:
            "Te enviamos un correo para verificar tu cuenta (opcional). ¡Ya podés jugar!",
          duration: 5000,
        });
        playSound?.("reward");
        setShowAuth(false);
      } else {
        ({ error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        }));

        if (error) throw error;

        toast({
          title: "📩 Enlace enviado",
          description: "Revisá tu correo para acceder sin contraseña.",
          duration: 4000,
        });
        playSound?.("reward");
        setShowAuth(false);
      }

      // 🔁 Actualiza usuario local si ya está logueado
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user) {
        setUser(session.session.user);
        localStorage.setItem(
          "cocodriloKombatUser",
          JSON.stringify(session.session.user)
        );
      }
    } catch (err) {
      console.error("Error en AuthModal:", err);
      toast({
        title: "⚠️ Error",
        description: err.message,
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
            <label className="block text-sm font-medium mb-2 text-foreground">
              Correo electrónico
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@gmail.com"
              required
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Mail className="w-4 h-4 mr-2" />
            {loading
              ? "Procesando..."
              : mode === "login"
              ? "Enviar enlace de acceso"
              : "Registrarme"}
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
