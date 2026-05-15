"use client";

import { Layers } from "lucide-react";
import Link from "next/link";
import { MiddlewaresPanel } from "@/components/builder/MiddlewaresPanel";
import { PageHeader } from "@/components/shared";

export default function UserMiddlewaresPage() {
  return (
    <div className="p-8 space-y-6">
      <PageHeader
        icon={Layers}
        eyebrow="Settings"
        title="Middlewares"
        description="Author Express middlewares from the UI. Lower priority runs first."
        variant="blue"
        actions={
          <Link
            href="/settings/builder?tab=middlewares"
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
            Open Code Builder →
          </Link>
        }
      />
      <MiddlewaresPanel />
    </div>
  );
}
