import { Text } from 'pixi.js';

export function createFreeSpinsCounter(app) {
  const text = new Text('Free Spins: 0', {
    fontSize: 32,
    fill: 0xffd700,
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

  const showCounter = (freeSpinsLeft) => {
    text.visible = true;
    text.text = `Free Spins: ${freeSpinsLeft}`;
  };

  // Скрываем счётчик в состояниях, где фриспины не активны
  const hideCounter = () => {
    text.visible = false;
  };

  const updateValue = (freeSpinsLeft) => {
    text.text = `Free Spins: ${freeSpinsLeft}`;
    if (text.visible) {
      text.text = `Free Spins: ${freeSpinsLeft}`;
    }
  };


  app.renderer.on('resize', position);
  app.stage.addChild(text);

  return {
    hideCounter,
    showCounter,
    updateValue,
  };
}
