"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";
import BigButton from "@/components/BigButton";
import StepIndicator from "@/components/StepIndicator";

export default function TermsPage() {
  const router = useRouter();
  const { session, updateSession } = useWizard();
  const dict = getDictionary(session.language);

  const [etoll, setEtoll] = useState(session.termsAccepted.etoll);
  const [fines, setFines] = useState(session.termsAccepted.fines);
  const [accident, setAccident] = useState(session.termsAccepted.accident);

  const allAccepted = etoll && fines && accident;

  function handleProceed() {
    if (!allAccepted) return;
    updateSession({
      termsAccepted: { etoll, fines, accident },
    });
    router.push("/wizard/confirmation");
  }

  function handleBack() {
    router.push("/wizard/car-selection");
  }

  return (
    <main className="terms-page">
      <StepIndicator currentStep={4} totalSteps={5} />
      <h1>{dict.step4.title}</h1>

      <fieldset className="terms-fieldset">
        <legend className="sr-only">{dict.step4.title}</legend>

        <label className="terms-item">
          <input
            type="checkbox"
            checked={etoll}
            onChange={(e) => setEtoll(e.target.checked)}
          />
          <span>{dict.step4.etoll}</span>
        </label>

        <label className="terms-item">
          <input
            type="checkbox"
            checked={fines}
            onChange={(e) => setFines(e.target.checked)}
          />
          <span>{dict.step4.fines}</span>
        </label>

        <label className="terms-item">
          <input
            type="checkbox"
            checked={accident}
            onChange={(e) => setAccident(e.target.checked)}
          />
          <span>{dict.step4.accident}</span>
        </label>
      </fieldset>

      <div className="terms-nav">
        <BigButton type="button" variant="secondary" onClick={handleBack}>
          {dict.navigation.back}
        </BigButton>
        <BigButton
          type="button"
          disabled={!allAccepted}
          onClick={handleProceed}
        >
          {dict.navigation.next}
        </BigButton>
      </div>
    </main>
  );
}
