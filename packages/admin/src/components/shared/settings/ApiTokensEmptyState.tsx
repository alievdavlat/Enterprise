"use client";

import { Plus, Key } from "lucide-react";
import { Button, Card, CardContent } from "@enterprise/design-system";
import {
  API_TOKENS_EMPTY_TITLE,
  API_TOKENS_EMPTY_DESCRIPTION,
  API_TOKENS_CREATE_BUTTON,
} from "@/consts";

export interface ApiTokensEmptyStateProps {
  onCreateClick: () => void;
}

export function ApiTokensEmptyState({ onCreateClick }: ApiTokensEmptyStateProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
          <Key className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium mb-1">{API_TOKENS_EMPTY_TITLE}</p>
        <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
          {API_TOKENS_EMPTY_DESCRIPTION}
        </p>
        <Button className="gap-2" onClick={onCreateClick}>
          <Plus className="w-4 h-4" />
          {API_TOKENS_CREATE_BUTTON}
        </Button>
      </CardContent>
    </Card>
  );
}
