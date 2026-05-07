"use client";

import Link from "next/link";
import { LucideIcon, ChevronRight, Zap } from "lucide-react";
import * as React from "react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useSidebar,
} from "@enterprise/design-system";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

export interface NavMenuItemProps {
  href: string;
  children: React.ReactNode | string;
  Icon: LucideIcon;
  pro?: boolean;
  tooltip?: string;
  isActive?: boolean;
  id: string;
  items?: NavMenuItemProps[];
}

/* Active comparator that respects ?tab=… queries (used by Marketplace tabs).  */
function useIsActive() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return React.useCallback(
    (target: string, opts?: { exact?: boolean }) => {
      const [path, query] = target.split("?");
      const samePath = opts?.exact ? pathname === path : path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(path + "/") || pathname === path;
      if (!samePath) return false;
      if (!query) return true;
      const params = new URLSearchParams(query);
      for (const [k, v] of params.entries()) {
        if (searchParams.get(k) !== v) return false;
      }
      return true;
    },
    [pathname, searchParams]
  );
}

export const NavMenuItem = ({
  href,
  children,
  Icon,
  pro,
  tooltip,
  items,
  id,
}: NavMenuItemProps) => {
  const pathname = usePathname();
  const isActive = useIsActive();
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const label = tooltip ?? (typeof children === "string" ? children : "");

  // Top-level "active" is when the path itself matches (ignore query).
  const active = isActive(href);
  const hasChildren = !!items && items.length > 0;
  const hasActiveChild =
    hasChildren && items!.some((s) => isActive(s.href, { exact: false }));

  const [openByClick, setOpenByClick] = React.useState(active || hasActiveChild);
  React.useEffect(() => {
    if (active || hasActiveChild) setOpenByClick(true);
  }, [active, hasActiveChild]);

  // ─────────────────── Leaf (no children) ───────────────────
  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={label}
          isActive={active}
          className={cn(
            "h-9 px-3 rounded-md text-sm font-medium transition-colors gap-3",
            active
              ? "!bg-primary !text-primary-foreground hover:!bg-primary/90"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          render={
            <Link href={href}>
              {Icon && <Icon className="size-4 shrink-0" />}
              <span className="truncate">{children}</span>
              {pro && (
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-auto" />
              )}
            </Link>
          }
        />
      </SidebarMenuItem>
    );
  }

  // ─────────────────── Has children + sidebar collapsed → Popover ───────────────────
  if (isCollapsed) {
    return (
      <SidebarMenuItem>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              tooltip={label}
              isActive={active || hasActiveChild}
              className={cn(
                "h-9 px-3 rounded-md text-sm font-medium transition-colors gap-3",
                active || hasActiveChild
                  ? "!bg-primary !text-primary-foreground hover:!bg-primary/90"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {Icon && <Icon className="size-4 shrink-0" />}
              <span className="truncate">{children}</span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent
            side="right"
            align="start"
            sideOffset={8}
            className="p-1.5 w-60 rounded-lg shadow-lg"
          >
            <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {children}
            </div>
            <div className="flex flex-col gap-0.5">
              {items!.map((subItem) => {
                const SubIcon = subItem.Icon;
                const subActive = isActive(subItem.href);
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "flex items-center gap-3 px-2.5 h-8 rounded-md text-sm font-medium transition-colors",
                      subActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {SubIcon && <SubIcon className="size-4 shrink-0" />}
                    <span className="truncate">{subItem.children}</span>
                    {subItem.pro && (
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-auto" />
                    )}
                  </Link>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    );
  }

  // ─────────────────── Has children + expanded → Collapsible ───────────────────
  return (
    <Collapsible
      asChild
      open={openByClick}
      onOpenChange={setOpenByClick}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={label}
            // Parent only shows "active" when its OWN path is active, not when a child is.
            isActive={active}
            className={cn(
              "h-9 px-3 rounded-md text-sm font-medium transition-colors gap-3 cursor-pointer",
              active
                ? "!bg-primary !text-primary-foreground hover:!bg-primary/90"
                : hasActiveChild
                  ? "bg-sidebar-accent/40 text-sidebar-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            {Icon && <Icon className="size-4 shrink-0" />}
            <span className="truncate">{children}</span>
            <ChevronRight className="size-4 ml-auto shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <SidebarMenuSub className="mx-3 my-0.5 border-l border-sidebar-border/60 pl-2 gap-0.5">
            {items!.map((subItem) => {
              const SubIcon = subItem.Icon;
              const subActive = isActive(subItem.href);
              return (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    isActive={subActive}
                    className={cn(
                      "h-8 transition-colors gap-2.5",
                      subActive
                        ? "!bg-primary !text-primary-foreground hover:!bg-primary/90"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    render={
                      <Link href={subItem.href}>
                        {SubIcon && <SubIcon className="size-3.5 shrink-0" />}
                        <span className="truncate">{subItem.children}</span>
                        {subItem.pro && (
                          <Zap className="w-3 h-3 text-amber-500 shrink-0 ml-auto" />
                        )}
                      </Link>
                    }
                  />
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};
