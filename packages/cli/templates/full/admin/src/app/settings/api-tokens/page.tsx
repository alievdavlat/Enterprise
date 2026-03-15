"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<{ id: string; name: string; description?: string; createdAt?: string; lastUsed?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/api-tokens")
      .then((res) => setTokens(res.data?.data ?? []))
      .catch(() => setTokens([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Tokens</h1>
          <p className="text-muted-foreground mt-1">
            List of generated tokens to consume the API
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create new API Token
        </Button>
      </div>

      {loading ? (
        <Card className="border-border/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : tokens.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium mb-1">No API tokens yet</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
              Create your first API token to consume the API from external clients.
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create new API Token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Description</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Created at</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Last used</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id} className="border-border/50">
                  <TableCell className="font-medium">{token.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[240px] truncate">
                    {token.description || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {token.createdAt || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {token.lastUsed || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
