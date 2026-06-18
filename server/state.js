// server/state.js
let state = {
  balance: 1000,
  freeSpinsLeft: 0,
  freeSpinsTotalWin: 0,
  isFreeSpinMode: false,
};

function getState() {
  return { ...state }; // возвращаем копию, чтобы избежать мутаций извне
}

function updateState(newState) {
  state = { ...state, ...newState };
}

function resetState(initialBalance = 1000) {
  state = {
    balance: initialBalance,
    freeSpinsLeft: 0,
    freeSpinsTotalWin: 0,
    isFreeSpinMode: false,
  };
}

module.exports = { getState, updateState, resetState };
