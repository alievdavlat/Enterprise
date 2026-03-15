import { Card, CardContent } from "@enterprise/design-system";
import { Database } from "lucide-react";

export default function DataManagerHome() {
  return (
    <div className="p-8 h-full flex items-center justify-center bg-gradient-to-br from-muted/20 via-background to-primary/5">
      <Card className="max-w-lg w-full border-border shadow-lg shadow-primary/5 rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <CardContent className="p-10 flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center ring-8 ring-primary/5 animate-in zoom-in-95 duration-500 delay-150">
            <Database className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              Select a content schema
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm animate-in fade-in duration-500 delay-300">
              Use the Data Manager menu on the left to choose a collection or
              single schema. You can then browse, edit, and create entries.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
