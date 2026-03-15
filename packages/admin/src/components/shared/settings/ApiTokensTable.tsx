"use client";

import { Pencil, Trash2 } from "lucide-react";
import {
  Button,
  Card,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import type { ApiToken } from "@/types";

export interface ApiTokensTableProps {
  tokens: ApiToken[];
  onEdit?: (token: ApiToken) => void;
  onDelete?: (token: ApiToken) => void;
}

export function ApiTokensTable({
  tokens,
  onEdit,
  onDelete,
}: ApiTokensTableProps) {
  return (
    <Card className="border-border/50">
      <TableRoot>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="font-semibold uppercase text-xs">
              Name
            </TableHead>
            <TableHead className="font-semibold uppercase text-xs">
              Description
            </TableHead>
            <TableHead className="font-semibold uppercase text-xs">
              Created at
            </TableHead>
            <TableHead className="font-semibold uppercase text-xs">
              Last used
            </TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.id} className="border-border/50">
              <TableCell className="font-medium">{token.name}</TableCell>
              <TableCell className="text-muted-foreground max-w-[240px] truncate">
                {token.description ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {token.createdAt ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {token.lastUsed ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onEdit?.(token)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete?.(token)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableRoot>
    </Card>
  );
}
