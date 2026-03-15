export function getImageUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (typeof window !== "undefined") return window.location.origin + url;
  return url;
}

export function isImageMime(mime: string): boolean {
  return /^image\//.test(mime);
}

export function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (size >= 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${Number(size).toFixed(1)} KB`;
}
