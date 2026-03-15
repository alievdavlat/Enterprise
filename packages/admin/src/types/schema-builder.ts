import type { ContentTypeSchema, ContentTypeAttributeConfig } from "./content-types";

export interface SchemaWithCategory extends ContentTypeSchema {
  category?: string;
}

export interface SchemaWithViewConfig extends ContentTypeSchema {
  draftAndPublish?: boolean;
  viewConfig?: { entryTitle?: string; displayedFields?: string[] };
}

export interface FieldFormState {
  fieldName: string;
  fieldType: string;
  fieldRequired: boolean;
  fieldStep: 1 | 2;
  fieldTab: "basic" | "advanced";
  enumValues: string;
  fieldTarget: string;
  fieldMaxLength: string;
  fieldMinLength: string;
  fieldDefaultValue: string;
  fieldRegex: string;
  fieldUnique: boolean;
  fieldPrivate: boolean;
  fieldTextType: "short" | "long";
  fieldNumberFormat: string;
  fieldDateType: string;
  fieldComponent: string;
  fieldRepeatable: boolean;
  fieldComponents: string[];
  compCreateMode: "create" | "existing";
  compNewDisplayName: string;
  compNewCategory: string;
  /** Relation type: oneToOne, oneToMany, manyToOne, manyToMany */
  fieldRelationType: "oneToOne" | "oneToMany" | "manyToOne" | "manyToMany";
  /** Media: single vs multiple */
  fieldMediaMultiple: boolean;
  /** Media: allowed types (e.g. images, videos, audios, files) */
  fieldMediaAllowedTypes: string[];
}

export const DEFAULT_FIELD_FORM: FieldFormState = {
  fieldName: "",
  fieldType: "string",
  fieldRequired: false,
  fieldStep: 1,
  fieldTab: "basic",
  enumValues: "",
  fieldTarget: "",
  fieldMaxLength: "",
  fieldMinLength: "",
  fieldDefaultValue: "",
  fieldRegex: "",
  fieldUnique: false,
  fieldPrivate: false,
  fieldTextType: "short",
  fieldNumberFormat: "integer",
  fieldDateType: "date",
  fieldComponent: "",
  fieldRepeatable: false,
  fieldComponents: [],
  compCreateMode: "existing",
  compNewDisplayName: "",
  compNewCategory: "",
  fieldRelationType: "oneToMany",
  fieldMediaMultiple: false,
  fieldMediaAllowedTypes: [],
};
