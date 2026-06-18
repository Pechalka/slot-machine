import { Graphics, Text } from 'pixi.js';
import { onState, subscribeFields } from '../xstate-subscribers.js';

export function createSpinButton(actor, app) {
  const radius = 45;
  const container = new Graphics();

  // Функция позиционирования: справа по центру
  const position = () => {
    container.x = app.screen.width - radius - 20;
    container.y = app.screen.height / 2;
  };

  const draw = () => {
    container.clear();
    container.beginFill(0x000000);
    container.lineStyle(2, 0xffffff, 1);
    container.drawCircle(0, 0, radius);
    container.endFill();
  };

  draw();

  const text = new Text('SPIN', {
    fontSize: 24,
    fill: 0xffffff,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  });
  text.anchor.set(0.5);
  container.addChild(text);

  container.eventMode = 'static';
  container.cursor = 'pointer';

  const setButtonsEnabled = (enabled) => {
    if (enabled) {
      container.alpha = 1;
      container.cursor = 'pointer';
    } else {
      container.alpha = 0.6;
      container.cursor = 'default';
    }
  };

  // Изменяем внешний вид в зависимости от состояния
  onState(actor, 'idle', ({ bet, balance }) => {
    const validBet = balance >= bet;
    setButtonsEnabled(validBet);
  });

  onState(actor, 'spinning', () => {
    setButtonsEnabled(false)
  });

  subscribeFields(actor, ['bet', 'balance'], ({ bet, balance }) => {
    if (actor.getSnapshot().matches('idle')) {
      const validBet = balance >= bet;
      setButtonsEnabled(validBet);
    }
  });

  container.on('pointertap', () => {
    if (actor.getSnapshot().matches('idle')) {
      actor.send({ type: 'SPIN' });
    }
  });



  // Реакция на изменение размера окна
  const onResize = () => {
    position();
    draw(); // при необходимости, если радиус зависит от размера – перерисуем
  };
  app.renderer.on('resize', onResize);
  onResize();

  app.stage.addChild(container);
  return container;
}
