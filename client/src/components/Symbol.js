import { Assets, Container, Sprite } from 'pixi.js';
import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v8';
import { SYMBOL_SIZE } from '../utils.js';
import { symbolRegistry } from '../symbolsLoader.js';


export function createSpineSymbol(symbolName, skeleton, atlas) {
  let idleAnim = `${skeleton}_static`;
  let winAnim = skeleton;
  if (symbolName === 'S') {
      idleAnim = 'scatter_static';
      winAnim = 'scatter_win';
  }

  const spine = SPINE_PIXI.Spine.from({ skeleton: skeleton, atlas });
  spine.position.set(spine.width / 2, spine.height / 2);


  const wrapper = new Container();

  wrapper.addChild(spine);
  spine.state.setAnimation(0, idleAnim, true);

  wrapper.width = SYMBOL_SIZE;
  wrapper.height = SYMBOL_SIZE;

  if (symbolName == 'S') {
    spine.scale.set(2)
  }

  return {
    display: wrapper,
    playWin: () => {
      return new Promise((resolve) => {
        const listeners = {
          complete: () => {
            spine.state.setAnimation(0, idleAnim, false);
            spine.state.removeListener(listeners);
            resolve();
          },
        };

        spine.state.addListener(listeners);
        spine.state.setAnimation(0, winAnim, false);
      });
    },
    destroy: () => {
      wrapper.destroy({ children: true });
    },
  };
}

export function createTextureSymbol(symbolName, textureName) {
  const sprite = new Sprite(Assets.get(textureName));

  sprite.width = SYMBOL_SIZE;
  sprite.height = SYMBOL_SIZE;

  return {
    display: sprite,
    playWin: () => {
      // Эффект мигания для текстур
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
    },
    destroy: () => {
      sprite.destroy();
    },
  };
}

export function createSymbol(symbolName) {
  const { skeleton, atlas, type, textureName } = symbolRegistry[symbolName];

  if (type == 'spine') return createSpineSymbol(symbolName, skeleton, atlas);
  if (type == 'texture') return createTextureSymbol(symbolName, textureName);

  // throw symbolName + ' not found'
  // return createSpineSymbol('h1', 'h1', 'atlas');
}
