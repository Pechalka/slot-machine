import { Assets } from 'pixi.js';
import { createEmojiTexture } from './utils.js';

export const symbolRegistry = {
  h1: { type: 'spine', skeleton: 'h1', atlas: 'atlas' },
  h2: { type: 'spine', skeleton: 'h2', atlas: 'atlas' },
  h3: { type: 'spine', skeleton: 'h3', atlas: 'atlas' },
  h4: { type: 'spine', skeleton: 'h4', atlas: 'atlas' },

  l1: { type: 'spine', skeleton: 'l1', atlas: 'atlas' },
  l2: { type: 'spine', skeleton: 'l2', atlas: 'atlas' },
  l3: { type: 'spine', skeleton: 'l3', atlas: 'atlas' },
  l4: { type: 'spine', skeleton: 'l4', atlas: 'atlas' },

  S: { type: 'spine', skeleton: 'S', atlas: 'atlas_scatter' }


  // h1: { type: 'texture', emoji: '🍒', color: 0xe34234, textureName: 'h1_emoji' },
  // h2: { type: 'texture', emoji: '🍋', color: 0xfff44f, textureName: 'h2_emoji' },
  // h3: { type: 'texture', emoji: '🍊', color: 0xffa500, textureName: 'h3_emoji' },
  // h4: { type: 'texture', emoji: '🔔', color: 0xc0c0c0, textureName: 'h4_emoji' },

  // l1: { type: 'texture', emoji: '1️⃣', color: 0x8b0000, textureName: 'l1_emoji' },
  // l2: { type: 'texture', emoji: '2️⃣', color: 0x8b0000, textureName: 'l2_emoji' },
  // l3: { type: 'texture', emoji: '3️⃣', color: 0x8b0000, textureName: 'l1_emoji' },
  // l4: { type: 'texture', emoji: '4️⃣', color: 0x8b0000, textureName: 'l4_emoji' },

  // S: { type: 'texture', emoji: '🎰', textureName: 'S_emoji' }
}

async function loadSpinesSymbols() {
  const symbols = ['h1', 'h2', 'h3', 'h4', 'h5', 'l1', 'l3', 'l2', 'l4'];
  for (let n = 0; n < symbols.length; n++) {
    const element = symbols[n];
    Assets.add({ alias: element, src: '/assets/spines/symbols/' + element + '.json'});
  }

  Assets.add({ alias: 'S', src: '/assets/spines/symbols2/S.json'});
  // Assets.add({ alias: 'M', src: '/assets/spines/symbols2/M.json' });

  Assets.add({ alias: 'atlas', src: '/assets/spines/symbols/symbols.atlas'});
  Assets.add({ alias: 'atlas_scatter', src: '/assets/spines/symbols2/symbols2.atlas'});


  // return await Assets.load([...symbols, 'atlas', 'atlas_scatter', 'S', 'M']);
  return await Assets.load([...symbols, 'atlas', 'atlas_scatter', 'S']) ;//, 'atlas_scatter' ]); //, 'S', 'M']);
}



async function generateSymbolTextures(app) {
  for (const sym of Object.keys(symbolRegistry)) {
    const { emoji, color, textureName } = symbolRegistry[sym];

    const texture = createEmojiTexture(app, emoji, color);

    Assets.cache.set(textureName, texture);
  }
}


export async function loadAllSymbolsAssets(app) {
  await loadSpinesSymbols();
  await generateSymbolTextures(app);
}

