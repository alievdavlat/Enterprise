import type { CreateContentTypePayload } from "@/hooks/useContentTypes";
import {
  toApiSlug,
  toSingularPlural,
  buildContentTypeUid,
} from "@/utils/schema-builder";

export interface BuildCreateSchemaParams {
  ctName: string;
  ctKind: string;
  compNewCategory: string;
  ctDraft: boolean;
}

export function buildCreateSchemaPayload(
  params: BuildCreateSchemaParams,
): CreateContentTypePayload {
  const { ctName, ctKind, compNewCategory, ctDraft } = params;
  const base = toApiSlug(ctName);
  const isComponent = ctKind === "component";
  const uid = buildContentTypeUid(ctKind, base, compNewCategory || undefined);
  const { singular, plural } = toSingularPlural(base);
  const payload: CreateContentTypePayload = {
    uid,
    kind: ctKind,
    collectionName: plural,
    displayName: ctName,
    singularName: singular,
    pluralName: plural,
    draftAndPublish: ctDraft,
    attributes: isComponent
      ? {}
      : { title: { type: "string", required: true } },
  };
  if (isComponent) {
    payload.category = compNewCategory || "default";
  }
  return payload;
}

export interface BuildComponentSchemaParams {
  displayName: string;
  category: string;
}

export function buildComponentSchemaPayload(
  params: BuildComponentSchemaParams,
): CreateContentTypePayload {
  const { displayName, category } = params;
  const compBase = displayName.toLowerCase().replace(/\s+/g, "-");
  const compUid = `component::${category || "default"}.${compBase}`;
  return {
    uid: compUid,
    kind: "component",
    collectionName: compBase.replace(/-/g, "_") + "s",
    displayName,
    singularName: compBase,
    pluralName: compBase.endsWith("s") ? compBase : compBase + "s",
    category: category || "default",
    attributes: {},
  };
}
