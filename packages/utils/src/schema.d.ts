export type FieldType = "string" | "text" | "richtext" | "email" | "password" | "number" | "integer" | "biginteger" | "float" | "decimal" | "boolean" | "date" | "datetime" | "time" | "json" | "enumeration" | "media" | "relation" | "uid" | "component" | "dynamiczone";
export interface FieldSchema {
    type: FieldType;
    required?: boolean;
    unique?: boolean;
    default?: unknown;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    regex?: string;
    enum?: string[];
    private?: boolean;
    pluginOptions?: Record<string, unknown>;
}
export interface ContentTypeSchema {
    kind: "collectionType" | "singleType";
    collectionName: string;
    info: {
        singularName: string;
        pluralName: string;
        displayName: string;
        description?: string;
    };
    options?: {
        draftAndPublish?: boolean;
        timestamps?: boolean;
    };
    pluginOptions?: Record<string, unknown>;
    attributes: Record<string, FieldSchema>;
}
export declare function generateApiRoutes(schema: ContentTypeSchema): string[];
export declare function validateSchema(schema: Partial<ContentTypeSchema>): string[];
export declare function schemaToTypeScript(schema: ContentTypeSchema): string;
//# sourceMappingURL=schema.d.ts.map