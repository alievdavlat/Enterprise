"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@enterprise/design-system";
import {
  Database,
  Key,
  Shield,
  Users,
  Globe,
  Image as ImageIcon,
  Webhook,
  Mail,
  Clock,
  History,
  Truck,
  Lock,
  ClipboardList,
  Zap,
  BookOpen,
  ArrowRight,
  Activity,
  HardDrive,
  Layers,
  Network,
  KeyRound,
  Settings as SettingsIcon,
} from "lucide-react";
import { PageHeader } from "@/components/shared";

type DbInfo = {
  connected?: boolean;
  contentTypes?: number;
  singleTypes?: number;
  client?: string;
  size?: number | string;
};

type StatTile = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  hint?: string;
  accent?: string;
};

type ShortcutCard = {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
};

const SHORTCUTS: { group: string; items: ShortcutCard[] }[] = [
  {
    group: "Global settings",
    items: [
      {
        href: "/settings/api-tokens",
        title: "API Tokens",
        description: "Programmatic access tokens for the REST API",
        icon: Key,
      },
      {
        href: "/settings/data-backup",
        title: "Data Backup",
        description: "Export & restore schemas and content",
        icon: HardDrive,
      },
      {
        href: "/settings/internationalization",
        title: "Internationalization",
        description: "Manage locales and translations",
        icon: Globe,
      },
      {
        href: "/settings/media-library",
        title: "Asset Gallery",
        description: "Upload settings, breakpoints & responsive media",
        icon: ImageIcon,
      },
      {
        href: "/settings/webhooks",
        title: "Webhooks",
        description: "Outgoing HTTP notifications on content events",
        icon: Webhook,
      },
      {
        href: "/settings/transfer-tokens",
        title: "Transfer Tokens",
        description: "Pull & push data between Enterprise instances",
        icon: Truck,
      },
      {
        href: "/settings/cron",
        title: "Cron Jobs",
        description: "Scheduled background tasks — create from UI, no restart",
        icon: Clock,
      },
      {
        href: "/settings/user-middlewares",
        title: "Middlewares",
        description: "Author Express middlewares from the UI (hot reload)",
        icon: Layers,
      },
      {
        href: "/settings/user-routes",
        title: "Custom Routes",
        description: "Build your own REST endpoints under /api/u/...",
        icon: Network,
      },
      {
        href: "/settings/api-docs",
        title: "API Documentation",
        description: "OpenAPI specs auto-generated for your CMS",
        icon: BookOpen,
      },
    ],
  },
  {
    group: "Administration",
    items: [
      {
        href: "/settings/users",
        title: "Admin Users",
        description: "Manage backoffice members",
        icon: Users,
      },
      {
        href: "/settings/roles",
        title: "Roles",
        description: "Permissions for admin & API roles",
        icon: Shield,
      },
      {
        href: "/settings/audit-logs",
        title: "Audit Logs",
        description: "Track sensitive admin operations",
        icon: ClipboardList,
        badge: "Pro",
      },
      {
        href: "/settings/content-history",
        title: "Content History",
        description: "Restore previous versions of content",
        icon: History,
        badge: "Pro",
      },
    ],
  },
  {
    group: "Plugins",
    items: [
      {
        href: "/settings/email",
        title: "Email Configuration",
        description: "SMTP / providers used for outgoing emails",
        icon: Mail,
      },
      {
        href: "/settings/users-permissions/email-templates",
        title: "Email Templates",
        description: "Reset password, account confirmation",
        icon: Mail,
      },
      {
        href: "/settings/auth-providers",
        title: "Auth Providers",
        description: "Sign-in with GitHub, Discord, Google, Microsoft & more",
        icon: KeyRound,
      },
      {
        href: "/settings/sso",
        title: "Single Sign-On",
        description: "SAML / enterprise OIDC providers",
        icon: Lock,
        badge: "Pro",
      },
      {
        href: "/settings/review-workflows",
        title: "Review Workflows",
        description: "Define approval stages for content",
        icon: Zap,
        badge: "Pro",
      },
    ],
  },
];

export default function SettingsOverviewPage() {
  const [dbInfo, setDbInfo] = useState<DbInfo>({});
  const [tokensCount, setTokensCount] = useState<number | null>(null);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [webhooksCount, setWebhooksCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [db, tokens, users, hooks] = await Promise.all([
          api.get("/admin/database/info").catch(() => null),
          api.get("/admin/api-tokens").catch(() => null),
          api.get("/admin/users").catch(() => null),
          api.get("/webhooks").catch(() => null),
        ]);
        if (db) setDbInfo(db.data?.data ?? {});
        setTokensCount(tokens?.data?.data?.length ?? 0);
        setUsersCount(users?.data?.data?.length ?? 0);
        setWebhooksCount(hooks?.data?.data?.length ?? 0);
      } catch (e) {
        console.error("Failed to load overview data", e);
      }
    })();
  }, []);

  const stats: StatTile[] = [
    {
      label: "Database",
      value: dbInfo.connected ? "Connected" : "Disconnected",
      icon: Database,
      hint: dbInfo.client?.toUpperCase() || "—",
      accent: dbInfo.connected
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-destructive",
    },
    {
      label: "Content schemas",
      value: (dbInfo.contentTypes ?? 0) + (dbInfo.singleTypes ?? 0),
      icon: Activity,
      hint: `${dbInfo.contentTypes ?? 0} collections · ${dbInfo.singleTypes ?? 0} singles`,
    },
    {
      label: "API tokens",
      value: tokensCount ?? "—",
      icon: Key,
    },
    {
      label: "Admin users",
      value: usersCount ?? "—",
      icon: Users,
    },
    {
      label: "Webhooks",
      value: webhooksCount ?? "—",
      icon: Webhook,
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Manage global project configuration, integrations and plugins."
        variant="primary"
      />

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/60 hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p
                  className={`text-2xl font-bold tracking-tight ${stat.accent ?? ""}`}
                >
                  {stat.value}
                </p>
                {stat.hint && (
                  <p className="text-xs text-muted-foreground">{stat.hint}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Shortcuts */}
      {SHORTCUTS.map((section) => (
        <div key={section.group} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {section.group}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group">
                  <Card className="h-full border-border/60 hover:border-primary/50 hover:shadow-md transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        {item.badge && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase tracking-wide"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base flex items-center gap-1.5 mt-3">
                        {item.title}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
