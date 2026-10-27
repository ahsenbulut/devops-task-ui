import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './client';

interface Result<T> {
  key?: string;
  data?: T;
  error?: ApiError;
}

export function useApi<T>(load: () => Promise<T>, deps: readonly unknown[]) {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([...deps, attempt]);
  const [result, setResult] = useState<Result<T>>({});

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) setResult({ key, data });
      },
      (error: unknown) => {
        if (active)
          setResult({
            key,
            error: error instanceof ApiError ? error : new ApiError(0, 'Unexpected error'),
          });
      },
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures every value `load` depends on
  }, [key]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const setData = useCallback(
    (data: T) => {
      setResult({ key, data });
    },
    [key],
  );

  const current = result.key === key;
  return {
    data: result.data,
    error: current ? result.error : undefined,
    loading: !current,
    retry,
    setData,
  };
}
