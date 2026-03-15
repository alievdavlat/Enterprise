"use client";

import { Plus } from "lucide-react";
import { Button } from "@enterprise/design-system";
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
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {API_TOKENS_PAGE_TITLE}
        </h1>
        <p className="text-muted-foreground mt-1">
          {API_TOKENS_PAGE_DESCRIPTION}
        </p>
      </div>
      <Button className="gap-2" onClick={onCreateClick}>
        <Plus className="w-4 h-4" />
        {API_TOKENS_CREATE_BUTTON}
      </Button>
    </div>
  );
}
