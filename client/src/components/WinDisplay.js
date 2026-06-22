import { Text } from 'pixi.js';

export function createWinDisplay(app) {
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

  // Позиция: центр по горизонтали, отступ от низа
  const position = () => {
    text.x = app.screen.width / 2;
    text.y = app.screen.height - 40;
  };
  position();

  text.visible = false;
  app.stage.addChild(text);

  const show = (winAmount) => {
    text.text = `🎉 +${winAmount}`;
    text.visible = true;
  }

  const hide = () => {
    text.visible = false;
  }


  app.renderer.on('resize', position);

  return {
    show,
    hide
  };
}
