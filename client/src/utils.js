import * as PIXI from 'pixi.js';

export function generateVisualStripFromWeights(weights, repeats = 1) {
  // 1. Формируем базовый массив на основе весов
  let base = [];
  for (const [symbol, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i++) base.push(symbol);
  }

  // 2. Создаём новый массив, повторяя base нужное количество раз
  let strip = [];
  for (let r = 0; r < repeats; r++) {
    strip.push(...base); // spread создаёт новые элементы
  }

  // 3. Перемешиваем новый массив (Fisher-Yates)
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }

  return strip; // возвращаем уникальный массив
}

export const colors = {
  h1: 0xe34234,
  h2: 0xfff44f,
  h3: 0xffa500,
  h4: 0xc0c0c0,
  l1: 0x8b0000,
  l2: 0x8b0000,
  l4: 0x8b0000,
};
export const SYMBOL_EMOJI = {
  h1: '🍒',
  h2: '🍋',
  h3: '🍊',
  h4: '🔔',
  l1: '1️⃣',
  l2: '2️⃣',
  // l3
  l4: '4️⃣',
};

export const SYMBOL_SIZE = 100;
export const VISIBLE_SYMBOLS = 3;
export const REEL_WIDTH = 120;



export function createEmojiTexture(app, name) {
  const padding = 5;
  const bgHeight = SYMBOL_SIZE - padding * 2;
  const bgY = padding;
  const bgCenterY = bgY + bgHeight / 2;

  // Создаём RenderTexture нужного размера
  const renderTexture = PIXI.RenderTexture.create({ width: SYMBOL_SIZE, height: SYMBOL_SIZE });
  const tempContainer = new PIXI.Container();

  // Прозрачный фон (можно не добавлять, но для ясности)
  const fullBg = new PIXI.Graphics();
  fullBg.beginFill(0x000000, 0);
  fullBg.drawRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE);
  fullBg.endFill();
  tempContainer.addChild(fullBg);

  // Цветной фон с отступами
  const bg = new PIXI.Graphics();
  bg.beginFill(colors[name], 0.9);
  bg.drawRoundedRect(0, bgY, SYMBOL_SIZE, bgHeight, 12);
  bg.endFill();
  tempContainer.addChild(bg);

  // Текст
  const fontSize = Math.min(bgHeight * 0.6, 46);
  const style = new PIXI.TextStyle({
    fontSize: fontSize,
    fontFamily: 'Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif',
  });
  const text = new PIXI.Text(SYMBOL_EMOJI[name], style);
  text.anchor.set(0.5);
  text.position.set(SYMBOL_SIZE / 2, bgCenterY);
  tempContainer.addChild(text);

  // Отрисовываем временный контейнер в RenderTexture
  app.renderer.render(tempContainer, { renderTexture });
  tempContainer.destroy({ children: true });

  return renderTexture;
}
