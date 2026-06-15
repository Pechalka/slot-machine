import { Assets } from 'pixi.js';
import * as SPINE_PIXI from '@esotericsoftware/spine-pixi-v7';
import { createEmojiTexture } from './utils.js';

export const symbols = ['h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l2', 'l3', 'l4'];

export async function loadSymbolsAssets() {
  for (let n = 0; n < symbols.length; n++) {
    const element = symbols[n];
    Assets.add(element, '/assets/spines/symbols/' + element + '.json');
  }

  Assets.add('atlas', '/assets/spines/symbols/symbols.atlas');

  return await Assets.load([...symbols, 'atlas']);
}

export function createSpineSymbol(sym) {
  const spines = {
    cherry: 'h1',
    lemon: 'h2',
    orange: 'h3',
    bell: 'h4',
    seven: 'h5',
  };
  const symbolName = spines[sym];

  const spine = SPINE_PIXI.Spine.from({ skeleton: symbolName, atlas: 'atlas', scale: 0.5 });

  spine.position.set(100, 100);
  spine.pivot.set(spine.width / 2, spine.height / 2);
  spine.scale.set(0.1);
  spine.state.setAnimation(0, symbolName + '_static', false);

  return spine;
}

export async function generateSymbolTextures(app) {
  const symbols = ['cherry', 'lemon', 'orange', 'bell', 'seven'];
  for (const sym of symbols) {
    Assets.cache.set(sym, createEmojiTexture(app, sym));
  }
}
