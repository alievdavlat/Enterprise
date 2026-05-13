"use client";

import { Clock } from "lucide-react";
import Link from "next/link";
import { CronPanel } from "@/components/builder/CronPanel";

export default function CronPage() {
  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cron jobs</h1>
            <p className="text-muted-foreground mt-1">Scheduled tasks from the UI — no restart, no config file.</p>
          </div>
        </div>
        <Link href="/settings/builder?tab=cron" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
          Open Code Builder →
        </Link>
      </div>
      <CronPanel />
    </div>
  );
}
