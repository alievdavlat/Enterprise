"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import { api } from "@/lib/api";

type Role = { id: number; name: string; description?: string };

export default function RolesPage() {
  const [list, setList] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/roles").then((r) => setList(r.data?.data ?? [])).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
        <p className="text-muted-foreground mt-1">Admin panel roles and permissions</p>
      </div>
      {loading ? (
        <Card className="border-border/50"><CardContent className="p-8 text-center text-muted-foreground">Loading…</CardContent></Card>
      ) : (
        <Card className="border-border/50">
          <TableRoot>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                <TableHead className="font-semibold uppercase text-xs">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.description || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </TableRoot>
        </Card>
      )}
    </div>
  );
}
