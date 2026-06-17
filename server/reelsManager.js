// server/reelsManager.js
const fs = require('fs');
const path = require('path');
const { symbolWeights, REEL_COUNT, REPEATS } = require('./config');

const REELS_FILE = path.join(__dirname, 'reels.json');

function generateVisualStripFromWeights(weights, repeats = 1) {
  let base = [];
  for (const [symbol, weight] of Object.entries(weights)) {
    for (let i = 0; i < weight; i++) base.push(symbol);
  }
  let strip = [];
  for (let r = 0; r < repeats; r++) {
    strip.push(...base);
  }
  for (let i = strip.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [strip[i], strip[j]] = [strip[j], strip[i]];
  }
  return strip;
}

function loadOrGenerateReels() {
  if (fs.existsSync(REELS_FILE)) {
    console.log('📂 Загружаем ленты из reels.json');
    const data = fs.readFileSync(REELS_FILE, 'utf8');
    return JSON.parse(data);
  } else {
    console.log('🔄 Генерируем новые ленты и сохраняем в reels.json');
    const reels = [];
    for (let i = 0; i < REEL_COUNT; i++) {
      reels.push(generateVisualStripFromWeights(symbolWeights, REPEATS));
    }
    fs.writeFileSync(REELS_FILE, JSON.stringify(reels, null, 2));
    return reels;
  }
}

let reelsCache = null;

function getReels() {
  if (!reelsCache) {
    reelsCache = loadOrGenerateReels();
  }
  return reelsCache;
}

module.exports = { getReels };
