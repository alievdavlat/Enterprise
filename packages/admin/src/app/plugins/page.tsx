"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PluginsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/marketplace?tab=plugins");
  }, [router]);
  return null;
}
