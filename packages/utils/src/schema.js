export function generateApiRoutes(schema) {
    const base = `/api/${schema.info.pluralName}`;
    const routes = [
        `GET    ${base}          → find (paginated, filtered)`,
        `POST   ${base}          → create`,
        `GET    ${base}/:id      → findOne`,
        `PUT    ${base}/:id      → update`,
        `DELETE ${base}/:id      → delete`,
    ];
    if (schema.options?.draftAndPublish) {
        routes.push(`POST   ${base}/:id/publish → publish`);
        routes.push(`POST   ${base}/:id/unpublish → unpublish`);
    }
    return routes;
}
export function validateSchema(schema) {
    const errors = [];
    if (!schema.info?.displayName)
        errors.push("displayName is required");
    if (!schema.info?.singularName)
        errors.push("singularName is required");
    if (!schema.info?.pluralName)
        errors.push("pluralName is required");
    if (!schema.kind)
        errors.push("kind must be collectionType or singleType");
    if (!schema.attributes || Object.keys(schema.attributes).length === 0) {
        errors.push("At least one attribute is required");
    }
    return errors;
}
export function schemaToTypeScript(schema) {
    const typeMap = {
        string: "string",
        text: "string",
        richtext: "string",
        email: "string",
        password: "string",
        uid: "string",
        number: "number",
        integer: "number",
        biginteger: "bigint",
        float: "number",
        decimal: "number",
        boolean: "boolean",
        date: "string",
        datetime: "string",
        time: "string",
        json: "Record<string, unknown>",
        enumeration: "string",
        media: "{ url: string; alternativeText?: string; caption?: string; }",
        relation: "unknown",
        component: "unknown",
        dynamiczone: "unknown[]",
    };
    const fields = Object.entries(schema.attributes)
        .map(([name, field]) => {
        const tsType = typeMap[field.type] ?? "unknown";
        const optional = !field.required ? "?" : "";
        return `  ${name}${optional}: ${tsType};`;
    })
        .join("\n");
    return `export interface ${schema.info.displayName.replace(/\s+/g, "")} {\n  id: number;\n${fields}\n  createdAt: string;\n  updatedAt: string;\n${schema.options?.draftAndPublish ? "  publishedAt?: string;\n" : ""}}\n`;
}
//# sourceMappingURL=schema.js.map