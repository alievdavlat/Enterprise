/**
 * Upload configuration (Strapi-style).
 * Backend media router can use this for allowed types and size limits.
 */

export interface UploadConfig {
  maxFileSize?: number; // bytes
  allowedMimeTypes?: string[];
  allowedImageTypes?: string[];
  allowedVideoTypes?: string[];
  allowedAudioTypes?: string[];
  allowedDocTypes?: string[];
}

const DEFAULT_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
const DEFAULT_VIDEO = ["video/mp4", "video/webm"];
const DEFAULT_AUDIO = ["audio/mpeg", "audio/wav", "audio/ogg"];
const DEFAULT_DOC = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function getDefaultUploadConfig(): UploadConfig {
  return {
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: [...DEFAULT_IMAGE, ...DEFAULT_VIDEO, ...DEFAULT_AUDIO, ...DEFAULT_DOC],
    allowedImageTypes: DEFAULT_IMAGE,
    allowedVideoTypes: DEFAULT_VIDEO,
    allowedAudioTypes: DEFAULT_AUDIO,
    allowedDocTypes: DEFAULT_DOC,
  };
}

export function isAllowedMime(mime: string, config: UploadConfig): boolean {
  const allowed = config.allowedMimeTypes ?? getDefaultUploadConfig().allowedMimeTypes ?? [];
  return allowed.length === 0 || allowed.includes(mime);
}

export function isWithinSizeLimit(size: number, config: UploadConfig): boolean {
  const max = config.maxFileSize ?? getDefaultUploadConfig().maxFileSize ?? 10 * 1024 * 1024;
  return size <= max;
}
