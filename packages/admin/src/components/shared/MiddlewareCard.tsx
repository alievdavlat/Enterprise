"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Toggle,
} from "@enterprise/design-system";
import { CheckCircle2 } from "lucide-react";

interface MiddlewareCardProps {
  middleware: any;
  toggleMiddleware: any;
}

export const MiddlewareCard = ({
  middleware,
  toggleMiddleware,
}: MiddlewareCardProps) => {
  const Icon = middleware.icon;

  return (
    <Card
      key={middleware.id}
      className={`transition-all duration-300 border-border/50 shadow-sm ${middleware.enabled ? "border-primary/30 ring-1 ring-primary/10 shadow-primary/5" : "opacity-80"}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-4">
          <div
            className={`p-2.5 rounded-lg shadow-sm ${middleware.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {middleware.name}
              {middleware.enabled && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5" />
              )}
            </CardTitle>
            <CardDescription className="text-sm mt-0.5">
              {middleware.description}
            </CardDescription>
          </div>
        </div>
        <Toggle
          checked={middleware.enabled}
          onCheckedChange={() =>
            toggleMiddleware(middleware.id, middleware.enabled)
          }
          className="data-[state=checked]:bg-primary"
        />
      </CardHeader>
      <CardFooter className="pt-2 flex justify-between items-center border-t border-border/30 bg-muted/10 h-10">
        <div className="text-xs text-muted-foreground font-mono">
          ID: {middleware.id}
        </div>
        <button
          disabled={!middleware.enabled}
          className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 transition-colors">
          Edit Configuration
        </button>
      </CardFooter>
    </Card>
  );
};
