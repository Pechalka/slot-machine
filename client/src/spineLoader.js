import { Assets, Container, Sprite } from 'pixi.js';
import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v7';
import { createEmojiTexture, SYMBOL_SIZE } from './utils.js';

// 'l3',
export const symbols = ['h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l2', 'l4'];

export async function loadSymbolsAssets() {
  for (let n = 0; n < symbols.length; n++) {
    const element = symbols[n];
    Assets.add(element, '/assets/spines/symbols/' + element + '.json');
  }

  Assets.add('atlas', '/assets/spines/symbols/symbols.atlas');

  return await Assets.load([...symbols, 'atlas']);
}

// export function createSpineSymbol(symbolName) {
//   const spine = SPINE_PIXI.Spine.from({ skeleton: symbolName, atlas: 'atlas', scale: 0.5 });

//   spine.position.set(100, 100);
//   spine.pivot.set(spine.width / 2, spine.height / 2);
//   spine.scale.set(0.1);
//   spine.state.setAnimation(0, symbolName + '_static', false);

//   return spine;
// }

export function createSpineSymbol(symbolName) {
  // Создаём Spine
  const spine = SPINE_PIXI.Spine.from({ skeleton: symbolName, atlas: 'atlas', scale: 0.5 });
  // Масштабируем под размер ячейки (подбери свой коэффициент)
  spine.scale.set(0.1);
  spine.position.set(spine.width / 2, spine.height / 2);

  // Создаём контейнер-обёртку размером SYMBOL_SIZE
  const wrapper = new Container();
  wrapper.width = SYMBOL_SIZE;
  wrapper.height = SYMBOL_SIZE;

  wrapper.addChild(spine);
  const animName = `${symbolName}_static`;
  spine.state.setAnimation(0, animName, true);

  wrapper.playWin = () => {
    return new Promise(resolve => {
      const listeners = {
        complete: () => {
          spine.state.setAnimation(0, animName , false);
          spine.state.removeListener(listeners);
          resolve();
        },
      }

      spine.state.addListener(listeners);
      spine.state.setAnimation(0, symbolName, false);
    });
  }

  return wrapper;
}

export function createTextureSymbol(symbolName) {
  const texture = new Sprite(Assets.get(symbolName + '_emoji'));

  texture.playWin = () => {
    console.log(' playWin ', symbolName)

    return Promise.resolve();
  }

  return texture;
}

export async function generateSymbolTextures(app) {
  for (const sym of symbols) {
    Assets.cache.set(sym + '_emoji', createEmojiTexture(app, sym));
  }
}
