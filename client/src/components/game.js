import { createSpinButton } from './SpinButton.js';
import { createBalance } from './Balance.js';
import { createBet } from './Bet.js';
// import { createReelsComponent } from './Reels/ReelsComponent.js';
// import { createReelsComponent } from './Reels/PixiReelsComponent.js';
import { createReelsComponent } from './Reels';

import { createWinDisplay } from './WinDisplay';
import { loadAllSymbolsAssets } from '../symbolsLoader.js';
import { createFreeSpinsResultPopup } from './FreeSpinsResultPopup.js';
import { createFreeSpinsCounter } from './FreeSpinsCounter.js';
import { onState } from '../xstate-subscribers.js';

export function createGame(actor, app) {
  let unsubscribers = [];

  // Создаём компоненты
  createSpinButton(actor, app);
  createBalance(actor, app);
  createBet(actor, app);
  createWinDisplay(actor, app);
  createFreeSpinsCounter(actor, app);

  const popup = createFreeSpinsResultPopup(actor, app);
  const reelsComponent = createReelsComponent(actor, app);

  async function init() {
    await loadAllSymbolsAssets(app);

    reelsComponent.init();

    app.stage.sortableChildren = true;
  }

  // Подписка на результат фриспинов
  unsubscribers.push(
    onState(actor, 'freeSpins.result', (ctx) => {
      const totalWin = ctx.freeSpinsTotalWin || 0;
      popup.show(totalWin);
    })
  );

  //  Скрываем попап при переходе в idle (на всякий случай)
  unsubscribers.push(
    onState(actor, 'idle', () => {
      popup.hide();
    })
  );

  function destroy() {
    unsubscribers.forEach((unsub) => unsub.unsubscribe?.());

    reelsComponent.destroy();
  }

  return { init, destroy };
}
