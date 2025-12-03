import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Settings, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Lock,
  Shield,
  Database,
  Cloud,
  CloudOff,
  AlertTriangle,
  CheckCircle,
  UserCircle2,
  Mail,
  Calendar,
  Globe,
  Bell,
  BellOff,
  HelpCircle,
  Download,
  Upload,
  Server,
  HardDrive,
  Cpu,
  Network
} from "lucide-react";
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
  syncGameData,
  gameData
}) {
  // 🔧 Estados locales
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // 🔄 Sincronización manual - MEJORADA
  const handleManualSync = async () => {
    setIsSyncing(true);
    playSound("uiClick");
    
    try {
      await syncGameData();
      
      toast({
        title: "✅ Sincronización Exitosa",
        description: "Todos tus datos han sido guardados en la nube.",
        duration: 3000,
      });
      
      playSound("reward");
    } catch (error) {
      console.error("❌ Error en sincronización:", error);
      
      toast({
        title: "⚠️ Error de Sincronización",
        description: "No se pudieron guardar los datos. Revisa tu conexión.",
        variant: "destructive",
        duration: 4000,
      });
      
      playSound("error");
    } finally {
      setIsSyncing(false);
    }
  };

  // 🛡️ Verificar integridad de datos
  const handleVerifyIntegrity = () => {
    if (gameData?.verifyDataIntegrity) {
      gameData.verifyDataIntegrity();
      playSound("uiClick");
      
      toast({
        title: "🔍 Verificando Integridad",
        description: "Comparando datos locales con el servidor...",
        duration: 2000,
      });
    } else {
      toast({
        title: "⚠️ Función no disponible",
        description: "El sistema de verificación no está configurado.",
        variant: "destructive",
      });
    }
  };

  // 🎵 Alternar sonido
  const handleSoundToggle = () => {
    const newSoundState = !soundEnabled;
    setSoundEnabled(newSoundState);
    playSound(newSoundState ? "uiClick" : "uiClose");
    
    // Guardar preferencia en localStorage
    localStorage.setItem("cocodriloKombat_soundEnabled", newSoundState);
    
    toast({
      title: newSoundState ? "🔊 Sonido Activado" : "🔇 Sonido Desactivado",
      description: newSoundState 
        ? "Los efectos de sonido están ahora activos." 
        : "Los efectos de sonido están silenciados.",
      duration: 2000,
    });
  };

  // 📚 Mostrar tutorial
  const handleShowTutorial = () => {
    setShowTutorial(true);
    playSound("uiClick");
    
    toast({
      title: "🎓 Tutorial",
      description: "Revive el tutorial paso a paso.",
      duration: 2000,
    });
  };

  // 🚨 Reiniciar progreso - CONFIRMACIÓN MEJORADA
  const handleResetProgress = () => {
    playSound("warning");
    
    const confirmed = window.confirm(
      "⚠️ ¿ESTÁS ABSOLUTAMENTE SEGURO?\n\n" +
      "Esta acción eliminará:\n" +
      "• Todas tus monedas y mejoras\n" +
      "• Tus tokens CROC\n" +
      "• Tu progreso de misiones y logros\n" +
      "• Todos los ítems y cartas obtenidas\n" +
      "• Tu nivel y experiencia\n\n" +
      "¿Quieres continuar? Esta acción NO se puede deshacer."
    );
    
    if (confirmed) {
      resetProgress();
      playSound("reset");
      
      toast({
        title: "🔄 Progreso Reiniciado",
        description: "¡Comienza una nueva aventura desde cero!",
        duration: 4000,
      });
    } else {
      playSound("uiClose");
    }
  };

  // 🪪 Alternar notificaciones
  const handleNotificationsToggle = () => {
    const newNotificationsState = !notificationsEnabled;
    setNotificationsEnabled(newNotificationsState);
    playSound("uiClick");
    
    localStorage.setItem("cocodriloKombat_notificationsEnabled", newNotificationsState);
    
    toast({
      title: newNotificationsState ? "🔔 Notificaciones Activadas" : "🔕 Notificaciones Desactivadas",
      description: newNotificationsState 
        ? "Recibirás notificaciones de eventos importantes." 
        : "Las notificaciones están desactivadas.",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-4xl mx-auto">
        {/* 🏁 Encabezado */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3 gradient-text">
            ⚙️ Configuración del Juego
          </h1>
          <p className="text-muted-foreground">
            Gestiona tu cuenta, preferencias y ajustes del sistema
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* 👤 Sección de Usuario */}
          <UserSection
            user={user}
            logout={logout}
            setShowAuth={setShowAuth}
            playSound={playSound}
            toast={toast}
          />

          {/* 🎮 Configuración del Juego */}
          <GameSettingsSection
            soundEnabled={soundEnabled}
            onSoundToggle={handleSoundToggle}
            onShowTutorial={handleShowTutorial}
            notificationsEnabled={notificationsEnabled}
            onNotificationsToggle={handleNotificationsToggle}
          />

          {/* ☁️ Sincronización y Datos */}
          <SyncDataSection
            gameData={gameData}
            isSyncing={isSyncing}
            onManualSync={handleManualSync}
            onVerifyIntegrity={handleVerifyIntegrity}
            playSound={playSound}
            toast={toast}
          />

          {/* 🔑 Cambio de Contraseña */}
          {user && (
            <ChangePasswordSection 
              toast={toast} 
              playSound={playSound} 
            />
          )}

          {/* ⚠️ Zona Peligrosa */}
          <DangerZoneSection 
            onResetProgress={handleResetProgress}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
          />
        </div>
      </div>
    </div>
  );
}

/* ===================== Subcomponentes ===================== */

// 👤 Sección de Usuario
function UserSection({ user, logout, setShowAuth, playSound, toast }) {
  const handleAuthClick = () => {
    setShowAuth(true);
    playSound("uiClick");
  };

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      playSound("uiClick");
      toast({
        title: "📋 ID Copiado",
        description: "El ID de usuario ha sido copiado al portapapeles.",
        duration: 2000,
      });
    }
  };

  return (
    <motion.div 
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <User className="w-6 h-6 mr-2 text-blue-400" />
        Información de Usuario
      </h3>

      {user ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  Email:
                </span>
                <span className="font-bold text-blue-400 truncate ml-2">
                  {user.email || "No disponible"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Miembro desde:
                </span>
                <span className="text-muted-foreground text-sm">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString("es-AR", {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : "—"}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm">
                  <Globe className="w-4 h-4 mr-2 text-gray-400" />
                  ID de Usuario:
                </span>
                <Button
                  onClick={copyUserId}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-white"
                >
                  {user.id.substring(0, 8)}... ▼
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-lg p-4 border border-blue-700/30">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-300">Cuenta Verificada</span>
              </div>
              <p className="text-xs text-blue-200">
                Tu progreso está protegido y sincronizado con la nube.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                logout();
                playSound("uiClose");
              }}
              variant="destructive"
              className="flex-1 mobile-button"
            >
              Cerrar Sesión
            </Button>
            
            <Button
              onClick={copyUserId}
              variant="outline"
              className="flex-1 mobile-button"
            >
              <UserCircle2 className="w-4 h-4 mr-2" />
              Copiar ID
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-500" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-semibold">Modo Invitado</p>
            <p className="text-sm text-muted-foreground">
              Tu progreso no se guardará hasta que inicies sesión.
            </p>
          </div>
          
          <Button
            onClick={handleAuthClick}
            className="w-full mobile-button bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          >
            Iniciar Sesión / Registrarse
          </Button>
          
          <p className="text-xs text-gray-500">
            Al crear una cuenta obtienes: Guardado automático, Ranking global, y Programa de referidos.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// 🎮 Configuración del Juego
function GameSettingsSection({ 
  soundEnabled, 
  onSoundToggle, 
  onShowTutorial,
  notificationsEnabled,
  onNotificationsToggle 
}) {
  return (
    <motion.div 
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Settings className="w-6 h-6 mr-2 text-purple-400" />
        Preferencias del Juego
      </h3>

      <div className="space-y-4">
        {/* 🎵 Sonido */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center">
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 mr-3 text-green-400" />
            ) : (
              <VolumeX className="w-5 h-5 mr-3 text-red-400" />
            )}
            <div>
              <p className="font-medium">Efectos de Sonido</p>
              <p className="text-xs text-muted-foreground">
                {soundEnabled ? "Sonidos activados" : "Sonidos desactivados"}
              </p>
            </div>
          </div>
          <Button
            onClick={onSoundToggle}
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            className="w-20"
          >
            {soundEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        {/* 🔔 Notificaciones */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 mr-3 text-green-400" />
            ) : (
              <BellOff className="w-5 h-5 mr-3 text-red-400" />
            )}
            <div>
              <p className="font-medium">Notificaciones</p>
              <p className="text-xs text-muted-foreground">
                {notificationsEnabled ? "Notificaciones activas" : "Notificaciones silenciadas"}
              </p>
            </div>
          </div>
          <Button
            onClick={onNotificationsToggle}
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            className="w-20"
          >
            {notificationsEnabled ? "ON" : "OFF"}
          </Button>
        </div>

        {/* 🎓 Tutorial */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
          <div className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-3 text-blue-400" />
            <div>
              <p className="font-medium">Tutorial</p>
              <p className="text-xs text-muted-foreground">
                Revive la guía de inicio del juego
              </p>
            </div>
          </div>
          <Button
            onClick={onShowTutorial}
            variant="outline"
            size="sm"
          >
            Ver Tutorial
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ☁️ Sincronización y Datos
function SyncDataSection({ 
  gameData, 
  isSyncing, 
  onManualSync, 
  onVerifyIntegrity,
  playSound,
  toast 
}) {
  const lastSync = gameData?.lastSync;
  const syncInProgress = gameData?.syncInProgress || false;

  // 📥 Exportar datos locales
  const handleExportData = () => {
    try {
      const exportData = {
        gameData: {
          gameState: gameData?.gameState,
          upgrades: gameData?.upgrades,
          missions: gameData?.missions,
          ownedCards: gameData?.ownedCards,
          ownedItems: gameData?.ownedItems,
          achievementsUnlocked: gameData?.achievementsUnlocked,
          farmingMilestones: gameData?.farmingMilestones,
        },
        metadata: {
          exportedAt: new Date().toISOString(),
          version: "1.0",
          playerId: gameData?.player?.id
        }
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `cocodrilo-kombat-backup-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      playSound("reward");
      toast({
        title: "📥 Datos Exportados",
        description: "Tu progreso se ha descargado como archivo JSON.",
        duration: 3000,
      });
    } catch (error) {
      console.error("❌ Error exportando datos:", error);
      playSound("error");
      toast({
        title: "⚠️ Error al Exportar",
        description: "No se pudieron exportar los datos.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div 
      className="stats-card rounded-xl p-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <Database className="w-6 h-6 mr-2 text-emerald-400" />
        Datos y Sincronización
      </h3>

      <div className="space-y-4">
        {/* 📊 Estado de sincronización */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {syncInProgress ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4 mr-2 text-blue-400" />
                </motion.div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              )}
              <span className="text-sm font-medium">
                {syncInProgress ? "Sincronizando..." : "Sincronizado"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {lastSync ? new Date(lastSync).toLocaleTimeString() : "Nunca"}
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <motion.div 
              className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
              animate={{ 
                width: syncInProgress ? ["0%", "100%", "0%"] : "100%"
              }}
              transition={{ 
                repeat: syncInProgress ? Infinity : 0,
                duration: 2,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* 🔄 Acciones de sincronización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={onManualSync}
            disabled={isSyncing || syncInProgress}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {isSyncing ? "Sincronizando..." : "Sincronizar Ahora"}
          </Button>

          <Button
            onClick={onVerifyIntegrity}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Verificar Integridad
          </Button>

          <Button
            onClick={handleExportData}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Datos
          </Button>

          <Button
            variant="outline"
            disabled
            className="flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
          >
            <HardDrive className="w-4 h-4" />
            Importar Datos (próximamente)
          </Button>
        </div>

        {/* ℹ️ Información del sistema */}
        <div className="p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg border border-blue-700/30">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold">Estado del Sistema</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Conexión:</span>
              <span className="flex items-center text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Online
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Base de datos:</span>
              <span className="text-green-400">Supabase</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Arquitectura:</span>
              <span className="text-blue-400">Centralizada</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Última sincronización:</span>
              <span className="text-gray-300">
                {lastSync ? new Date(lastSync).toLocaleTimeString() : "Nunca"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 🔑 Cambio de Contraseña
function ChangePasswordSection({ toast, playSound }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    playSound("uiClick");

    if (newPassword.length < 6) {
      toast({
        title: "⚠️ Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      playSound("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "⚠️ Las contraseñas no coinciden",
        description: "Por favor, verifica que ambas contraseñas sean iguales.",
        variant: "destructive",
      });
      playSound("error");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) throw error;

      toast({
        title: "✅ Contraseña actualizada",
        description: "Tu nueva contraseña fue guardada exitosamente.",
      });
      
      playSound("reward");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (err) {
      console.error("❌ Error actualizando contraseña:", err);
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
    <motion.div 
      className="stats-card rounded-xl p-6 border border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-cyan-900/10"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-xl font-bold mb-4 flex items-center text-blue-400">
        <Lock className="w-6 h-6 mr-2" />
        Seguridad de la Cuenta
      </h3>

      <form onSubmit={handleChangePassword} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Confirmar Contraseña
            </label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Repite tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg p-3 border border-blue-700/30">
          <p className="text-xs text-blue-300 flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Tu contraseña se actualiza de forma segura en Supabase Auth.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold"
          disabled={loading || !newPassword || !confirmPassword}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              Actualizando...
            </div>
          ) : (
            "Actualizar Contraseña"
          )}
        </Button>
      </form>
    </motion.div>
  );
}

// ⚠️ Zona Peligrosa
function DangerZoneSection({ onResetProgress, showAdvanced, setShowAdvanced }) {
  return (
    <motion.div 
      className="stats-card rounded-xl p-6 border-2 border-red-500/30 bg-gradient-to-br from-red-900/10 to-orange-900/10"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center text-red-400">
          <AlertTriangle className="w-6 h-6 mr-2" />
          Zona de Alto Riesgo
        </h3>
        
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="ghost"
          size="sm"
          className="text-xs text-red-300 hover:text-red-200"
        >
          {showAdvanced ? "Ocultar opciones" : "Mostrar opciones avanzadas"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="p-3 bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-lg border border-red-700/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-200">
              <span className="font-bold">ADVERTENCIA:</span> Las acciones en esta sección son IRREVERSIBLES y pueden afectar permanentemente tu progreso.
            </p>
          </div>
        </div>

        {/* 🚨 Botón principal de reinicio */}
        <div className="space-y-3">
          <Button
            onClick={onResetProgress}
            variant="destructive"
            className="w-full mobile-button py-6 text-lg font-bold shadow-lg shadow-red-900/30"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            REINICIAR TODO EL PROGRESO
          </Button>
          
          <p className="text-xs text-red-300 text-center">
            Esta acción elimina TODO tu progreso y no se puede deshacer.
          </p>
        </div>

        {/* 🔧 Opciones avanzadas */}
        {showAdvanced && (
          <motion.div 
            className="space-y-3 pt-4 border-t border-red-800/30"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p className="text-sm font-semibold text-orange-400">Opciones Avanzadas:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                disabled
              >
                <HardDrive className="w-4 h-4 mr-2" />
                Limpiar Caché Local
              </Button>
              
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                disabled
              >
                <Network className="w-4 h-4 mr-2" />
                Forzar Resincronización
              </Button>
              
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                disabled
              >
                <Cpu className="w-4 h-4 mr-2" />
                Debug del Sistema
              </Button>
              
              <Button
                variant="outline"
                className="border-red-700 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                disabled
              >
                <CloudOff className="w-4 h-4 mr-2" />
                Desconectar de la Nube
              </Button>
            </div>
            
            <div className="p-2 bg-gradient-to-r from-gray-900/30 to-gray-800/30 rounded border border-gray-700/50">
              <p className="text-xs text-gray-400 text-center">
                ⚙️ Las opciones avanzadas estarán disponibles en futuras actualizaciones.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}