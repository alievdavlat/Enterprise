import { Router, Request, Response, NextFunction } from "express";
import type { SchemaRegistry, DocumentService } from "@enterprise/core";
import type { ContentTypeSchema, FindManyParams, DocumentId } from "@enterprise/types";
import type { DatabaseAdapter } from "@enterprise/database";
import type { LifecycleManager } from "@enterprise/core";
import { ensureTableForSchema } from "../loadSchemasFromDb";

const DOCUMENT_ID_LENGTH = 24;
function looksLikeDocumentId(id: string): boolean {
  return id.length === DOCUMENT_ID_LENGTH && /^[a-zA-Z0-9]+$/.test(id);
}

function ensureDocumentId(row: Record<string, unknown>): Record<string, unknown> {
  if (row.documentId) return row;
  return { ...row, documentId: row.documentId ?? String(row.id ?? "") };
}

interface FieldConfig {
  type?: string;
  required?: boolean;
  unique?: boolean;
  maxLength?: number;
  minLength?: number;
  regex?: string;
  default?: unknown;
  private?: boolean;
  enum?: string[];
  relation?: string;
}

function validateAndApplyDefaults(
  data: Record<string, unknown>,
  attributes: Record<string, FieldConfig>,
  isUpdate: boolean,
): { data: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const result = { ...data };

  for (const [field, config] of Object.entries(attributes)) {
    const value = result[field];
    const isEmpty = value === undefined || value === null || value === "";

    if (!isUpdate && isEmpty && config.default !== undefined) {
      result[field] = config.default;
      continue;
    }

    if (config.required && isEmpty && !isUpdate) {
      errors.push(`"${field}" is required`);
      continue;
    }

    if (isEmpty) continue;

    const strVal = typeof value === "string" ? value : undefined;

    if (strVal !== undefined && config.maxLength && strVal.length > config.maxLength) {
      errors.push(`"${field}" exceeds maximum length of ${config.maxLength}`);
    }

    if (strVal !== undefined && config.minLength && strVal.length < config.minLength) {
      errors.push(`"${field}" is shorter than minimum length of ${config.minLength}`);
    }

    if (strVal !== undefined && config.regex) {
      try {
        if (!new RegExp(config.regex).test(strVal)) {
          errors.push(`"${field}" does not match pattern ${config.regex}`);
        }
      } catch {
        // Invalid regex in schema — skip validation
      }
    }

    if (config.type === "enumeration" && Array.isArray(config.enum) && strVal !== undefined) {
      if (!config.enum.includes(strVal)) {
        errors.push(`"${field}" must be one of: ${config.enum.join(", ")}`);
      }
    }

    if (config.type === "email" && strVal !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        errors.push(`"${field}" is not a valid email address`);
      }
    }

    if ((config.type === "integer" || config.type === "biginteger") && value !== undefined && value !== null && value !== "") {
      if (!Number.isInteger(Number(value)) || isNaN(Number(value))) {
        errors.push(`"${field}" must be an integer`);
      }
    }

    if ((config.type === "float" || config.type === "decimal") && value !== undefined && value !== null && value !== "") {
      if (isNaN(Number(value))) {
        errors.push(`"${field}" must be a number`);
      }
    }

    if (config.type === "boolean" && value !== undefined && value !== null) {
      if (typeof value !== "boolean" && value !== 0 && value !== 1 && value !== "true" && value !== "false") {
        errors.push(`"${field}" must be a boolean`);
      }
    }

    if (config.type === "relation" && value !== undefined && value !== null && value !== "") {
      const isMulti = config.relation === "oneToMany" || config.relation === "manyToMany";
      if (isMulti) {
        const arr = Array.isArray(value) ? value : [value];
        const invalid = arr.some((v) => typeof v !== "number" || !Number.isInteger(v) || isNaN(v));
        if (invalid) {
          errors.push(`"${field}" must be an array of integers`);
        } else {
          result[field] = arr;
        }
      } else {
        const n = Number(value);
        if (!Number.isInteger(n) || isNaN(n)) {
          errors.push(`"${field}" must be an integer`);
        } else {
          result[field] = n;
        }
      }
    }
  }

  return { data: result, errors };
}

async function checkUniqueConstraints(
  db: DatabaseAdapter,
  collectionName: string,
  data: Record<string, unknown>,
  attributes: Record<string, FieldConfig>,
  excludeId?: string | number,
): Promise<string[]> {
  const errors: string[] = [];
  for (const [field, config] of Object.entries(attributes)) {
    if (!config.unique) continue;
    const value = data[field];
    if (value === undefined || value === null || value === "") continue;
    const existing = await db.findOneBy(collectionName, { [field]: value });
    if (existing) {
      const existingId = (existing as Record<string, unknown>).id ?? (existing as Record<string, unknown>).documentId;
      if (excludeId !== undefined && String(existingId) === String(excludeId)) continue;
      errors.push(`"${field}" must be unique — value "${value}" already exists`);
    }
  }
  return errors;
}

function stripPrivateFields(
  row: Record<string, unknown>,
  attributes: Record<string, FieldConfig>,
): Record<string, unknown> {
  const result = { ...row };
  for (const [field, config] of Object.entries(attributes)) {
    if (config.private) {
      delete result[field];
    }
  }
  return result;
}

