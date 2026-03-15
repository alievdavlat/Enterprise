"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Key,
  Globe,
  Image,
  Puzzle,
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
  FileJson,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NavLink = ({
  href,
  children,
  icon: Icon,
  pro,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  pro?: boolean;
}) => {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (href !== "/settings" && pathname.startsWith(href)) ||
    (href === "/settings" && pathname === "/settings" && !pathname.slice(10));
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
      <span className="flex-1">{children}</span>
      {pro && <Zap className="w-3.5 h-3.5 text-primary shrink-0" />}
    </Link>
  );
};

export function SettingsSidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar/80 flex flex-col overflow-hidden">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="font-semibold text-sm">Settings</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Global settings
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink href="/settings" icon={Home}>
              Overview
            </NavLink>
            <NavLink href="/settings/api-tokens" icon={Key}>
              API Tokens
            </NavLink>
            <NavLink href="/settings/internationalization" icon={Globe}>
              Internationalization
            </NavLink>
            <NavLink href="/settings/media-library" icon={Image}>
              Asset Gallery
            </NavLink>
            <NavLink href="/settings/plugins" icon={Puzzle}>
              Plugins
            </NavLink>
            <NavLink href="/settings/review-workflows" icon={Zap} pro>
              Review Workflows
            </NavLink>
            <NavLink href="/settings/sso" icon={Lock} pro>
              Single Sign-On
            </NavLink>
            <NavLink href="/settings/transfer-tokens" icon={Truck}>
              Transfer Tokens
            </NavLink>
            <NavLink href="/settings?tab=backup" icon={FileJson}>
              Project backup
            </NavLink>
            <NavLink href="/settings/webhooks" icon={Webhook}>
              Webhooks
            </NavLink>
          </div>
        </div>
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administration panel
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink href="/settings/audit-logs" icon={ClipboardList} pro>
              Audit Logs
            </NavLink>
            <NavLink href="/settings/roles" icon={Shield}>
              Roles
            </NavLink>
            <NavLink href="/settings/users" icon={Users}>
              Users
            </NavLink>
          </div>
        </div>
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email plugin
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink href="/settings/email" icon={Mail}>
              Configuration
            </NavLink>
          </div>
        </div>
        <div className="mb-4">
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Users & permissions
          </p>
          <div className="flex flex-col gap-0.5">
            <NavLink href="/settings/roles" icon={UserCog}>
              Roles
            </NavLink>
            <NavLink href="/settings/users-permissions/email-templates" icon={FileText}>
              Email templates
            </NavLink>
            <NavLink href="/settings/users-permissions/advanced" icon={Wrench}>
              Advanced settings
            </NavLink>
          </div>
        </div>
      </nav>
    </aside>
  );
}
