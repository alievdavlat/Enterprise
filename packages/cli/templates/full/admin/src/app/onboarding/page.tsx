"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Rocket,
  Database,
  Settings,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { toast } from "sonner";

const STEPS = [
  {
    title: "Welcome to Enterprise CMS",
    description:
      "The open-source headless CMS built with modern technologies. Let’s get you started.",
    icon: Rocket,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Your First Content Type",
    description:
      'A Content Type is the skeleton of your real-world data. We will create an "Article" schema for you as an example.',
    action: "Create Sample Content Type",
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

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchContentTypes } = useAppStore();

  const handleNext = async () => {
    if (currentStep === 1) {
      // Create a sample content type if it doesn't already exist
      setLoading(true);
      try {
        await api.post("/admin/content-types", {
          uid: "api::article.article",
          kind: "collectionType",
          collectionName: "articles",
          displayName: "Article",
          singularName: "article",
          pluralName: "articles",
          draftAndPublish: true,
          attributes: {
            title: { type: "string", required: true },
            content: { type: "richtext" },
            slug: { type: "uid" },
          },
        });
        toast.success("Sample 'Article' created successfully");
        fetchContentTypes();
      } catch (e: any) {
        if (!e.response?.data?.error?.message?.includes("already exists")) {
          toast.error("Failed to create sample content type");
        }
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 2) {
      setLoading(true);
      try {
        const { v4: uuidv4 } = await import("uuid");
        await api.post("/admin/api-tokens", {
          name: "Master Token",
          description: "Auto-generated during onboarding",
          type: "full-access",
        });
        toast.success("Master token generated");
      } catch (e) {
        toast.error("Failed to generate token");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 3) {
      localStorage.setItem("onboardingComplete", "true");
      router.push("/");
      return;
    }
    setCurrentStep((c) => Math.min(STEPS.length - 1, c + 1));
  };

  const step = STEPS[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <Card className="max-w-xl w-full mx-4 shadow-2xl border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <CardContent className="p-10 text-center animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${step.bg} ring-8 ring-background`}
            >
              <Icon className={`w-12 h-12 ${step.color}`} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold mb-4 tracking-tight">
            {step.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-sm mx-auto">
            {step.description}
          </p>

          <div className="flex flex-col gap-4 max-w-xs mx-auto">
            <Button
              size="lg"
              onClick={handleNext}
              disabled={loading}
              className="gap-2 shadow-sm font-semibold text-md h-12 hover:scale-[1.02] transition-transform"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {currentStep === 0 ? "Let's Go" : step.action}
                  {currentStep !== 3 && <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </Button>
            {currentStep > 0 && currentStep < 3 && (
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((c) => c + 1)}
                className="text-muted-foreground hover:bg-muted/50"
              >
                Skip this step
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentStep ? "bg-primary scale-125" : i < currentStep ? "bg-primary/50" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
