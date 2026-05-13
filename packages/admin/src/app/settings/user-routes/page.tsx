"use client";

import { Network } from "lucide-react";
import Link from "next/link";
import { RoutesPanel } from "@/components/builder/RoutesPanel";

/**
 * Deep-link compatibility: this URL still works, but the canonical home
 * for the no-code builder is /settings/builder. The standalone page
 * shows just the Routes panel + a breadcrumb back to the unified view.
 */
export default function UserRoutesPage() {
  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Custom routes</h1>
            <p className="text-muted-foreground mt-1">
              Author REST endpoints from the UI. Mounted at <code>/api/u/...</code>.
            </p>
          </div>
        </div>
        <Link href="/settings/builder" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
          Open Code Builder →
        </Link>
      </div>
      <RoutesPanel />
    </div>
  );
}
