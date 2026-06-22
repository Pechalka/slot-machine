// server/scripts/calculateRTP.js
const { getReels } = require('../reelsManager');
const { buildMatrix, checkAllLines } = require('../gameLogic');
const { VISIBLE_SYMBOLS } = require('../config');

const TOTAL_SPINS = 100_000;
const BET = 1;

function simulate() {
  const reels = getReels();
  let totalWin = 0;
  let totalSpins = 0;

  // Статистика фриспинов
  let freeSpinCount = 0;          // количество раундов с фриспинами
  let totalFreeSpins = 0;         // общее количество сыгранных фриспинов
  let totalFreeSpinWin = 0;       // выигрыш, полученный во фриспинах

  for (let i = 0; i < TOTAL_SPINS; i++) {
    // 1. Базовый спин
    const positions = reels.map((strip) => {
      const maxStart = strip.length - VISIBLE_SYMBOLS;
      return Math.floor(Math.random() * (maxStart + 1));
    });
    const matrix = buildMatrix(reels, positions);
    const result = checkAllLines(matrix, BET);
    let spinWin = result.win;
    let freeSpinsAwarded = 0;

    // 2. Проверка Scatter
    if (result.scatterCount >= 3) {
      const map = { 3: 5, 4: 10, 5: 15 };
      freeSpinsAwarded = map[Math.min(result.scatterCount, 5)] || 5;
    }

    // 3. Фриспины
    let freeSpinsTotalWin = 0;
    let freeSpinsLeft = freeSpinsAwarded;
    if (freeSpinsLeft > 0) {
      freeSpinCount++;
    }
    while (freeSpinsLeft > 0) {
      totalFreeSpins++; // увеличиваем счётчик сыгранных фриспинов
      const fsPositions = reels.map((strip) => {
        const maxStart = strip.length - VISIBLE_SYMBOLS;
        return Math.floor(Math.random() * (maxStart + 1));
      });
      const fsMatrix = buildMatrix(reels, fsPositions);
      const fsResult = checkAllLines(fsMatrix, BET);
      freeSpinsTotalWin += fsResult.win;
      freeSpinsLeft--;

      // Ретриггер
      if (fsResult.scatterCount >= 3) {
        const map = { 3: 5, 4: 10, 5: 15 };
        const extra = map[Math.min(fsResult.scatterCount, 5)] || 5;
        freeSpinsLeft += extra;
      }
    }

    // 4. Общий выигрыш за раунд
    totalWin += spinWin + freeSpinsTotalWin;
    totalFreeSpinWin += freeSpinsTotalWin;
    totalSpins++;
  }

  const rtp = (totalWin / (totalSpins * BET)) * 100;
  const freeSpinRatio = (freeSpinCount / totalSpins) * 100;
  const avgFreeSpinsPerBonus = totalFreeSpins / (freeSpinCount || 1);
  const avgFreeSpinWin = totalFreeSpinWin / (freeSpinCount || 1);

  console.log(`📊 RTP за ${totalSpins} раундов: ${rtp.toFixed(2)}%`);
  console.log(`💰 Общий выигрыш: ${totalWin}`);
  console.log(`🎰 Общее количество раундов: ${totalSpins}`);
  console.log('--- Статистика по фриспинам ---');
  console.log(`🎆 Раундов с фриспинами: ${freeSpinCount} (${freeSpinRatio.toFixed(2)}%)`);
  console.log(`🎡 Всего сыгранных фриспинов: ${totalFreeSpins}`);
  console.log(`💎 Выигрыш с фриспинов: ${totalFreeSpinWin}`);
  console.log(`📈 Среднее количество фриспинов на бонус: ${avgFreeSpinsPerBonus.toFixed(2)}`);
  console.log(`💰 Средний выигрыш с фриспинов (за бонус): ${avgFreeSpinWin.toFixed(2)}`);
}

simulate();
