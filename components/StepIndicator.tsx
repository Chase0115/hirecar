"use client";

import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const { session } = useWizard();
  const dict = getDictionary(session.language);

  const label = dict.navigation.stepIndicator
    .replace("{{current}}", String(currentStep))
    .replace("{{total}}", String(totalSteps));

  return (
    <div className="step-indicator" role="status" aria-live="polite" aria-label={label}>
      <span className="step-indicator__text">{label}</span>
      <div className="step-indicator__bar" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`step-indicator__dot${i + 1 <= currentStep ? " step-indicator__dot--active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
