"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/app";

const PUBLIC_PATHS = ["/login", "/register"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppStore((s) => s.token);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!isPublic && !token) {
      router.replace("/login");
    }
  }, [mounted, pathname, token, router]);

  if (!mounted) return null;
  if (!token && pathname && !PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return null;
  }
  return <>{children}</>;
}
