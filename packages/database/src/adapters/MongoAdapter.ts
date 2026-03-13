import mongoose, { Connection, Schema, Model, Document } from "mongoose";
import type {
  DatabaseConfig,
  FindManyParams,
  FindManyResult,
} from "@enterprise/types";
import type { DatabaseAdapter, TableSchema } from "../adapter";
import { QueryBuilder } from "@enterprise/core";

export class MongoAdapter implements DatabaseAdapter {
  private connection: Connection | null = null;
  private config: DatabaseConfig;
  private queryBuilder = new QueryBuilder();
  private _isConnected = false;
  private models: Map<string, Model<any>> = new Map();

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const uri =
      this.config.uri ||
      `mongodb://${this.config.username}:${this.config.password}@${this.config.host || "localhost"}:${this.config.port || 27017}/${this.config.database}`;

    this.connection = await mongoose
      .createConnection(uri, {
        maxPoolSize: this.config.pool?.max || 10,
        minPoolSize: this.config.pool?.min || 2,
      })
      .asPromise();

    this._isConnected = true;
    console.log("[MongoAdapter] Connected to MongoDB");
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this._isConnected = false;
      console.log("[MongoAdapter] Disconnected from MongoDB");
    }
  }

  isConnected(): boolean {
    return this._isConnected;
  }

  private getModel(collection: string): Model<any> {
    if (this.models.has(collection)) {
      return this.models.get(collection)!;
    }
    const schema = new Schema<any>({}, { strict: false, timestamps: true });
    const model = this.connection!.model<any>(collection, schema, collection);
    this.models.set(collection, model);
    return model;
  }

  async findMany(
    collection: string,
    params: FindManyParams = {},
  ): Promise<FindManyResult<Record<string, unknown>>> {
    const model = this.getModel(collection);
    const { filters = {}, sort, pagination } = params;
    const mongoFilter = this.queryBuilder.buildMongoFilter(filters);
    const pag = this.queryBuilder.parsePagination(pagination);

    let sortObj: Record<string, 1 | -1> = {};
    if (sort && typeof sort === "string") {
      const [field, dir] = sort.split(":");
      sortObj[field] = dir === "desc" ? -1 : 1;
    } else if (sort && typeof sort === "object" && !Array.isArray(sort)) {
      const s = sort as { field: string; direction: string };
      sortObj[s.field] = s.direction === "desc" ? -1 : 1;
    } else if (Array.isArray(sort)) {
      sort.forEach((s) => {
        sortObj[s.field] = s.direction === "desc" ? -1 : 1;
      });
    }

    const [data, total] = await Promise.all([
      model
        .find(mongoFilter)
        .sort(sortObj)
        .skip(pag.offset)
        .limit(pag.limit)
        .lean(),
      model.countDocuments(mongoFilter),
    ]);

    const pageCount = Math.ceil(total / pag.pageSize);

    return {
      data: data.map((doc) => {
        const d = doc as Record<string, unknown>;
        if (d._id) {
          d.id = d._id.toString();
          delete d._id;
        }
        return d;
      }),
      meta: {
        pagination: {
          page: pag.page,
          pageSize: pag.pageSize,
          pageCount,
          total,
        },
      },
    };
  }

  async findOne(
    collection: string,
    id: string | number,
  ): Promise<Record<string, unknown> | null> {
    const model = this.getModel(collection);
    try {
      const doc = await model.findById(id).lean();
      if (!doc) return null;
      const d = doc as Record<string, unknown>;
      if (d._id) {
        d.id = d._id.toString();
        delete d._id;
      }
      return d;
    } catch {
      // Try as string ID
      const doc = await model.findOne({ _id: id }).lean();
      if (!doc) return null;
      const d = doc as Record<string, unknown>;
      if (d._id) {
        d.id = d._id.toString();
        delete d._id;
      }
      return d;
    }
  }

  async findOneBy(
    collection: string,
    where: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> {
    const model = this.getModel(collection);
    const mongoFilter = this.queryBuilder.buildMongoFilter(where);
    const doc = await model.findOne(mongoFilter).lean();
    if (!doc) return null;
    const d = doc as Record<string, unknown>;
    if (d._id) {
      d.id = d._id.toString();
      delete d._id;
    }
    return d;
  }

  async create(
    collection: string,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const model = this.getModel(collection);
    const doc = await model.create(data);
    const result = doc.toObject() as unknown as Record<string, unknown>;
    if (result._id) {
      result.id = result._id.toString();
      delete result._id;
    }
    return result;
  }

  async update(
    collection: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const model = this.getModel(collection);
    const doc = await model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
    if (!doc) throw new Error(`Document not found: ${id}`);
    const d = doc as Record<string, unknown>;
    if (d._id) {
      d.id = d._id.toString();
      delete d._id;
    }
    return d;
  }

  async delete(
    collection: string,
    id: string | number,
  ): Promise<Record<string, unknown>> {
    const model = this.getModel(collection);
    const doc = await model.findByIdAndDelete(id).lean();
    if (!doc) throw new Error(`Document not found: ${id}`);
    const d = doc as Record<string, unknown>;
    if (d._id) {
      d.id = d._id.toString();
      delete d._id;
    }
    return d;
  }

  async count(
    collection: string,
    filters: Record<string, unknown> = {},
  ): Promise<number> {
    const model = this.getModel(collection);
    const mongoFilter = this.queryBuilder.buildMongoFilter(filters);
    return model.countDocuments(mongoFilter);
  }

  async createTable(name: string, schema: TableSchema): Promise<void> {
    // MongoDB doesn't need explicit collection creation
    console.log(
      `[MongoAdapter] Collection "${name}" will be created on first insert`,
    );
  }

  async dropTable(name: string): Promise<void> {
    if (this.connection) {
      await this.connection.dropCollection(name).catch(() => {});
    }
  }

  async tableExists(name: string): Promise<boolean> {
    if (!this.connection) return false;
    const collections = await this.connection
      .db!.listCollections({ name })
      .toArray();
    return collections.length > 0;
  }

  async raw(query: string, params: unknown[] = []): Promise<unknown> {
    // For MongoDB, raw is an aggregation pipeline or command
    if (!this.connection?.db) throw new Error("Not connected");
    return this.connection.db.command(JSON.parse(query));
  }
}
