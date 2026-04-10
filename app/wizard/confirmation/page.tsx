"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";
import { completePickup, completeDropoff } from "@/actions/session";
import { getCarByIdAction } from "@/actions/cars";
import type { LoanCar } from "@/lib/types";
import BigButton from "@/components/BigButton";
import StepIndicator from "@/components/StepIndicator";

export default function ConfirmationPage() {
  const router = useRouter();
  const { session, resetSession } = useWizard();
  const dict = getDictionary(session.language);

  const isPickup = session.action === "pickup";
  const totalSteps = isPickup ? 5 : 3;
  const currentStep = totalSteps;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [car, setCar] = useState<LoanCar | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    async function complete() {
      if (!session.selectedCarId) {
        setStatus("error");
        setErrorMessage("No car selected.");
        return;
      }

      // Fetch car details for display
      try {
        const carData = await getCarByIdAction(session.selectedCarId);
        if (carData) {
          setCar(carData);
        }
      } catch {
        // Non-critical — we can still complete the session
      }

      const result = isPickup
        ? await completePickup({
            customerName: session.customerName,
            phoneNumber: session.phoneNumber,
            customerPlateNumber: session.customerPlateNumber,
            licensePhotoUrl: session.licensePhotoUrl ?? "",
            loanCarId: session.selectedCarId,
          })
        : await completeDropoff({
            customerName: session.customerName,
            phoneNumber: session.phoneNumber,
            loanCarId: session.selectedCarId,
          });

      if (result.success) {
        setStatus("success");
      } else {
        if (result.error === "Car is not available" || result.error === "Car is not currently in use") {
          router.push("/wizard/car-selection");
          return;
        }
        setStatus("error");
        setErrorMessage(dict.step5.genericError ?? "Something went wrong. Please try again.");
      }
    }

    complete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDone() {
    resetSession();
    router.push("/");
  }

  const carLabel = car
    ? [car.make, car.model, car.colour].filter(Boolean).join(" ")
    : "";

  return (
    <main className="confirmation-page">
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
      <h1>{dict.step5.title}</h1>

      {status === "loading" && (
        <p role="status" aria-live="polite">Loading…</p>
      )}

      {status === "success" && (
        <div role="status" aria-live="polite">
          <p className="confirmation-page__success">{dict.step5.successMessage}</p>
          {carLabel && (
            <p className="confirmation-page__car">
              {dict.step5.carModel}: {carLabel}
            </p>
          )}
          <p>{dict.step5.thankYou}</p>
        </div>
      )}

      {status === "error" && (
        <div role="alert">
          <p className="confirmation-page__error">{errorMessage}</p>
        </div>
      )}

      {status !== "loading" && (
        <div className="confirmation-nav">
          <BigButton type="button" onClick={handleDone}>
            {dict.step5.done}
          </BigButton>
        </div>
      )}
    </main>
  );
}
