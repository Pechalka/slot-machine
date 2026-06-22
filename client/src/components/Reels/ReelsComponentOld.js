// components/ReelsComponent.js
import * as PIXI from 'pixi.js';
import { Reel } from './ReelOld.js';
import {
  generateVisualStripFromWeights,
  REEL_WIDTH,
  SYMBOL_SIZE,
  VISIBLE_SYMBOLS,
} from '../../utils.js';
// import { createSpineSymbol, createTextureSymbol } from '../spineLoader.js';
import { createSymbol } from './Symbol.js'

export function createReelsComponent(app, onReelStopped) {
  let reels = [];

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
      const reel = new Reel(app, 0, 0, createSumbol, reelsData[i], 10);
      reel.onStopped = () => {
        if (onReelStopped) onReelStopped();
      };
      reels.push(reel);
    }

    repositionReels(reelsCount);
    app.ticker.add((delta) => {
      for (let r of reels) r.update(delta);
    });
  }

    const spin = () => {
    reels.forEach((reel) => reel.startSpin());
  };

  const setResult = (spinResult) => {
    const { positions } = spinResult;
    if (positions) {
      reels.forEach((reel, idx) => {
        // reel.stopAtPosition(positions[idx]);
        // Длительность 2 секунды, задержка: от краёв к центру
        const pos = spinResult.positions[idx];
        const delays = [0, 100, 200, 300, 400]
        //[0, 300, 600, 300, 0]; // для 5 барабанов
        reel.stopAtPosition(pos, 2000, delays[idx] || 0);
      });
    }
  };

  const showWinAnimation = async (spinResult) => {
    if (spinResult?.winningLines) {
      // Проходим по каждой линии последовательно
      for (const line of spinResult.winningLines) {
        // Собираем промисы для всех позиций в этой линии
        const linePromises = line.positions.map(([row, col]) => {
          const reel = reels[col];
          const symbolName = spinResult.matrix[row][col];
          return reel.playWinOnRow(row, symbolName);
        });
        // Ждём завершения анимации для всех позиций в этой линии
        await Promise.all(linePromises);
        // Небольшая задержка между линиями (опционально, например, 300 мс)
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
  };

  const showScaterAnimation = async (spinResult) => {
    const scatterPositions = [];
    const matrix = spinResult?.matrix;
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
  };


  return {
    createReels,
    spin,
    setResult,
    showWinAnimation,
    showScaterAnimation,
   };
}
