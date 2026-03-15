"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
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
            <main className="flex-1 overflow-y-auto bg-muted/20 relative w-full h-full flex flex-col">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </OnboardingGuard>
    </div>
  );
}
