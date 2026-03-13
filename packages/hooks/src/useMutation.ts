import { useState, useCallback } from "react";

export interface MutationOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onSettled?: () => void;
}

export interface MutationResult<T, V> {
  mutate: (variables: V) => Promise<T | undefined>;
  loading: boolean;
  error: Error | null;
  data: T | undefined;
  reset: () => void;
}

export function useMutation<T, V = unknown>(
  mutationFn: (variables: V) => Promise<T>,
  options: MutationOptions<T, V> = {},
): MutationResult<T, V> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | undefined>();

  const mutate = useCallback(
    async (variables: V): Promise<T | undefined> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mutationFn(variables);
        setData(result);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        options.onError?.(e);
      } finally {
        setLoading(false);
        options.onSettled?.();
      }
    },
    [mutationFn],
  );

  const reset = useCallback(() => {
    setData(undefined);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
}
