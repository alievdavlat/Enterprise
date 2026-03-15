"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Key,
  Shield,
  User,
  Webhook,
  KeyRound,
  Copy,
  Check,
} from "lucide-react";

export default function Settings() {
  const [dbInfo, setDbInfo] = useState<any>({});
  const [tokens, setTokens] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dbRes, tokensRes, usersRes] = await Promise.all([
        api.get("/admin/database/info"),
        api.get("/admin/api-tokens").catch(() => ({ data: { data: [] } })),
        api.get("/admin/users").catch(() => ({ data: { data: [] } })),
      ]);
      setDbInfo(dbRes.data.data);
      setTokens(tokensRes.data.data || []);
      setUsers(usersRes.data.data || []);
    } catch (e) {
      console.error("Failed to load settings data", e);
    }
  };

  const handleCreateToken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.post("/admin/api-tokens", {
        name: formData.get("name"),
        description: formData.get("description"),
        type: formData.get("type"),
      });
      toast.success("API Token created");
      fetchData();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error("Failed to create API token");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Token copied to clipboard");
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage global project configurations
        </p>
      </div>

      <Tabs defaultValue="db" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 flex overflow-x-auto w-fit">
          <TabsTrigger
            value="db"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Database className="w-4 h-4" /> Database
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Shield className="w-4 h-4" /> Roles
          </TabsTrigger>
          <TabsTrigger
            value="users"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <User className="w-4 h-4" /> Admin Users
          </TabsTrigger>
          <TabsTrigger
            value="tokens"
            className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Key className="w-4 h-4" /> API Tokens
          </TabsTrigger>
        </TabsList>

        <TabsContent value="db">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Database className="w-5 h-5" /> Database Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${dbInfo.connected ? "bg-green-500" : "bg-red-500"}`}
                  />
                  <span className="font-semibold text-lg">
                    {dbInfo.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Client
                </p>
                <p className="font-semibold text-lg uppercase">
                  {process.env.NEXT_PUBLIC_DB_CLIENT || "Postgres"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Content Types
                </p>
                <p className="font-semibold text-lg">
                  {dbInfo.contentTypes + dbInfo.singleTypes || 0}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Node Environment
                </p>
                <p className="font-semibold text-lg capitalize">
                  {process.env.NODE_ENV || "development"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-border/50 shadow-sm h-fit">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-primary" /> Create Token
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateToken} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      name="name"
                      required
                      placeholder="e.g. Frontend App"
                      className="focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      name="description"
                      placeholder="Short description..."
                      className="focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Token Type</label>
                    <select
                      name="type"
                      className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="read-only">Read-only</option>
                      <option value="full-access">Full Access</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full mt-4">
                    Generate Token
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-border/50 shadow-sm">
              <CardHeader className="bg-muted/10 border-b border-border/50">
                <CardTitle className="text-lg">Active API Tokens</CardTitle>
              </CardHeader>
              <CardContent className="p-0 border-t-0">
                {tokens.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <Key className="w-8 h-8 opacity-20" />
                    <p>No tokens generated yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {tokens.map((token) => (
                      <div
                        key={token.id}
                        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-muted/10 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-[15px]">
                            {token.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {token.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                              {token.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/50 p-1.5 pl-3 rounded-md border border-border/50 group-hover:bg-background transition-colors w-fit">
                          <code
                            className="text-xs font-mono text-muted-foreground w-[120px] truncate block"
                            title={token.accessKey}
                          >
                            {token.accessKey}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 bg-background shadow-sm border border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                            onClick={() => copyToClipboard(token.accessKey)}
                          >
                            {copiedToken === token.accessKey ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Roles and Users Tabs can be similarly implemented */}
        <TabsContent value="roles">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Admin Roles configuration coming soon based on `@enterprise/core`
              RBAC.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <Card className="border-border/50">
            <div className="divide-y divide-border/50">
              {users.map((u: any) => (
                <div
                  key={u.id}
                  className="p-4 flex justify-between items-center hover:bg-muted/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase">
                      {u.username?.[0] || "U"}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {u.firstName} {u.lastName}{" "}
                        <span className="text-muted-foreground font-normal ml-2">
                          @{u.username}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-md font-medium uppercase tracking-wider">
                    {u.role}
                  </span>
                </div>
              ))}
              {users.length === 0 && (
                <p className="p-8 text-center text-muted-foreground">
                  No users found.
                </p>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
