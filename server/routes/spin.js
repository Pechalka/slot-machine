const { getReels } = require('../reelsManager');
const { buildMatrix, checkAllLines } = require('../gameLogic');
const { VISIBLE_SYMBOLS } = require('../config');

function spinHandler(req, res) {
  const reels = getReels();
  const positions = reels.map(strip => {
    const maxStart = strip.length - VISIBLE_SYMBOLS;
    return Math.floor(Math.random() * (maxStart + 1));
  });
  const matrix = buildMatrix(reels, positions);
  const result = checkAllLines(matrix);
  res.json({
    positions,
    matrix,
    win: result.win,
    isWin: result.isWin,
    winningLines: result.winningLines
  });
}

function replaySpinHandler(req, res) {
  const { positions } = req.body;
  if (!positions || !Array.isArray(positions) || positions.length !== 5) {
    return res.status(400).json({ error: 'Invalid positions' });
  }
  const reels = getReels();
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] < 0 || positions[i] >= reels[i].length) {
      return res.status(400).json({ error: `Position ${i} out of range` });
    }
  }
  const matrix = buildMatrix(reels, positions);
  const result = checkAllLines(matrix);
  res.json({
    positions,
    matrix,
    win: result.win,
    isWin: result.isWin,
    winningLines: result.winningLines
  });
}

module.exports = { spinHandler, replaySpinHandler };
