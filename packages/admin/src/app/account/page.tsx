"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  PasswordInput,
  Label,
  Separator,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@enterprise/design-system";
import { toast } from "sonner";

/**
 * Account page — wired to the sidebar user dropdown ("Account").
 * Pulls the live profile from /api/auth/me, lets the user update display
 * fields and rotate the password without leaving the admin.
 */
export default function AccountPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => (s as unknown as { setUser?: (u: unknown) => void }).setUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", username: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/auth/me");
        if (cancelled) return;
        const data = res.data?.data ?? {};
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          username: data.username ?? "",
        });
      } catch (err) {
        toast.error("Failed to load profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/admin/users/${user.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
      });
      // Reflect the change in the sidebar without forcing a reload.
      const updated = (data?.data ?? data) as Record<string, unknown>;
      if (setUser && typeof setUser === "function") setUser({ ...user, ...updated });
      else {
        const token = localStorage.getItem("token");
        if (token) localStorage.setItem("user", JSON.stringify({ ...user, ...updated }));
      }
      toast.success("Profile updated");
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        ?? "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (pw.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed");
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
        ?? "Password change failed";
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <div className="h-32 animate-pulse rounded-lg bg-muted/30" />
      </div>
    );
  }

  const initials = `${(form.firstName?.[0] ?? "").toUpperCase()}${(form.lastName?.[0] ?? "").toUpperCase()}` || "U";

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.avatar ?? undefined} alt={form.firstName} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold">{`${form.firstName} ${form.lastName}`.trim() || form.email}</h1>
          <p className="text-sm text-muted-foreground">{form.email}</p>
          {user?.role && (
            <p className="text-xs text-muted-foreground/80 mt-1">Role: {user.role}</p>
          )}
        </div>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your name and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
          <CardDescription>
            Use at least 8 characters. Other sessions will stay signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handlePassword}>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="current">Current password</Label>
              <PasswordInput
                id="current"
                autoComplete="current-password"
                value={pw.currentPassword}
                onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <PasswordInput
                id="new"
                autoComplete="new-password"
                value={pw.newPassword}
                onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                value={pw.confirmPassword}
                onChange={(e) => setPw((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
            <div className="sm:col-span-2 flex justify-end pt-2">
              <Button type="submit" loading={pwSaving}>
                Change password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
