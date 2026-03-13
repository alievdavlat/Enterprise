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
export declare function useQuery<T>(queryFn: () => Promise<T>, options?: QueryOptions<T>): QueryResult<T>;
//# sourceMappingURL=useQuery.d.ts.map