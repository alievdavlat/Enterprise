export interface ContentTypeAttributeConfig {
  type: string;
  [key: string]: unknown;
}

export interface ContentTypeSchema {
  uid: string;
  kind: string;
  displayName: string;
  collectionName: string;
  singularName: string;
  pluralName: string;
  attributes: Record<string, ContentTypeAttributeConfig>;
}
