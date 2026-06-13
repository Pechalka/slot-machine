import { createSpinButton } from './components/SpinButton.js';
import { createBalance } from './components/Balance.js';
import { createBet } from './components/Bet.js';
import { createReelsComponent } from './components/ReelsComponent.js';

export function createGame(actor, app) {
  // Создаём компоненты
  createSpinButton(actor, app);
  createBalance(actor, app);
  createBet(actor, app);
  const reelsComponent = createReelsComponent(actor, app);

  function init() {
    reelsComponent.init();
  }

  function destroy() {
    reelsComponent.destroy();
  }

  return { init, destroy };
}
