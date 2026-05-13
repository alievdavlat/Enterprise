"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@enterprise/design-system";
import {
  Search,
  Database,
  Settings,
  Wrench,
  Network,
  Layers,
  Clock,
  Wand2,
  Activity,
  Puzzle,
  Boxes,
  KeyRound,
  Key,
  Users,
  Shield,
  HardDrive,
  Image as ImageIcon,
  Webhook,
  Mail,
  Globe,
  Lock,
  BookOpen,
  ClipboardList,
  History,
  FileText,
  Truck,
  Bell,
  User as UserIcon,
  LogOut,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  group: string;
  href?: string;
  action?: () => void;
  keywords?: string;
}

const STATIC_ITEMS: Omit<CommandItem, "id">[] = [
  // Pages
  { group: "Pages", label: "Dashboard", icon: Database, href: "/", keywords: "home overview" },
  { group: "Pages", label: "Media library", icon: ImageIcon, href: "/media" },
  { group: "Pages", label: "Schema builder", icon: Layers, href: "/schema-builder", keywords: "content types" },

  // No-code builder
  { group: "Code Builder", label: "Open Code Builder", icon: Wrench, href: "/settings/builder", keywords: "no-code" },
  { group: "Code Builder", label: "Routes", icon: Network, href: "/settings/builder?tab=routes", keywords: "controllers endpoints" },
  { group: "Code Builder", label: "Middlewares", icon: Layers, href: "/settings/builder?tab=middlewares" },
  { group: "Code Builder", label: "Cron jobs", icon: Clock, href: "/settings/builder?tab=cron" },
  { group: "Code Builder", label: "Services", icon: Wand2, href: "/settings/builder?tab=services" },
  { group: "Code Builder", label: "Lifecycles", icon: Activity, href: "/settings/builder?tab=lifecycles" },
  { group: "Code Builder", label: "Extensions", icon: Puzzle, href: "/settings/builder?tab=extensions" },
  { group: "Code Builder", label: "Plugin bundles", icon: Boxes, href: "/settings/builder?tab=plugins" },
  { group: "Code Builder", label: "Migrations", icon: Database, href: "/settings/migrations" },

  // Settings
  { group: "Settings", label: "Settings overview", icon: Settings, href: "/settings" },
  { group: "Settings", label: "API tokens", icon: Key, href: "/settings/api-tokens" },
  { group: "Settings", label: "Roles", icon: Shield, href: "/settings/roles", keywords: "permissions" },
  { group: "Settings", label: "Users", icon: Users, href: "/settings/users" },
  { group: "Settings", label: "Webhooks", icon: Webhook, href: "/settings/webhooks" },
  { group: "Settings", label: "Auth providers", icon: KeyRound, href: "/settings/auth-providers", keywords: "oauth github discord" },
  { group: "Settings", label: "Email configuration", icon: Mail, href: "/settings/email" },
  { group: "Settings", label: "Internationalization", icon: Globe, href: "/settings/internationalization", keywords: "i18n locale" },
  { group: "Settings", label: "Data backup", icon: HardDrive, href: "/settings/data-backup", keywords: "export import" },
  { group: "Settings", label: "Transfer tokens", icon: Truck, href: "/settings/transfer-tokens" },
  { group: "Settings", label: "Audit logs", icon: ClipboardList, href: "/settings/audit-logs" },
  { group: "Settings", label: "Content history", icon: History, href: "/settings/content-history" },
  { group: "Settings", label: "Review workflows", icon: Activity, href: "/settings/review-workflows" },
  { group: "Settings", label: "SSO", icon: Lock, href: "/settings/sso" },
  { group: "Settings", label: "API documentation", icon: BookOpen, href: "/settings/api-docs" },
  { group: "Settings", label: "Email templates", icon: FileText, href: "/settings/users-permissions/email-templates" },

  // Personal
  { group: "Personal", label: "Account", icon: UserIcon, href: "/account" },
  { group: "Personal", label: "Notifications", icon: Bell, href: "/notifications" },
];

/**
 * Command palette mounted globally — Cmd+K (Mac) / Ctrl+K (Windows). Lists
 * every navigation target plus content-type entries the user has access to.
 * Strapi has no equivalent — Linear / GitHub style productivity feature.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const contentTypes = useAppStore((s) => s.contentTypes);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isToggle) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items: CommandItem[] = useMemo(() => {
    const out: CommandItem[] = STATIC_ITEMS.map((it, i) => ({ ...it, id: `static-${i}` }));
    for (const ct of contentTypes) {
      out.push({
        id: `ct-${ct.uid}`,
        label: ct.displayName ?? ct.uid,
        hint: ct.uid,
        icon: Database,
        group: "Content types",
        href: `/data-manager/${ct.uid}`,
        keywords: `${ct.uid} ${ct.collectionName}`,
      });
    }
    out.push({
      id: "action-logout",
      label: "Log out",
      icon: LogOut,
      group: "Actions",
      action: () => {
        logout();
        router.replace("/login");
      },
    });
    return out;
  }, [contentTypes, logout, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      it.label.toLowerCase().includes(q)
      || (it.keywords ?? "").toLowerCase().includes(q)
      || (it.hint ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const it of filtered) {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const run = (it: CommandItem) => {
    if (it.href) router.push(it.href);
    if (it.action) it.action();
    setOpen(false);
    setQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search…"
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {grouped.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No matches.
            </div>
          ) : (
            grouped.map(([group, list]) => (
              <div key={group} className="mb-2 last:mb-0">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {list.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => run(it)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left">
                      <it.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{it.label}</span>
                      {it.hint && <span className="text-xs text-muted-foreground/70 truncate">{it.hint}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t text-[11px] text-muted-foreground flex items-center justify-between bg-muted/30">
          <span>
            <kbd className="bg-background border px-1 rounded font-mono mr-1">↵</kbd>open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-background border px-1 rounded font-mono">Ctrl</kbd>
            <kbd className="bg-background border px-1 rounded font-mono">K</kbd>
            <span className="ml-1">to toggle</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
