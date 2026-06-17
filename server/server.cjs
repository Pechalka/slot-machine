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


// Определяем линии выплат (для 5 барабанов, 3 строки)
const PAYLINES = [
  // Горизонтальные
  [0, 0, 0, 0, 0], // верхняя
  [1, 1, 1, 1, 1], // средняя (центральная)
  [2, 2, 2, 2, 2], // нижняя
  // Зигзаги
  // [0, 1, 2, 1, 0],
  // [2, 1, 0, 1, 2],
  // Можно добавить больше
];

// Таблица выплат (зависит от символа и длины)
const PAY_TABLE = {
  h1: { 3: 10, 4: 50, 5: 200 },
  h2: { 3: 8, 4: 40, 5: 150 },
  h3: { 3: 6, 4: 30, 5: 100 },
  h4: { 3: 5, 4: 20, 5: 75 },
  l1: { 3: 3, 4: 10, 5: 30 },
  l2: { 3: 3, 4: 10, 5: 30 },
  l4: { 3: 3, 4: 10, 5: 30 },
};

// Функция для расчёта выигрыша по линии (возвращает { win, count })
function calculateLineWin(symbols) {
  if (symbols.length === 0) return { win: 0, count: 0 };
  const first = symbols[0];
  let count = 0;
  for (let i = 0; i < symbols.length; i++) {
    if (symbols[i] === first) count++;
    else break;
  }
  if (count < 3) return { win: 0, count: 0 };
  const pay = PAY_TABLE[first];
  if (!pay) return { win: 0, count: 0 };
  const maxCount = Math.min(count, 5);
  const win = pay[maxCount] || 0;
  return { win, count };
}

// Функция проверки всех линий
function checkAllLines(matrix) {
  let totalWin = 0;
  const winningLines = [];
  for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const symbols = line.map((row, col) => matrix[row][col]);
    const result = calculateLineWin(symbols);
    if (result.win > 0) {
      totalWin += result.win;
      const positions = line.slice(0, result.count).map((row, col) => [row, col]);
      winningLines.push({
        lineIndex: lineIdx,
        win: result.win,
        count: result.count,
        positions: positions
      });
    }
  }
  return { win: totalWin, isWin: totalWin > 0, winningLines };
}

// Эндпоинт /api/spin
app.get('/api/spin', (req, res) => {
  const VISIBLE = 3; // число видимых строк
  const centerIndex = Math.floor(VISIBLE / 2); // 1

  // 1. Генерируем случайные позиции для каждого барабана (индексы в ленте)
  const positions = reels.map(strip => {
    // maxStart = длина ленты - VISIBLE, чтобы можно было взять 3 символа подряд
    const maxStart = strip.length - VISIBLE;
    return Math.floor(Math.random() * (maxStart + 1));
  });

  // 2. Строим матрицу 3x5 по этим позициям
  const matrix = [];
  for (let row = 0; row < VISIBLE; row++) {
    const rowSymbols = reels.map((strip, idx) => {
      const pos = positions[idx] + row;
      return strip[pos % strip.length]; // с учётом цикличности
    });
    matrix.push(rowSymbols);
  }

  // 3. Проверяем все линии
  let totalWin = 0;
  const winningLines = [];
  for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const symbols = line.map((row, col) => matrix[row][col]);
    const result = calculateLineWin(symbols);
    if (result.win > 0) {
      totalWin += result.win;
      // Сохраняем позиции для анимации (строка, колонка)
      const positions = line.map((row, col) => [row, col]);
      winningLines.push({
        lineIndex: lineIdx,
        win: result.win,
        count: result.count,
        positions: positions
      });
    }
  }

  // 4. Отправляем ответ
  res.json({
    positions: positions,
    matrix: matrix,
    win: totalWin,
    isWin: totalWin > 0,
    winningLines: winningLines
  });
});

// Эндпоинт для воспроизведения заданных позиций
app.post('/api/replay-spin', express.json(), (req, res) => {
  const { positions } = req.body;
  if (!positions || !Array.isArray(positions) || positions.length !== 5) {
    return res.status(400).json({ error: 'Invalid positions, expected array of 5 indices' });
  }
  // Проверяем, что все позиции в пределах длины лент
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] < 0 || positions[i] >= reels[i].length) {
      return res.status(400).json({ error: `Position ${i} out of range` });
    }
  }

  // Строим матрицу по этим позициям (как в обычном спине)
  const VISIBLE = 3;
  const matrix = [];
  for (let row = 0; row < VISIBLE; row++) {
    const rowSymbols = reels.map((strip, idx) => {
      const pos = positions[idx] + row;
      return strip[pos % strip.length];
    });
    matrix.push(rowSymbols);
  }

  // Проверяем линии
  const result = checkAllLines(matrix);
  res.json({
    positions: positions,
    matrix: matrix,
    win: result.win,
    isWin: result.isWin,
    winningLines: result.winningLines
  });
});

const PORT = 7777;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Сгенерированные ленты:', reels);
});
