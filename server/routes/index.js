const express = require('express');
const configRouter = require('./config');
const { spinHandler, replaySpinHandler } = require('./spin');

const router = express.Router();
router.get('/config', configRouter);
router.post('/spin', spinHandler);
router.post('/replay-spin', replaySpinHandler);

module.exports = router;
