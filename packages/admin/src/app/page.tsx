"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@enterprise/design-system";
import { useAppStore } from "@/store/app";
import { BarChart3, Database, Users, Box, Zap } from "lucide-react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const { contentTypes, fetchContentTypes } = useAppStore();
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    fetchContentTypes();
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data.data))
      .catch(console.error);
  }, [fetchContentTypes]);

  const totalEntries = stats.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Welcome to Enterprise CMS. Here is an overview of your project.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-background to-muted/50 border-primary/20 shadow-sm transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Schemas</CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{contentTypes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Schemas defined
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 border-primary/20 shadow-sm transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all collections
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 border-primary/20 shadow-sm transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Plugins</CardTitle>
            <Box className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active extensions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-muted/50 border-primary/20 shadow-sm transition-transform hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">Online</div>
            <p className="text-xs text-muted-foreground mt-1">
              REST & GraphQL Active
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Activity logs across your CMS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.map((stat) => (
                <div
                  key={stat.uid}
                  className="flex items-center p-3 rounded-lg border border-border/50 bg-muted/20"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {stat.displayName}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.uid}</p>
                  </div>
                  <div className="font-medium px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {stat.count} items
                  </div>
                </div>
              ))}
              {stats.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Server and Database info</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Version</span>
              <span className="font-semibold">v1.0.0</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Node.js</span>
              <span className="font-semibold">
                {process.version || "v20.x"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Database</span>
              <span className="font-semibold">Connected</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-semibold">Development</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
