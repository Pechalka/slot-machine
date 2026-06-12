/**
 * Подписка на изменение полей контекста
 */
export function subscribeFields(actor, fields, effect) {
  let lastContext = actor.getSnapshot().context;

  return actor.subscribe(({ context }) => {
    if (lastContext === context) return;

    if (!fields || fields.length === 0) {
      effect(context);
      lastContext = context;
      return;
    }

    const hasChanges = fields.some(field => lastContext[field] !== context[field]);
    if (hasChanges) {
      effect(context);
      lastContext = context;
    }
  });
}

/**
 * Подписка на вход в состояния
 */
export function subscribeStates(actor, states, effect) {
  if (!states || states.length === 0) return { unsubscribe: () => {} };

  let lastSnapshot = actor.getSnapshot();
  let cleanup = null;

  const subscription = actor.subscribe(currentSnapshot => {
    const entered = states.filter(s => !lastSnapshot.matches(s) && currentSnapshot.matches(s));
    const left = states.filter(s => lastSnapshot.matches(s) && !currentSnapshot.matches(s));

    if (left.length && cleanup) {
      cleanup();
      cleanup = null;
    }

    if (entered.length) {
      const result = effect(currentSnapshot.context);
      if (typeof result === 'function') cleanup = result;
    }

    lastSnapshot = currentSnapshot;
  });

  return { unsubscribe: () => subscription.unsubscribe() };
}

// Упрощённые обёртки
export const onState = (actor, state, effect) => subscribeStates(actor, [state], effect);
export const onField = (actor, field, effect) => subscribeFields(actor, [field], effect);

export function onSelect(actor, selector, effect) {
  let lastValue = selector(actor.getSnapshot().context);

  return actor.subscribe(({ context }) => {
    const currentValue = selector(context);
    if (lastValue !== currentValue) {
      effect(currentValue);
      lastValue = currentValue;
    }
  });
}
