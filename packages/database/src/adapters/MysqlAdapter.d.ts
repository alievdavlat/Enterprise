import type { DatabaseConfig, FindManyParams, FindManyResult } from "@enterprise/types";
import type { DatabaseAdapter, TableSchema } from "../adapter";
export declare class MysqlAdapter implements DatabaseAdapter {
    private pool;
    private config;
    private queryBuilder;
    private _isConnected;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    private buildMysqlWhere;
    findMany(collection: string, params?: FindManyParams): Promise<FindManyResult<Record<string, unknown>>>;
    findOne(collection: string, id: string | number): Promise<Record<string, unknown> | null>;
    findOneBy(collection: string, where: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    create(collection: string, data: Record<string, unknown>): Promise<Record<string, unknown>>;
    update(collection: string, id: string | number, data: Record<string, unknown>): Promise<Record<string, unknown>>;
    delete(collection: string, id: string | number): Promise<Record<string, unknown>>;
    count(collection: string, filters?: Record<string, unknown>): Promise<number>;
    createTable(name: string, schema: TableSchema): Promise<void>;
    dropTable(name: string): Promise<void>;
    tableExists(name: string): Promise<boolean>;
    raw(query: string, params?: unknown[]): Promise<unknown>;
    private mysqlType;
}
//# sourceMappingURL=MysqlAdapter.d.ts.map