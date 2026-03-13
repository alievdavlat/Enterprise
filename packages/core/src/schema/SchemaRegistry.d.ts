import type { ContentTypeSchema } from "@enterprise/types";
/**
 * Content Type Registry & Schema Validator
 * Manages all content type schemas with validation
 */
export declare class SchemaRegistry {
    private schemas;
    /**
     * Register a content type schema
     */
    register(schema: ContentTypeSchema): void;
    /**
     * Get a schema by UID
     */
    get(uid: string): ContentTypeSchema | undefined;
    /**
     * Check if a schema exists
     */
    has(uid: string): boolean;
    /**
     * Get all registered schemas
     */
    getAll(): ContentTypeSchema[];
    /**
     * Get collection types only
     */
    getCollectionTypes(): ContentTypeSchema[];
    /**
     * Get single types only
     */
    getSingleTypes(): ContentTypeSchema[];
    /**
     * Update a schema
     */
    update(uid: string, updates: Partial<ContentTypeSchema>): void;
    /**
     * Delete a schema
     */
    delete(uid: string): void;
    /**
     * Validate a schema definition
     */
    validate(schema: ContentTypeSchema): void;
    private validateField;
    /**
     * Generate API routes from a schema
     */
    generateRoutes(uid: string): Array<{
        method: string;
        path: string;
        handler: string;
    }>;
}
//# sourceMappingURL=SchemaRegistry.d.ts.map