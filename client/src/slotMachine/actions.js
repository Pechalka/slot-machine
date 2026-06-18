import { assign } from 'xstate';

export const actions = {
  changeBet: assign({
    bet: ({ context, event }) => {
      const newBet = event.value;
      const { minBet, maxBet } = context.config;
      if (newBet < minBet) return minBet;
      if (newBet > maxBet) return maxBet;
      return newBet;
    },
  }),
  incrementStoppedCount: assign(({ context }) => ({
    stoppedReelsCount: context.stoppedReelsCount + 1,
  })),
  deductBet: assign(({ context }) => ({
    balance: context.balance - context.bet,
  })),
  addWin: assign(({ context }) => ({
    balance: context.balance + (context.spinResult?.win || 0),
  })),
  applyRetrigger: assign({
    freeSpinsLeft: ({ context }) => {
      const awarded = context.spinResult?.freeSpinsAwarded || 0;
      return context.freeSpinsLeft + awarded;
    },
  }),
  applyPendingBalance: assign({
    balance: ({ context }) => context.pendingBalance ?? context.balance,
    pendingBalance: null,
  }),
};
