// server/gameLogic.js
const { PAYLINES, PAY_TABLE, VISIBLE_SYMBOLS } = require('./config');

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

function checkAllLines(matrix, bet) {
  let totalWin = 0;
  const winningLines = [];
  for (let lineIdx = 0; lineIdx < PAYLINES.length; lineIdx++) {
    const line = PAYLINES[lineIdx];
    const symbols = line.map((row, col) => matrix[row][col]);
    const result = calculateLineWin(symbols);
    if (result.win > 0) {
      totalWin += result.win * bet;
      const positions = line.slice(0, result.count).map((row, col) => [row, col]);
      winningLines.push({
        lineIndex: lineIdx,
        win: result.win,
        count: result.count,
        positions
      });
    }
  }

  let scatterCount = 0;
  // Подсчёт Scatter (S)
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      if (matrix[row][col] === 'S') scatterCount++;
    }
  }

  let freeSpinsAwarded = 0;
  if (scatterCount >= 3) {
    const map = { 3: 5, 4: 10, 5: 15 };
    freeSpinsAwarded = map[Math.min(scatterCount, 5)] || 5;
  }

  return { win: totalWin, isWin: totalWin > 0, winningLines, scatterCount, freeSpinsAwarded };
}

function buildMatrix(reels, positions) {
  const matrix = [];
  for (let row = 0; row < VISIBLE_SYMBOLS; row++) {
    const rowSymbols = reels.map((strip, idx) => {
      const pos = positions[idx] + row;
      // Корректировка для смещения (можно вынести в конфиг)
      return strip[(pos - 1 + strip.length) % strip.length];
    });
    matrix.push(rowSymbols);
  }
  return matrix;
}

module.exports = { calculateLineWin, checkAllLines, buildMatrix };
