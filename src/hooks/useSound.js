
import { Howl } from 'howler';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const soundFiles = {
  click: '/sounds/click.mp3',
  upgrade: '/sounds/upgrade.mp3',
  reward: '/sounds/reward.mp3',
  error: '/sounds/error.mp3',
  achievement: '/sounds/achievement.mp3',
  levelUp: '/sounds/levelUp.mp3',
  missionComplete: '/sounds/missionComplete.mp3',
  cardGet: '/sounds/cardGet.mp3',
  buy: '/sounds/buy.mp3',
  equip: '/sounds/equip.mp3',
  powerUp: '/sounds/powerUp.mp3',
  uiClick: '/sounds/ui_click.mp3',
  uiClose: '/sounds/ui_close.mp3',
  login: '/sounds/login.mp3',
  logout: '/sounds/logout.mp3',
  reset: '/sounds/reset.mp3',
  milestone: '/sounds/milestone.mp3',
  notification: '/sounds/notification.mp3',
  success: '/sounds/success.mp3',
};

const sounds = {};

Object.keys(soundFiles).forEach(key => {
  sounds[key] = new Howl({
    src: [soundFiles[key]],
    volume: 0.3, 
  });
});

export function useSound() {
  const [soundEnabled] = useLocalStorage('cocodriloKombatSoundEnabled', true);

  const playSound = (soundName) => {
    if (soundEnabled && sounds[soundName]) {
      sounds[soundName].play();
    }
  };

  return { playSound };
}
