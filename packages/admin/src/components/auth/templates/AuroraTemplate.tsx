"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  AuroraBackground,
  CardSpotlight,
  TextGenerateEffect,
} from "@enterprise/design-system";
import { EnterpriseLogo } from "@/components/EnterpriseLogo";
import type { AuthTemplateProps } from "../types";

export function AuroraTemplate({
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
    <AuroraBackground className="min-h-screen p-4">
      <div className="w-full flex items-center justify-center py-12">
        <CardSpotlight
          spotlightColor="rgba(120,119,198,0.30)"
          radius={420}
          className="w-full max-w-md p-8 backdrop-blur-xl bg-zinc-950/80"
        >
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-zinc-100/10 border border-zinc-100/20 p-2.5 rounded-xl">
                <EnterpriseLogo className="size-6 text-zinc-100" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">
                <TextGenerateEffect
                  words={
                    isRegister ? `Welcome to ${brandName}` : `Welcome back to ${brandName}`
                  }
                  className="font-semibold text-3xl"
                />
              </h1>
              <p className="text-sm text-zinc-400 text-center">
                {isRegister
                  ? "Create your administrator account."
                  : "Sign in to continue to your workspace."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="h-11 bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
              {isRegister && setUsername && (
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-zinc-300">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={username ?? ""}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    autoComplete="username"
                    className="h-11 bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-zinc-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  className="h-11 bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-900 font-medium"
              >
                {loading
                  ? "Working…"
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>

            <p className="text-sm text-center text-zinc-400">
              {isRegister ? (
                <>
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-zinc-100 font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-zinc-100 font-medium hover:underline"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </p>
          </div>
        </CardSpotlight>
      </div>
    </AuroraBackground>
  );
}
