import {
  ArrowLeftRight,
  Clock,
  FileCode2,
  Globe,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Upload,
} from "lucide-react";

export const MIDDLEWARES = [
  {
    id: "logger",
    name: "Request Logger",
    description: "Log all incoming requests",
    icon: FileCode2,
    enabled: true,
  },
  {
    id: "cors",
    name: "CORS",
    description: "Enable Cross-Origin Resource Sharing",
    icon: ArrowLeftRight,
    enabled: true,
  },
  {
    id: "rateLimit",
    name: "Rate Limiter",
    description: "Limit repeated requests to APIs",
    icon: Timer,
    enabled: true,
  },
  {
    id: "bodySize",
    name: "Body Size Limit",
    description: "Restrict payload size",
    icon: ShieldAlert,
    enabled: true,
  },
  {
    id: "timeout",
    name: "Request Timeout",
    description: "Cancel slow requests automatically",
    icon: Clock,
    enabled: false,
  },
];

export const PLUGINS = [
  {
    id: "i18n",
    name: "Internationalization",
    description: "Create multilingual content",
    icon: Globe,
    enabled: true,
    version: "1.0.0",
  },
  {
    id: "upload",
    name: "Media Library",
    description: "Upload and manage media files",
    icon: Upload,
    enabled: true,
    version: "1.0.0",
  },
  {
    id: "users-permissions",
    name: "Users & Permissions",
    description: "Manage authentication and RBAC",
    icon: ShieldCheck,
    enabled: true,
    version: "1.0.0",
  },
  {
    id: "email",
    name: "Email Provider",
    description: "Send emails from your application",
    icon: Mail,
    enabled: false,
    version: "1.0.0",
  },
  {
    id: "seo",
    name: "SEO Toolkit",
    description: "Manage metadata and SEO attributes",
    icon: Search,
    enabled: false,
    version: "1.0.0",
  },
];
