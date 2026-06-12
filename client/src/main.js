import * as PIXI from 'pixi.js';
import { createActor } from 'xstate';
import { slotMachine } from './slotMachine.js';
import { createBoard } from './board.js';
import { onState } from './xstate-subscribers.js';

const app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0x0a0a2a });
document.getElementById('pixi-canvas-wrapper').appendChild(app.view);

const actor = createActor(slotMachine);
const game = createBoard(actor, app);
game.init();

// UI – пока в main.js
const spinBtn = document.getElementById('spin-btn');
const winDiv = document.getElementById('win-message');

// Подписки на UI (они могут быть вынесены в отдельный модуль позже)
onState(actor, 'idle', () => {
  spinBtn.disabled = false;
  winDiv.innerText = 'Нажмите SPIN';
});
onState(actor, 'spinning', () => {
  spinBtn.disabled = true;
  winDiv.innerText = 'Вращение...';
});
onState(actor, 'stoppingReels', () => {
  winDiv.innerText = 'Останавливается...';
});

spinBtn.onclick = () => {
  if (actor.getSnapshot().matches('idle')) {
    actor.send({ type: 'SPIN' });
  }
};

actor.start();
