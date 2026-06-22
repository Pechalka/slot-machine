// components/SoundToggleButton.js
import * as PIXI from 'pixi.js';

export function createSoundToggleButton(app, onToggle, initialMuted = false) {
  let isMuted = initialMuted;
  const radius = 22;
  const container = new PIXI.Container();
  container.zIndex = 1000;

  const bg = new PIXI.Graphics();
  bg.beginFill(0x000000, 0.6);
  bg.drawCircle(0, 0, radius);
  bg.endFill();
  container.addChild(bg);

  const text = new PIXI.Text('🔊', {
    fontSize: 28,
    fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
  });
  text.anchor.set(0.5);
  text.position.set(0, 0);
  container.addChild(text);

  container.eventMode = 'static';
  container.cursor = 'pointer';

  const update = (muted) => {
    isMuted = muted;
    text.text = muted ? '🔇' : '🔊';
  };

  container.on('pointertap', () => {
    const newMuted = !isMuted;
    update(newMuted);
    if (onToggle) onToggle(newMuted);
  });

  const position = () => {
    container.x = app.screen.width - radius - 20;
    container.y = radius + 20;
  };
  position();
  app.renderer.on('resize', position);

  app.stage.addChild(container);

  update(initialMuted);

  return {
    update,
    destroy: () => {
      container.destroy({ children: true });
    },
  };
}
