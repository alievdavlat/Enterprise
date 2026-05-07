"use client";

import * as React from "react";
import { NexusTemplate } from "./templates/NexusTemplate";
import { WelcomeBackTemplate } from "./templates/WelcomeBackTemplate";
import { AuroraTemplate } from "./templates/AuroraTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import type { AuthTemplateId, AuthTemplateProps } from "./types";
import { DEFAULT_AUTH_TEMPLATE } from "./types";
import { api } from "@/lib/api";

const STORE_KEY = "admin::ui::auth-template";

export function useActiveAuthTemplate() {
  const [template, setTemplate] = React.useState<AuthTemplateId>(DEFAULT_AUTH_TEMPLATE);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    // Use the public, unauthenticated endpoint so /login & /register can read it.
    api
      .get("/public/ui-config", { params: { key: STORE_KEY } })
      .then((res) => {
        const v = res.data?.data?.value;
        if (mounted && typeof v === "string") {
          setTemplate(v as AuthTemplateId);
        }
      })
      .catch(() => {
        /* fall back to default */
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { template, setTemplate, loaded };
}

export function AuthTemplateRenderer(
  props: AuthTemplateProps & { templateId?: AuthTemplateId }
) {
  const { templateId, ...templateProps } = props;
  const { template: storedTemplate, loaded } = useActiveAuthTemplate();
  const id = templateId ?? storedTemplate;

  // Avoid flashing default template before store loads, when not preview-overridden
  if (!templateId && !loaded) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  switch (id) {
    case "welcome-back":
      return <WelcomeBackTemplate {...templateProps} />;
    case "aurora":
      return <AuroraTemplate {...templateProps} />;
    case "minimal":
      return <MinimalTemplate {...templateProps} />;
    case "nexus":
    default:
      return <NexusTemplate {...templateProps} />;
  }
}
