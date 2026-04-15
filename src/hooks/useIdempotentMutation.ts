import { useRef, useCallback } from 'react';

/**
 * Hook that prevents duplicate submissions by tracking in-flight mutations.
 * Wraps an async function to ensure it can only run once at a time.
 */
export function useIdempotentMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
) {
  const inFlightRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      if (inFlightRef.current) {
        return null; // Already in progress, skip duplicate
      }

      // Generate idempotency key from args
      const key = JSON.stringify(args);
      if (key === lastKeyRef.current) {
        // Exact same args as last call — likely a double-click
        return null;
      }

      inFlightRef.current = true;
      lastKeyRef.current = key;

      try {
        const result = await fn(...args);
        return result;
      } finally {
        inFlightRef.current = false;
        // Reset key after a short delay to allow intentional re-submissions
        setTimeout(() => {
          lastKeyRef.current = null;
        }, 2000);
      }
    },
    [fn]
  );

  const isExecuting = useCallback(() => inFlightRef.current, []);

  return { execute, isExecuting };
}

/**
 * Debounced async function — waits for idle before executing.
 */
export function useDebouncedMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  delay = 300
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(
    (...args: TArgs): Promise<TResult> => {
      return new Promise((resolve, reject) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
          try {
            resolve(await fn(...args));
          } catch (e) {
            reject(e);
          }
        }, delay);
      });
    },
    [fn, delay]
  );

  return { execute };
}

/**
 * Throttled function — executes at most once per interval.
 */
export function useThrottledFn<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  intervalMs = 1000
) {
  const lastCallRef = useRef(0);

  return useCallback(
    (...args: TArgs) => {
      const now = Date.now();
      if (now - lastCallRef.current >= intervalMs) {
        lastCallRef.current = now;
        fn(...args);
      }
    },
    [fn, intervalMs]
  );
}
