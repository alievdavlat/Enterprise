"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/app";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { fetchContentTypes } = useAppStore();

  useEffect(() => {
    setMounted(true);
    fetchContentTypes();
  }, [fetchContentTypes]);

  useEffect(() => {
    if (!mounted) return;
    const onboardingComplete = localStorage.getItem("onboardingComplete");
    if (!onboardingComplete && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [mounted, pathname, router]);

  if (!mounted) return null;

  return <>{children}</>;
}
