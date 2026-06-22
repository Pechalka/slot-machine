
import { loadAllSymbolsAssets } from '../symbolsLoader.js';
import { createUIController } from './uiController.js'

export function createGame(actor, app) {
  // Создаём компоненты
  // createSpinButton(actor, app);
  // createBet(actor, app);
  // createFreeSpinsCounter(actor, app);
  createUIController(actor, app);

  // const popup = createFreeSpinsResultPopup(actor, app);

  async function init() {
    await loadAllSymbolsAssets(app);


    app.stage.sortableChildren = true;
  }



  function destroy() {
//    reelsComponent.destroy();
  }

  return { init, destroy };
}
