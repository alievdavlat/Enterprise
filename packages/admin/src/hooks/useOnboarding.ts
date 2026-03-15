"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app";
import { toast } from "sonner";
import { ONBOARDING_STEPS, ONBOARDING_STORAGE_KEY } from "@/consts";

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { fetchContentTypes } = useAppStore();

  const handleNext = useCallback(async () => {
    if (currentStep === 1) {
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
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: { message?: string } } } };
        if (!err.response?.data?.error?.message?.includes("already exists")) {
          toast.error("Failed to create sample content schema");
        }
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 2) {
      setLoading(true);
      try {
        await api.post("/admin/api-tokens", {
          name: "Master Token",
          description: "Auto-generated during onboarding",
          type: "full-access",
        });
        toast.success("Master token generated");
      } catch {
        toast.error("Failed to generate token");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 3) {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      router.push("/");
      return;
    }
    setCurrentStep((c) => Math.min(ONBOARDING_STEPS.length - 1, c + 1));
  }, [currentStep, fetchContentTypes, router]);

  const handleSkip = useCallback(() => {
    setCurrentStep((c) => Math.min(ONBOARDING_STEPS.length - 1, c + 1));
  }, []);

  return {
    currentStep,
    loading,
    step: ONBOARDING_STEPS[currentStep],
    steps: ONBOARDING_STEPS,
    handleNext,
    handleSkip,
  };
}
