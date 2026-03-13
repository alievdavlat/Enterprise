import { Router, Request, Response, NextFunction } from "express";
import type { SchemaRegistry, DocumentService } from "@enterprise/core";
import type { ContentTypeSchema, FindManyParams, DocumentId } from "@enterprise/types";
import type { DatabaseAdapter } from "@enterprise/database";
import { HookManager } from "@enterprise/core";

const DOCUMENT_ID_LENGTH = 24;
function looksLikeDocumentId(id: string): boolean {
  return id.length === DOCUMENT_ID_LENGTH && /^[a-zA-Z0-9]+$/.test(id);
}

function ensureDocumentId(row: Record<string, unknown>): Record<string, unknown> {
  if (row.documentId) return row;
  return { ...row, documentId: row.documentId ?? String(row.id ?? "") };
}

export function createContentTypeRouter(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
  hookManager: HookManager,
  documentService: DocumentService,
): Router {
  const router = Router();

  /**
   * Parse query params into FindManyParams
   */
  function parseQueryParams(query: Record<string, unknown>): FindManyParams {
    const params: FindManyParams = {};

    // Filters: ?filters[name][$contains]=test
    if (query.filters && typeof query.filters === "object") {
      params.filters = query.filters as Record<string, unknown>;
    }

    // Sort: ?sort=name:asc or ?sort[0]=name:asc
    if (query.sort) {
      if (typeof query.sort === "string") {
        const parts = (query.sort as string).split(":");
        params.sort = {
          field: parts[0],
          direction: (parts[1] as "asc" | "desc") || "asc",
        };
      }
    }

    // Pagination: ?pagination[page]=1&pagination[pageSize]=25
    if (query.pagination && typeof query.pagination === "object") {
      params.pagination = query.pagination as Record<string, number>;
    } else {
      params.pagination = { page: 1, pageSize: 25 };
    }

    // Fields: ?fields[0]=name&fields[1]=title
    if (query.fields) {
      params.fields = Array.isArray(query.fields)
        ? (query.fields as string[])
        : [query.fields as string];
    }

    // Populate: ?populate=*
    if (query.populate) {
      if (query.populate === "*") {
        params.populate = ["*"];
      } else {
        params.populate = Array.isArray(query.populate)
          ? (query.populate as string[])
          : [query.populate as string];
      }
    }

    // Status: ?status=draft | published (Strapi v5 Draft & Publish)
    if (query.status === "draft" || query.status === "published") {
      params.status = query.status;
    }

    return params;
  }

  // Register routes for each content type schema
  function registerContentTypeRoutes(schema: ContentTypeSchema): void {
    const { uid, pluralName, singularName, kind } = schema;

    if (kind === "collectionType") {
      // GET /api/{plural} - find many
      router.get(
        `/${pluralName}`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const params = parseQueryParams(
              req.query as Record<string, unknown>,
            );

            // Run beforeFindMany hook
            await hookManager.run("beforeFindMany", {
              model: uid,
              action: "beforeFindMany",
              params: params as unknown as Record<string, unknown>,
            });

            const result = await db.findMany(schema.collectionName, params);
            const dataWithDocumentId = result.data.map(ensureDocumentId);

            const out = { data: dataWithDocumentId, meta: result.meta };
            const afterCtx = await hookManager.run("afterFindMany", {
              model: uid,
              action: "afterFindMany",
              params: params as unknown as Record<string, unknown>,
              result: out,
            });

            res.json(afterCtx.result || out);
          } catch (err) {
            next(err);
          }
        },
      );

      // POST /api/{plural} - create
      router.post(
        `/${pluralName}`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const { data } = req.body;
            if (!data)
              return res
                .status(400)
                .json({
                  error: {
                    status: 400,
                    message: "data is required in request body",
                  },
                });

            await hookManager.run("beforeCreate", {
              model: uid,
              action: "beforeCreate",
              params: { data },
            });
            const created = await documentService
              .documents(uid)
              .create({ data });
            const afterCtx = await hookManager.run("afterCreate", {
              model: uid,
              action: "afterCreate",
              params: { data },
              result: created,
            });

            res.status(201).json({ data: afterCtx.result || created });
          } catch (err) {
            next(err);
          }
        },
      );

      // GET /api/{plural}/:id (id can be numeric id or documentId – Strapi v5)
      router.get(
        `/${pluralName}/:id`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const idRaw = req.params.id;
            const id = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
            await hookManager.run("beforeFindOne", {
              model: uid,
              action: "beforeFindOne",
              params: { id },
            });
            let item: Record<string, unknown> | null;
            if (looksLikeDocumentId(id)) {
              const doc = await documentService
                .documents(uid)
                .findOne({ documentId: id as DocumentId });
              item = doc as unknown as Record<string, unknown>;
            } else {
              const idVal = Number(id) || id;
              item = await db.findOne(schema.collectionName, idVal);
            }
            if (!item)
              return res
                .status(404)
                .json({ error: { status: 404, message: "Not found" } });
            const withDocId = ensureDocumentId(item);
            const afterCtx = await hookManager.run("afterFindOne", {
              model: uid,
              action: "afterFindOne",
              params: { id },
              result: withDocId,
            });
            res.json({ data: afterCtx.result ?? withDocId });
          } catch (err) {
            next(err);
          }
        },
      );

      // PUT /api/{plural}/:id (id can be numeric or documentId – Strapi v5)
      router.put(
        `/${pluralName}/:id`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const idRaw = req.params.id;
            const id = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
            const { data } = req.body;
            if (!data)
              return res
                .status(400)
                .json({ error: { status: 400, message: "data is required" } });

            await hookManager.run("beforeUpdate", {
              model: uid,
              action: "beforeUpdate",
              params: { id, data },
            });
            let updated: Record<string, unknown>;
            if (looksLikeDocumentId(id)) {
              updated = (await documentService.documents(uid).update({
                documentId: id as DocumentId,
                data,
              })) as unknown as Record<string, unknown>;
            } else {
              const idVal = Number(id) || id;
              updated = await db.update(schema.collectionName, idVal, data);
            }
            const withDocId = ensureDocumentId(updated);
            const afterCtx = await hookManager.run("afterUpdate", {
              model: uid,
              action: "afterUpdate",
              params: { id, data },
              result: withDocId,
            });
            res.json({ data: afterCtx.result ?? withDocId });
          } catch (err) {
            next(err);
          }
        },
      );

      // DELETE /api/{plural}/:id (id can be numeric or documentId – Strapi v5)
      router.delete(
        `/${pluralName}/:id`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const idRaw = req.params.id;
            const id = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
            await hookManager.run("beforeDelete", {
              model: uid,
              action: "beforeDelete",
              params: { id },
            });
            let deleted: Record<string, unknown> | null;
            if (looksLikeDocumentId(id)) {
              deleted = (await documentService.documents(uid).delete({
                documentId: id as DocumentId,
              })) as unknown as Record<string, unknown>;
            } else {
              const idVal = Number(id) || id;
              deleted = await db.delete(schema.collectionName, idVal);
            }
            if (!deleted)
              return res
                .status(404)
                .json({ error: { status: 404, message: "Not found" } });
            const withDocId = ensureDocumentId(deleted);
            const afterCtx = await hookManager.run("afterDelete", {
              model: uid,
              action: "afterDelete",
              params: { id },
              result: withDocId,
            });
            res.json({ data: afterCtx.result ?? withDocId });
          } catch (err) {
            next(err);
          }
        },
      );

      // Draft & Publish (Strapi v5: documentId or id)
      if (schema.draftAndPublish) {
        router.post(
          `/${pluralName}/:id/publish`,
          async (req: Request, res: Response, next: NextFunction) => {
            try {
              const idRaw = req.params.id;
              const id = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
              let updated: Record<string, unknown>;
              if (looksLikeDocumentId(id)) {
                updated = (await documentService.documents(uid).publish({
                  documentId: id as DocumentId,
                })) as unknown as Record<string, unknown>;
              } else {
                const idVal = Number(id) || id;
                updated = await db.update(
                  schema.collectionName,
                  idVal,
                  { publishedAt: new Date().toISOString() },
                );
              }
              res.json({ data: ensureDocumentId(updated) });
            } catch (err) {
              next(err);
            }
          },
        );

        router.post(
          `/${pluralName}/:id/unpublish`,
          async (req: Request, res: Response, next: NextFunction) => {
            try {
              const idRaw = req.params.id;
              const id = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
              let updated: Record<string, unknown>;
              if (looksLikeDocumentId(id)) {
                updated = (await documentService.documents(uid).unpublish({
                  documentId: id as DocumentId,
                })) as unknown as Record<string, unknown>;
              } else {
                const idVal = Number(id) || id;
                updated = await db.update(schema.collectionName, idVal, {
                  publishedAt: null,
                });
              }
              res.json({ data: ensureDocumentId(updated) });
            } catch (err) {
              next(err);
            }
          },
        );
      }
    } else {
      // Single type (Strapi v5: documentId in response)
      router.get(
        `/${singularName}`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const result = await db.findMany(schema.collectionName, {
              pagination: { page: 1, pageSize: 1 },
            });
            const first = result.data[0];
            res.json({
              data: first ? ensureDocumentId(first as Record<string, unknown>) : null,
            });
          } catch (err) {
            next(err);
          }
        },
      );

      router.put(
        `/${singularName}`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const { data } = req.body;
            const existing = await db.findMany(schema.collectionName, {
              pagination: { page: 1, pageSize: 1 },
            });
            let result: Record<string, unknown>;
            const first = existing.data[0] as Record<string, unknown> | undefined;
            if (first?.documentId) {
              result = (await documentService.documents(uid).update({
                documentId: first.documentId as DocumentId,
                data: data as Record<string, unknown>,
              })) as unknown as Record<string, unknown>;
            } else if (first?.id != null) {
              result = await db.update(
                schema.collectionName,
                first.id as string | number,
                data,
              );
            } else {
              result = (await documentService
                .documents(uid)
                .create({ data })) as unknown as Record<string, unknown>;
            }
            res.json({ data: ensureDocumentId(result) });
          } catch (err) {
            next(err);
          }
        },
      );
    }
  }

  // Register all existing schemas
  schemaRegistry.getAll().forEach(registerContentTypeRoutes);

  // Allow dynamic registration of new content types
  (router as any).__registerSchema = registerContentTypeRoutes;

  return router;
}
