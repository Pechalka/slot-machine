// game.js
import { Reel } from './Reel.js';
import { generateVisualStripFromWeights, REEL_WIDTH, SYMBOL_SIZE, VISIBLE_SYMBOLS, createEmojiTexture } from './utils.js';
import { onState, onField } from './xstate-subscribers.js';

export function createBoard(actor, app) {
  let reels = [];
  let unsubscribers = [];

  function repositionReels(count) {
    const startX = (app.screen.width - count * REEL_WIDTH) / 2;
    const startY = (app.screen.height - VISIBLE_SYMBOLS * SYMBOL_SIZE) / 2;
    reels.forEach((reel, i) => {
      reel.container.x = startX + i * REEL_WIDTH;
      reel.container.y = startY;
    });
  }

  function createReels(config) {
    const { symbolWeights, reelsCount = 3, symbols = ['cherry','lemon','orange','bell','seven'] } = config;
    const textures = {};
    for (const sym of symbols) {
      textures[sym] = createEmojiTexture(app, sym);
    }

    for (let i = 0; i < reelsCount; i++) {
      const visualStrip = generateVisualStripFromWeights(symbolWeights);
      const reel = new Reel(app, 0, 0, textures, visualStrip, 4);
      reel.onStopped = () => {
        actor.send({ type: 'REEL_STOPPED' });
      };
      reels.push(reel);
    }

    repositionReels(reelsCount);
    app.ticker.add((delta) => {
      for (let r of reels) r.update(delta);
    });
  }

  function setupSubscriptions() {
    // При загрузке конфига создаём барабаны
    unsubscribers.push(onField(actor, 'config', (ctx) => {
      if (ctx.config && reels.length === 0) {
        createReels(ctx.config);
      }
    }));

    // При входе в spinning – запускаем вращение
    unsubscribers.push(onState(actor, 'spinning', () => {
      reels.forEach(reel => reel.startSpin());
    }));

    // При входе в stoppingReels – останавливаем на нужных символах
    unsubscribers.push(onState(actor, 'stoppingReels', (ctx) => {
      if (ctx.spinResult?.reels) {
        reels.forEach((reel, idx) => {
          reel.stopAtSymbol(ctx.spinResult.reels[idx]);
        });
      }
    }));
  }

  function init() {
    setupSubscriptions();
  }

  function destroy() {
    unsubscribers.forEach(unsub => unsub.unsubscribe?.());
    // дополнительная очистка ticker и reels
  }

  return { init, destroy };
}
