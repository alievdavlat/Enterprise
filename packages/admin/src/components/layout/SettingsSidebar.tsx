"use client";

import { useEffect, useState } from "react";
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
  FileText,
  Wrench,
  History,
  BookOpen,
  Database,
  KeyRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@enterprise/design-system";
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
  id: string;
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
    id: "global",
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
    ],
  },
  {
    id: "builder",
    title: "Code Builder",
    items: [
      { href: "/settings/builder", label: "Builder", icon: Wrench },
      { href: "/settings/migrations", label: "Migrations", icon: Database },
    ],
  },
  {
    id: "auth",
    title: "Authentication",
    items: [
      { href: "/settings/auth-providers", label: "Auth Providers", icon: KeyRound },
    ],
  },
  {
    id: "admin",
    title: "Administration panel",
    items: [
      { href: "/settings/audit-logs", label: "Audit Logs", icon: ClipboardList, pro: true },
      { href: "/settings/roles", label: "Roles", icon: Shield },
      { href: "/settings/users", label: "Users", icon: Users },
    ],
  },
  {
    id: "email",
    title: "Email plugin",
    items: [
      { href: "/settings/email", label: "Configuration", icon: Mail },
    ],
  },
  {
    id: "users-perms",
    title: "Users & permissions",
    items: [
      { href: "/settings/users-permissions/email-templates", label: "Email templates", icon: FileText },
      { href: "/settings/users-permissions/advanced", label: "Advanced settings", icon: Wrench },
    ],
  },
];

const STORAGE_KEY = "settings-sidebar-expanded";
const ALL_SECTION_IDS = SECTIONS.map((s) => s.id);

/**
 * Settings → secondary sidebar. Sections collapse / expand via Accordion
 * (Strapi-style, mirroring ContentManagerSidebar). Open / closed state
 * persists in localStorage so opening Settings always restores the user's
 * preferred shape — important when many groups are present and the user
 * has narrow viewport.
 */
export function SettingsSidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(ALL_SECTION_IDS);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount. Until then keep all sections open
  // so navigation works even with JS disabled / before this runs.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) setExpanded(parsed);
      }
    } catch {
      /* corrupt entry — ignore */
    }
    setHydrated(true);
  }, []);

  // Auto-open the section that contains the active route, so a deep link
  // doesn't leave the user staring at a collapsed group with no obvious
  // way to find where they are.
  useEffect(() => {
    const matching = SECTIONS.find((s) => s.items.some((i) => pathname.startsWith(i.href) && i.href !== "/settings"));
    if (matching && !expanded.includes(matching.id)) {
      setExpanded((prev) => [...prev, matching.id]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (next: string[]) => {
    setExpanded(next);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota / disabled storage — ignore */
      }
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar/80 flex flex-col overflow-hidden">
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <span className="font-semibold text-sm">Settings</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange(ALL_SECTION_IDS)}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded"
            title="Expand all sections"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded"
            title="Collapse all sections"
          >
            None
          </button>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <Accordion
          type="multiple"
          value={hydrated ? expanded : ALL_SECTION_IDS}
          onValueChange={onChange}
          className="w-full"
        >
          {SECTIONS.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border-0">
              <AccordionTrigger className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:no-underline rounded-md">
                {section.title}
              </AccordionTrigger>
              <AccordionContent className="pb-2">
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    </aside>
  );
}
