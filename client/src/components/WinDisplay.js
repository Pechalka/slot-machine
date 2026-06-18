import { Text } from 'pixi.js';
import { subscribeStates } from '../xstate-subscribers.js';

export function createWinDisplay(actor, app) {
  const text = new Text('', {
    fontSize: 48,
    fill: 0xFFD700,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    stroke: 0x000000,
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: 0x000000,
    dropShadowBlur: 8,
    dropShadowDistance: 4,
  });
  text.anchor.set(0.5);

  // Позиция: центр по горизонтали, отступ от низа 120px
  const position = () => {
    text.x = app.screen.width / 2;
    text.y = app.screen.height - 40;
  };
  position();

  text.visible = false;
  app.stage.addChild(text);

  subscribeStates(actor, ['winAnimation', 'freeSpins.win'], (ctx) => {
    const winAmount = ctx.spinResult?.win || 0;
    if (winAmount > 0) {
      text.text = `🎉 +${winAmount}`;
      text.visible = true;
    } else {
      text.visible = false;
    }
  });

  subscribeStates(actor, ['idle', 'freeSpins.spinning'], () => {
    text.visible = false;
  });

  app.renderer.on('resize', position);

  return text;
}
