import type { SchemaRegistry } from "../schema/SchemaRegistry";
import type {
  ContentTypeSchema,
  Document,
  DocumentId,
  DocumentServiceDb,
  FindOneParams,
  FindFirstParams,
  FindManyParams,
  DocumentServiceApi,
  DocumentServiceCreateParams,
  DocumentServiceUpdateParams,
  DocumentServiceDeleteParams,
  Filters,
  HookEvent,
} from "@enterprise/types";
import type { LifecycleManager } from "../lifecycle/LifecycleManager";

const DOCUMENT_ID_LENGTH = 24;
const ALPHANUM =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateDocumentId(): DocumentId {
  let id = "";
  for (let i = 0; i < DOCUMENT_ID_LENGTH; i++) {
    id += ALPHANUM[Math.floor(Math.random() * ALPHANUM.length)];
  }
  return id;
}

function toDocument<T = Record<string, unknown>>(
  row: Record<string, unknown>,
  schema: ContentTypeSchema,
): Document<T> {
  const doc: Document<T> = {
    documentId: (row.documentId as DocumentId) || String(row.id),
    id: row.id as number | string,
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? ""),
    ...row,
  } as Document<T>;
  if (schema.draftAndPublish && row.publishedAt !== undefined) {
    doc.publishedAt = row.publishedAt ? String(row.publishedAt) : null;
    doc.status = row.publishedAt ? "published" : "draft";
  }
  return doc;
}

/**
 * Document Service (Strapi v5 alignment).
 * Provides documents(uid).findOne, findMany, create, update, delete, publish, unpublish, discardDraft, count.
 */
export class DocumentService {
  constructor(
    private schemaRegistry: SchemaRegistry,
    private db: DocumentServiceDb,
    private lifecycleManager?: LifecycleManager,
  ) {}

