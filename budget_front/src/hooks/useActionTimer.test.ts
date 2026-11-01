// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActionTimer, type UseActionTimerOptions } from './useActionTimer';

describe('useActionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('type "timeout"', () => {
    it("exécute l'action une seule fois après le délai", () => {
      const action = vi.fn();

      renderHook(() => useActionTimer({ type: 'timeout', delay: 1000, action }));

      expect(action).not.toHaveBeenCalled();

      vi.advanceTimersByTime(999);
      expect(action).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(action).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000);
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('type "interval"', () => {
    it("exécute l'action à chaque intervalle", () => {
      const action = vi.fn();

      renderHook(() => useActionTimer({ type: 'interval', delay: 1000, action }));

      vi.advanceTimersByTime(3000);
      expect(action).toHaveBeenCalledTimes(3);
    });
  });

  describe('delay null', () => {
    it("ne démarre aucun timer et n'appelle pas onCleanUp", () => {
      const action = vi.fn();
      const onCleanUp = vi.fn();

      const { unmount } = renderHook(() =>
        useActionTimer({ type: 'interval', delay: null, action, onCleanUp }),
      );

      vi.advanceTimersByTime(10_000);
      expect(action).not.toHaveBeenCalled();
      expect(vi.getTimerCount()).toBe(0);

      unmount();
      expect(onCleanUp).not.toHaveBeenCalled();
    });

    it('démarre le timer quand delay passe de null à un nombre', () => {
      const action = vi.fn();

      const { rerender } = renderHook(
        (props: UseActionTimerOptions) => useActionTimer(props),
        { initialProps: { type: 'interval', delay: null, action } },
      );

      vi.advanceTimersByTime(2000);
      expect(action).not.toHaveBeenCalled();

      rerender({ type: 'interval', delay: 1000, action });

      vi.advanceTimersByTime(2000);
      expect(action).toHaveBeenCalledTimes(2);
    });

    it('met le timer en pause quand delay passe à null', () => {
      const action = vi.fn();
      const onCleanUp = vi.fn();

      const { rerender } = renderHook(
        (props: UseActionTimerOptions) => useActionTimer(props),
        { initialProps: { type: 'interval', delay: 1000, action, onCleanUp } },
      );

      vi.advanceTimersByTime(1000);
      expect(action).toHaveBeenCalledTimes(1);

      rerender({ type: 'interval', delay: null, action, onCleanUp });

      expect(onCleanUp).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);

      vi.advanceTimersByTime(5000);
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('callbacks stockés dans des refs', () => {
    it("utilise la dernière version de l'action sans redémarrer le timer", () => {
      const firstAction = vi.fn();
      const secondAction = vi.fn();

      const { rerender } = renderHook(
        (props: UseActionTimerOptions) => useActionTimer(props),
        {
          initialProps: { type: 'timeout', delay: 1000, action: firstAction },
        },
      );

      vi.advanceTimersByTime(600);
      rerender({ type: 'timeout', delay: 1000, action: secondAction });

      // Le timer n'a pas été redémarré : il reste 400 ms, pas 1000.
      vi.advanceTimersByTime(400);

      expect(firstAction).not.toHaveBeenCalled();
      expect(secondAction).toHaveBeenCalledTimes(1);
    });

    it("ne recrée pas le timer quand seule l'identité des callbacks change", () => {
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      const { rerender } = renderHook(
        (props: UseActionTimerOptions) => useActionTimer(props),
        {
          initialProps: {
            type: 'interval',
            delay: 1000,
            action: () => undefined,
            onCleanUp: () => undefined,
          },
        },
      );

      rerender({
        type: 'interval',
        delay: 1000,
        action: () => undefined,
        onCleanUp: () => undefined,
      });

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('nettoyage', () => {
    it('appelle onCleanUp puis clear le timer au démontage', () => {
      const action = vi.fn();
      const onCleanUp = vi.fn(() => {
        // Au moment de onCleanUp, le timer est encore actif.
        expect(vi.getTimerCount()).toBe(1);
      });

      const { unmount } = renderHook(() =>
        useActionTimer({ type: 'timeout', delay: 1000, action, onCleanUp }),
      );

      unmount();

      expect(onCleanUp).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);

      vi.advanceTimersByTime(5000);
      expect(action).not.toHaveBeenCalled();
    });

    it('utilise clearTimeout / clearInterval selon le type', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      const timeoutHook = renderHook(() =>
        useActionTimer({ type: 'timeout', delay: 1000, action: vi.fn() }),
      );
      timeoutHook.unmount();
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);

      const intervalHook = renderHook(() =>
        useActionTimer({ type: 'interval', delay: 1000, action: vi.fn() }),
      );
      intervalHook.unmount();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('changements de delay et de type', () => {
    it('redémarre le timer quand delay change', () => {
      const action = vi.fn();
      const onCleanUp = vi.fn();

      const { rerender } = renderHook(
        (props: UseActionTimerOptions) => useActionTimer(props),
        { initialProps: { type: 'interval', delay: 1000, action, onCleanUp } },
      );

      vi.advanceTimersByTime(1000);
      expect(action).toHaveBeenCalledTimes(1);

      rerender({ type: 'interval', delay: 500, action, onCleanUp });
      expect(onCleanUp).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(action).toHaveBeenCalledTimes(3);
    });

    it('nettoie le timeout et démarre un interval quand type change', () => {
      const action = vi.fn();
      const onCleanUp = vi.fn();

      const { rerender } = renderHook(
        (props: UseActionTimerOptions) => useActionTimer(props),
        { initialProps: { type: 'timeout', delay: 1000, action, onCleanUp } },
      );

      vi.advanceTimersByTime(500);
      rerender({ type: 'interval', delay: 1000, action, onCleanUp });

      expect(onCleanUp).toHaveBeenCalledTimes(1);

      // Le timeout initial a été annulé : aucun appel à 1000 ms depuis le début.
      vi.advanceTimersByTime(500);
      expect(action).not.toHaveBeenCalled();

      // L'interval, lui, se déclenche 1000 ms après le changement de type.
      vi.advanceTimersByTime(500);
      expect(action).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(action).toHaveBeenCalledTimes(2);
    });
  });
});
