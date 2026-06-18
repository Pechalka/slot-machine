export const guards = {
  hasEnoughBalance: ({ context }) => context.balance >= context.bet,
  canStop: ({ context }) => context.spinResult !== null && context.timerFinished === true,

  allReelsStoppedAndHasWin: ({ context }) => {
    const count = context.config?.reels?.length || 5;
    return context.stoppedReelsCount === count && context.spinResult?.isWin === true;
  },
  allReelsStoppedAndNoWin: ({ context }) => {
    const count = context.config?.reels?.length || 5;
    return context.stoppedReelsCount === count && context.spinResult?.isWin !== true;
  },
  shouldStartFreeSpins: ({ context }) => {
    const count = context.config?.reels?.length || 5;
    return context.stoppedReelsCount === count && context.freeSpinsLeft > 0;
  },
  hasFreeSpinsLeft: ({ context }) => context.freeSpinsLeft > 0,
  noFreeSpinsLeft: ({ context }) => context.freeSpinsLeft === 0,

  hasFreeSpinsOnStart: ({ context }) => context.freeSpinsLeft > 0,

  hasRetrigger: ({ context }) => {
    const count = context.config?.reels?.length || 5;
    return context.stoppedReelsCount === count && context.spinResult?.freeSpinsAwarded > 0;
  },
};
