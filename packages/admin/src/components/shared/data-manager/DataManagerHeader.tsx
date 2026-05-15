"use client";

import Link from "next/link";
import { Button } from "@enterprise/design-system";
import { Plus, Database } from "lucide-react";
import type { ContentTypeSchema } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";

export interface DataManagerHeaderProps {
  contentType: ContentTypeSchema;
  model: string;
}

export const DataManagerHeader = ({
  contentType,
  model,
}: DataManagerHeaderProps) => {
  return (
    <PageHeader
      icon={Database}
      eyebrow="Content Manager"
      title={contentType.displayName}
      description={`${contentType.uid} · ${contentType.kind}`}
      variant="primary"
      actions={
        contentType.kind !== "singleType" ? (
          <Link href={`/data-manager/${model}/new`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create new entry
            </Button>
          </Link>
        ) : undefined
      }
      className="mb-2"
    />
  );
};
