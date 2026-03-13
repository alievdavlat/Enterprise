import { useState, useCallback } from "react";
export function useMutation(mutationFn, options = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState();
    const mutate = useCallback(async (variables) => {
        setLoading(true);
        setError(null);
        try {
            const result = await mutationFn(variables);
            setData(result);
            options.onSuccess?.(result);
            return result;
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
            options.onError?.(e);
        }
        finally {
            setLoading(false);
            options.onSettled?.();
        }
    }, [mutationFn]);
    const reset = useCallback(() => {
        setData(undefined);
        setError(null);
        setLoading(false);
    }, []);
    return { mutate, loading, error, data, reset };
}
//# sourceMappingURL=useMutation.js.map