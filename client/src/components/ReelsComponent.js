// components/ReelsComponent.js
import * as PIXI from 'pixi.js';
import { Reel } from './Reel.js';
import {
  generateVisualStripFromWeights,
  REEL_WIDTH,
  SYMBOL_SIZE,
  VISIBLE_SYMBOLS,
} from '../utils.js';
import { onState, onField } from '../xstate-subscribers.js';
import { createSpineSymbol, createTextureSymbol } from '../spineLoader.js';

export function createReelsComponent(actor, app) {
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
    const reelsData = config.reels;
    const reelsCount = reelsData.length;

    const createSumbol = (sym) => {
      return createSpineSymbol(sym);
      // return new PIXI.Sprite(PIXI.Assets.get(sym + '_emoji'));
      // return createTextureSymbol(sym);
    };

    for (let i = 0; i < reelsCount; i++) {
      const reel = new Reel(app, 0, 0, createSumbol, reelsData[i], 10);
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
    unsubscribers.push(
      onField(actor, 'config', (ctx) => {
        if (ctx.config && reels.length === 0) {
          createReels(ctx.config);
        }
      })
    );

    unsubscribers.push(
      onState(actor, 'spinning', () => {
        reels.forEach((reel) => reel.startSpin());
      })
    );

    unsubscribers.push(
      onState(actor, 'stoppingReels', (ctx) => {
        const { positions } = ctx.spinResult;
        if (positions) {
          reels.forEach((reel, idx) => {
            // reel.stopAtSymbol(ctx.spinResult.reels[idx]);
            reel.stopAtPosition(positions[idx]);
          });
        }
      })
    );

    // unsubscribers.push(
    //   onState(actor, 'winAnimation', (ctx) => {
    //     if (ctx.spinResult?.reels) {

    //       const promises = reels.map((reel, idx) => {
    //         const symbol = ctx.spinResult.reels[idx];
    //         return reel.playWinOnCenter(symbol);
    //       });

    //       Promise.all(promises).then(() => {
    //         actor.send({ type: 'ANIMATION_END' })
    //       });
    //     }
    //   })
    // );
    unsubscribers.push(
      onState(actor, 'winAnimation', async (ctx) => {
        if (ctx.spinResult?.winningLines) {
          // Проходим по каждой линии последовательно
          for (const line of ctx.spinResult.winningLines) {
            // Собираем промисы для всех позиций в этой линии
            const linePromises = line.positions.map(([row, col]) => {
              const reel = reels[col];
              const symbolName = ctx.spinResult.matrix[row][col];
              return reel.playWinOnRow(row, symbolName);
            });
            // Ждём завершения анимации для всех позиций в этой линии
            await Promise.all(linePromises);
            // Небольшая задержка между линиями (опционально, например, 300 мс)
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        }
        // Все линии анимированы — отправляем событие
        actor.send({ type: 'ANIMATION_END' });
      })
    );
  }

  function init() {
    setupSubscriptions();
  }

  function destroy() {
    unsubscribers.forEach((unsub) => unsub.unsubscribe?.());
    // Дополнительная очистка: убрать тикер, удалить спрайты
    reels.forEach((reel) => {
      reel.container.destroy({ children: true });
    });
    reels = [];
  }

  return { init, destroy };
}
