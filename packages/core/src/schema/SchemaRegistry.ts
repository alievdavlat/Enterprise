import type { ContentTypeSchema, FieldDefinition } from "@enterprise/types";

/**
 * Content Type Registry & Schema Validator
 * Manages all content type schemas with validation
 */
export class SchemaRegistry {
  private schemas: Map<string, ContentTypeSchema> = new Map();

  /**
   * Register a content type schema
   */
  register(schema: ContentTypeSchema): void {
    this.validate(schema);
    this.schemas.set(schema.uid, schema);
    console.log(`[Enterprise] Content type "${schema.uid}" registered.`);
  }

  /**
   * Get a schema by UID
   */
  get(uid: string): ContentTypeSchema | undefined {
    return this.schemas.get(uid);
  }

  /**
   * Check if a schema exists
   */
  has(uid: string): boolean {
    return this.schemas.has(uid);
  }

  /**
   * Get all registered schemas
   */
  getAll(): ContentTypeSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Get collection types only
   */
  getCollectionTypes(): ContentTypeSchema[] {
    return this.getAll().filter((s) => s.kind === "collectionType");
  }

  /**
   * Get single types only
   */
  getSingleTypes(): ContentTypeSchema[] {
    return this.getAll().filter((s) => s.kind === "singleType");
  }

  /**
   * Update a schema
   */
  update(uid: string, updates: Partial<ContentTypeSchema>): void {
    const existing = this.schemas.get(uid);
    if (!existing) throw new Error(`Content type "${uid}" not found`);
    const updated = { ...existing, ...updates };
    this.validate(updated);
    this.schemas.set(uid, updated);
  }

  /**
   * Delete a schema
   */
  delete(uid: string): void {
    if (!this.schemas.has(uid))
      throw new Error(`Content type "${uid}" not found`);
    this.schemas.delete(uid);
  }

  /**
   * Validate a schema definition
   */
  validate(schema: ContentTypeSchema): void {
    if (!schema.uid) throw new Error("Content type must have a uid");
    if (!schema.displayName)
      throw new Error("Content type must have a displayName");
    if (!schema.collectionName)
      throw new Error("Content type must have a collectionName");
    if (
      !schema.kind ||
      !["collectionType", "singleType", "component", "dynamiczone"].includes(schema.kind)
    ) {
      throw new Error(
        'Content type kind must be "collectionType", "singleType", "component", or "dynamiczone"',
      );
    }
    if (!schema.attributes || typeof schema.attributes !== "object") {
      throw new Error("Content type must have attributes");
    }

    // Validate each field
    for (const [fieldName, field] of Object.entries(schema.attributes)) {
      this.validateField(fieldName, field);
    }
  }

  private validateField(name: string, field: FieldDefinition): void {
    const validTypes = [
      "string",
      "text",
      "richtext",
      "integer",
      "biginteger",
      "float",
      "decimal",
      "boolean",
      "email",
      "password",
      "date",
      "datetime",
      "time",
      "json",
      "enumeration",
      "media",
      "relation",
      "uid",
      "component",
      "dynamiczone",
    ];
    if (!validTypes.includes(field.type)) {
      throw new Error(`Field "${name}" has invalid type "${field.type}"`);
    }
    if (
      field.type === "enumeration" &&
      (!field.enum || field.enum.length === 0)
    ) {
      throw new Error(`Enumeration field "${name}" must have enum values`);
    }
    if (field.type === "relation" && !field.target) {
      throw new Error(
        `Relation field "${name}" must have a target content type`,
      );
    }
  }

  /**
   * Generate API routes from a schema
   */
  generateRoutes(
    uid: string,
  ): Array<{ method: string; path: string; handler: string }> {
    const schema = this.get(uid);
    if (!schema) throw new Error(`Schema "${uid}" not found`);

    const plural = schema.pluralName;
    const routes = [];

    if (schema.kind === "collectionType" || schema.kind === "component" || schema.kind === "dynamiczone") {
      routes.push(
        { method: "GET", path: `/api/${plural}`, handler: `${uid}.findMany` },
        { method: "POST", path: `/api/${plural}`, handler: `${uid}.create` },
        {
          method: "GET",
          path: `/api/${plural}/:id`,
          handler: `${uid}.findOne`,
        },
        { method: "PUT", path: `/api/${plural}/:id`, handler: `${uid}.update` },
        {
          method: "DELETE",
          path: `/api/${plural}/:id`,
          handler: `${uid}.delete`,
        },
      );
      if (schema.draftAndPublish) {
        routes.push(
          {
            method: "POST",
            path: `/api/${plural}/:id/publish`,
            handler: `${uid}.publish`,
          },
          {
            method: "POST",
            path: `/api/${plural}/:id/unpublish`,
            handler: `${uid}.unpublish`,
          },
        );
      }
    } else {
      // Single type
      routes.push(
        {
          method: "GET",
          path: `/api/${singular(schema.singularName)}`,
          handler: `${uid}.find`,
        },
        {
          method: "PUT",
          path: `/api/${singular(schema.singularName)}`,
          handler: `${uid}.update`,
        },
        {
          method: "DELETE",
          path: `/api/${singular(schema.singularName)}`,
          handler: `${uid}.delete`,
        },
      );
    }

    return routes;
  }
}

function singular(name: string): string {
  return name;
}
