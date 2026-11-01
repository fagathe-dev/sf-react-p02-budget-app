import { useEffect, useRef } from 'react';

export type ActionTimerType = 'timeout' | 'interval';

export interface UseActionTimerOptions {
  /** Type de timer : `setTimeout` (une fois) ou `setInterval` (répété). */
  type: ActionTimerType;
  /** Délai en ms. `null` = timer en pause / désactivé. */
  delay: number | null;
  /** Callback exécuté à chaque déclenchement. */
  action: () => void;
  /** Callback exécuté juste avant le nettoyage effectif du timer. */
  onCleanUp?: () => void;
}

export function useActionTimer({
  type,
  delay,
  action,
  onCleanUp,
}: UseActionTimerOptions): void {
  const actionRef = useRef<() => void>(action);
  const onCleanUpRef = useRef<(() => void) | undefined>(onCleanUp);

  // Garde les refs à jour sans jamais recréer le timer.
  useEffect(() => {
    actionRef.current = action;
    onCleanUpRef.current = onCleanUp;
  }, [action, onCleanUp]);

  // Le timer n'est recréé que si `type` ou `delay` change.
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = (): void => {
      actionRef.current();
    };

    const id: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval> =
      type === 'timeout' ? setTimeout(tick, delay) : setInterval(tick, delay);

    return () => {
      onCleanUpRef.current?.();

      if (type === 'timeout') {
        clearTimeout(id as ReturnType<typeof setTimeout>);
      } else {
        clearInterval(id as ReturnType<typeof setInterval>);
      }
    };
  }, [type, delay]);
}

/* Exemple :
 *
 * const [running, setRunning] = useState(true);
 *
 * useActionTimer({
 *   type: 'interval',
 *   delay: running ? 1000 : null,
 *   action: () => setCount((c) => c + 1),
 *   onCleanUp: () => console.log('timer nettoyé'),
 * });
 */
