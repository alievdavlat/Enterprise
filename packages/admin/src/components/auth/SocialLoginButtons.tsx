"use client";

import { useEffect, useState } from "react";
import { Button } from "@enterprise/design-system";
import { Github } from "lucide-react";
import { api } from "@/lib/api";

interface EnabledProvider {
  name: string;
  displayName: string;
  redirectPath: string;
}

/**
 * Renders one button per enabled OAuth provider. Public endpoint, so we
 * don't need a session — it's safe to fetch on the login page itself.
 */
export function SocialLoginButtons() {
  const [providers, setProviders] = useState<EnabledProvider[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/oauth");
        setProviders((res.data?.data ?? []) as EnabledProvider[]);
      } catch {
        setProviders([]);
      }
    })();
  }, []);

  if (!providers || providers.length === 0) return null;

  return (
    <div className="space-y-3 pt-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <Button
            key={p.name}
            variant="outline"
            type="button"
            onClick={() => {
              window.location.href = p.redirectPath;
            }}>
            <ProviderGlyph name={p.name} />
            {p.displayName}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ProviderGlyph({ name }: { name: string }) {
  if (name === "github") return <Github className="w-4 h-4 mr-2" />;
  const colours: Record<string, string> = {
    discord: "bg-indigo-500",
    google: "bg-red-500",
    facebook: "bg-blue-600",
    microsoft: "bg-sky-500",
    gitlab: "bg-orange-500",
    twitter: "bg-black",
  };
  const c = colours[name] ?? "bg-muted";
  const initial = name.slice(0, 1).toUpperCase();
  return (
    <span className={`w-4 h-4 mr-2 rounded ${c} text-white text-[10px] font-bold inline-flex items-center justify-center`}>
      {initial}
    </span>
  );
}
