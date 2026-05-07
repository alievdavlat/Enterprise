"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MiddlewaresRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/marketplace?tab=middlewares");
  }, [router]);
  return null;
}
