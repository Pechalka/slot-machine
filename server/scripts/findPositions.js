// server/findPositions.js
const { getReels } = require('../reelsManager');
const { buildMatrix } = require('../gameLogic');
const { VISIBLE_SYMBOLS } = require('../config');

// ===== КОНФИГУРАЦИЯ (меняй здесь!) =====
// Массив условий: каждая строка требует, чтобы на указанной строке (row)
// первые count символов были равны symbol
const targets = [
  { row: 1, count: 4, symbol: 'S' },  // центральная линия: 4 h4
  // { row: 2, count: 3, symbol: 'l2' },  // нижняя линия: 3 l1
];

const maxAttempts = 50000; // количество попыток (увеличь, если не находит)
// ========================================

const reels = getReels();
console.log(`🔍 Searching positions for ${targets.length} condition(s)...`);
targets.forEach(t => console.log(`  row=${t.row}, count=${t.count}, symbol=${t.symbol}`));

let found = false;
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  const positions = reels.map(strip => {
    const maxStart = strip.length - VISIBLE_SYMBOLS;
    return Math.floor(Math.random() * (maxStart + 1));
  });
  const matrix = buildMatrix(reels, positions);
  let allMatch = true;
  for (const target of targets) {
    const rowSymbols = matrix[target.row];
    let matched = 0;
    for (let i = 0; i < rowSymbols.length; i++) {
      if (rowSymbols[i] === target.symbol) matched++;
      else break;
    }
    if (matched < target.count) {
      allMatch = false;
      break;
    }
  }
  if (allMatch) {
    console.log('✅ Found positions:', positions);
    console.log('Matrix:');
    matrix.forEach((row, i) => console.log(`  row ${i}:`, row.join(' ')));
    found = true;
    break;
  }
}
if (!found) {
  console.log(`❌ No positions found after ${maxAttempts} attempts. Try increasing maxAttempts.`);
}
