"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { CronPanel } from "@/components/builder/CronPanel";
import { PageHeader } from "@/components/shared";

export default function CronPage() {
  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Clock}
        eyebrow="Settings"
        title="Cron jobs"
        description="Scheduled tasks from the UI — no restart, no config file."
        variant="amber"
        actions={
          <Link
            href="/settings/builder?tab=cron"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            Open Code Builder →
          </Link>
        }
      />
      <CronPanel />
    </div>
  );
}
