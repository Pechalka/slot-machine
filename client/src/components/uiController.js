// uiController.js
import { createWinDisplay } from './WinDisplay.js';
import { createFreeSpinsResultPopup } from './FreeSpinsResultPopup.js';
import { createSpinButton } from './SpinButton.js';
import { createBalance } from './Balance.js';
import { createFreeSpinsCounter } from './FreeSpinsCounter.js';
import { createBet } from './Bet.js';
import { createReelsComponent } from './Reels';
import { createSoundToggleButton } from './SoundToggleButton.js'
import { subscribeStates, onState, subscribeFields, onField } from '../xstate-subscribers.js';
import { soundManager } from '../soundManager.js';

export function createUIController(actor, app) {
  // win display
  const winDisplay = createWinDisplay(app);

  subscribeStates(actor, ['winAnimation', 'freeSpins.win'], (ctx) => {
    const winAmount = ctx.spinResult?.win || 0;
    if (winAmount > 0) {
      winDisplay.show(winAmount);
    } else {
      winDisplay.hide();
    }
  });

  subscribeStates(actor, ['idle', 'freeSpins.spinning'], () => {
    winDisplay.hide();
  });

  // free spin result popup
  const onCloseResultPopup = () => {
    actor.send({ type: 'CLOSE_RESULT' });
  }
  const popup = createFreeSpinsResultPopup(app, onCloseResultPopup);

  onState(actor, 'freeSpins.result', (ctx) => {
    const totalWin = ctx.freeSpinsTotalWin || 0;
    popup.show(totalWin);
  });

  //  Скрываем попап при переходе в idle (на всякий случай)
  onState(actor, 'idle', () => {
    popup.hide();
  });

  // spin button
  const onSpin = () => {
    if (actor.getSnapshot().matches('idle')) {
      actor.send({ type: 'SPIN' });
    }
  }
  const spinButton = createSpinButton(app, onSpin)
  // Изменяем внешний вид в зависимости от состояния
  onState(actor, 'idle', ({ bet, balance }) => {
    const validBet = balance >= bet;
    spinButton.setButtonsEnabled(validBet);
  });

  onState(actor, 'spinning', () => {
    spinButton.setButtonsEnabled(false)
  });

  subscribeFields(actor, ['bet', 'balance'], ({ bet, balance }) => {
    if (actor.getSnapshot().matches('idle')) {
      const validBet = balance >= bet;
      spinButton.setButtonsEnabled(validBet);
    }
  });

  // Balance
  const balance = createBalance(actor, app);
  onField(actor, 'balance', (ctx) => {
    balance.updateBalance(ctx.balance);
  });

  // freeSpinsCounter
  const freeSpinsCounter = createFreeSpinsCounter(app);
  onState(actor, 'freeSpins.spinning', () => {
    const ctx = actor.getSnapshot().context;
    if (ctx.freeSpinsLeft > 0) {
      freeSpinsCounter.showCounter(ctx.freeSpinsLeft);
    }
  });
  onState(actor, 'freeSpins.result', freeSpinsCounter.hideCounter);
  onState(actor, 'idle', freeSpinsCounter.hideCounter);

  onField(actor, 'freeSpinsLeft', (ctx) => {
    freeSpinsCounter.updateValue(ctx.freeSpinsLeft)
  });

  // Bet
  const onChangeBet = (direction) => {
   const state = actor.getSnapshot();
    // Разрешено менять ставку только в idle
    if (!state.matches('idle')) return;

    const { bet, betStep, minBet, maxBet } = state.context;
    let newBet = bet + direction * (betStep || 1);
    newBet = Math.max(minBet || 1, Math.min(maxBet || 100, newBet));
    if (newBet !== bet) {
      actor.send({ type: 'CHANGE_BET', value: newBet });
    }
  }
  const bet = createBet(app, onChangeBet);
    // Подписка на изменение ставки
  onField(actor, 'bet', (ctx) => {
    bet.updateBet(ctx.bet);
  });


  onState(actor, 'idle', () => bet.setButtonsEnabled(true));
  onState(actor, 'spinning', () => bet.setButtonsEnabled(false));
  onState(actor, 'winAnimation', () => bet.setButtonsEnabled(false));
  onState(actor, 'stoppingReels', () => bet.setButtonsEnabled(false));

  // Reels
  const onReelStopped = () => {
    actor.send({ type: 'REEL_STOPPED' });
  }
  const reelsComponent = createReelsComponent(app, onReelStopped);

  onField(actor, 'config', (ctx) => {
    if (ctx.config) {
      reelsComponent.createReels(ctx.config);
    }
  });

  subscribeStates(actor, ['spinning', 'freeSpins.spinning'], () => {
    reelsComponent.spin();
    soundManager.play('click')
  });

  subscribeStates(actor, ['stoppingReels', 'freeSpins.stopping'], (ctx) => {
    reelsComponent.setResult(ctx.spinResult);
    soundManager.play('stop')
  });

  subscribeStates(actor, ['freeSpins.win', 'winAnimation'], async (ctx) => {
    soundManager.play('win')
    await reelsComponent.showWinAnimation(ctx.spinResult);
    // Все линии анимированы — отправляем событие
    actor.send({ type: 'ANIMATION_END' });
  });

  subscribeStates(actor, ['freeSpins.scatterActivation', 'scatterActivation'], async (ctx) => {
    await reelsComponent.showScaterAnimation(ctx.spinResult);
    // Завершаем анимацию Scatter и переходим к фриспинам
    actor.send({ type: 'SCATTER_ANIMATION_END' });
  });

  soundManager.load();

   // Кнопка звука
  const initialMuted = soundManager.isMuted(); // читаем из localStorage
  console.log('initialMuted ', initialMuted);
  createSoundToggleButton(app, (muted) => {
    soundManager.setMuted(muted);
  }, initialMuted);
  soundManager.playBg();

  return {
    destroy: () => {
      winDisplay.destroy();
    },
    init: () => {
    }
  };
}
