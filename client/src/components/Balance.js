import { Text } from 'pixi.js';
import { onField } from '../xstate-subscribers.js';

export function createBalance(actor, app) {
  const offsetX = 20;
  const text = new Text('0', {
    fontSize: 32,
    fill: 0xFFD700,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  });
  text.anchor.set(0, 1);

  const position = () => {
    text.x = offsetX;
    text.y = app.screen.height - 20;
  };

  let lastBalance = null;
  let blinkInterval = null;

  onField(actor, 'balance', (ctx) => {
    const newBalance = ctx.balance;
    if (lastBalance !== null && newBalance !== lastBalance) {
      // Очищаем предыдущий интервал, если он есть
      if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
      }

      // Сохраняем исходный цвет
      const originalColor = text.style.fill;

      // Запускаем новую анимацию
      let blink = 0;
      blinkInterval = setInterval(() => {
        text.style.fill = blink % 2 === 0 ? 0xFFFFFF : originalColor;
        blink++;
        if (blink > 3) {
          clearInterval(blinkInterval);
          blinkInterval = null;
          text.style.fill = originalColor;
        }
      }, 100);
    }
    text.text = `${newBalance}`;
    lastBalance = newBalance;
  });

  const onResize = () => {
    position();
  };
  app.renderer.on('resize', onResize);
  onResize();

  app.stage.addChild(text);
  return text;
}
