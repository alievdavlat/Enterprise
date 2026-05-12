import fs from "fs";
import path from "path";

export interface ImageFormatSpec {
  /** Format key used in URL prefix (`/uploads/<key>_<hash>.jpg`). */
  name: string;
  /** Max width in pixels. Height auto-scales unless `height` is set. */
  width: number;
  height?: number;
  /**
   * Output format. `auto` keeps the original; `webp` and `jpeg` reencode. WebP
   * cuts file size for photo-heavy sites at the cost of an extra request when
   * a browser doesn't support it.
   */
  format?: "auto" | "webp" | "jpeg";
  quality?: number;
}

/** Strapi v5 defaults (thumbnail / small / medium / large). */
export const DEFAULT_IMAGE_FORMATS: ImageFormatSpec[] = [
  { name: "thumbnail", width: 245, height: 156, format: "auto", quality: 80 },
  { name: "small", width: 500, format: "auto", quality: 80 },
  { name: "medium", width: 750, format: "auto", quality: 80 },
  { name: "large", width: 1000, format: "auto", quality: 80 },
];

export interface GeneratedFormat {
  name: string;
  url: string;
  width: number;
  height: number;
  size: number;
  mime: string;
  ext: string;
}

export interface OriginalImageMetadata {
  width?: number;
  height?: number;
}

const IMAGE_MIME_PREFIX = /^image\/(jpeg|png|webp|gif|avif|tiff)$/;

// Minimal structural type so we don't pull the real `sharp` types into a
// build that may not have the package installed.
type SharpFactory = (input?: Buffer) => {
  metadata: () => Promise<{ width?: number; height?: number }>;
  resize: (opts: Record<string, unknown>) => SharpReturn;
};
type SharpReturn = {
  resize: (opts: Record<string, unknown>) => SharpReturn;
  webp: (opts?: { quality?: number }) => SharpReturn;
  jpeg: (opts?: { quality?: number }) => SharpReturn;
  toBuffer: (opts: {
    resolveWithObject: true;
  }) => Promise<{ data: Buffer; info: { width: number; height: number; size: number } }>;
};

/**
 * Image resizing wrapper around `sharp`. Sharp is loaded lazily so projects
 * that never upload images don't have to install it. If the import fails the
 * processor degrades to a no-op and returns `{}` so the caller's flow keeps
 * working — the original file is still stored, just without variants.
 */
export class ImageProcessor {
  private sharpLib: SharpFactory | null = null;
  private sharpLoadAttempted = false;

  isImage(mime: string): boolean {
    return IMAGE_MIME_PREFIX.test(mime);
  }

  /** Try to lazily load sharp via require(). Caches result + failure. */
  private loadSharp(): SharpFactory | null {
    if (this.sharpLoadAttempted) return this.sharpLib;
    this.sharpLoadAttempted = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require("sharp");
      // sharp is a CommonJS module whose `module.exports` IS the callable;
      // under esModuleInterop the namespace may surface as `default`.
      const fn = (mod && (mod.default ?? mod)) as SharpFactory;
      if (typeof fn !== "function") {
        console.warn("[ImageProcessor] Unexpected sharp shape; skipping image variants");
        return null;
      }
      this.sharpLib = fn;
      return fn;
    } catch {
      console.warn(
        "[ImageProcessor] sharp is not installed; responsive variants will be skipped. Install with `npm install sharp` to enable.",
      );
      return null;
    }
  }

  /**
   * Read width/height of the original buffer. Returns empty object if sharp
   * isn't available so the caller can still persist the upload row.
   */
  async readMetadata(buffer: Buffer): Promise<OriginalImageMetadata> {
    const sharp = this.loadSharp();
    if (!sharp) return {};
    const meta = await sharp(buffer).metadata();
    return { width: meta.width, height: meta.height };
  }

  /**
   * Generate sized variants of `buffer` and write them under `outputDir`.
   * Returns the descriptors so the caller can persist them in the media row.
   *
   * Format files are named `<format>_<hash><ext>` so the variant lives next
   * to the original on disk and the URL stays predictable.
   */
  async generateVariants(opts: {
    buffer: Buffer;
    hash: string;
    outputDir: string;
    publicUrlPrefix: string;
    originalExt: string;
    originalMime: string;
    formats?: ImageFormatSpec[];
  }): Promise<Record<string, GeneratedFormat>> {
    const sharp = this.loadSharp();
    if (!sharp) return {};
    const formats = opts.formats ?? DEFAULT_IMAGE_FORMATS;
    const out: Record<string, GeneratedFormat> = {};
    await fs.promises.mkdir(opts.outputDir, { recursive: true });

    for (const spec of formats) {
      try {
        let pipeline = sharp(opts.buffer).resize({
          width: spec.width,
          height: spec.height,
          fit: spec.height ? "cover" : "inside",
          withoutEnlargement: true,
        });

        let outExt = opts.originalExt;
        let outMime = opts.originalMime;
        if (spec.format === "webp") {
          pipeline = pipeline.webp({ quality: spec.quality ?? 80 });
          outExt = "webp";
          outMime = "image/webp";
        } else if (spec.format === "jpeg") {
          pipeline = pipeline.jpeg({ quality: spec.quality ?? 80 });
          outExt = "jpg";
          outMime = "image/jpeg";
        } else if (spec.quality && /jpe?g|webp/.test(opts.originalMime)) {
          // Preserve format but apply the quality knob when the codec accepts one.
          if (/jpe?g/.test(opts.originalMime)) pipeline = pipeline.jpeg({ quality: spec.quality });
          else pipeline = pipeline.webp({ quality: spec.quality });
        }

        const buffer = await pipeline.toBuffer({ resolveWithObject: true });
        const cleanExt = outExt.replace(/^\./, "");
        const fileName = `${spec.name}_${opts.hash}.${cleanExt}`;
        const filePath = path.join(opts.outputDir, fileName);
        await fs.promises.writeFile(filePath, buffer.data);
        out[spec.name] = {
          name: spec.name,
          url: `${opts.publicUrlPrefix}/${fileName}`,
          width: buffer.info.width,
          height: buffer.info.height,
          size: buffer.info.size,
          mime: outMime,
          ext: cleanExt,
        };
      } catch (err) {
        console.warn(
          `[ImageProcessor] Failed to generate variant "${spec.name}":`,
          err instanceof Error ? err.message : err,
        );
      }
    }
    return out;
  }
}
