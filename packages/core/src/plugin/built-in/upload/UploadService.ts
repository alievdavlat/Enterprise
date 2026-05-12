import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ImageProcessor,
  DEFAULT_IMAGE_FORMATS,
  type ImageFormatSpec,
  type GeneratedFormat,
} from "./ImageProcessor";

export interface MediaRecord {
  id?: number;
  name: string;
  hash: string;
  ext?: string;
  mime: string;
  size: number;
  url: string;
  provider?: string;
  caption?: string;
  alternativeText?: string;
  folderPath?: string;
  width?: number;
  height?: number;
  /** JSON-encoded Record<string, GeneratedFormat> when stored in the DB. */
  formats?: string | Record<string, GeneratedFormat>;
}

export interface UploadInput {
  /** Original filename including extension */
  filename: string;
  mimeType: string;
  /** File contents */
  buffer: Buffer;
  caption?: string;
  alternativeText?: string;
  folderPath?: string;
}

type DbLike = {
  findOneBy: (table: string, where: Record<string, unknown>) => Promise<unknown>;
  findOne: (table: string, id: number | string) => Promise<unknown>;
  findMany: (
    table: string,
    opts?: {
      filters?: Record<string, unknown>;
      pagination?: { page: number; pageSize: number };
      sort?: { field: string; direction: "asc" | "desc" }[];
    },
  ) => Promise<{ data: unknown[]; meta?: unknown }>;
  create: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  update: (table: string, id: number | string, data: Record<string, unknown>) => Promise<unknown>;
  delete: (table: string, id: number | string) => Promise<unknown>;
};

export interface UploadConfig {
  /** Disk directory for the `local` provider */
  uploadDir?: string;
  /** Public URL prefix served by the host (e.g. /uploads) */
  publicUrlPrefix?: string;
  sizeLimit?: number;
  /** Storage provider id. Only `local` is wired here; extend via app.plugin('upload').services.registerProvider */
  provider?: string;
  /**
   * Responsive image variants generated on upload. Defaults to Strapi's
   * thumbnail/small/medium/large set. Pass `[]` to disable.
   */
  imageFormats?: ImageFormatSpec[];
}

/**
 * Media library service. Wraps the disk write + DB row insert that media
 * routes used to do inline. Centralising it means lifecycles + plugin code
 * can upload files without rebuilding the express request flow.
 */
export class UploadService {
  private db: DbLike;
  private table: string;
  private uploadDir: string;
  private publicUrlPrefix: string;
  private sizeLimit: number;
  private provider: string;
  private imageFormats: ImageFormatSpec[];
  private imageProcessor: ImageProcessor;

  constructor(opts: { db: DbLike; table?: string; config?: UploadConfig }) {
    this.db = opts.db;
    this.table = opts.table ?? "enterprise_media";
    const cfg = opts.config ?? {};
    this.uploadDir = path.resolve(cfg.uploadDir ?? process.env.UPLOAD_DIR ?? "public/uploads");
    this.publicUrlPrefix = cfg.publicUrlPrefix ?? "/uploads";
    this.sizeLimit = cfg.sizeLimit ?? 50 * 1024 * 1024;
    this.provider = cfg.provider ?? "local";
    this.imageFormats = cfg.imageFormats ?? DEFAULT_IMAGE_FORMATS;
    this.imageProcessor = new ImageProcessor();
  }

