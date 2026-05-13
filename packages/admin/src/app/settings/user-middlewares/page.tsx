"use client";

import { Layers } from "lucide-react";
import Link from "next/link";
import { MiddlewaresPanel } from "@/components/builder/MiddlewaresPanel";

export default function UserMiddlewaresPage() {
  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg border border-primary/20">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Middlewares</h1>
            <p className="text-muted-foreground mt-1">Author Express middlewares from the UI. Lower priority runs first.</p>
          </div>
        </div>
        <Link href="/settings/builder?tab=middlewares" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
          Open Code Builder →
        </Link>
      </div>
      <MiddlewaresPanel />
    </div>
  );
}
