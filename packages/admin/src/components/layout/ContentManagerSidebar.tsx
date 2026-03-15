"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Database, FileBox } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Switch,
} from "@enterprise/design-system";

const ALL_SECTIONS = ["collections", "singles"];

export function ContentManagerSidebar() {
  const pathname = usePathname();
  const contentTypes = useAppStore((state) => state.contentTypes);
  const fetchContentTypes = useAppStore((state) => state.fetchContentTypes);
  const [expanded, setExpanded] = useState<string[]>(ALL_SECTIONS);

  useEffect(() => {
    if (contentTypes.length === 0) {
      fetchContentTypes();
    }
  }, [contentTypes.length, fetchContentTypes]);

  const collectionTypes = contentTypes.filter(
    (ct) => ct.kind === "collectionType",
  );
  const singleTypes = contentTypes.filter((ct) => ct.kind === "singleType");

  const activeUid =
    pathname.startsWith("/data-manager/") &&
    pathname.split("/")[2] &&
    pathname.split("/")[2] !== ""
      ? decodeURIComponent(pathname.split("/")[2]!)
      : null;

  const allExpanded = expanded.length === ALL_SECTIONS.length;

  return (
    <aside className="h-full w-80 shrink-0 border-r border-border bg-card/30 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/50 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data Manager
        </p>
      </div>

      <div className="flex items-center justify-between mb-2 px-4 pt-3">
        <span className="text-xs text-muted-foreground">
          {allExpanded ? "Expanded" : "Collapsed"}
        </span>
        <Switch
          checked={allExpanded}
          onCheckedChange={(checked) =>
            setExpanded(checked ? [...ALL_SECTIONS] : [])
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-4 pr-2">
        <Accordion
          type="multiple"
          value={expanded}
          onValueChange={(v) => setExpanded(v as string[])}
          className="space-y-0">
          {collectionTypes.length > 0 && (
            <AccordionItem value="collections" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 hover:no-underline">
                Collection Schemas
                <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
                  {collectionTypes.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {collectionTypes.map((ct) => (
                    <Link
                      key={ct.uid}
                      href={`/data-manager/${ct.uid}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors  w-full !no-underline hover:no-underline",
                        activeUid === ct.uid
                          ? "bg-primary text-primary-foreground hover:!text-primary-foreground hover:bg-primary"
                          : "text-foreground hover:bg-muted",
                      )}>
                      <Database className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">
                        {ct.displayName}
                      </span>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {singleTypes.length > 0 && (
            <AccordionItem value="singles" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 hover:no-underline">
                Single Schemas
                <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
                  {singleTypes.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {singleTypes.map((ct) => (
                    <Link
                      key={ct.uid}
                      href={`/data-manager/${ct.uid}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors  w-full !no-underline hover:no-underline",
                        activeUid === ct.uid
                          ? "bg-primary text-primary-foreground hover:!text-primary-foreground hover:bg-primary"
                          : "text-foreground hover:bg-muted [&_svg]:text-muted-foreground",
                      )}>
                      <FileBox className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">
                        {ct.displayName}
                      </span>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </aside>
  );
}
