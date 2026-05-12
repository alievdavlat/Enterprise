import type { Plugin } from "@enterprise/types";
import { UploadService, type UploadConfig } from "./UploadService";

/**
 * Built-in `upload` plugin. Provides a media library service backed by the
 * `enterprise_media` table + on-disk storage. Existing express media routes
 * keep working unchanged; new code (lifecycles, plugins, custom routes) can
 * upload via `app.plugin('upload').services.upload`.
 */
export function createUploadPlugin(config?: UploadConfig): Plugin {
  const plugin: Plugin & { services: { upload?: UploadService } } = {
    name: "upload",
    version: "1.0.0",
    description: "Media library + file upload (local provider, dedup by hash)",
    services: {},
    register(app) {
      const db = (app as { getDb?: unknown }).getDb;
      if (!db) {
        console.warn("[upload] Skipping service registration: app.getDb not available");
        return;
      }
      plugin.services.upload = new UploadService({ db: db as never, config });
    },
  };
  return plugin;
}

export { UploadService };
export type { UploadInput, UploadConfig, MediaRecord } from "./UploadService";
export { ImageProcessor, DEFAULT_IMAGE_FORMATS } from "./ImageProcessor";
export type { ImageFormatSpec, GeneratedFormat } from "./ImageProcessor";
