import type { ReactNode } from "react";

import { ContentManagerSidebar } from "@/components/layout/ContentManagerSidebar";

export default function DataManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full">
      <ContentManagerSidebar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