  async upload(input: UploadInput): Promise<MediaRecord> {
    if (input.buffer.length > this.sizeLimit) {
      throw new Error(
        `File too large: ${input.buffer.length} bytes (limit ${this.sizeLimit})`,
      );
    }
    const ext = path.extname(input.filename).toLowerCase();
    const hash = crypto
      .createHash("sha256")
      .update(input.buffer)
      .digest("hex")
      .slice(0, 16);

    // Dedupe: if a media with the same hash exists, reuse it instead of re-storing.
    const existing = (await this.db.findOneBy(this.table, { hash })) as
      | (MediaRecord & { id: number })
      | null;
    if (existing) return existing;

    await fs.promises.mkdir(this.uploadDir, { recursive: true });
    const storedName = `${hash}${ext}`;
    const absPath = path.join(this.uploadDir, storedName);
    await fs.promises.writeFile(absPath, input.buffer);

    const url = `${this.publicUrlPrefix}/${storedName}`;

    // Image-only: read dimensions + render the responsive variant set. Both
    // calls degrade to no-ops when `sharp` isn't installed so non-image
    // uploads and sharp-less environments still complete normally.
    let width: number | undefined;
    let height: number | undefined;
    let formats: Record<string, GeneratedFormat> = {};
    if (this.imageProcessor.isImage(input.mimeType)) {
      const meta = await this.imageProcessor.readMetadata(input.buffer);
      width = meta.width;
      height = meta.height;
      if (this.imageFormats.length > 0) {
        formats = await this.imageProcessor.generateVariants({
          buffer: input.buffer,
          hash,
          outputDir: this.uploadDir,
          publicUrlPrefix: this.publicUrlPrefix,
          originalExt: ext.replace(".", ""),
          originalMime: input.mimeType,
          formats: this.imageFormats,
        });
      }
    }

    const record: Omit<MediaRecord, "id"> = {
      name: input.filename,
      hash,
      ext: ext.replace(".", "") || undefined,
      mime: input.mimeType,
      size: input.buffer.length,
      url,
      provider: this.provider,
      caption: input.caption,
      alternativeText: input.alternativeText,
      folderPath: input.folderPath,
      width,
      height,
      // DB column is TEXT; JSON-stringify so adapters that don't auto-encode
      // (sqlite/mysql) still round-trip correctly.
      formats: Object.keys(formats).length > 0 ? JSON.stringify(formats) : undefined,
    };
    const created = (await this.db.create(this.table, record as Record<string, unknown>)) as MediaRecord;
    return created;
  }

  async findOne(id: number | string): Promise<MediaRecord | null> {
    return (await this.db.findOne(this.table, id)) as MediaRecord | null;
  }

  async findMany(opts?: {
    page?: number;
    pageSize?: number;
    folderPath?: string;
  }): Promise<{ data: MediaRecord[]; meta?: unknown }> {
    const page = opts?.page ?? 1;
    const pageSize = opts?.pageSize ?? 50;
    const filters: Record<string, unknown> = {};
    if (opts?.folderPath) filters.folderPath = opts.folderPath;
    const result = await this.db.findMany(this.table, {
      filters,
      pagination: { page, pageSize },
      sort: [{ field: "createdAt", direction: "desc" }],
    });
    return { data: result.data as MediaRecord[], meta: result.meta };
  }

  async updateMetadata(
    id: number | string,
    patch: { caption?: string; alternativeText?: string; name?: string; folderPath?: string },
  ): Promise<MediaRecord | null> {
    await this.db.update(this.table, id, patch as Record<string, unknown>);
    return this.findOne(id);
  }

  async delete(id: number | string): Promise<boolean> {
    const record = await this.findOne(id);
    if (!record) return false;
    // Remove the file from disk for local provider; ignore failures (file may
    // already be gone, or another media row may share the hash via dedupe).
    if ((record.provider ?? this.provider) === "local" && record.url) {
      try {
        const dupeCount = (
          await this.db.findMany(this.table, {
            filters: { hash: record.hash },
            pagination: { page: 1, pageSize: 2 },
          })
        ).data.length;
        if (dupeCount <= 1) {
          const filesToRemove: string[] = [path.basename(record.url)];
          // Pull variant filenames from the formats blob so the on-disk
          // variants disappear too.
          const formatsRaw = record.formats;
          let formatsObj: Record<string, GeneratedFormat> | null = null;
          if (typeof formatsRaw === "string") {
            try {
              formatsObj = JSON.parse(formatsRaw);
            } catch {
              formatsObj = null;
            }
          } else if (formatsRaw && typeof formatsRaw === "object") {
            formatsObj = formatsRaw as Record<string, GeneratedFormat>;
          }
          if (formatsObj) {
            for (const fmt of Object.values(formatsObj)) {
              if (fmt?.url) filesToRemove.push(path.basename(fmt.url));
            }
          }
          for (const fileName of filesToRemove) {
            const filePath = path.join(this.uploadDir, fileName);
            try {
              await fs.promises.unlink(filePath);
            } catch {
              /* file may be missing */
            }
          }
        }
      } catch {
        /* file may be missing */
      }
    }
    await this.db.delete(this.table, id);
    return true;
  }
}
