const { getReels } = require('../reelsManager');

function configRouter(req, res) {
  const reels = getReels();
  res.json({ reels });
}

module.exports = configRouter;
