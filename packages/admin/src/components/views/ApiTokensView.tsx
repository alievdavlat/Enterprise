"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ApiTokensHeader, ApiTokensEmptyState, ApiTokensTable } from "@/components/shared/settings";
import { useApiTokens, useDeleteApiToken } from "@/hooks/useApiTokens";
import { Card, CardContent } from "@enterprise/design-system";
import type { ApiToken } from "@/types";

export function ApiTokensView() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: tokens = [], isLoading } = useApiTokens();
  const deleteToken = useDeleteApiToken();

  const handleDelete = (token: ApiToken) => {
    if (!confirm(`Delete token "${token.name}"?`)) return;
    deleteToken.mutate(token.id, {
      onSuccess: () => toast.success("Token deleted"),
      onError: () => toast.error("Failed to delete token"),
    });
  };

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <ApiTokensHeader onCreateClick={() => setCreateOpen(true)} />

      {isLoading ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : tokens.length === 0 ? (
        <ApiTokensEmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <ApiTokensTable tokens={tokens} onDelete={handleDelete} />
      )}

      {/* TODO: Create/Edit token dialog when needed */}
    </div>
  );
}
