/**
 * Onboarding Step Component
 * 
 * Displays a single step in the onboarding guide with
 * an illustration, title, description, and navigation.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingStepProps {
  step: {
    number: number;
    total: number;
    title: string;
    description: string;
    illustration: React.ReactNode;
    tip?: string;
  };
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

export function OnboardingStep({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
}: OnboardingStepProps) {
  const isLastStep = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted rounded-full mb-6">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col items-center text-center">
        {/* Illustration */}
        <div className="w-full max-w-xs aspect-square mb-6 flex items-center justify-center">
          {step.illustration}
        </div>

        {/* Step Number */}
        <span className="text-sm font-medium text-primary mb-2">
          Step {step.number} of {step.total}
        </span>

        {/* Title */}
        <h2 className="text-2xl font-bold mb-3">
          {step.title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-sm">
          {step.description}
        </p>

        {/* Tip (if provided) */}
        {step.tip && (
          <div className="w-full max-w-sm p-3 bg-muted rounded-lg mb-6">
            <p className="text-sm">
              💡 <strong>Tip:</strong> {step.tip}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 mt-6">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {currentStep === 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
          >
            Skip Guide
          </Button>
        )}

        <Button
          onClick={isLastStep ? onComplete : onNext}
          className="gap-2"
        >
          {isLastStep ? (
            <>
              Get Started
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default OnboardingStep;

