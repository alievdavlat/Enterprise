import type { LucideIcon } from "lucide-react";
import {
  Rocket,
  Database,
  Settings,
  ShieldCheck,
} from "lucide-react";

export interface OnboardingStep {
  title: string;
  description: string;
  action?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Welcome to Enterprise CMS",
    description:
      "The open-source headless CMS built with modern technologies. Let's get you started.",
    icon: Rocket,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Your First Content Schema",
    description:
      'A Content Schema is the skeleton of your real-world data. We will create an "Article" schema for you as an example.',
    action: "Create Sample Schema",
    icon: Database,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Secure Your API",
    description:
      "We use Role-Based Access Control and API tokens to protect your endpoints.",
    action: "Generate Master Token",
    icon: ShieldCheck,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "Ready to Launch",
    description:
      "You are all set! Dive into the dashboard to start managing your digital experiences.",
    action: "Go to Dashboard",
    icon: Settings,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
];

export const ONBOARDING_STORAGE_KEY = "onboardingComplete";
