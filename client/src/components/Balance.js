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

  let lastCredits = null;

  onField(actor, 'credits', (ctx) => {
    const newCredits = ctx.credits;
    if (lastCredits !== null && newCredits !== lastCredits) {
      // Анимация мигания
      let blink = 0;
      const originalColor = text.style.fill;
      const interval = setInterval(() => {
        text.style.fill = blink % 2 === 0 ? 0xFFFFFF : originalColor;
        blink++;
        if (blink > 3) {
          clearInterval(interval);
          text.style.fill = originalColor;
        }
      }, 100);
    }
    text.text = `${newCredits}`;
    lastCredits = newCredits;
    position(); // обновляем позицию после изменения текста (меняется высота)
  });

  const onResize = () => {
    position();
  };
  app.renderer.on('resize', onResize);
  onResize();

  app.stage.addChild(text);
  return text;
}
