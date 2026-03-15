"use client";

import { Button } from "@enterprise/design-system";
import { Plus, Wrench } from "lucide-react";

export interface SchemaBuilderEmptyStateProps {
  onOpenNewSchema: () => void;
}

export function SchemaBuilderEmptyState({ onOpenNewSchema }: SchemaBuilderEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
        <Wrench className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Schema Builder</h2>
      <p className="text-muted-foreground mb-8">
        Select an existing content schema or create a new one to define your
        data structure and generate APIs instantly.
      </p>
      <Button
        onClick={onOpenNewSchema}
        size="lg"
        className="w-full gap-2 font-medium shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform"
      >
        <Plus className="w-5 h-5" /> Create new Content Schema
      </Button>
    </div>
  );
}
