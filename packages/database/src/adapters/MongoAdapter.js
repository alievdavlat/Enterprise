import mongoose, { Schema } from "mongoose";
import { QueryBuilder } from "@enterprise/core";
export class MongoAdapter {
    constructor(config) {
        this.connection = null;
        this.queryBuilder = new QueryBuilder();
        this._isConnected = false;
        this.models = new Map();
        this.config = config;
    }
    async connect() {
        const uri = this.config.uri ||
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
    async disconnect() {
        if (this.connection) {
            await this.connection.close();
            this._isConnected = false;
            console.log("[MongoAdapter] Disconnected from MongoDB");
        }
    }
    isConnected() {
        return this._isConnected;
    }
    getModel(collection) {
        if (this.models.has(collection)) {
            return this.models.get(collection);
        }
        const schema = new Schema({}, { strict: false, timestamps: true });
        const model = this.connection.model(collection, schema, collection);
        this.models.set(collection, model);
        return model;
    }
    async findMany(collection, params = {}) {
        const model = this.getModel(collection);
        const { filters = {}, sort, pagination } = params;
        const mongoFilter = this.queryBuilder.buildMongoFilter(filters);
        const pag = this.queryBuilder.parsePagination(pagination);
        let sortObj = {};
        if (sort && typeof sort === "string") {
            const [field, dir] = sort.split(":");
            sortObj[field] = dir === "desc" ? -1 : 1;
        }
        else if (sort && typeof sort === "object" && !Array.isArray(sort)) {
            const s = sort;
            sortObj[s.field] = s.direction === "desc" ? -1 : 1;
        }
        else if (Array.isArray(sort)) {
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
                const d = doc;
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
    async findOne(collection, id) {
        const model = this.getModel(collection);
        try {
            const doc = await model.findById(id).lean();
            if (!doc)
                return null;
            const d = doc;
            if (d._id) {
                d.id = d._id.toString();
                delete d._id;
            }
            return d;
        }
        catch {
            // Try as string ID
            const doc = await model.findOne({ _id: id }).lean();
            if (!doc)
                return null;
            const d = doc;
            if (d._id) {
                d.id = d._id.toString();
                delete d._id;
            }
            return d;
        }
    }
    async findOneBy(collection, where) {
        const model = this.getModel(collection);
        const mongoFilter = this.queryBuilder.buildMongoFilter(where);
        const doc = await model.findOne(mongoFilter).lean();
        if (!doc)
            return null;
        const d = doc;
        if (d._id) {
            d.id = d._id.toString();
            delete d._id;
        }
        return d;
    }
    async create(collection, data) {
        const model = this.getModel(collection);
        const doc = await model.create(data);
        const result = doc.toObject();
        if (result._id) {
            result.id = result._id.toString();
            delete result._id;
        }
        return result;
    }
    async update(collection, id, data) {
        const model = this.getModel(collection);
        const doc = await model
            .findByIdAndUpdate(id, { $set: data }, { new: true })
            .lean();
        if (!doc)
            throw new Error(`Document not found: ${id}`);
        const d = doc;
        if (d._id) {
            d.id = d._id.toString();
            delete d._id;
        }
        return d;
    }
    async delete(collection, id) {
        const model = this.getModel(collection);
        const doc = await model.findByIdAndDelete(id).lean();
        if (!doc)
            throw new Error(`Document not found: ${id}`);
        const d = doc;
        if (d._id) {
            d.id = d._id.toString();
            delete d._id;
        }
        return d;
    }
    async count(collection, filters = {}) {
        const model = this.getModel(collection);
        const mongoFilter = this.queryBuilder.buildMongoFilter(filters);
        return model.countDocuments(mongoFilter);
    }
    async createTable(name, schema) {
        // MongoDB doesn't need explicit collection creation
        console.log(`[MongoAdapter] Collection "${name}" will be created on first insert`);
    }
    async dropTable(name) {
        if (this.connection) {
            await this.connection.dropCollection(name).catch(() => { });
        }
    }
    async tableExists(name) {
        if (!this.connection)
            return false;
        const collections = await this.connection
            .db.listCollections({ name })
            .toArray();
        return collections.length > 0;
    }
    async raw(query, params = []) {
        // For MongoDB, raw is an aggregation pipeline or command
        if (!this.connection?.db)
            throw new Error("Not connected");
        return this.connection.db.command(JSON.parse(query));
    }
}
//# sourceMappingURL=MongoAdapter.js.map