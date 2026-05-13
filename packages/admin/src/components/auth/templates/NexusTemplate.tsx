"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Input,
  Label,
  Spotlight,
  TextGenerateEffect,
  GridBackground,
} from "@enterprise/design-system";
import { EnterpriseLogo } from "@/components/EnterpriseLogo";
import type { AuthTemplateProps } from "../types";

export function NexusTemplate({
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
  footer,
}: AuthTemplateProps) {
  const isRegister = mode === "register";

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] relative overflow-hidden">
      {/* Top neon bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 z-20" />

      {/* LEFT: Brand panel with spotlight + grid */}
      <GridBackground
        variant="line"
        fade
        className="hidden lg:flex flex-col justify-between p-10 border-r border-zinc-900 bg-black min-h-screen"
      >
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="cyan" />

        {/* Brand mark */}
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="bg-cyan-500/15 border border-cyan-500/30 p-2 rounded-lg">
              <EnterpriseLogo className="size-7 text-cyan-400" />
            </div>
          </Link>
        </div>

        <div className="relative space-y-3 max-w-md">
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-50">
            <TextGenerateEffect words={brandName} />
          </h1>
          <p className="text-zinc-400 text-sm">
            A headless CMS for modern teams. Build content models, ship to any
            channel, and let your team focus on what matters.
          </p>
        </div>
      </GridBackground>

      {/* RIGHT: Form */}
      <div className="flex items-center justify-center p-6 sm:p-10 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex justify-center">
            <EnterpriseLogo className="size-10 text-cyan-400" />
          </div>

          <header className="space-y-1.5 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              {isRegister ? "Create account" : "Sign in"}
            </h2>
            <p className="text-sm text-zinc-400">
              {isRegister
                ? "Set up your admin account to get started."
                : "Welcome back! Please sign in to continue."}
            </p>
          </header>

          <button
            type="button"
            disabled
            className="w-full h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 transition-colors flex items-center justify-center gap-3 text-sm font-medium opacity-60 cursor-not-allowed"
            title="OAuth login is set up by your administrator"
          >
            <GoogleIcon className="size-4" />
            Continue with Google
          </button>

          <div className="relative flex items-center text-xs text-zinc-500">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="px-3">or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-zinc-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="hello@app.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40"
              />
            </div>

            {isRegister && setUsername && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-zinc-300">
                  Username
                </Label>
                <Input
                  id="username"
                  placeholder="admin"
                  value={username ?? ""}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="h-11 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                className="h-11 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-cyan-500/40 focus-visible:border-cyan-500/40"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-[0_0_24px_-6px_rgba(59,130,246,0.6)]"
            >
              {loading ? "Working…" : "Continue"}
            </Button>
          </form>

          {footer}

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

          <footer className="pt-4 text-center text-xs text-zinc-500 space-x-2">
            <span>© {brandName}</span>
            <span>·</span>
            <a className="hover:text-zinc-300 cursor-pointer">Privacy</a>
            <span>·</span>
            <a className="hover:text-zinc-300 cursor-pointer">Terms</a>
          </footer>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18A13.94 13.94 0 0 1 10.96 24c0-1.45.25-2.86.7-4.18v-5.7H4.34A22 22 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.13 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7C13.42 13.62 18.27 9.75 24 9.75z" />
    </svg>
  );
}
