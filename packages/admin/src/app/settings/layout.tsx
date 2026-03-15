"use client";

import { SettingsSidebar } from "@/components/layout/SettingsSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 min-w-0 h-full">
      <SettingsSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto bg-muted/20">
        {children}
      </div>
    </div>
  );
}
