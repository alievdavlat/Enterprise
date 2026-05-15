"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@enterprise/design-system";
import { Pencil, Plus, Trash2, Users as UsersIcon } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ListSkeleton, PageHeader, StandardDialog } from "@/components/shared";
import { IllustrationCreate, IllustrationDocument } from "@/components/illustrations";

type User = {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
};

type Role = { id: number; name: string };

const FALLBACK_ROLES = ["public", "authenticated", "admin", "superAdmin"];

export default function UsersPage() {
  const [list, setList] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  }>({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    role: "authenticated",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/roles").catch(() => ({ data: { data: [] } })),
      ]);
      setList((u.data?.data ?? []) as User[]);
      setRoles((r.data?.data ?? []) as Role[]);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const roleOptions =
    roles.length > 0 ? roles.map((r) => r.name) : FALLBACK_ROLES;

  const create = async () => {
    if (!draft.email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin/users", draft);
      toast.success("User created (default password: Welcome1!)");
      setCreateOpen(false);
      setDraft({
        email: "",
        username: "",
        firstName: "",
        lastName: "",
        role: "authenticated",
      });
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/admin/users/${editing.id}`, editing);
      toast.success("User updated");
      setEditing(null);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u: User) => {
    if (!confirm(`Delete user "${u.email}"?`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success("User deleted");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message || "Failed to delete user");
    }
  };

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={UsersIcon}
        eyebrow="Settings"
        title="Users"
        description="Manage admin users and assign their roles."
        variant="primary"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Invite user
          </Button>
        }
      />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>
            Newly created users get the default password{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Welcome1!</code> — they should
            change it after first login.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <ListSkeleton rows={4} card={false} className="p-2" />
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                <UsersIcon className="w-7 h-7 text-muted-foreground/70" />
              </div>
              <p className="font-medium mb-1">No users yet</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Invite team members to manage content together.
              </p>
            </div>
          ) : (
            <TableRoot>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold uppercase text-xs">Name</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Email</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Role</TableHead>
                  <TableHead className="font-semibold uppercase text-xs">Status</TableHead>
                  <TableHead className="text-right font-semibold uppercase text-xs">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((u) => (
                  <TableRow key={u.id} className="border-border/50">
                    <TableCell className="font-medium">
                      {u.firstName || u.lastName
                        ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                        : u.username}
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted">
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          u.isActive
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing({ ...u })}
                          className="gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(u)}
                          className="gap-1 text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableRoot>
          )}
        </CardContent>
      </Card>

      <StandardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        illustration={<IllustrationCreate size={120} />}
        title="Invite user"
        description="Create an admin user with a default password."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={saving}>
              Create
            </Button>
          </>
        }>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Username</Label>
            <Input
              value={draft.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.value })}
              placeholder="(defaults to email prefix)"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>First name</Label>
              <Input
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Last name</Label>
              <Input
                value={draft.lastName}
                onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </StandardDialog>

      <StandardDialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        illustration={<IllustrationDocument size={120} />}
        title="Edit user"
        description="Update user details and role."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} loading={saving}>
              Save
            </Button>
          </>
        }>
        {editing && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editing.email}
                onChange={(e) =>
                  setEditing({ ...editing, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Username</Label>
              <Input
                value={editing.username}
                onChange={(e) =>
                  setEditing({ ...editing, username: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>First name</Label>
                <Input
                  value={editing.firstName ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Last name</Label>
                <Input
                  value={editing.lastName ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editing.role}
                onChange={(e) =>
                  setEditing({ ...editing, role: e.target.value })
                }>
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Active</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Inactive users cannot sign in.
                </p>
              </div>
              <Switch
                checked={editing.isActive}
                onCheckedChange={(v) =>
                  setEditing({ ...editing, isActive: v })
                }
              />
            </div>
          </div>
        )}
      </StandardDialog>
    </div>
  );
}
