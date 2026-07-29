import { useState, useEffect, useCallback, useRef } from 'react';
import { secureFetch, ApiError } from '../lib/api/crud';

/**
 * React hook wrapping secureFetch with abort, loading, and error state.
 */
export function useFetchWrapper(fetcher, deps = [], { enabled = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const execute = useCallback(async () => {
    if (!enabled) return null;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher({ signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') return null;
      if (!controller.signal.aborted) setError(err);
      throw err;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [fetcher, enabled]);

  useEffect(() => {
    execute().catch(() => {});
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, retry: execute, setData };
}

export function useSecureMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (path, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      return await secureFetch(path, options);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error, isApiError: (e) => e instanceof ApiError };
}

export default useFetchWrapper;
