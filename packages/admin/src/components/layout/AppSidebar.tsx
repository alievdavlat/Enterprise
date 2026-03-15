"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Database,
  Wrench,
  Blocks,
  Settings,
  Image,
  Zap,
  ClipboardList,
  Shield,
  Users,
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
  SidebarRail,
} from "@enterprise/design-system";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";
import { EnterpriseLogo } from "@/components/EnterpriseLogo";

const NavLink = ({
  href,
  children,
  icon: Icon,
  pro,
  tooltip,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  pro?: boolean;
  tooltip?: string;
}) => {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  const label = tooltip ?? (typeof children === "string" ? children : "");
  return (
    <SidebarItem active={active} tooltip={label}>
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
  const user = useAppStore((s) => s.user);
  const initials = [user?.firstName?.[0], user?.lastName?.[0]].filter(Boolean).join("") || "U";

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar transition-all duration-300 relative">
      <SidebarRail />
      <SidebarHeader className="h-14 flex items-center gap-3 px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="bg-primary text-primary-foreground p-2 rounded-md shrink-0 flex items-center justify-center">
            <EnterpriseLogo className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm truncate">Enterprise CMS</span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3 flex-1 overflow-y-auto">
        <div className="px-3 mb-2">
          <SidebarMenu className="gap-[10px]">
            <NavLink href="/" icon={BarChart3}>
              Dashboard
            </NavLink>
          </SidebarMenu>
        </div>
        <div className="px-3 mb-4">
          <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Content
          </SidebarLabel>
          <SidebarMenu className="gap-[10px]">
            <NavLink href="/data-manager" icon={Database}>
              Data Manager
            </NavLink>
            <NavLink href="/schema-builder" icon={Wrench}>
              Schema Builder
            </NavLink>
            <NavLink href="/media" icon={Image}>
              Asset Gallery
            </NavLink>
          </SidebarMenu>
        </div>
        <div className="px-3 mb-4">
          <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Extensions
          </SidebarLabel>
          <SidebarMenu className="gap-[10px]">
            <NavLink href="/plugins" icon={Blocks}>
              Plugins
            </NavLink>
            <NavLink href="/middlewares" icon={Settings}>
              Middlewares
            </NavLink>
          </SidebarMenu>
        </div>
        {/* <div className="px-3 mb-4">
          <SidebarLabel className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Administration panel
          </SidebarLabel>
          <SidebarMenu className="gap-[10px]">
            <NavLink href="/settings/audit-logs" icon={ClipboardList} pro>
              Audit Logs
            </NavLink>
            <NavLink href="/settings/roles" icon={Shield}>
              Roles
            </NavLink>
            <NavLink href="/settings/users" icon={Users}>
              Users
            </NavLink>
          </SidebarMenu>
        </div> */}
        <div className="px-3">
          <SidebarMenu className="gap-[10px]">
            <NavLink href="/settings" icon={Settings}>
              Settings
            </NavLink>
          </SidebarMenu>
        </div>
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
