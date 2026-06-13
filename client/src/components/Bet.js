import { Text } from 'pixi.js';
import { onField } from '../xstate-subscribers.js';

export function createBet(actor, app) {
  const text = new Text('Bet: 10', {
    fontSize: 28,
    fill: 0xCCCCCC,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  });
  text.anchor.set(1, 1); // привязываем правый нижний угол

  const position = () => {
    text.x = app.screen.width - 20;
    text.y = app.screen.height - 20;
  };

  // В будущем можно подписаться на изменение ставки из контекста
  // onField(actor, 'bet', (ctx) => { text.text = `Bet: ${ctx.bet}`; });

  const onResize = () => {
    position();
  };
  app.renderer.on('resize', onResize);
  onResize();

  app.stage.addChild(text);
  return text;
}
