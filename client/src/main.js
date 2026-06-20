import * as PIXI from 'pixi.js';
import { createActor } from 'xstate';
import { slotMachine } from './slotMachine/machine.js';
import { createGame } from './components/game.js';
import { subscribeStates } from './xstate-subscribers.js';

import { ReelSetBuilder, SpriteSymbol, SpeedPresets, enableDebug } from 'pixi-reels';
import { symbolRegistry } from './symbolsLoader.js'
import { createEmojiTexture } from './utils.js';

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


  // const actor = createActor(slotMachine);
  // const game = createGame(actor, app);
  // await game.init();

  // actor.start();

  // subscribeStates(actor, ['loading', 'idle', 'spinning', 'stoppingReels', 'error'], (context) => {
  //   const currentState = actor.getSnapshot().value;
  //   console.log('Состояние:', currentState);
  //   console.log('Контекст:', context);
  // });

  // document.addEventListener('keydown', (event) => {
  //   if (event.code === 'Space') {
  //     event.preventDefault();
  //     const snapshot = actor.getSnapshot();
  //     if (snapshot.matches('idle')) {
  //       actor.send({ type: 'SPIN' });
  //     }
  //   }
  // });

  const WEIGHTS = {
  h1: 1, h2: 2, h3: 3, h4: 4,
  l1: 5, l2: 6, l3: 7, l4: 8,
  S: 1,
};

const SYMBOLS = Object.keys(symbolRegistry);

  const reelSet = new ReelSetBuilder()
  .reels(5)                     // 5 барабанов
  .visibleRows(3)               // 3 видимых строки
  .symbolSize(100, 100)         // размер символа
  .symbolGap(10, 0)
  .symbols((factory) => {
    for (const id of SYMBOLS) {
      const { color, emoji } = symbolRegistry[id];
      const texture = createEmojiTexture(app, emoji, color);
      // console.log('texture ', id, texture)
      factory.register(id, SpriteSymbol, { textures: { [id]: texture } });
    }
  })
  .weights(WEIGHTS)
  .speed('normal', SpeedPresets.NORMAL)
  .speed('turbo',  SpeedPresets.TURBO)
  .ticker(app.ticker)
  .build();

  enableDebug(reelSet);


  app.stage.addChild(reelSet);




reelSet.events.on('spin:complete', async (result) => {
  // console.log('result ', result)
  // const wins = detectWins(result.symbols);      // your logic
  // if (wins.length === 0) return;

  // await reelSet.spotlight.showLine({
  //   positions: [0, 0, 0, 0, 0],                // [{reelIndex, rowIndex}, ...]
  //   duration: 1200,
  // });
  const winLines = [{
    positions: [
    {
      reelIndex: 0, rowIndex: 0
    },
    {
      reelIndex: 1, rowIndex: 0
    },
    {
      reelIndex: 2, rowIndex: 0
    },
    {
      reelIndex: 3, rowIndex: 0
    },
    {
      reelIndex: 4, rowIndex: 0
    },
  ]}]

  function highlightLine(reelSet, positions) {
  for (const pos of positions) {
    const { reelIndex, rowIndex } = pos;
    const reel = reelSet.reels[reelIndex];
    const symbol = reel.getSymbolAt(rowIndex);
    if (symbol && symbol.playWin) {
      symbol.playWin(); // запускает win-анимацию на символе
    }
  }
}

// highlightLine(reelSet, winLines[0].positions);

// reelSet.spotlight.showLine({
//   positions: winLines[0].positions,
//   playWin: true,   // invoke symbol.playWin() on each
// });

// console.log('reelSet.spotlight ', reelSet.spotlight)

reelSet.events.on('win:end', async (result) => {
  console.log('spotlight:end ', result)
})

reelSet.spotlight.cycle(winLines, {
        displayDuration: 1500,
        gapDuration: 200,
        cycles: 2,
      });


  // reelSet.showLine(winLines);
  // await reelSet.showLine({
  //   positions: winLines,                // [{reelIndex, rowIndex}, ...]
  //   duration: 1200,
  // });
  // debugger
  // reelSet.spotlight.cycle(winLines, {
  //       displayDuration: 1500,
  //       gapDuration: 200,
  //       cycles: 2,
  //     });
});


  setTimeout(() => {
    // const result = reelSet.nextResult();
    // reelSet.spin(result);
    reelSet.spin();
    setTimeout(() => {
      reelSet.setResult([
        { visible: ['h1', 'h1', 'h1']},
        { visible: ['h1', 'h2', 'h1']},
        { visible: ['h1', 'h2', 'l1']},
        { visible: ['h1', 'h3', 'S']},
        { visible: ['h1', 'h1', 'h1']}
      ])
    })
  }, 1000);
}

bootstrap();
