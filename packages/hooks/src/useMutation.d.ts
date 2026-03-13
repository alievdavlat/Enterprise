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
export declare function useMutation<T, V = unknown>(mutationFn: (variables: V) => Promise<T>, options?: MutationOptions<T, V>): MutationResult<T, V>;
//# sourceMappingURL=useMutation.d.ts.map