"use client";

import Link from "next/link";
import {
  BarChart3,
  Database,
  Wrench,
  Image,
  Settings2,
  Boxes,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@enterprise/design-system";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";
import { EnterpriseLogo } from "@/components/EnterpriseLogo";
import NavMenu from "./NavMenu";
import { NavUser } from "./NavUsers";
import type { NavMenuItemProps } from "./NavMenuItem";

const navigation = [
  {
    href: "/",
    icon: BarChart3,
    children: "Dashboard",
    id: "dashboard",
    pro: false,
    tooltip: "Dashboard",
  },
  "Content",
  {
    href: "/data-manager",
    icon: Database,
    children: "Data Manager",
    id: "data-manager",
    pro: false,
    tooltip: "Data Manager",
  },
  {
    href: "/schema-builder",
    icon: Wrench,
    children: "Schema Builder",
    id: "schema-builder",
    pro: false,
    tooltip: "Schema Builder",
  },
  {
    href: "/media",
    icon: Image,
    children: "Asset Gallery",
    id: "media",
    pro: false,
    tooltip: "Asset Gallery",
  },
  "Extend",
  {
    href: "/marketplace",
    icon: Boxes,
    children: "Plugins & Tools",
    id: "marketplace",
    pro: false,
    tooltip: "Plugins, middlewares, extensions, cron jobs, lifecycles",
  },
];

const footerNavigation = [
  {
    href: "/settings",
    icon: Settings2,
    children: "Settings",
    id: "settings",
    pro: false,
  },
];

export function AppSidebar() {
  const user = useAppStore((s) => s.user);

  const navigationGroups = (
    navigation as Array<
      | string
      | {
          href: string;
          icon: any;
          children: string;
          id: string;
          pro?: boolean;
          tooltip?: string;
          items?: Array<{
            href: string;
            icon: any;
            children: string;
            id: string;
            pro?: boolean;
            tooltip?: string;
          }>;
        }
    >
  ).reduce(
    (acc, entry) => {
      if (typeof entry === "string") {
        acc.push({ title: entry, items: [] as NavMenuItemProps[] });
        return acc;
      }

      const last = acc[acc.length - 1];
      if (!last) {
        acc.push({ title: undefined, items: [] as NavMenuItemProps[] });
      }

      (acc[acc.length - 1].items as NavMenuItemProps[]).push({
        href: entry.href,
        Icon: entry.icon,
        children: entry.children,
        id: entry.id,
        pro: entry.pro,
        tooltip: entry.tooltip,
        items: entry.items?.map((subItem) => ({
          href: subItem.href,
          Icon: subItem.icon,
          children: subItem.children,
          id: subItem.id,
          pro: subItem.pro,
          tooltip: subItem.tooltip,
        })),
      });

      return acc;
    },
    [] as Array<{ title?: string; items: NavMenuItemProps[] }>,
  );

  const footerNavigationGroups = (
    footerNavigation as Array<
      | string
      | {
          href: string;
          icon: any;
          children: string;
          id: string;
          pro?: boolean;
          tooltip?: string;
        }
    >
  ).reduce(
    (acc, entry) => {
      if (typeof entry === "string") {
        acc.push({ title: entry, items: [] as NavMenuItemProps[] });
        return acc;
      }

      const last = acc[acc.length - 1];
      if (!last) {
        acc.push({ title: undefined, items: [] as NavMenuItemProps[] });
      }

      (acc[acc.length - 1].items as NavMenuItemProps[]).push({
        href: entry.href,
        Icon: entry.icon,
        children: entry.children,
        id: entry.id,
        pro: entry.pro,
        tooltip: entry.tooltip,
      });

      return acc;
    },
    [] as Array<{ title?: string; items: NavMenuItemProps[] }>,
  );

  if (
    navigation.length > 0 &&
    typeof navigation[0] === "object" &&
    !navigationGroups.length
  ) {
    navigationGroups.push({ title: undefined, items: [] });
  }

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-sidebar transition-all duration-300 relative">
      <SidebarHeader
        className={cn(
          "py-3 flex flex-row items-center gap-3 border-b border-border relative",
          "group-data-[state=collapsed]:flex-col group-data-[state=collapsed]:items-start group-data-[state=collapsed]:gap-2",
        )}>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="bg-primary text-primary-foreground p-2 rounded-md shrink-0 flex items-center justify-center">
                  <EnterpriseLogo className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Enterprise CMS</span>
                </div>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger
          className={cn(
            "hidden md:inline-flex h-8 w-8 rounded-full border border-border bg-background shadow-sm hover:bg-muted/50",
            "ml-auto self-center",
            "group-data-[state=collapsed]:ml-0 group-data-[state=collapsed]:self-start group-data-[state=collapsed]:mt-1",
          )}
        />
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-y-auto">
        {navigationGroups.map((group, idx) => (
          <div
            className={cn(
              group.title ? "mb-4" : "mb-2",
              "group-data-[collapsible=icon]:mb-0",
            )}
            key={group.title ?? idx}>
            <NavMenu title={group.title} items={group.items} />
          </div>
        ))}
      </SidebarContent>
      <SidebarContent>
        {footerNavigationGroups.map((group, idx) => (
          <div
            className={cn(
              "mt-auto",
              group.title ? "mb-2" : "mb-0",
              "group-data-[collapsible=icon]:mb-0",
            )}
            key={group.title ?? idx}>
            <NavMenu title={group.title} items={group.items} />
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          firstName={user?.firstName || ""}
          lastName={user?.lastName || ""}
          email={user?.email || ""}
          avatar={user?.avatar || ""}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
