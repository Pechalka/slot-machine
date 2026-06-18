const { getReels } = require('../reelsManager');
const { buildMatrix, checkAllLines } = require('../gameLogic');
const { VISIBLE_SYMBOLS } = require('../config');
const { getState, updateState } = require('../state');

// Общая логика обработки спина (обычного или фриспина)
function processSpin(positions, bet, isFreeSpin = false) {
  const reels = getReels();
  const matrix = buildMatrix(reels, positions);
  const result = checkAllLines(matrix, bet);

  const state = getState();
  let newBalance = state.balance;
  let newFreeSpinsLeft = state.freeSpinsLeft;
  let newFreeSpinsTotalWin = state.freeSpinsTotalWin;
  let newIsFreeSpinMode = state.isFreeSpinMode;

  if (isFreeSpin) {
    // Фриспин: не списываем ставку, накапливаем выигрыш
    newFreeSpinsTotalWin += result.win;
    newFreeSpinsLeft -= 1;
    newFreeSpinsLeft += result.freeSpinsAwarded || 0;
    newIsFreeSpinMode = newFreeSpinsLeft > 0;
    newBalance += result.win;
  } else {
    // Обычный спин: списываем ставку, добавляем выигрыш
    newBalance -= bet;
    newBalance += result.win;
    if (result.freeSpinsAwarded > 0) {
      newFreeSpinsLeft = result.freeSpinsAwarded;
      newFreeSpinsTotalWin = 0;
      newIsFreeSpinMode = true;
    } else {
      newFreeSpinsLeft = 0;
      newFreeSpinsTotalWin = 0;
      newIsFreeSpinMode = false;
    }
  }

  // Сохраняем состояние
  updateState({
    balance: newBalance,
    freeSpinsLeft: newFreeSpinsLeft,
    freeSpinsTotalWin: newFreeSpinsTotalWin,
    isFreeSpinMode: newIsFreeSpinMode,
  });

  // Формируем ответ
  return {
    freeSpinsAwarded: result.freeSpinsAwarded || 0,
    positions,
    matrix,
    win: result.win,
    isWin: result.isWin,
    winningLines: result.winningLines,
    balance: newBalance,
    freeSpinsLeft: newFreeSpinsLeft,
    freeSpinsTotalWin: newFreeSpinsTotalWin,
    isFreeSpinMode: newIsFreeSpinMode,
  };
}

// Эндпоинт для обычного спина
function spinHandler(req, res) {
  const { bet, isFreeSpin } = req.body;
  const reels = getReels();

  // Генерируем случайные позиции
  const positions = reels.map((strip) => {
    const maxStart = strip.length - VISIBLE_SYMBOLS;
    return Math.floor(Math.random() * (maxStart + 1));
  });

  const response = processSpin(positions, bet, isFreeSpin);
  res.json(response);
}

// Эндпоинт для реплея (использует переданные позиции)
function replaySpinHandler(req, res) {
  const { positions, bet, isFreeSpin } = req.body;

  if (!positions || !Array.isArray(positions) || positions.length !== 5) {
    return res.status(400).json({ error: 'Invalid positions' });
  }

  const reels = getReels();
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] < 0 || positions[i] >= reels[i].length) {
      return res.status(400).json({ error: `Position ${i} out of range` });
    }
  }

  const response = processSpin(positions, bet, isFreeSpin);

  res.json(response);
}

module.exports = { spinHandler, replaySpinHandler };
