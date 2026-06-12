import { createMachine, assign, fromPromise } from 'xstate';

// Загрузка конфигурации с бэкенда
async function loadConfig() {
  const res = await fetch('/api/config');
  const config = await res.json();
  // config = { symbolWeights: { cherry:5, lemon:4, ... }, reelsCount: 3, symbols: [...] }
  return config;
}

// Запрос результата спина
const fetchSpinResult = fromPromise(() => fetch('/api/spin').then(res => res.json()));

export const slotMachine = createMachine({
  id: 'slot',
  initial: 'loading',
  context: {
    config: null,
    stoppedReelsCount: 0,
    spinResult: null,
    timerFinished: false,
  },
  states: {
    loading: {
      invoke: {
        src: 'loadConfig',
        onDone: {
          target: 'idle',
          actions: assign({ config: ({ event }) => event.output })
        },
        onError: 'error'
      }
    },
    idle: {
      on: { SPIN: 'spinning' }
    },
    spinning: {
      entry: assign({
        stoppedReelsCount: 0,
        spinResult: null,
        timerFinished: false
      }),
      invoke: {
        src: 'fetchSpinResult',
        onDone: {
          actions: assign({ spinResult: ({ event }) => event.output })
        }
      },
      after: {
        2000: { actions: assign({ timerFinished: true }) }
      },
      always: {
        target: 'stoppingReels',
        guard: 'canStop'
      }
    },
    stoppingReels: {
      on: {
        REEL_STOPPED: { actions: 'incrementStoppedCount' }
      },
      always: {
        target: 'idle',
        guard: 'allReelsStopped'
      }
    },
    error: {}
  }
}, {
  actions: {
    incrementStoppedCount: assign(({ context }) => ({
      stoppedReelsCount: context.stoppedReelsCount + 1
    }))
  },
  guards: {
    canStop: ({ context }) => context.spinResult !== null && context.timerFinished === true,
    allReelsStopped: ({ context }) => context.stoppedReelsCount === (context.config?.reelsCount || 3)
  },
  actors: {
    loadConfig: fromPromise(loadConfig),
    fetchSpinResult
  }
});
