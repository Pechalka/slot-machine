// components/ReelsComponent.js
import { ReelSetBuilder, SpriteSymbol, SpeedPresets, enableDebug } from 'pixi-reels';
import { symbolRegistry } from '../../symbolsLoader.js';
import { createEmojiTexture } from '../../utils.js';
import { SpineReelSymbol } from 'pixi-reels/spine';

import { onField, subscribeStates } from '../../xstate-subscribers.js';

class EmojiSpriteSymbol extends SpriteSymbol {
  constructor(opts) {
    super(opts);
  }
  async playWin() {
    const sprite = this.view;
    return new Promise((resolve) => {
      let blink = 0;
      const originalAlpha = sprite.alpha;
      const interval = setInterval(() => {
        sprite.alpha = blink % 2 === 0 ? 0.3 : originalAlpha;
        blink++;
        if (blink > 3) {
          clearInterval(interval);
          sprite.alpha = originalAlpha;
          resolve();
        }
      }, 150);
    });
  }
}

export function createReelsComponent(actor, app) {
  let unsubscribers = [];
  let reelSet = null;

  function createReels(config) {
    const SYMBOLS = Object.keys(config.symbolWeights);
    reelSet = new ReelSetBuilder()
      .reels(5) // 5 барабанов
      .visibleRows(3) // 3 видимых строки
      .symbolSize(100, 100) // размер символа
      .symbolGap(10, 0)
      .symbols((factory) => {
        for (const id of SYMBOLS) {
          const { skeleton, atlas, type, emoji, color } = symbolRegistry[id];
          if (type == 'texture') {
            const texture = createEmojiTexture(app, emoji, color);
            factory.register(id, EmojiSpriteSymbol, { textures: { [id]: texture } });
          } else {
            if (id == 'S') {
              console.log('skeleton ', skeleton);
              console.log('atlas ', atlas);
              factory.register(id, SpineReelSymbol, {
                autoPlayLanding: true,
                idleAnimation: 'scatter_static',
                landingAnimation: 'scatter_static',
                outAnimation: 'scatter_static',
                blurAnimation: 'scatter_static',
                scale: 0.1,
                winAnimation: 'scatter_win',
                spineMap: { [id]: { skeleton, atlas } },
              });
            } else {
              factory.register(id, SpineReelSymbol, {
                autoPlayLanding: true,
                idleAnimation: id + '_static',
                landingAnimation: id + '_static',
                outAnimation: id + '_static',
                blurAnimation: id + '_static',
                scale: 0.1,
                winAnimation: id,
                spineMap: { [id]: { skeleton, atlas } },
              });
            }
          }
        }
      })
      .weights(config.symbolWeights)
      .speed('normal', SpeedPresets.NORMAL)
      .speed('turbo', SpeedPresets.TURBO)
      .ticker(app.ticker)
      .build();

    enableDebug(reelSet);

    const REELS = 5;
    const ROWS = 3;
    const SYMBOL_SIZE = 100;
    const GAP_X = 10;
    const GAP_Y = 0;

    // Устанавливаем размеры контейнера
    reelSet.width = REELS * (SYMBOL_SIZE + GAP_X) - GAP_X;
    reelSet.height = ROWS * (SYMBOL_SIZE + GAP_Y) - GAP_Y;

    app.stage.addChild(reelSet);

    function reposition() {
      const maxScaleX = app.screen.width / reelSet.width;
      const maxScaleY = app.screen.height / reelSet.height;
      const scale = Math.min(maxScaleX, maxScaleY, 1);
      reelSet.scale.set(scale);
      reelSet.x = (app.screen.width - reelSet.width * scale) / 2;
      reelSet.y = (app.screen.height - reelSet.height * scale) / 2;
    }

    reposition();
    app.renderer.on('resize', reposition);

    reelSet.events.on('win:end', async (result) => {
      console.log('spotlight:end ', result);
    });

    reelSet.events.on('spin:reelLanded', (i, symbols) => {
      console.log('reel', i, 'landed on', symbols);
      actor.send({ type: 'REEL_STOPPED' });
    });
  }

  function matrixToReelResult(matrix) {
    // matrix — массив строк (3 строки × 5 столбцов)
    const cols = matrix[0].length; // 5
    const result = [];
    for (let col = 0; col < cols; col++) {
      const visible = matrix.map((row) => row[col]); // берём символ из каждой строки для этого столбца
      result.push({ visible });
    }
    return result;
  }

  function setupSubscriptions() {
    unsubscribers.push(
      onField(actor, 'config', (ctx) => {
        if (ctx.config && !reelSet) {
          createReels(ctx.config);
        }
      })
    );

    unsubscribers.push(
      subscribeStates(actor, ['spinning', 'freeSpins.spinning'], () => {
        reelSet.spin();
      })
    );

    unsubscribers.push(
      subscribeStates(actor, ['stoppingReels', 'freeSpins.stopping'], (ctx) => {
        const formatted = matrixToReelResult(ctx.spinResult.matrix);
        reelSet.setResult(formatted);
      })
    );

    unsubscribers.push(
      subscribeStates(actor, ['freeSpins.win', 'winAnimation'], async (ctx) => {
        if (ctx.spinResult?.winningLines) {
          // Проходим по каждой линии последовательно
          for (const line of ctx.spinResult.winningLines) {
            // Собираем промисы для всех позиций в этой линии
            const linePromises = line.positions.map(([row, col]) => {
              const reel = reelSet.reels[col];
              const symbol = reel.getSymbolAt(row);
              symbol.playWin();
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
            // // Используем ту же анимацию, что и для выигрыша (или отдельную)
            const reel = reelSet.reels[col];
            const symbol = reel.getSymbolAt(row);
            return symbol.playWin();
          });
          await Promise.all(promises);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Завершаем анимацию Scatter и переходим к фриспинам
        actor.send({ type: 'SCATTER_ANIMATION_END' });
      })
    );
  }
  const init = () => {
    setupSubscriptions();
  };

  const destroy = () => {
    unsubscribers.forEach((unsub) => unsub.unsubscribe?.());
  };

  return { init, destroy };
}
