"use client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Toggle,
  Badge,
  Button,
} from "@enterprise/design-system";
import { CheckCircle2 } from "lucide-react";

interface PluginCardProps {
  plugin: any;
  togglePlugin: any;
}

export const PluginCard = ({ plugin, togglePlugin }: PluginCardProps) => {
  const Icon = plugin.icon;

  return (
    <Card
      key={plugin.id}
      className={`transition-all duration-300 border-border/50 shadow-sm ${plugin.enabled ? "border-primary/30 ring-1 ring-primary/10 shadow-primary/5" : "opacity-80"}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div
            className={`p-3 rounded-xl shadow-sm ${plugin.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Toggle
            checked={plugin.enabled}
            onCheckedChange={() => togglePlugin(plugin.id, plugin.enabled)}
          />
        </div>
        <CardTitle className="mt-4 flex items-center gap-2">
          {plugin.name}
          {plugin.enabled && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </CardTitle>
        <CardDescription className="min-h-[40px] text-sm leading-relaxed">
          {plugin.description}
        </CardDescription>
      </CardHeader>
      <CardFooter className="pt-2 flex justify-between items-center border-t border-border/30 bg-muted/10">
        <Badge
          variant={plugin.enabled ? "primary" : "secondary"}
          className="font-mono text-xs shadow-none">
          v{plugin.version}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          disabled={!plugin.enabled}
          className="text-primary hover:text-primary hover:bg-primary/10 px-3">
          Configure
        </Button>
      </CardFooter>
    </Card>
  );
};
