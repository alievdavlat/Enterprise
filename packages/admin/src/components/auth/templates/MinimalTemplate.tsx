"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@enterprise/design-system";
import { EnterpriseLogo } from "@/components/EnterpriseLogo";
import type { AuthTemplateProps } from "../types";

export function MinimalTemplate({
  mode,
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUsername,
  loading,
  error,
  onSubmit,
  brandName = "Enterprise CMS",
  footer: _footer,
}: AuthTemplateProps) {
  const isRegister = mode === "register";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl">
          <EnterpriseLogo className="size-7 text-primary" />
        </div>
        <span className="text-lg font-semibold text-foreground">
          {brandName}
        </span>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isRegister ? "Create an account" : "Sign in"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Set up an admin account to start managing your content."
              : "Welcome back. Please sign in to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md border border-destructive/20">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {isRegister && setUsername && (
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username ?? ""}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              {isRegister ? "Register" : "Sign in"}
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-2">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="text-primary hover:underline font-medium">
                    Register
                  </Link>
                </>
              )}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
