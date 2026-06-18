// components/Bet.js
import { Graphics, Text } from 'pixi.js';
import { onField, onState } from '../xstate-subscribers.js';

// TODO: вернуться поже
export function createBet(actor, app) {
  const container = new Graphics();
  const uiContainer = new Graphics();

  // Текст ставки
  const text = new Text('Bet: 10', {
    fontSize: 28,
    fill: 0xCCCCCC,
    fontFamily: 'Arial',
    fontWeight: 'bold',
  });
  text.anchor.set(0.5, 0.5);
  text.position.set(0, 0);
  uiContainer.addChild(text);

  // Кнопка "-"
  const minusBtn = createButton('-', () => {
    const state = actor.getSnapshot();
    if (!state.matches('idle')) return;
    const currentBet = state.context.bet;
    const step = state.context.betStep || 1;
    const minBet = state.context.minBet || 1;
    const newBet = Math.max(currentBet - step, minBet);
    if (newBet !== currentBet) {
      actor.send({ type: 'CHANGE_BET', value: newBet });
    }
  });
  minusBtn.position.set(-100, 0);
  uiContainer.addChild(minusBtn);

  // Кнопка "+"
  const plusBtn = createButton('+', () => {
    const state = actor.getSnapshot();
    if (!state.matches('idle')) return;
    const currentBet = state.context.bet;
    const step = state.context.betStep || 1;
    const maxBet = state.context.maxBet || 100;
    const newBet = Math.min(currentBet + step, maxBet);
    if (newBet !== currentBet) {
      actor.send({ type: 'CHANGE_BET', value: newBet });
    }
  });
  plusBtn.position.set(100, 0);
  uiContainer.addChild(plusBtn);

  container.addChild(uiContainer);

  // Позиционирование
  const position = () => {
    container.x = app.screen.width - 140;
    container.y = app.screen.height - 40;
  };

  // Подписка на изменение ставки
  onField(actor, 'bet', (ctx) => {
    text.text = `Bet: ${ctx.bet}`;
  });

  // Блокировка кнопок
  const setButtonsEnabled = (enabled) => {
    [minusBtn, plusBtn].forEach(btn => {
      btn.cursor = enabled ? 'pointer' : 'default';
      btn.alpha = enabled ? 1 : 0.5;
    });
  };

  onState(actor, 'idle', () => setButtonsEnabled(true));
  onState(actor, 'spinning', () => setButtonsEnabled(false));
  onState(actor, 'winAnimation', () => setButtonsEnabled(false));
  onState(actor, 'stoppingReels', () => setButtonsEnabled(false));

  // Ресайз
  app.renderer.on('resize', position);
  position();

  app.stage.addChild(container);
  return container;
}

// Вспомогательная функция для создания кнопки
function createButton(label, onClick) {
  const btn = new Graphics();
  btn.beginFill(0x444444);
  btn.drawCircle(0, 0, 18);
  btn.endFill();
  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.on('pointertap', onClick);

  const labelText = new Text(label, {
    fontSize: 24,
    fill: 0xFFFFFF,
    fontFamily: 'Arial',
  });
  labelText.anchor.set(0.5);
  btn.addChild(labelText);

  return btn;
}