export function createContentTypeRouter(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
  lifecycleManager: LifecycleManager,
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

    // Pagination: ?page=1&pageSize=25 or ?pagination[page]=1&pagination[pageSize]=25
    if (query.pagination && typeof query.pagination === "object") {
      params.pagination = query.pagination as Record<string, number>;
    } else {
      const p = Number(query.page);
      const ps = Number(query.pageSize);
      params.pagination = {
        page: Number.isFinite(p) && p >= 1 ? p : 1,
        pageSize: Number.isFinite(ps) && ps >= 1 ? Math.min(ps, 200) : 25,
      };
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

    if (kind === "collectionType" || kind === "component" || kind === "dynamiczone") {
      // GET /api/{plural} - find many
      router.get(
        `/${pluralName}`,
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            const params = parseQueryParams(
              req.query as Record<string, unknown>,
            );

            await lifecycleManager.run("beforeFindMany", {
              model: uid,
              action: "beforeFindMany",
              params: params as unknown as Record<string, unknown>,
            });

            const result = await db.findMany(schema.collectionName, params);
            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            const dataWithDocumentId = result.data
              .map(ensureDocumentId)
              .map((row) => stripPrivateFields(row, attrs));

            const out = { data: dataWithDocumentId, meta: result.meta };
            const afterCtx = await lifecycleManager.run("afterFindMany", {
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

            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            const { data: validatedData, errors } = validateAndApplyDefaults(data, attrs, false);
            if (errors.length > 0) {
              return res.status(400).json({ error: { status: 400, message: "Validation error", details: errors } });
            }

            const uniqueErrors = await checkUniqueConstraints(db, schema.collectionName, validatedData, attrs);
            if (uniqueErrors.length > 0) {
              return res.status(400).json({ error: { status: 400, message: "Validation error", details: uniqueErrors } });
            }

            await ensureTableForSchema(db, schema);
            await lifecycleManager.run("beforeCreate", {
              model: uid,
              action: "beforeCreate",
              params: { data: validatedData },
            });
            const created = await documentService
              .documents(uid)
              .create({ data: validatedData });
            const afterCtx = await lifecycleManager.run("afterCreate", {
              model: uid,
              action: "afterCreate",
              params: { data: validatedData },
              result: created,
            });

            const result = (afterCtx.result || created) as Record<string, unknown>;
            res.status(201).json({ data: stripPrivateFields(result, attrs) });
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
            await lifecycleManager.run("beforeFindOne", {
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
            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            const withDocId = stripPrivateFields(ensureDocumentId(item), attrs);
            const afterCtx = await lifecycleManager.run("afterFindOne", {
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

            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            const { data: validatedData, errors } = validateAndApplyDefaults(data, attrs, true);
            if (errors.length > 0) {
              return res.status(400).json({ error: { status: 400, message: "Validation error", details: errors } });
            }

            const excludeId = looksLikeDocumentId(id) ? id : (Number(id) || id);
            const uniqueErrors = await checkUniqueConstraints(db, schema.collectionName, validatedData, attrs, excludeId);
            if (uniqueErrors.length > 0) {
              return res.status(400).json({ error: { status: 400, message: "Validation error", details: uniqueErrors } });
            }

            await ensureTableForSchema(db, schema);
            await lifecycleManager.run("beforeUpdate", {
              model: uid,
              action: "beforeUpdate",
              params: { id, data: validatedData },
            });
            let updated: Record<string, unknown>;
            if (looksLikeDocumentId(id)) {
              updated = (await documentService.documents(uid).update({
                documentId: id as DocumentId,
                data: validatedData,
              })) as unknown as Record<string, unknown>;
            } else {
              const idVal = Number(id) || id;
              updated = await db.update(schema.collectionName, idVal, validatedData);
            }
            const withDocId = ensureDocumentId(updated);
            const afterCtx = await lifecycleManager.run("afterUpdate", {
              model: uid,
              action: "afterUpdate",
              params: { id, data: validatedData },
              result: withDocId,
            });
            const result = (afterCtx.result ?? withDocId) as Record<string, unknown>;
            res.json({ data: stripPrivateFields(result, attrs) });
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
            await lifecycleManager.run("beforeDelete", {
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
            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            const withDocId = stripPrivateFields(ensureDocumentId(deleted), attrs);
            const afterCtx = await lifecycleManager.run("afterDelete", {
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
            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            res.json({
              data: first ? stripPrivateFields(ensureDocumentId(first as Record<string, unknown>), attrs) : null,
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
            const attrs = (schema.attributes || {}) as Record<string, FieldConfig>;
            const existing = await db.findMany(schema.collectionName, {
              pagination: { page: 1, pageSize: 1 },
            });
            const isUpdate = existing.data.length > 0;
            const { data: validatedData, errors } = validateAndApplyDefaults(data, attrs, isUpdate);
            if (errors.length > 0) {
              return res.status(400).json({ error: { status: 400, message: "Validation error", details: errors } });
            }

            const first = existing.data[0] as Record<string, unknown> | undefined;
            const excludeId = first?.id ?? first?.documentId;
            const uniqueErrors = await checkUniqueConstraints(db, schema.collectionName, validatedData, attrs, excludeId as string | number | undefined);
            if (uniqueErrors.length > 0) {
              return res.status(400).json({ error: { status: 400, message: "Validation error", details: uniqueErrors } });
            }

            await ensureTableForSchema(db, schema);
            let result: Record<string, unknown>;
            if (first?.documentId) {
              result = (await documentService.documents(uid).update({
                documentId: first.documentId as DocumentId,
                data: validatedData as Record<string, unknown>,
              })) as unknown as Record<string, unknown>;
            } else if (first?.id != null) {
              result = await db.update(
                schema.collectionName,
                first.id as string | number,
                validatedData,
              );
            } else {
              result = (await documentService
                .documents(uid)
                .create({ data: validatedData })) as unknown as Record<string, unknown>;
            }
            res.json({ data: stripPrivateFields(ensureDocumentId(result), attrs) });
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
