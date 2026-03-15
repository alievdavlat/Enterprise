"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutTemplate,
  BarChart3,
  Database,
  FileBox,
  Wrench,
  Blocks,
  Settings,
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
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarItem,
  SidebarLabel,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/app";
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
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <SidebarItem>
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
    </SidebarItem>
  );
};

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const contentTypes = useAppStore((state) => state.contentTypes);
  const collectionTypes = contentTypes.filter((ct) => ct.kind === "collectionType");
  const singleTypes = contentTypes.filter((ct) => ct.kind === "singleType");
  const isSettings = pathname.startsWith("/settings");
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") || "U";

  return (
    <Sidebar className="border-r border-border bg-sidebar transition-all duration-300">
      <SidebarHeader className="h-14 flex items-center gap-3 px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="bg-primary text-primary-foreground p-2 rounded-md shrink-0">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm truncate">
            {isSettings ? "Settings" : "Enterprise CMS"}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3 flex-1 overflow-y-auto">
        {!isSettings && (
          <>
            <div className="px-3 mb-2">
              <SidebarMenu>
                <NavLink href="/" icon={BarChart3}>Dashboard</NavLink>
              </SidebarMenu>
            </div>
            {(collectionTypes.length > 0 || singleTypes.length > 0) && (
              <div className="px-3 mb-4">
                <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</SidebarLabel>
                <SidebarMenu>
                  {collectionTypes.map((ct) => (
                    <SidebarItem key={ct.uid}>
                      <Link href={`/content-manager/${ct.uid}`} className={cn("flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm transition-colors", pathname === `/content-manager/${ct.uid}` ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                        <Database className="w-4 h-4 shrink-0" />
                        <span className="flex-1 truncate">{ct.pluralName}</span>
                      </Link>
                    </SidebarItem>
                  ))}
                  {singleTypes.map((ct) => (
                    <SidebarItem key={ct.uid}>
                      <Link href={`/content-manager/${ct.uid}`} className={cn("flex items-center gap-3 px-3 py-2 rounded-md w-full text-sm transition-colors", pathname === `/content-manager/${ct.uid}` ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                        <FileBox className="w-4 h-4 shrink-0" />
                        <span className="flex-1 truncate">{ct.singularName}</span>
                      </Link>
                    </SidebarItem>
                  ))}
                </SidebarMenu>
              </div>
            )}
            <div className="px-3 mb-4">
              <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Builder</SidebarLabel>
              <SidebarMenu>
                <NavLink href="/content-types" icon={Wrench}>Content Type Builder</NavLink>
                <NavLink href="/media" icon={Image}>Media Library</NavLink>
              </SidebarMenu>
            </div>
          </>
        )}
        <div className="px-3 mb-4">
          <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isSettings ? "Global settings" : "Extensions"}</SidebarLabel>
          <SidebarMenu>
            {isSettings ? (
              <>
                <NavLink href="/settings" icon={Home}>Overview</NavLink>
                <NavLink href="/settings/api-tokens" icon={Key}>API Tokens</NavLink>
                <NavLink href="/settings/internationalization" icon={Globe}>Internationalization</NavLink>
                <NavLink href="/settings/media-library" icon={Image}>Media Library</NavLink>
                <NavLink href="/settings/plugins" icon={Puzzle}>Plugins</NavLink>
                <NavLink href="/settings/review-workflows" icon={Zap} pro>Review Workflows</NavLink>
                <NavLink href="/settings/sso" icon={Lock} pro>Single Sign-On</NavLink>
                <NavLink href="/settings/transfer-tokens" icon={Truck}>Transfer Tokens</NavLink>
                <NavLink href="/settings/webhooks" icon={Webhook}>Webhooks</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/plugins" icon={Blocks}>Plugins</NavLink>
                <NavLink href="/middlewares" icon={Settings}>Middlewares</NavLink>
              </>
            )}
          </SidebarMenu>
        </div>
        <div className="px-3 mb-4">
          <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administration panel</SidebarLabel>
          <SidebarMenu>
            <NavLink href="/settings/audit-logs" icon={ClipboardList} pro>Audit Logs</NavLink>
            <NavLink href="/settings/roles" icon={Shield}>Roles</NavLink>
            <NavLink href="/settings/users" icon={Users}>Users</NavLink>
          </SidebarMenu>
        </div>
        {isSettings && (
          <>
            <div className="px-3 mb-4">
              <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email plugin</SidebarLabel>
              <SidebarMenu>
                <NavLink href="/settings/email" icon={Mail}>Configuration</NavLink>
              </SidebarMenu>
            </div>
            <div className="px-3 mb-4">
              <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Users & permissions</SidebarLabel>
              <SidebarMenu>
                <NavLink href="/settings/roles" icon={UserCog}>Roles</NavLink>
                <NavLink href="/settings/users-permissions/email-templates" icon={FileText}>Email templates</NavLink>
                <NavLink href="/settings/users-permissions/advanced" icon={Wrench}>Advanced settings</NavLink>
              </SidebarMenu>
            </div>
          </>
        )}
        {!isSettings && (
          <div className="px-3">
            <SidebarMenu>
              <NavLink href="/settings" icon={Settings}>Settings</NavLink>
            </SidebarMenu>
          </div>
        )}
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
