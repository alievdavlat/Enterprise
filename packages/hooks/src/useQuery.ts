import { useState, useEffect, useCallback, useRef } from "react";

export interface QueryOptions<T> {
  initialData?: T;
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface QueryResult<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions<T> = {},
): QueryResult<T> {
  const {
    initialData,
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!refetchInterval) return;
    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
