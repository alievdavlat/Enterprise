import type { ContentTypeSchema } from "@enterprise/types";

export interface SeoComponent {
  metaTitle?: string;
  metaDescription?: string;
  metaImage?: string | { url?: string };
  metaKeywords?: string;
  canonicalURL?: string;
  metaRobots?: string;
  structuredData?: unknown;
}

type SchemaRegistryLike = {
  getAll: () => ContentTypeSchema[];
};

type DbLike = {
  findMany: (
    table: string,
    opts?: {
      filters?: Record<string, unknown>;
      pagination?: { page: number; pageSize: number };
    },
  ) => Promise<{ data: unknown[] }>;
};

/**
 * SEO helper. Renders a sitemap.xml from every public, draft-and-published
 * collection type and extracts SEO metadata from entry rows when they include
 * a `seo` field (component-style).
 */
export class SeoService {
  private schemaRegistry: SchemaRegistryLike;
  private db: DbLike;
  private siteUrl: string;

  constructor(opts: {
    schemaRegistry: SchemaRegistryLike;
    db: DbLike;
    siteUrl?: string;
  }) {
    this.schemaRegistry = opts.schemaRegistry;
    this.db = opts.db;
    this.siteUrl = (opts.siteUrl ?? process.env.SITE_URL ?? "").replace(/\/$/, "");
  }

  /**
   * Build a sitemap.xml string. URLs are derived from `${siteUrl}/${pluralName}/${id-or-slug}`.
   * Custom URL strategies should override this method on a subclass.
   */
  async generateSitemap(): Promise<string> {
    const urls: { loc: string; lastmod?: string }[] = [];
    if (this.siteUrl) {
      urls.push({ loc: this.siteUrl });
    }

    for (const schema of this.schemaRegistry.getAll()) {
      if (schema.kind !== "collectionType") continue;
      const collection = schema.collectionName;
      const pluralPath = schema.pluralName ?? collection;

      let rows: Record<string, unknown>[];
      try {
        const result = await this.db.findMany(collection, {
          pagination: { page: 1, pageSize: 1000 },
        });
        rows = (result.data ?? []) as Record<string, unknown>[];
      } catch {
        continue; // table not ready
      }

      for (const row of rows) {
        const slug =
          (row.slug as string | undefined) ??
          (row.documentId as string | undefined) ??
          (row.id != null ? String(row.id) : null);
        if (!slug) continue;
        const status = row.publishedAt ? "published" : "draft";
        if (status !== "published") continue;
        const lastmod = (row.updatedAt as string | undefined) ?? undefined;
        urls.push({
          loc: this.siteUrl ? `${this.siteUrl}/${pluralPath}/${slug}` : `/${pluralPath}/${slug}`,
          lastmod,
        });
      }
    }

    const xmlEntries = urls
      .map(
        (u) =>
          `  <url><loc>${escapeXml(u.loc)}</loc>${
            u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ""
          }</url>`,
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`;
  }

  /**
   * Pick the SEO component from an entry. Returns null when the entry has no
   * `seo` field (either disabled for that content-type or not yet set).
   */
  extract(entry: Record<string, unknown> | null | undefined): SeoComponent | null {
    if (!entry) return null;
    const seo = entry.seo;
    if (!seo || typeof seo !== "object") return null;
    return seo as SeoComponent;
  }
}

function escapeXml(input: string): string {
  return input.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
    return c;
  });
}
