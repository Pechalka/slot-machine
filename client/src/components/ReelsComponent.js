// components/ReelsComponent.js
import * as PIXI from 'pixi.js';
import { Reel } from './Reel.js';
import {
  generateVisualStripFromWeights,
  REEL_WIDTH,
  SYMBOL_SIZE,
  VISIBLE_SYMBOLS,
} from '../utils.js';
import { onState, onField, subscribeStates } from '../xstate-subscribers.js';
// import { createSpineSymbol, createTextureSymbol } from '../spineLoader.js';
import { createSymbol } from './Symbol.js'

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
      return createSymbol(sym);
    };

    for (let i = 0; i < reelsCount; i++) {
      const reel = new Reel(app, 0, 0, createSumbol, reelsData[i], 15);
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
      subscribeStates(actor, ['spinning', 'freeSpins.spinning'], () => {
        reels.forEach((reel, idx) => reel.startSpin(idx * 100));
      })
    );

    unsubscribers.push(
      subscribeStates(actor, ['stoppingReels', 'freeSpins.stopping'], (ctx) => {
        const { positions } = ctx.spinResult;
        if (positions) {
          reels.forEach((reel, idx) => {
            // reel.stopAtPosition(positions[idx]);
            // Длительность 2 секунды, задержка: от краёв к центру
            const pos = ctx.spinResult.positions[idx];
            const stopDelays = [0, 200, 400, 600, 800];
            //[0, 300, 600, 300, 0]; // для 5 барабанов
            reel.stopAtPosition(pos, stopDelays[idx] || 0, 1500);
          });
        }
      })
    );


    unsubscribers.push(
      subscribeStates(actor, ['freeSpins.win', 'winAnimation'], async (ctx) => {
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

    unsubscribers.push(
      subscribeStates(actor, ['freeSpins.scatterActivation', 'scatterActivation'], async (ctx) => {
        // Находим все позиции Scatter в матрице
        const scatterPositions = [];
        const matrix = ctx.spinResult?.matrix;
        if (matrix) {
          for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
              const symbol = matrix[row][col];
              // Scatter — это S (или M, если добавишь)
              if (symbol === 'S' || symbol === 'M') {
                scatterPositions.push([row, col]);
              }
            }
          }
        }

        if (scatterPositions.length > 0) {
          // Анимируем все Scatter-символы (можно как win-анимацию)
          const promises = scatterPositions.map(([row, col]) => {
            const reel = reels[col];
            const symbolName = matrix[row][col];
            // Используем ту же анимацию, что и для выигрыша (или отдельную)
            return reel.playWinOnRow(row, symbolName);
          });
          await Promise.all(promises);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Завершаем анимацию Scatter и переходим к фриспинам
        actor.send({ type: 'SCATTER_ANIMATION_END' });
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
