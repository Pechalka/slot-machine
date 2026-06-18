import { Text } from 'pixi.js';
import { onState, onField } from '../xstate-subscribers.js';

export function createFreeSpinsCounter(actor, app) {
  const text = new Text('Free Spins: 0', {
    fontSize: 32,
    fill: 0xFFD700,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    stroke: 0x000000,
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 6,
    dropShadowDistance: 3,
  });
  text.anchor.set(0, 0.5);
  text.visible = false;

  const position = () => {
    text.x = 20;
    text.y = app.screen.height / 2;
  };
  position();

const showCounter = () => {
    const ctx = actor.getSnapshot().context;
    if (ctx.freeSpinsLeft > 0) {
      text.visible = true;
      text.text = `Free Spins: ${ctx.freeSpinsLeft}`;
    }
  };

  // Скрываем счётчик в состояниях, где фриспины не активны
  const hideCounter = () => {
    text.visible = false;
  };

  // Подписки на состояния
  onState(actor, 'freeSpins.spinning', showCounter);
  onState(actor, 'freeSpins.result', hideCounter);
  onState(actor, 'idle', hideCounter);

  // Обновление счётчика при изменении freeSpinsLeft (только если видим)
  onField(actor, 'freeSpinsLeft', (ctx) => {
    if (text.visible) {
      text.text = `Free Spins: ${ctx.freeSpinsLeft}`;
    }
  });

  app.renderer.on('resize', position);
  app.stage.addChild(text);

  return text;
}
