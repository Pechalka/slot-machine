import { sound } from '@pixi/sound';

const STORAGE_KEY = 'slot_sound_muted';
let muted = false;

export const soundManager = {
  async load() {
    sound.add('click', '/assets/sounds/sound1.mp3');
    sound.add('stop', '/assets/sounds/sound2.mp3');
    sound.add('win', '/assets/sounds/sound3.mp3');
    sound.add('bg', '/assets/sounds/sound5.mp3');

    // Восстанавливаем состояние из localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    muted = saved === 'true';
    // Применяем mute к звуковому движку
    sound.mute = muted;
  },

  play(name, options = {}) {
    if (muted) return;
    sound.play(name, { volume: 0.5, ...options });
  },

  playBg() {
    if (muted) return;
    sound.play('bg', { volume: 0.3, loop: true });
  },

  isMuted() {
    return muted;
  },

  setMuted(value) {
    muted = Boolean(value);
    localStorage.setItem(STORAGE_KEY, String(muted));
    sound.mute = muted;
    if (!muted) {
      // Если звук включаем, перезапускаем фон
      this.playBg();
    } else {
      // Если выключаем, останавливаем все
      sound.stopAll();
    }
  },
};
