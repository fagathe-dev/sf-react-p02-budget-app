import { copyToClipboard, isClipboardSupported } from 'core-ts';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseClipboardOptions {
  /** Durée d'affichage de l'état "copié" en millisecondes (défaut : 2000ms) */
  feedbackDuration?: number;
  /** Callback optionnel déclenché après une copie réussie */
  onSuccess?: (text: string) => void;
  /** Callback optionnel déclenché en cas d'échec */
  onError?: (error?: string) => void;
}

export const useClipboard = (options: UseClipboardOptions = {}) => {
  const { feedbackDuration = 2000, onSuccess, onError } = options;

  const [hasCopied, setHasCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSupported = isClipboardSupported();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;

      const result = await copyToClipboard(text);

      if (result.success) {
        setHasCopied(true);
        setError(null);
        onSuccess?.(text);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setHasCopied(false);
        }, feedbackDuration);

        return true;
      }

      setError(result.error ?? 'Erreur lors de la copie');
      onError?.(result.error);
      return false;
    },
    [feedbackDuration, onSuccess, onError]
  );

  return {
    copy,
    hasCopied,
    error,
    isSupported,
  };
};
