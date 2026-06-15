import { createSpinButton } from './components/SpinButton.js';
import { createBalance } from './components/Balance.js';
import { createBet } from './components/Bet.js';
import { createReelsComponent } from './components/ReelsComponent.js';
import { loadSymbolsAssets, generateSymbolTextures } from './spineLoader.js';

export function createGame(actor, app) {
  // Создаём компоненты
  createSpinButton(actor, app);
  createBalance(actor, app);
  createBet(actor, app);

  const reelsComponent = createReelsComponent(actor, app);

  async function init() {
    await loadSymbolsAssets();
    await generateSymbolTextures(app);

    reelsComponent.init();
  }

  function destroy() {
    reelsComponent.destroy();
  }

  return { init, destroy };
}
