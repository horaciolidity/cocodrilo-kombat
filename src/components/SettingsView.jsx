
import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Settings, Volume2, VolumeX, RefreshCw } from 'lucide-react';

export function SettingsView({ user, logout, setShowAuth, soundEnabled, setSoundEnabled, setShowTutorial, resetProgress, playSound }) {
  
  const handleSoundToggle = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      playSound('uiClick'); 
    }
  };

  const handleShowTutorial = () => {
    setShowTutorial(true);
    playSound('uiClick');
  };
  
  const handleResetProgress = () => {
    if(window.confirm("¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.")) {
        resetProgress();
        playSound('reset');
    } else {
        playSound('uiClose');
    }
  };


  return (
    <div className="min-h-screen game-bg p-4 mobile-padding">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center gradient-text">⚙️ Configuración</h1>
        
        <div className="space-y-6">
          <UserSection user={user} logout={logout} setShowAuth={setShowAuth} playSound={playSound} />
          <GameSettingsSection 
            soundEnabled={soundEnabled} 
            onSoundToggle={handleSoundToggle} 
            onShowTutorial={handleShowTutorial} 
          />
          <DangerZoneSection onResetProgress={handleResetProgress} />
        </div>
      </div>
    </div>
  );
}

function UserSection({ user, logout, setShowAuth, playSound }) {
  const handleAuthClick = () => {
    setShowAuth(true);
    playSound('uiClick');
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
            <span className="font-bold text-blue-400">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Miembro desde:</span>
            <span className="text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Button onClick={logout} variant="destructive" className="w-full mobile-button">
            Cerrar Sesión
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No has iniciado sesión</p>
          <Button onClick={handleAuthClick} className="w-full mobile-button bg-primary hover:bg-primary/90">
            Iniciar Sesión / Registrarse
          </Button>
        </div>
      )}
    </div>
  );
}

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
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
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

function DangerZoneSection({ onResetProgress }) {
  return (
    <div className="stats-card rounded-xl p-6 border-red-500/30">
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
