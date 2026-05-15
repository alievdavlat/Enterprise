"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@enterprise/design-system";
import type { ContentTypeSchema } from "@/types";

export interface EntryBreadcrumbsProps {
  contentType: ContentTypeSchema;
  isNew: boolean;
  entryLabel?: string;
  onNavigate: (href: string) => void;
}

export const EntryBreadcrumbs = ({
  contentType,
  isNew,
  entryLabel,
  onNavigate,
}: EntryBreadcrumbsProps) => {
  const model = contentType.uid;
  const tail = isNew ? "New entry" : entryLabel || "Edit entry";

  return (
    <Breadcrumb className="mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href="/data-manager"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("/data-manager");
            }}
            className="cursor-pointer">
            Content Manager
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            href={`/data-manager/${model}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(`/data-manager/${model}`);
            }}
            className="cursor-pointer">
            {contentType.displayName}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-[40ch] truncate">
            {tail}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
