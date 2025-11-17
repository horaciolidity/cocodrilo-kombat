// src/components/views/SettingsView.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  User,
  Settings,
  Volume2,
  VolumeX,
  RefreshCw,
  Lock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function SettingsView({
  user,
  logout,
  setShowAuth,
  soundEnabled,
  setSoundEnabled,
  setShowTutorial,
  resetProgress,
  playSound,
  toast,
}) {
  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    playSound(soundEnabled ? "uiClose" : "uiClick");
  };

  const handleShowTutorial = () => {
    setShowTutorial(true);
    playSound("uiClick");
  };

  const handleResetProgress = () => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer."
      )
    ) {
      resetProgress();
      playSound("reset");
    } else {
      playSound("uiClose");
    }
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">
          ⚙️ Configuración
        </h1>

        <div className="space-y-6">
          <UserSection
            user={user}
            logout={logout}
            setShowAuth={setShowAuth}
            playSound={playSound}
          />
          <GameSettingsSection
            soundEnabled={soundEnabled}
            onSoundToggle={handleSoundToggle}
            onShowTutorial={handleShowTutorial}
          />
          <ChangePasswordSection toast={toast} playSound={playSound} />
          <DangerZoneSection onResetProgress={handleResetProgress} />
        </div>
      </div>
    </div>
  );
}

/* =========================
   🧍 Sección de usuario
========================= */
function UserSection({ user, logout, setShowAuth, playSound }) {
  const handleAuthClick = () => {
    setShowAuth(true);
    playSound("uiClick");
  };

  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <User className="w-6 h-6 mr-2 text-blue-400" />
        Usuario
      </h3>

      {user ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Email:</span>
            <span className="font-bold text-blue-400">{user.email || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Miembro desde:</span>
            <span className="text-muted-foreground">
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString("es-AR")
                : "—"}
            </span>
          </div>
          <Button
            onClick={() => {
              logout();
              playSound("uiClose");
            }}
            variant="destructive"
            className="w-full mobile-button"
          >
            Cerrar Sesión
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No has iniciado sesión</p>
          <Button
            onClick={handleAuthClick}
            className="w-full mobile-button bg-primary hover:bg-primary/90"
          >
            Iniciar Sesión / Registrarse
          </Button>
        </div>
      )}
    </div>
  );
}

/* =========================
   🎮 Configuración del juego
========================= */
function GameSettingsSection({ soundEnabled, onSoundToggle, onShowTutorial }) {
  return (
    <div className="stats-card rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Settings className="w-6 h-6 mr-2 text-gray-400" />
        Configuración del Juego
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Sonidos</span>
          <Button
            onClick={onSoundToggle}
            variant="outline"
            size="sm"
            className="mobile-button"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span>Tutorial</span>
          <Button
            onClick={onShowTutorial}
            variant="outline"
            size="sm"
            className="mobile-button"
          >
            Mostrar Tutorial
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   🔑 Cambio de contraseña
========================= */
function ChangePasswordSection({ toast, playSound }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    playSound("uiClick");

    if (newPassword !== confirmPassword) {
      toast({
        title: "⚠️ Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      playSound("error");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "✅ Contraseña actualizada",
        description: "Tu nueva contraseña fue guardada correctamente.",
      });
      playSound("reward");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      toast({
        title: "⚠️ Error",
        description: err.message || "No se pudo actualizar la contraseña.",
        variant: "destructive",
      });
      playSound("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stats-card rounded-xl p-6 border border-blue-500/30">
      <h3 className="text-xl font-bold mb-4 flex items-center text-blue-400">
        <Lock className="w-6 h-6 mr-2" />
        Cambiar Contraseña
      </h3>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <Input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <Input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar Contraseña"}
        </Button>
      </form>
    </div>
  );
}

/* =========================
   ⚠️ Zona peligrosa
========================= */
function DangerZoneSection({ onResetProgress }) {
  return (
    <div className="stats-card rounded-xl p-6 border border-red-500/30">
      <h3 className="text-xl font-bold mb-4 flex items-center text-red-400">
        <RefreshCw className="w-6 h-6 mr-2" />
        Zona Peligrosa
      </h3>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Esta acción eliminará todo tu progreso y no se puede deshacer.
        </p>
        <Button
          onClick={onResetProgress}
          variant="destructive"
          className="w-full mobile-button"
        >
          Reiniciar Progreso
        </Button>
      </div>
    </div>
  );
}
