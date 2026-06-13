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
  /** @xstate-layout N4IgpgJg5mDOIC5SwDYHsAuA6dBDCAlgHZQDEEaRYWxAbmgNbWqY5r7FQJ1oDGuGApQDaABgC6Y8YlAAHNLAKDKMkAA9EAJgAsorLoBsOgJwBmAKzntpgOyjtAGhABPRLYAcWY5uM3zo41EARgN-IIBfcKcWbDxCElIwACcktCSsWRQBADM0gFssGLYOEm4ien5lIikpVXlFKtUNBB09QxMLK1t7J1cEU1Mg-R8bO3dTA21-c1NI6PRsAggUMFIAZQAFAEkAOVqkEHqlISImxH8DLB8DdztTTRDtG97EXU9td2MDe-NNc29NAY5iAirBZMQiJxyJRqDwmIUFoVwURIaUeJUTjUJHUFMcVAdmgYgjZ9FNBqJxkFjNTjC8WmZ9DNNBSAqZAjYvsDQcjUWR9nJcY0CYhxposKJRDZ3DogkF7DYBnTrHoguZvkF3BSqUFdNouYiwRCoWpYBgBNRcNkMMkABTMiUASlI3KNJH5h0FJzOCFCnlFwU0HNEpl0pjp9vFEtEge+BmpogMNn1rFNaFkyKgACUwGAULBSJmAKKFgAyAH01gAVADyGw2hYAIu6jkLQM05fZSVZozrNIGqXT7sZGfcdRcrHYgVEQQaMGmM9nc-nm578W2RfdI1KZXLtAqwy4RUN-BL7fZzByppFp0Q0BA4KoYjiGl7hQgALQGOnv8xeGl+P5TFZP49WnIo4k4Z88VON9tE0QdviwVVvgCKUbE0aUL2TRZljAKDW3UV5iUZcZfkCcZxm+JUJS8BMfAmIxbgw7CkVdKB8NfdcfWDLxrljC8vhmQdjCGQJvkBS9QkBFjU3TThFzzDi10IhA5RDJDqRDCk-BsDUlSA2jxKmSYHluFjklSJIlJgrjtBCLApSCDDVXMTVmS-Q9+gMuDfD8VUOTM68gA */
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
