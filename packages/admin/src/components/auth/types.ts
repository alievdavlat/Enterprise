export type AuthMode = "login" | "register";

export type AuthTemplateId = "nexus" | "welcome-back" | "aurora" | "minimal";

export interface AuthTemplateProps {
  mode: AuthMode;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  username?: string;
  setUsername?: (v: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  brandName?: string;
  /**
   * Rendered below the credentials form — used for social-login buttons,
   * forgot-password links, and any other auxiliary actions. Each template
   * is responsible for placing it inside its own card.
   */
  footer?: import("react").ReactNode;
}

export interface AuthTemplateMeta {
  id: AuthTemplateId;
  name: string;
  description: string;
  preview: string; // small SVG/emoji thumbnail label
}

export const AUTH_TEMPLATES: AuthTemplateMeta[] = [
  {
    id: "nexus",
    name: "Nexus",
    description: "Bold split-screen with logo brand on the left & minimal sign-in panel on the right",
    preview: "▣ ▦",
  },
  {
    id: "welcome-back",
    name: "Welcome Back",
    description: "Form-first layout with a testimonial & animated gradient hero card",
    preview: "▤ ✦",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Centered glassy card on top of an animated aurora mesh background",
    preview: "🌌",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Centered card on a soft background — clean, classic & accessible",
    preview: "▢",
  },
];

export const DEFAULT_AUTH_TEMPLATE: AuthTemplateId = "nexus";
