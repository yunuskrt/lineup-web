import type {
  DuelEvent,
  DuelEventHandler,
  DuelEventMap,
  Unsubscribe,
} from '@/lib/api/duel-client';

type HandlerSet = Set<DuelEventHandler<DuelEvent>>;

export type DuelEmitter = {
  on<E extends DuelEvent>(event: E, handler: DuelEventHandler<E>): Unsubscribe;
  emit<E extends DuelEvent>(event: E, payload: DuelEventMap[E]): void;
  clear(): void;
};

export function createEmitter(): DuelEmitter {
  const handlers = new Map<DuelEvent, HandlerSet>();

  return {
    on(event, handler) {
      const existing = handlers.get(event) ?? new Set();
      existing.add(handler as DuelEventHandler<DuelEvent>);
      handlers.set(event, existing);

      return () => {
        handlers.get(event)?.delete(handler as DuelEventHandler<DuelEvent>);
      };
    },

    emit(event, payload) {
      const listeners = handlers.get(event);
      if (!listeners) return;

      // Copied so handlers may unsubscribe mid-dispatch
      for (const handler of [...listeners]) {
        (handler as DuelEventHandler<typeof event>)(payload);
      }
    },

    clear() {
      handlers.clear();
    },
  };
}
