"use client";

import { Network } from "lucide-react";
import Link from "next/link";
import { RoutesPanel } from "@/components/builder/RoutesPanel";
import { PageHeader } from "@/components/shared";

/**
 * Deep-link compatibility: this URL still works, but the canonical home
 * for the no-code builder is /settings/builder. The standalone page
 * shows just the Routes panel + a breadcrumb back to the unified view.
 */
export default function UserRoutesPage() {
  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Network}
        eyebrow="Settings"
        title="Custom routes"
        description="Author REST endpoints from the UI. Mounted at /api/u/..."
        variant="violet"
        actions={
          <Link
            href="/settings/builder"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            Open Code Builder →
          </Link>
        }
      />
      <RoutesPanel />
    </div>
  );
}
