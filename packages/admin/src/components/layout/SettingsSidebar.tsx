"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Key,
  Globe,
  Image,
  Zap,
  Lock,
  Truck,
  Webhook,
  ClipboardList,
  Shield,
  Users,
  Mail,
  UserCog,
  FileText,
  Wrench,
  History,
  BookOpen,
  Clock,
  Database,
  Layers,
  Network,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NavLink = ({
  href,
  children,
  icon: Icon,
  pro,
  exact,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  pro?: boolean;
  exact?: boolean;
}) => {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || (href !== "/settings" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="flex-1 truncate">{children}</span>
      {pro && <Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
    </Link>
  );
};

type Section = {
  title: string;
  items: Array<{
    href: string;
    label: string;
    icon: React.ElementType;
    pro?: boolean;
    exact?: boolean;
  }>;
};

const SECTIONS: Section[] = [
  {
    title: "Global settings",
    items: [
      { href: "/settings", label: "Overview", icon: Home, exact: true },
      { href: "/settings/api-tokens", label: "API Tokens", icon: Key },
      { href: "/settings/data-backup", label: "Data Backup", icon: Database },
      { href: "/settings/internationalization", label: "Internationalization", icon: Globe },
      { href: "/settings/media-library", label: "Asset Gallery", icon: Image },
      { href: "/settings/review-workflows", label: "Review Workflows", icon: Zap, pro: true },
      { href: "/settings/sso", label: "Single Sign-On", icon: Lock, pro: true },
      { href: "/settings/transfer-tokens", label: "Transfer Tokens", icon: Truck },
      { href: "/settings/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/settings/api-docs", label: "API Documentation", icon: BookOpen },
      { href: "/settings/content-history", label: "Content History", icon: History, pro: true },
      { href: "/settings/cron", label: "Cron jobs", icon: Clock },
      { href: "/settings/user-middlewares", label: "Middlewares", icon: Layers },
      { href: "/settings/user-routes", label: "Custom Routes", icon: Network },
    ],
  },
  {
    title: "Authentication",
    items: [
      { href: "/settings/auth-providers", label: "Auth Providers", icon: KeyRound },
    ],
  },
  {
    title: "Administration panel",
    items: [
      { href: "/settings/audit-logs", label: "Audit Logs", icon: ClipboardList, pro: true },
      { href: "/settings/roles", label: "Roles", icon: Shield },
      { href: "/settings/users", label: "Users", icon: Users },
    ],
  },
  {
    title: "Email plugin",
    items: [
      { href: "/settings/email", label: "Configuration", icon: Mail },
    ],
  },
  {
    title: "Users & permissions",
    items: [
      { href: "/settings/roles", label: "Roles", icon: UserCog },
      { href: "/settings/users-permissions/email-templates", label: "Email templates", icon: FileText },
      { href: "/settings/users-permissions/advanced", label: "Advanced settings", icon: Wrench },
    ],
  },
];

export function SettingsSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar/80 flex flex-col overflow-hidden">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="font-semibold text-sm">Settings</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <div className="flex flex-col gap-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  pro={item.pro}
                  exact={item.exact}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
