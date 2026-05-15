"use client";

import { Plus, KeyRound } from "lucide-react";
import { Button } from "@enterprise/design-system";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  API_TOKENS_PAGE_TITLE,
  API_TOKENS_PAGE_DESCRIPTION,
  API_TOKENS_CREATE_BUTTON,
} from "@/consts";

export interface ApiTokensHeaderProps {
  onCreateClick: () => void;
}

export function ApiTokensHeader({ onCreateClick }: ApiTokensHeaderProps) {
  return (
    <PageHeader
      icon={KeyRound}
      eyebrow="Settings"
      title={API_TOKENS_PAGE_TITLE}
      description={API_TOKENS_PAGE_DESCRIPTION}
      variant="violet"
      actions={
        <Button className="gap-2" onClick={onCreateClick}>
          <Plus className="w-4 h-4" />
          {API_TOKENS_CREATE_BUTTON}
        </Button>
      }
    />
  );
}
