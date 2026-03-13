import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import type { DatabaseAdapter } from "@enterprise/database";
import { getDefaultUploadConfig, isAllowedMime, isWithinSizeLimit, type UploadConfig } from "@enterprise/core";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads";
const MEDIA_TABLE = "enterprise_media";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function createUploadMiddleware(uploadConfig?: UploadConfig) {
  const config = uploadConfig ?? getDefaultUploadConfig();
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || "";
      const hash = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      cb(null, `${hash}${ext}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: config.maxFileSize ?? 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (isAllowedMime(file.mimetype, config)) cb(null, true);
      else cb(new Error(`File type ${file.mimetype} not allowed`));
    },
  });
}

function toPublicUrl(filename: string): string {
  const base = (process.env.UPLOAD_BASE_URL || "/uploads").replace(/\/$/, "");
  return `${base}/${filename}`;
}

function paramId(p: string | number | string[] | undefined): number | string {
  const s = Array.isArray(p) ? p[0] : p;
  if (s === undefined) return 0;
  const n = Number(s);
  return Number.isNaN(n) || (n === 0 && s !== "0") ? s : n;
}

export function createMediaRouter(db: DatabaseAdapter, uploadConfig?: UploadConfig): Router {
  const router = Router();
  const upload = createUploadMiddleware(uploadConfig);

  /**
   * POST /api/upload – Upload files (Strapi-style: save to disk + DB)
   */
  router.post(
    "/",
    upload.array("files", 10),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          return res.status(400).json({ error: { status: 400, message: "No files uploaded" } });
        }
        const fileInfo = (req.body?.fileInfo && typeof req.body.fileInfo === "string")
          ? (() => { try { return JSON.parse(req.body.fileInfo); } catch { return {}; } })()
          : (req.body?.fileInfo && typeof req.body.fileInfo === "object" ? req.body.fileInfo : {});

        const created: Record<string, unknown>[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const info = Array.isArray(fileInfo) ? fileInfo[i] : fileInfo;
          const name = info?.name ?? file.originalname;
          const caption = info?.caption ?? null;
          const alternativeText = info?.alternativeText ?? info?.alt ?? null;
          const row = await db.create(MEDIA_TABLE, {
            name,
            hash: path.basename(file.filename, path.extname(file.filename)),
            ext: path.extname(file.filename),
            mime: file.mimetype,
            size: file.size / 1024,
            url: toPublicUrl(file.filename),
            provider: "local",
            caption: caption ?? null,
            alternativeText: alternativeText ?? null,
            folderPath: null,
          });
          const r = row as { created_at?: string; updated_at?: string };
          created.push({
            ...row,
            createdAt: r.created_at ?? (row as { createdAt?: string }).createdAt,
            updatedAt: r.updated_at ?? (row as { updatedAt?: string }).updatedAt,
          });
        }
        res.status(201).json(created);
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * GET /api/upload/files – List media (Strapi-style: from DB)
   */
  router.get("/files", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
      const sortParam = req.query.sort as string | undefined;
      let sort: { field: string; direction: "asc" | "desc" }[] = [{ field: "created_at", direction: "desc" }];
      if (sortParam && /^[\w_]+:(asc|desc)$/i.test(sortParam)) {
        const [field, dir] = sortParam.split(":");
        const allowed = ["created_at", "updated_at", "name", "size"];
        if (allowed.includes(field)) sort = [{ field, direction: dir.toLowerCase() as "asc" | "desc" }];
      }
      const result = await db.findMany(MEDIA_TABLE, {
        pagination: { page, pageSize },
        sort,
      });
      const data = (result.data as Record<string, unknown>[]).map((row) => ({
        id: row.id,
        name: row.name,
        hash: row.hash,
        ext: row.ext,
        mime: row.mime,
        size: row.size,
        url: row.url,
        provider: row.provider,
        caption: row.caption,
        alternativeText: row.alternativeText,
        folderPath: row.folderPath,
        createdAt: row.created_at ?? row.createdAt,
        updatedAt: row.updated_at ?? row.updatedAt,
      }));
      res.json({ data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/upload/files/:id – Get one file metadata (Strapi-style)
   */
  router.get("/files/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const row = await db.findOne(MEDIA_TABLE, id);
      if (!row) {
        return res.status(404).json({ error: { status: 404, message: "File not found" } });
      }
      const r = row as Record<string, unknown>;
      res.json({
        id: r.id,
        name: r.name,
        hash: r.hash,
        ext: r.ext,
        mime: r.mime,
        size: r.size,
        url: r.url,
        provider: r.provider,
        caption: r.caption,
        alternativeText: r.alternativeText,
        folderPath: r.folderPath,
        createdAt: r.created_at ?? r.createdAt,
        updatedAt: r.updated_at ?? r.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /api/upload/files/:id – Update file info (name, caption, alternativeText) Strapi-style
   */
  router.patch(
    "/files/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = paramId(req.params.id);
        const existing = await db.findOne(MEDIA_TABLE, id);
        if (!existing) {
          return res.status(404).json({ error: { status: 404, message: "File not found" } });
        }
        const { name, caption, alternativeText } = req.body;
        const payload: Record<string, unknown> = {};
        if (name !== undefined) payload.name = name;
        if (caption !== undefined) payload.caption = caption;
        if (alternativeText !== undefined) payload.alternativeText = alternativeText;
        if (Object.keys(payload).length === 0) {
          return res.json({ data: existing });
        }
        const updated = await db.update(MEDIA_TABLE, id, payload);
        const r = updated as Record<string, unknown>;
        res.json({
          id: r.id,
          name: r.name,
          hash: r.hash,
          ext: r.ext,
          mime: r.mime,
          size: r.size,
          url: r.url,
          provider: r.provider,
          caption: r.caption,
          alternativeText: r.alternativeText,
          folderPath: r.folderPath,
          createdAt: r.created_at ?? r.createdAt,
          updatedAt: r.updated_at ?? r.updatedAt,
        });
      } catch (err) {
        next(err);
      }
    },
  );

  /**
   * DELETE /api/upload/files/:id – Delete file from DB and disk (Strapi-style)
   */
  router.delete("/files/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = paramId(req.params.id);
      const row = await db.findOne(MEDIA_TABLE, id);
      if (!row) {
        return res.status(404).json({ error: { status: 404, message: "File not found" } });
      }
      const hash = (row as { hash?: string }).hash;
      const ext = (row as { ext?: string }).ext ?? "";
      const filename = hash + ext;
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await db.delete(MEDIA_TABLE, id);
      res.json({ data: { id, deleted: true } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
