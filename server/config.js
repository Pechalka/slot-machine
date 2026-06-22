// server/config.js
const VISIBLE_SYMBOLS = 3;
const REEL_COUNT = 5;
const REPEATS = 1; // длина ленты = базовый массив × REPEATS

const symbolValues = {
  h1: 100, h2: 80, h3: 60, h4: 40,
  l1: 20, l2: 15, l3: 10, l4: 5,
};

const symbolWeights = {
  h1: 1, h2: 2, h3: 3, h4: 4,
  l1: 10, l2: 12, l3: 14, l4: 16,
  S: 1,
};

const PAYLINES = [
  [0,0,0,0,0], // верхняя
  [1,1,1,1,1], // центральная
  [2,2,2,2,2], // нижняя
  [0,1,2,1,0], // зигзаг вниз-вверх
  [2,1,0,1,2], // зигзаг вверх-вниз
  [0,0,1,0,0], // V-образная (короткая)
  [2,2,1,2,2], // перевёрнутая V
];

const PAY_TABLE = {
  h1: { 3: 12, 4: 40, 5: 150 },
  h2: { 3: 9, 4: 28, 5: 100 },
  h3: { 3: 6, 4: 18, 5: 60 },
  h4: { 3: 4, 4: 12, 5: 40 },
  l1: { 3: 2, 4: 6, 5: 16 },
  l2: { 3: 2, 4: 6, 5: 16 },
  l3: { 3: 2, 4: 6, 5: 16 },
  l4: { 3: 2, 4: 6, 5: 16 },
};

module.exports = {
  VISIBLE_SYMBOLS,
  REEL_COUNT,
  REPEATS,
  symbolValues,
  symbolWeights,
  PAYLINES,
  PAY_TABLE,
};
