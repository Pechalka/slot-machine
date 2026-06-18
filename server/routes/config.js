const { getReels } = require('../reelsManager');

const { getState } = require('../state');

function configRouter(req, res) {
  const reels = getReels();
  const state = getState();

  res.json({
    reels,
    minBet: 1,
    maxBet: 10,
    defaultBet: 1,
    betStep: 1,

    initialBalance: state.balance,
    freeSpinsLeft: state.freeSpinsLeft,
    freeSpinsTotalWin: state.freeSpinsTotalWin,
    isFreeSpinMode: state.isFreeSpinMode,
  });
}

module.exports = configRouter;
