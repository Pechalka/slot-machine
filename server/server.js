const express = require('express');

const app = express();

// Символы и их веса (чем больше вес, тем чаще выпадает)
const symbols = [
  { name: 'cherry', value: 10, weight: 4 }, // вишня
  { name: 'lemon', value: 20, weight: 3 }, // лимон
  { name: 'orange', value: 30, weight: 2 }, // апельсин
  { name: 'bell', value: 50, weight: 1 }, // колокол
  { name: 'seven', value: 100, weight: 1 }, // семёрка
];

// Генерация случайного символа с учётом весов
function getRandomSymbol() {
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
  let rand = Math.random() * totalWeight;
  let acc = 0;
  for (const sym of symbols) {
    acc += sym.weight;
    if (rand <= acc) return sym;
  }
  return symbols[0];
}

// Проверка выигрыша для 3 барабанов (простая центральная линия)
function calculateWin(reels) {
  const [a, b, c] = reels;
  if (a.name === b.name && b.name === c.name) {
    return a.value * 10; // за три одинаковых символа даём множитель 10
  }
  return 0;
}

// Эндпоинт вращения
app.get('/api/spin', (req, res) => {
  const reels = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
  const winAmount = calculateWin(reels);
  res.json({
    reels: reels.map((s) => s.name),
    win: winAmount,
  });


});

app.get('/api/config', (req, res) => {
  const gameConfig = {
    // Таблица весов символов (сумма весов = 11)
    symbolWeights: {
      cherry: 4,
      lemon: 3,
      orange: 2,
      bell: 1,
      seven: 1,
    },
  };
  res.json(gameConfig);
});

const PORT = 7777;

app.listen(PORT, () => console.log(`Сервер запущен на http://localhost:${PORT}`));
