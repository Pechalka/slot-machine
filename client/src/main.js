import * as PIXI from 'pixi.js';
import { createActor } from 'xstate';
import { slotMachine } from './slotMachine/machine.js';
import { createGame } from './components/game.js';
import { subscribeStates } from './xstate-subscribers.js';

async function bootstrap() {
  // 1. Создаём приложение
  const app = new PIXI.Application();

  // 2. Инициализируем (обязательно await!)
  await app.init({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x0a0a2a,
    resizeTo: window,
    antialias: true,
  });

  // 3. Добавляем canvas в DOM
  document.body.appendChild(app.canvas); // или app.view (работает тоже)

  const actor = createActor(slotMachine);
  const game = createGame(actor, app);
  await game.init();

  actor.start();

  subscribeStates(actor, ['loading', 'idle', 'spinning', 'stoppingReels', 'error'], (context) => {
    const currentState = actor.getSnapshot().value;
    console.log('Состояние:', currentState);
    console.log('Контекст:', context);
  });

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      const snapshot = actor.getSnapshot();
      if (snapshot.matches('freeSpins.result')) {
        actor.send({ type: 'CLOSE_RESULT' });
      } else if (snapshot.matches('idle')) {
        actor.send({ type: 'SPIN' });
      }
    }
  });
}

bootstrap();
