"use client";

import * as React from "react";
import Link from "next/link";
import {
  Button,
  Input,
  PasswordInput,
  Label,
  Badge,
  BackgroundGradient,
  Meteors,
} from "@enterprise/design-system";
import { EnterpriseLogo } from "@/components/EnterpriseLogo";
import type { AuthTemplateProps } from "../types";

export function WelcomeBackTemplate({
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
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-0 p-6 lg:p-10">
      {/* LEFT: form */}
      <div className="flex flex-col justify-center max-w-md w-full mx-auto lg:mx-0 lg:max-w-none lg:w-auto lg:pl-6 lg:pr-12 space-y-8">
        <div>
          <EnterpriseLogo className="size-7 text-zinc-100 mb-8" />
          <h1 className="text-4xl font-semibold tracking-tight">
            {isRegister ? "Welcome aboard!" : "Welcome back!"}
          </h1>
          <p className="text-zinc-400 text-sm mt-3 max-w-md">
            We empower developers and technical teams to create, simulate, and
            manage AI-driven workflows visually.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 max-w-md">
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-zinc-200 font-semibold">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="youremail@yourdomain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-400/40 focus-visible:border-orange-400/40"
            />
          </div>

          {isRegister && setUsername && (
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-zinc-200 font-semibold">
                Username
              </Label>
              <Input
                id="username"
                placeholder="admin"
                value={username ?? ""}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="h-11 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-400/40 focus-visible:border-orange-400/40"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-zinc-200 font-semibold">
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder={isRegister ? "Create a password" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="h-11 bg-zinc-900/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-orange-400/40 focus-visible:border-orange-400/40"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-medium"
          >
            {isRegister ? "Sign up" : "Sign in"}
          </Button>

          <div className="flex items-center gap-3 text-xs text-zinc-500 py-1">
            <div className="flex-1 h-px bg-zinc-800" />
            <span>or</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SocialButton icon="google" />
            <SocialButton icon="facebook" />
            <SocialButton icon="apple" />
          </div>

          <p className="text-sm text-center text-zinc-400 pt-2">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-orange-400 font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-orange-400 font-semibold hover:underline"
                >
                  Sign up
                </Link>
              </>
            )}
          </p>
        </form>
      </div>

      {/* RIGHT: animated testimonial card */}
      <div className="hidden lg:flex items-center justify-center">
        <BackgroundGradient
          containerClassName="w-full max-w-md"
          className="aspect-[3/4] rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-stone-300 overflow-hidden relative"
        >
          {/* meteors layer */}
          <div className="absolute inset-0 overflow-hidden">
            <Meteors number={12} />
          </div>

          {/* content */}
          <div className="relative h-full flex flex-col justify-end p-7">
            <div className="flex gap-2 mb-3">
              <Badge className="bg-zinc-900/70 text-zinc-100 border border-zinc-700 backdrop-blur">
                Product Company
              </Badge>
              <Badge className="bg-zinc-900/70 text-zinc-100 border border-zinc-700 backdrop-blur">
                Cloud Management
              </Badge>
            </div>
            <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/70 backdrop-blur p-5 space-y-4">
              <p className="text-sm leading-relaxed text-zinc-100">
                {brandName} has completely changed how we work. What used to
                take hours every week is now fully automated.
              </p>
              <div className="text-sm">
                <p className="font-semibold text-zinc-100">Gina Clinton</p>
                <p className="text-zinc-400">Head of Product, Acme Inc.</p>
              </div>
            </div>
          </div>
        </BackgroundGradient>
      </div>
    </div>
  );
}

function SocialButton({ icon }: { icon: "google" | "facebook" | "apple" }) {
  return (
    <button
      type="button"
      disabled
      className="h-11 rounded-md bg-zinc-900/60 border border-zinc-800 hover:bg-zinc-900 transition-colors flex items-center justify-center opacity-60 cursor-not-allowed"
      title="Configure OAuth in admin settings to enable"
    >
      {icon === "google" && (
        <svg viewBox="0 0 48 48" className="size-5">
          <path fill="#4285F4" d="M45 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
          <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
          <path fill="#FBBC05" d="M11.69 28.18A13.94 13.94 0 0 1 10.96 24c0-1.45.25-2.86.7-4.18v-5.7H4.34A22 22 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
          <path fill="#EA4335" d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.13 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7C13.42 13.62 18.27 9.75 24 9.75z" />
        </svg>
      )}
      {icon === "facebook" && (
        <svg viewBox="0 0 24 24" className="size-5" fill="#1877F2">
          <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.027 1.792-4.7 4.533-4.7 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.953.93-1.953 1.886v2.272h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
        </svg>
      )}
      {icon === "apple" && (
        <svg viewBox="0 0 24 24" className="size-5 text-zinc-100" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      )}
    </button>
  );
}
