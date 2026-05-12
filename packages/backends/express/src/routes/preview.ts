import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import type { SchemaRegistry, DocumentService } from "@enterprise/core";
import type { DatabaseAdapter } from "@enterprise/database";
import type { DocumentId } from "@enterprise/types";

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
const DOCUMENT_ID_LENGTH = 24;

function looksLikeDocumentId(id: string): boolean {
  return id.length === DOCUMENT_ID_LENGTH && /^[a-zA-Z0-9]+$/.test(id);
}

/**
 * Public preview router. Mounted at `/api/preview` so a front-end can fetch
 * a draft entry with a short-lived token without needing auth — useful for
 * "Preview" buttons in the admin content manager.
 *
 * GET /api/preview/:uid/:idOrDocumentId?token=...
 *   → looks up the token, checks the uid matches, checks expiry,
 *     returns the entry regardless of publishedAt state.
 */
export function createPreviewRouter(
  schemaRegistry: SchemaRegistry,
  db: DatabaseAdapter,
  documentService: DocumentService,
): Router {
  const router = Router();
  const TABLE = "enterprise_preview_tokens";

  router.get("/:uid/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const uid = String(req.params.uid);
      const id = String(req.params.id);
      const token = (req.query.token as string | undefined)?.trim();
      if (!token) {
        return res.status(401).json({
          error: { status: 401, name: "Unauthorized", message: "token query parameter required" },
        });
      }
      const row = (await db.findOneBy(TABLE, { token })) as
        | { uid: string; documentId?: string; entryId?: number; expiresAt: string }
        | null;
      if (!row) {
        return res.status(404).json({ error: { status: 404, message: "Preview token not found" } });
      }
      if (row.uid !== uid) {
        return res.status(403).json({ error: { status: 403, message: "Token does not match content type" } });
      }
      if (new Date(row.expiresAt).getTime() < Date.now()) {
        return res.status(410).json({ error: { status: 410, message: "Preview token expired" } });
      }
      const schema = schemaRegistry.get(uid);
      if (!schema) {
        return res.status(404).json({ error: { status: 404, message: `Unknown content type ${uid}` } });
      }

      // Resolve the entry. Prefer documentId when the token carries one (or
      // the URL param looks like one); otherwise fall back to numeric id.
      let entry: Record<string, unknown> | null = null;
      const docId = row.documentId ?? (looksLikeDocumentId(id) ? id : undefined);
      if (docId) {
        entry = (await documentService
          .documents(uid)
          .findOne({ documentId: docId as DocumentId, status: "draft" })) as unknown as Record<string, unknown> | null;
      }
      if (!entry) {
        const numericId: string | number = row.entryId ?? (Number(id) || id);
        entry = await db.findOne(schema.collectionName, numericId);
      }
      if (!entry) {
        return res.status(404).json({ error: { status: 404, message: "Entry not found" } });
      }
      res.json({ data: entry });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

/**
 * Admin endpoint to mint a preview token. Mounted under `/api/admin/preview-tokens`
 * by EnterpriseServer.setupRoutes.
 *
 * POST /api/admin/preview-tokens  body: { uid, documentId?, entryId?, ttlMs? }
 *   → { data: { token, expiresAt, url? } } (url present when previewUrlBuilder is set)
 *
 * DELETE /api/admin/preview-tokens/:token  → invalidate ahead of expiry
 */
export function createAdminPreviewRouter(
  db: DatabaseAdapter,
  options?: {
    /**
     * Build a front-end preview URL from (uid, id, token). Wired by the
     * server from config so the admin UI can hand the user a clickable link.
     */
    previewUrlBuilder?: (input: {
      uid: string;
      documentId?: string;
      entryId?: number | string;
      token: string;
    }) => string | undefined;
  },
): Router {
  const router = Router();
  const TABLE = "enterprise_preview_tokens";

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { uid, documentId, entryId, ttlMs } = req.body ?? {};
      if (!uid) {
        return res.status(400).json({ error: { status: 400, message: "uid is required" } });
      }
      if (!documentId && entryId == null) {
        return res.status(400).json({
          error: { status: 400, message: "documentId or entryId is required" },
        });
      }
      const token = crypto.randomBytes(24).toString("hex");
      const expiresAt = new Date(Date.now() + (ttlMs ?? DEFAULT_TTL_MS)).toISOString();
      const userId = (req as Request & { user?: { id?: number } }).user?.id ?? null;
      await db.create(TABLE, {
        token,
        uid,
        documentId: documentId ?? null,
        entryId: entryId ?? null,
        expiresAt,
        userId,
      });
      const url = options?.previewUrlBuilder?.({ uid, documentId, entryId, token });
      res.status(201).json({ data: { token, expiresAt, url } });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/:token", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const row = (await db.findOneBy(TABLE, { token: req.params.token })) as
        | { id: number }
        | null;
      if (!row) return res.status(404).json({ error: { status: 404, message: "Not found" } });
      await db.delete(TABLE, row.id);
      res.json({ data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
