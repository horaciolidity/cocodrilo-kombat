// useSound.js - Versión con sonidos del sistema
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Sonidos del sistema usando la Web Audio API
const createSystemSound = (frequency = 440, duration = 0.1, type = 'sine') => {
  return () => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;
    
    try {
      // Crear contexto de audio
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Crear oscilador y nodo de ganancia
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Conectar los nodos
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar el sonido
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      // Configurar volumen (suave)
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
      
      // Reproducir
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
      
      // Cerrar el contexto después de reproducir (para móviles)
      setTimeout(() => {
        audioContext.close();
      }, duration * 1000 + 100);
      
    } catch (error) {
      console.warn('❌ Error creando sonido del sistema:', error);
      
      // Fallback: usar el método antiguo de beep
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.connect(context.destination);
        oscillator.frequency.value = frequency;
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
      } catch (fallbackError) {
        console.warn('❌ Fallback de sonido también falló:', fallbackError);
      }
    }
  };
};

// Sonidos del sistema personalizados
const systemSounds = {
  // Mordida fuerte (tono bajo)
  bite: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(150, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.2);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  },
  
  // Click simple
  click: createSystemSound(800, 0.05, 'square'),
  
  // Upgrade (tono ascendente)
  upgrade: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(300, context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(600, context.currentTime + 0.3);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.4);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.4);
  },
  
  // Recompensa (tonos alegres)
  reward: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Melodía simple: Do-Mi-Sol
    oscillator.frequency.setValueAtTime(523.25, context.currentTime); // Do
    oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // Mi
    oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // Sol
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  },
  
  // Error (tono bajo y molesto)
  error: createSystemSound(200, 0.3, 'sawtooth'),
  
  // Logro (fanfarria simple)
  achievement: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Fanfarria: Do-Mi-Sol-Do alto
    oscillator.frequency.setValueAtTime(261.63, context.currentTime); // Do
    oscillator.frequency.setValueAtTime(329.63, context.currentTime + 0.1); // Mi
    oscillator.frequency.setValueAtTime(392.00, context.currentTime + 0.2); // Sol
    oscillator.frequency.setValueAtTime(523.25, context.currentTime + 0.3); // Do alto
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.8);
  },
  
  // Subida de nivel (tono ascendente dramático)
  levelUp: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(261.63, context.currentTime); // Do
    oscillator.frequency.linearRampToValueAtTime(523.25, context.currentTime + 0.2); // Do alto
    oscillator.frequency.linearRampToValueAtTime(1046.50, context.currentTime + 0.4); // Do más alto
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.6);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.6);
  },
  
  // Misión completada
  missionComplete: createSystemSound(800, 0.3, 'square'),
  
  // Carta obtenida
  cardGet: createSystemSound(400, 0.2, 'sine'),
  
  // Compra
  buy: createSystemSound(200, 0.1, 'square'),
  
  // Equipar
  equip: createSystemSound(500, 0.1, 'sine'),
  
  // Power up
  powerUp: createSystemSound(700, 0.3, 'sawtooth'),
  
  // Click de UI
  uiClick: createSystemSound(1200, 0.05, 'square'),
  
  // Cierre de UI
  uiClose: createSystemSound(600, 0.05, 'square'),
  
  // Login (tono de bienvenida)
  login: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(659.25, context.currentTime); // Mi
    oscillator.frequency.setValueAtTime(830.61, context.currentTime + 0.1); // Sol#
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  },
  
  // Logout
  logout: createSystemSound(200, 0.3, 'sine'),
  
  // Reset
  reset: createSystemSound(100, 0.5, 'sawtooth'),
  
  // Hito
  milestone: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Secuencia épica
    oscillator.frequency.setValueAtTime(392.00, context.currentTime); // Sol
    oscillator.frequency.setValueAtTime(523.25, context.currentTime + 0.2); // Do
    oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.4); // Mi
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 1);
  },
  
  // Notificación
  notification: createSystemSound(1000, 0.1, 'sine'),
  
  // Éxito
  success: () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Acorde de éxito
    oscillator.frequency.setValueAtTime(523.25, context.currentTime); // Do
    oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.1); // Mi
    oscillator.frequency.setValueAtTime(783.99, context.currentTime + 0.2); // Sol
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  }
};

// Versión simplificada para móviles/fallback
const simpleSounds = {
  bite: () => { try { new AudioContext().createOscillator().start().stop(); } catch(e) {} },
  click: () => { try { new AudioContext().createOscillator().start().stop(); } catch(e) {} },
  upgrade: () => { console.log('🔊 Sonido de upgrade'); },
  reward: () => { console.log('🔊 Sonido de reward'); },
  error: () => { console.log('🔊 Sonido de error'); },
  achievement: () => { console.log('🔊 Sonido de achievement'); },
  levelUp: () => { console.log('🔊 Sonido de levelUp'); },
  missionComplete: () => { console.log('🔊 Sonido de missionComplete'); },
  cardGet: () => { console.log('🔊 Sonido de cardGet'); },
  buy: () => { console.log('🔊 Sonido de buy'); },
  equip: () => { console.log('🔊 Sonido de equip'); },
  powerUp: () => { console.log('🔊 Sonido de powerUp'); },
  uiClick: () => { console.log('🔊 Sonido de uiClick'); },
  uiClose: () => { console.log('🔊 Sonido de uiClose'); },
  login: () => { console.log('🔊 Sonido de login'); },
  logout: () => { console.log('🔊 Sonido de logout'); },
  reset: () => { console.log('🔊 Sonido de reset'); },
  milestone: () => { console.log('🔊 Sonido de milestone'); },
  notification: () => { console.log('🔊 Sonido de notification'); },
  success: () => { console.log('🔊 Sonido de success'); },
};

export function useSound() {
  const [soundEnabled] = useLocalStorage('cocodriloKombatSoundEnabled', true);

  const playSound = (soundName) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    
    try {
      // Verificar si la Web Audio API está disponible
      if (window.AudioContext || window.webkitAudioContext) {
        const soundFunction = systemSounds[soundName];
        if (soundFunction) {
          soundFunction();
        }
      } else {
        // Fallback simple
        const simpleSound = simpleSounds[soundName];
        if (simpleSound) simpleSound();
      }
    } catch (error) {
      console.warn(`❌ Error reproduciendo sonido "${soundName}":`, error);
      
      // Intentar con el método más simple
      try {
        simpleSounds[soundName]?.();
      } catch (fallbackError) {
        console.warn(`❌ Fallback también falló para "${soundName}"`);
      }
    }
  };

  return { playSound };
}