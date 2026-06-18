// server/config.js
const VISIBLE_SYMBOLS = 3;
const REEL_COUNT = 5;
const REPEATS = 1; // длина ленты = базовый массив × REPEATS

const symbolValues = {
  h1: 100, h2: 80, h3: 60, h4: 40,
  l1: 20, l2: 15, l4: 5,
};

const symbolWeights = {
  h1: 1, h2: 2, h3: 3, h4: 4,
  l1: 5, l2: 6, l4: 8,
  S: 1,
};

const PAYLINES = [
  [0,0,0,0,0], // верхняя
  [1,1,1,1,1], // центральная
  [2,2,2,2,2], // нижняя
];

const PAY_TABLE = {
  h1: { 3: 10, 4: 50, 5: 200 },
  h2: { 3: 8, 4: 40, 5: 150 },
  h3: { 3: 6, 4: 30, 5: 100 },
  h4: { 3: 5, 4: 20, 5: 75 },
  l1: { 3: 3, 4: 10, 5: 30 },
  l2: { 3: 3, 4: 10, 5: 30 },
  l4: { 3: 3, 4: 10, 5: 30 },
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
