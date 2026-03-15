"use client";

import { Button, Card, CardContent } from "@enterprise/design-system";
import { ArrowRight } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

export function OnboardingView() {
  const {
    currentStep,
    loading,
    step,
    steps,
    handleNext,
    handleSkip,
  } = useOnboarding();

  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <Card className="max-w-xl w-full mx-4 shadow-2xl border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
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
                onClick={handleSkip}
                className="text-muted-foreground hover:bg-muted/50"
              >
                Skip this step
              </Button>
            )}
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {steps.map((_, i) => (
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
