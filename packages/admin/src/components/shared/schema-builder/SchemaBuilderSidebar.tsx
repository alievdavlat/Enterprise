"use client";

import { Database, FileBox, Layers, Puzzle, Plus } from "lucide-react";
import {
  Switch,
  Button,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@enterprise/design-system";
import type { ContentTypeSchema } from "@/types";

interface SchemaWithCategory extends ContentTypeSchema {
  category?: string;
}

export interface SchemaBuilderSidebarProps {
  collectionSchemas: ContentTypeSchema[];
  singleSchemas: ContentTypeSchema[];
  componentSchemas: SchemaWithCategory[];
  dynamiczoneSchemas: ContentTypeSchema[];
  selectedCt: ContentTypeSchema | null;
  onSelectCt: (ct: ContentTypeSchema) => void;
  openSections: string[];
  onOpenSectionsChange: (value: string[]) => void;
  expandedCompCategories: string[];
  onExpandedCompCategoriesChange: (value: string[]) => void;
  allSections: readonly string[];
  onCreateComponentClick: () => void;
  createSchemaButton: React.ReactNode;
}

export function SchemaBuilderSidebar({
  collectionSchemas,
  singleSchemas,
  componentSchemas,
  dynamiczoneSchemas,
  selectedCt,
  onSelectCt,
  openSections,
  onOpenSectionsChange,
  expandedCompCategories,
  onExpandedCompCategoriesChange,
  allSections,
  onCreateComponentClick,
  createSchemaButton,
}: SchemaBuilderSidebarProps) {
  const allExpanded = openSections.length === allSections.length;

  return (
    <div className="w-80 border-r border-border bg-card/30 flex flex-col pt-8 px-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content Schemas
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs text-muted-foreground">
          {allExpanded ? "Expanded" : "Collapsed"}
        </span>
        <Switch
          checked={allExpanded}
          onCheckedChange={(checked) =>
            onOpenSectionsChange(checked ? [...allSections] : [])
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={(val: any) => onOpenSectionsChange(val as string[])}>
          {collectionSchemas.length > 0 && (
            <AccordionItem value="collections" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 hover:no-underline">
                Collection Schemas
                <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
                  {collectionSchemas.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {collectionSchemas.map((ct) => (
                    <div
                      key={ct.uid}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer ${selectedCt?.uid === ct.uid ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted [&_svg]:text-muted-foreground"}`}
                      onClick={() => onSelectCt(ct)}>
                      <Database className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">
                        {ct.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {singleSchemas.length > 0 && (
            <AccordionItem value="singles" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 hover:no-underline">
                Single Schemas
                <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
                  {singleSchemas.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {singleSchemas.map((ct) => (
                    <div
                      key={ct.uid}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer ${selectedCt?.uid === ct.uid ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted [&_svg]:text-muted-foreground"}`}
                      onClick={() => onSelectCt(ct)}>
                      <FileBox className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">
                        {ct.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {componentSchemas.length > 0 && (
            <AccordionItem value="components" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 hover:no-underline">
                Components
                <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
                  {componentSchemas.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion
                  type="multiple"
                  value={expandedCompCategories}
                  onValueChange={(val: any) =>
                    onExpandedCompCategoriesChange(
                      Array.isArray(val) ? val : [val],
                    )
                  }>
                  {(() => {
                    const categories = new Map<string, SchemaWithCategory[]>();
                    componentSchemas.forEach((ct) => {
                      const cat = ct.category || "default";
                      if (!categories.has(cat)) categories.set(cat, []);
                      categories.get(cat)!.push(ct);
                    });
                    return Array.from(categories.entries());
                  })().map(([cat, items]) => (
                    <AccordionItem
                      key={cat}
                      value={`comp-cat-${cat}`}
                      className="border-none ml-1">
                      <AccordionTrigger className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider py-1.5 hover:no-underline hover:text-foreground transition-colors">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3 h-3" />
                          {cat}
                        </div>
                        <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal text-muted-foreground/50">
                          {items.length}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-0.5 ml-2 border-l border-border/40 pl-2">
                          {items.map((ct) => (
                            <div
                              key={ct.uid}
                              className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-all flex items-center gap-2 cursor-pointer ${selectedCt?.uid === ct.uid ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted [&_svg]:text-muted-foreground"}`}
                              onClick={() => onSelectCt(ct)}>
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span className="font-medium truncate text-[13px]">
                                {ct.displayName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          )}

          {dynamiczoneSchemas.length > 0 && (
            <AccordionItem value="dynamiczones" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2 hover:no-underline">
                Dynamic Zones
                <span className="ml-auto mr-2 text-[10px] font-normal normal-case tracking-normal bg-muted rounded-full px-1.5 py-0.5">
                  {dynamiczoneSchemas.length}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {dynamiczoneSchemas.map((ct) => (
                    <div
                      key={ct.uid}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 cursor-pointer ${selectedCt?.uid === ct.uid ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted [&_svg]:text-muted-foreground"}`}
                      onClick={() => onSelectCt(ct)}>
                      <Puzzle className="w-4 h-4 shrink-0" />
                      <span className="font-medium truncate">
                        {ct.displayName}
                      </span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <button
          type="button"
          onClick={onCreateComponentClick}
          className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 px-3 py-1.5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Create new component
        </button>
      </div>

      {createSchemaButton}
    </div>
  );
}
