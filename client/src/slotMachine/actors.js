import { fromPromise } from 'xstate';
import replay from '../replay';

const post = (url, data) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => res.json());

export const loadConfig = fromPromise(async () => {
  const res = await fetch('/api/config');
  return res.json();
});

let replayIndex = 0;

export const fetchSpinResult = fromPromise(({ input }) => {
  const { bet, isFreeSpin } = input;

  // Если есть массив rounds, используем его последовательно
  if (replay && replay.debug && replay.rounds) {
    if (replayIndex < replay.rounds.length) {
      const round = replay.rounds[replayIndex];
      replayIndex++;
      // Используем isFreeSpin из round, если он задан, иначе переданный
      const freeSpinFlag = round.isFreeSpin !== undefined ? round.isFreeSpin : isFreeSpin;
      return post('/api/replay-spin', {
        positions: round.positions,
        bet,
        isFreeSpin: freeSpinFlag,
      });
    } else {
      // Если раунды закончились, переходим на случайные запросы
      return post('/api/spin', { bet, isFreeSpin });
    }
  }

  // Старый формат реплея (один набор позиций)
  if (replay && replay.debug && replay.positions) {
    return post('/api/replay-spin', { positions: replay.positions, bet, isFreeSpin });
  }

  // Обычный случайный запрос
  return post('/api/spin', { bet, isFreeSpin });
});
