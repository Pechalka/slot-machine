// components/Bet.js
import { Graphics, Text } from 'pixi.js';

export function createBet(app, onChangeBet) {
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
    onChangeBet(-1);
  });
  minusBtn.position.set(-100, 0);
  uiContainer.addChild(minusBtn);

  // Кнопка "+"
  const plusBtn = createButton('+', () => {
    onChangeBet(1);
  });
  plusBtn.position.set(100, 0);
  uiContainer.addChild(plusBtn);

  container.addChild(uiContainer);

  // Позиционирование
  const position = () => {
    container.x = app.screen.width - 140;
    container.y = app.screen.height - 40;
  };

  const updateBet = (bet) => {
    text.text = `Bet: ${bet}`;
  }

    // Блокировка кнопок
  const setButtonsEnabled = (enabled) => {
    [minusBtn, plusBtn].forEach(btn => {
      btn.cursor = enabled ? 'pointer' : 'default';
      btn.alpha = enabled ? 1 : 0.5;
    });
  };


  // Ресайз
  app.renderer.on('resize', position);
  position();

  app.stage.addChild(container);
  return {
    setButtonsEnabled,
    updateBet,
  };
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
