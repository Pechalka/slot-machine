const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// 'h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l2', 'l3', 'l4'
// Стоимости символов для расчёта выигрыша
const symbolValues = {
  h1: 100,
  h2: 80,
  h3: 60,
  h4: 40,
  l1: 20,
  l2: 15,
  // l3: 10,
  l4: 5,
};

// Веса для генерации лент (частота выпадения)
const symbolWeights = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  l1: 5,
  l2: 6,
  // l3: 7,
  l4: 8,
};

// Генерация ленты (как на клиенте, но для сервера)
function generateVisualStripFromWeights(weights, repeats = 3) {
  let base = [];
  for (const [symbol, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i++) base.push(symbol);
  }
  let strip = [];
  for (let r = 0; r < repeats; r++) {
    strip.push(...base);
  }
  // Перемешиваем
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

const REEL_COUNT = 5;
const REPEATS = 1;       // длина ленты = базовый массив × REPEATS
const VISIBLE_SYMBOLS = 3;

// Генерируем 5 лент при старте
const reels = [];
for (let i = 0; i < REEL_COUNT; i++) {
  reels.push(generateVisualStripFromWeights(symbolWeights, REPEATS));
}

// Эндпоинт конфига – отдаём готовые ленты
app.get('/api/config', (req, res) => {
  res.json({ reels });
});

// Расчёт выигрыша по центральной линии (все 5 одинаковых)
function calculateWin(centerSymbols) {
  const first = centerSymbols[0];
  if (centerSymbols.every(s => s === first)) {
    const value = symbolValues[first] || 0;
    return value * 10;
  }
  // Здесь можно добавить другие комбинации (3 одинаковых подряд и т.д.)
  return 0;
}

// Эндпоинт спина
app.get('/api/spin', (req, res) => {
  const centerIndex = Math.floor(VISIBLE_SYMBOLS / 2); // 1 (при 3 видимых)
  const spinResult = reels.map(strip => {
    const maxStart = strip.length - VISIBLE_SYMBOLS;
    const randomStart = Math.floor(Math.random() * (maxStart + 1));
    return strip[randomStart + centerIndex];
  });
  const winAmount = calculateWin(spinResult);
  res.json({ reels: spinResult, win: winAmount });
});

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Сгенерированные ленты:', reels);
});
