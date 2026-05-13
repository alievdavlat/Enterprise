"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@enterprise/design-system";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { OnboardingGuard } from "@/components/providers/OnboardingGuard";

const PUBLIC_PATHS = ["/login", "/register"];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = pathname && PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      <OnboardingGuard>
        <SidebarProvider defaultOpen>
          <div className="flex h-screen w-full overflow-hidden">
            <AppSidebar />
            <SidebarInset>
              <main className="flex-1 overflow-y-auto bg-muted/20 relative w-full h-full flex flex-col">
                {children}
              </main>
            </SidebarInset>
          </div>
          {/* Command palette is mounted globally so Cmd/Ctrl+K works from any
              admin page — Linear / Stripe / Vercel style productivity. */}
          <CommandPalette />
        </SidebarProvider>
      </OnboardingGuard>
    </div>
  );
}