  /**
   * Get Document Service API for a content-type by UID (e.g. 'api::article.article').
   */
  documents<T = Record<string, unknown>>(
    uid: string,
  ): DocumentServiceApi<T> {
    const schema = this.schemaRegistry.get(uid);
    if (!schema) {
      throw new Error(`Content type "${uid}" not found`);
    }
    const collection = schema.collectionName;

    const runLifecycle = async (
      event: HookEvent,
      ctx: { model: string; action: string; params: unknown; result?: unknown },
    ) => {
      if (this.lifecycleManager) {
        const out = await this.lifecycleManager.run(event, ctx as any);
        return out?.result;
      }
      return ctx.result;
    };

    return {
      findOne: async (params: FindOneParams): Promise<Document<T> | null> => {
        const doc = await this.db.findOneBy(collection, {
          documentId: params.documentId,
        });
        if (!doc) return null;
        const result = toDocument(doc, schema) as Document<T>;
        const after = await runLifecycle("afterFindOne", {
          model: uid,
          action: "beforeFindOne",
          params,
          result,
        });
        return (after as Document<T>) ?? result;
      },

      findFirst: async (
        params?: FindFirstParams,
      ): Promise<Document<T> | null> => {
        const findParams: FindManyParams = {
          filters: params?.filters,
          sort: [{ field: "id", direction: "asc" }],
          pagination: { page: 1, pageSize: 1 },
          status: params?.status,
          locale: params?.locale,
          fields: params?.fields as string[] | undefined,
          populate: params?.populate as string[] | Record<string, unknown> | undefined,
        };
        const result = await this.db.findMany(collection, findParams);
        const first = result.data[0];
        if (!first) return null;
        return toDocument(first as Record<string, unknown>, schema) as Document<T>;
      },

      findMany: async (
        params?: FindManyParams,
      ): Promise<Document<T>[]> => {
        const result = await this.db.findMany(collection, params ?? {});
        return result.data.map((row) =>
          toDocument(row as Record<string, unknown>, schema),
        ) as Document<T>[];
      },

      create: async (
        params: DocumentServiceCreateParams<T>,
      ): Promise<Document<T>> => {
        const documentId = generateDocumentId();
        const data = {
          ...(params.data as Record<string, unknown>),
          documentId,
        };
        await runLifecycle("beforeCreate", {
          model: uid,
          action: "beforeCreate",
          params: { data },
        });
        const created = await this.db.create(collection, data);
        const doc = toDocument(created as Record<string, unknown>, schema) as Document<T>;
        const after = await runLifecycle("afterCreate", {
          model: uid,
          action: "afterCreate",
          params: { data },
          result: doc,
        });
        return (after as Document<T>) ?? doc;
      },

      update: async (
        params: DocumentServiceUpdateParams<T>,
      ): Promise<Document<T>> => {
        const existing = await this.db.findOneBy(collection, {
          documentId: params.documentId,
        });
        if (!existing) {
          throw new Error(`Document ${params.documentId} not found`);
        }
        const id = existing.id as number | string;
        const data = {
          ...(params.data as Record<string, unknown>),
          documentId: params.documentId,
        };
        await runLifecycle("beforeUpdate", {
          model: uid,
          action: "beforeUpdate",
          params: { id, data },
        });
        const updated = await this.db.update(collection, id, data);
        const doc = toDocument(updated as Record<string, unknown>, schema) as Document<T>;
        const after = await runLifecycle("afterUpdate", {
          model: uid,
          action: "afterUpdate",
          params: { id, data },
          result: doc,
        });
        return (after as Document<T>) ?? doc;
      },

      delete: async (
        params: DocumentServiceDeleteParams,
      ): Promise<Document<T> | null> => {
        const existing = await this.db.findOneBy(collection, {
          documentId: params.documentId,
        });
        if (!existing) return null;
        const id = existing.id as number | string;
        await runLifecycle("beforeDelete", {
          model: uid,
          action: "beforeDelete",
          params: { id },
        });
        const deleted = await this.db.delete(collection, id);
        const doc = toDocument(deleted as Record<string, unknown>, schema) as Document<T>;
        await runLifecycle("afterDelete", {
          model: uid,
          action: "afterDelete",
          params: { id },
          result: doc,
        });
        return doc;
      },

      publish: async (params: {
        documentId: DocumentId;
        locale?: string;
      }): Promise<Document<T>> => {
        const existing = await this.db.findOneBy(collection, {
          documentId: params.documentId,
        });
        if (!existing) throw new Error(`Document ${params.documentId} not found`);
        const id = existing.id as number | string;
        const updated = await this.db.update(collection, id, {
          ...existing,
          publishedAt: new Date().toISOString(),
        });
        return toDocument(updated as Record<string, unknown>, schema) as Document<T>;
      },

      unpublish: async (params: {
        documentId: DocumentId;
        locale?: string;
      }): Promise<Document<T>> => {
        const existing = await this.db.findOneBy(collection, {
          documentId: params.documentId,
        });
        if (!existing) throw new Error(`Document ${params.documentId} not found`);
        const id = existing.id as number | string;
        const updated = await this.db.update(collection, id, {
          ...existing,
          publishedAt: null,
        });
        return toDocument(updated as Record<string, unknown>, schema) as Document<T>;
      },

      discardDraft: async (params: {
        documentId: DocumentId;
        locale?: string;
      }): Promise<Document<T>> => {
        const existing = await this.db.findOneBy(collection, {
          documentId: params.documentId,
        });
        if (!existing) throw new Error(`Document ${params.documentId} not found`);
        const publishedAt = existing.publishedAt ?? null;
        const id = existing.id as number | string;
        const updated = await this.db.update(collection, id, {
          ...existing,
          publishedAt,
        });
        return toDocument(updated as Record<string, unknown>, schema) as Document<T>;
      },

      count: async (params?: {
        filters?: Filters;
        status?: "draft" | "published";
        locale?: string;
      }): Promise<number> => {
        return this.db.count(collection, params?.filters as Record<string, unknown>);
      },
    };
  }
}
