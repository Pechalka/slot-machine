// machine.js
import { createMachine, assign } from 'xstate';
import { initialContext } from './context';
import { loadConfig, fetchSpinResult } from './actors';
import { actions } from './actions';
import { guards } from './guards';

export const slotMachine = createMachine(
  {
    id: 'slot',
    initial: 'loading',
    context: initialContext,
    states: {
      loading: {
        invoke: {
          src: 'loadConfig',
          onDone: {
            target: 'idle',
            actions: assign({
              config: ({ event }) => event.output,
              balance: ({ event }) => event.output.initialBalance,
              bet: ({ event }) => event.output.defaultBet,
              freeSpinsLeft: ({ event }) => event.output.freeSpinsLeft || 0,
              freeSpinsTotalWin: ({ event }) => event.output.freeSpinsTotalWin || 0,
              isFreeSpinMode: ({ event }) => event.output.isFreeSpinMode || false,
            }),
          },
          onError: 'error',
        },
      },
      idle: {
        always: {
          target: '#slot.freeSpins.spinning',
          guard: 'hasFreeSpinsOnStart',
        },
        on: {
          SPIN: { target: 'spinning', guard: 'hasEnoughBalance' },
          CHANGE_BET: { actions: 'changeBet' },
        },
      },
      spinning: {
        entry: [
          assign({
            stoppedReelsCount: 0,
            spinResult: null,
            timerFinished: false,
          }),
          'deductBet',
        ],
        invoke: {
          src: 'fetchSpinResult',
          input: ({ context }) => ({ bet: context.bet, isFreeSpin: false }),
          onDone: {
            actions: assign({
              spinResult: ({ event }) => event.output,
              pendingBalance: ({ event }) => event.output.balance,
              freeSpinsLeft: ({ event }) => event.output.freeSpinsAwarded || 0,
            }),
          },
        },
        after: { 2000: { actions: assign({ timerFinished: true }) } },
        always: { target: 'stoppingReels', guard: 'canStop' },
      },
      stoppingReels: {
        on: { REEL_STOPPED: { actions: 'incrementStoppedCount' } },
        always: [
          { target: 'winAnimation', guard: 'allReelsStoppedAndHasWin' },
          { target: 'scatterActivation', guard: 'shouldStartFreeSpins' },
          { target: 'idle', guard: 'allReelsStoppedAndNoWin', actions: 'applyPendingBalance' },
        ],
      },
      scatterActivation: {
        entry: 'applyPendingBalance',
        on: {
          SCATTER_ANIMATION_END: '#slot.freeSpins',
        },
      },
      winAnimation: {
        on: {
          ANIMATION_END: [
            {
              target: 'scatterActivation',
              guard: 'shouldStartFreeSpins',
              actions: 'applyPendingBalance',
            },
            {
              target: 'idle',
              actions: 'applyPendingBalance',
            },
          ],
        },
      },
      freeSpins: {
        initial: 'spinning',
        states: {
          spinning: {
            entry: assign({
              stoppedReelsCount: 0,
              spinResult: null,
              timerFinished: false,
            }),
            invoke: {
              src: 'fetchSpinResult',
              input: ({ context }) => ({ bet: context.bet, isFreeSpin: true }),
              onDone: {
                actions: assign({
                  spinResult: ({ event }) => event.output,
                  pendingBalance: ({ event }) => event.output.balance,
                  freeSpinsTotalWin: ({ context, event }) =>
                    context.freeSpinsTotalWin + (event.output.win || 0),
                  freeSpinsLeft: ({ context, event }) => {
                    return context.freeSpinsLeft - 1;
                  },
                }),
              },
            },
            after: { 2000: { actions: assign({ timerFinished: true }) } },
            always: { target: 'stopping', guard: 'canStop' },
          },
          stopping: {
            on: { REEL_STOPPED: { actions: 'incrementStoppedCount' } },
            always: [
              { target: 'win', guard: 'allReelsStoppedAndHasWin' },
              { target: 'scatterActivation', guard: 'hasRetrigger' },
              { target: 'continue', guard: 'allReelsStoppedAndNoWin', actions: 'applyPendingBalance' },
            ],
          },
          win: {
            on: {
              ANIMATION_END: [
                {
                  target: 'scatterActivation',
                  guard: 'hasRetrigger',
                  actions: 'applyPendingBalance',
                },
                {
                  target: 'continue',
                  actions: 'applyPendingBalance',
                },
              ],
            },
          },
          continue: {
            after: {
              1500: [
                { target: 'spinning', guard: 'hasFreeSpinsLeft' },
                { target: 'result', guard: 'noFreeSpinsLeft' },
              ],
            },
          },
          scatterActivation: {
            entry: 'applyPendingBalance',
            on: {
              SCATTER_ANIMATION_END: 'continue',
            },
          },
          result: {
            on: { CLOSE_RESULT: '#slot.idle' },
          },
        },
      },
      error: {},
    },
  },
  {
    actions,
    guards,
    actors: {
      loadConfig,
      fetchSpinResult,
    },
  }
);
