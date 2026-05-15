"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Textarea,
} from "@enterprise/design-system";
import { Plus, Save, Shield, Users as UsersIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAppStore } from "@/store/app";
import { PageHeader, ListSkeleton } from "@/components/shared";

type Role = { id: number; name: string; description?: string };
type Permission = {
  id?: number;
  roleId?: number;
  action: string;
  subject?: string | null;
};
type Schema = { uid: string; displayName: string };

// Strapi-style verbs + the bulk + draft-and-publish variants we ship in
// Phase 17. The roles matrix lets admins toggle each verb per content type.
const ACTIONS = [
  "find",
  "findOne",
  "count",
  "create",
  "update",
  "delete",
  "publish",
  "unpublish",
  "bulkCreate",
  "bulkUpdate",
  "bulkDelete",
] as const;
type Action = (typeof ACTIONS)[number];

export default function RolesPage() {
  const contentTypes = useAppStore((s) => s.contentTypes);
  const fetchContentTypes = useAppStore((s) => s.fetchContentTypes);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState<{ name: string; description: string }>({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchContentTypes();
    loadRoles();
  }, [fetchContentTypes]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const r = await api.get("/admin/roles");
      const list: Role[] = r.data?.data ?? [];
      setRoles(list);
      if (list.length > 0 && selectedRoleId === null) {
        setSelectedRoleId(list[0].id);
      }
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoleId === null) {
      setPermissions([]);
      return;
    }
    api
      .get(`/admin/roles/${selectedRoleId}/permissions`)
      .then((r) => setPermissions((r.data?.data ?? []) as Permission[]))
      .catch(() => setPermissions([]));
  }, [selectedRoleId]);

  const schemas = useMemo<Schema[]>(
    () =>
      (contentTypes ?? []).map((c: any) => ({
        uid: c.uid,
        displayName: c.displayName || c.uid,
      })),
    [contentTypes],
  );

  const isEnabled = (uid: string, action: Action) => {
    return permissions.some(
      (p) => p.subject === uid && p.action === `${uid}.${action}`,
    );
  };

  const togglePerm = (uid: string, action: Action) => {
    const actionKey = `${uid}.${action}`;
    setPermissions((prev) => {
      const exists = prev.some((p) => p.subject === uid && p.action === actionKey);
      if (exists) {
        return prev.filter((p) => !(p.subject === uid && p.action === actionKey));
      }
      return [...prev, { action: actionKey, subject: uid }];
    });
  };

  const toggleAllForType = (uid: string, enable: boolean) => {
    setPermissions((prev) => {
      const without = prev.filter((p) => p.subject !== uid);
      if (!enable) return without;
      return [
        ...without,
        ...ACTIONS.map((a) => ({ action: `${uid}.${a}`, subject: uid })),
      ];
    });
  };

  const savePermissions = async () => {
    if (selectedRoleId === null) return;
    setSavingPerms(true);
    try {
      await api.put(`/admin/roles/${selectedRoleId}/permissions`, permissions);
      toast.success("Permissions saved");
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to save permissions");
    } finally {
      setSavingPerms(false);
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      const r = await api.post("/admin/roles", newRole);
      toast.success("Role created");
      setCreateOpen(false);
      setNewRole({ name: "", description: "" });
      await loadRoles();
      const created = r.data?.data as Role | undefined;
      if (created?.id) setSelectedRoleId(created.id);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to create role");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Shield}
        eyebrow="Settings"
        title="Roles"
        description="Define roles and choose which content types each role can read or modify."
        variant="primary"
        actions={
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> New role
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <Card className="border-border/50 h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UsersIcon className="w-4 h-4" /> Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {loading ? (
              <ListSkeleton rows={3} card={false} className="p-2" />
            ) : roles.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No roles yet.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      r.id === selectedRoleId
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{r.name}</div>
                    {r.description && (
                      <div
                        className={`text-xs truncate ${
                          r.id === selectedRoleId
                            ? "opacity-80"
                            : "text-muted-foreground"
                        }`}
                      >
                        {r.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Permissions</CardTitle>
              <CardDescription>
                {selectedRoleId
                  ? `Pick the actions allowed for this role across content types.`
                  : `Select a role on the left to edit its permissions.`}
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={savePermissions}
              disabled={savingPerms || selectedRoleId === null}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {savingPerms ? "Saving…" : "Save"}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {selectedRoleId === null ? (
              <div className="p-8 text-center text-muted-foreground">No role selected</div>
            ) : schemas.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No content types found. Create one in the Schema Builder first.
              </div>
            ) : (
              <TableRoot>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-semibold uppercase text-xs">
                      Content type
                    </TableHead>
                    {ACTIONS.map((a) => (
                      <TableHead
                        key={a}
                        className="font-semibold uppercase text-xs text-center"
                      >
                        {a}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-semibold uppercase text-xs">
                      All
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schemas.map((s) => {
                    const allOn = ACTIONS.every((a) => isEnabled(s.uid, a));
                    return (
                      <TableRow key={s.uid} className="border-border/50">
                        <TableCell className="font-medium">
                          {s.displayName}
                          <div className="text-xs text-muted-foreground">{s.uid}</div>
                        </TableCell>
                        {ACTIONS.map((a) => (
                          <TableCell key={a} className="text-center">
                            <Checkbox
                              checked={isEnabled(s.uid, a)}
                              onCheckedChange={() => togglePerm(s.uid, a)}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <Checkbox
                            checked={allOn}
                            onCheckedChange={(v) => toggleAllForType(s.uid, !!v)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </TableRoot>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>Create a new admin role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Editor"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={newRole.description}
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
                placeholder="What can this role do?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createRole}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
