"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";
import { getAvailableCars, getInUseCarsWithHirer } from "@/actions/cars";
import { completeDropoff } from "@/actions/session";
import type { LoanCar } from "@/lib/types";
import BigButton from "@/components/BigButton";
import StepIndicator from "@/components/StepIndicator";
import CarCard from "@/components/CarCard";

export default function CarSelectionPage() {
  const router = useRouter();
  const { session, updateSession, resetSession } = useWizard();
  const dict = getDictionary(session.language);

  const isPickup = session.action === "pickup";
  const totalSteps = isPickup ? 5 : 1;
  const currentStep = isPickup ? 3 : 1;

  const [cars, setCars] = useState<(LoanCar & { hirerName?: string | null })[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(session.selectedCarId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCars() {
      try {
        const result = isPickup ? await getAvailableCars() : await getInUseCarsWithHirer();
        setCars(result);
      } finally {
        setLoading(false);
      }
    }
    fetchCars();
  }, [isPickup]);

  function handleSelect(carId: number) {
    setSelectedCarId(carId);
  }

  async function handleNext() {
    if (selectedCarId === null) return;
    updateSession({ selectedCarId });

    if (isPickup) {
      router.push("/wizard/terms");
    } else {
      // Drop-off: complete immediately and go home
      setSubmitting(true);
      const selectedCar = cars.find((c) => c.id === selectedCarId);
      const result = await completeDropoff({
        customerName: selectedCar?.hirerName || "Unknown",
        phoneNumber: "",
        loanCarId: selectedCarId,
      });
      if (result.success) {
        resetSession();
        router.push("/");
      } else {
        // Car was already returned — refresh the list
        setSubmitting(false);
        setSelectedCarId(null);
        const freshCars = await getInUseCarsWithHirer();
        setCars(freshCars);
      }
    }
  }

  function handleBack() {
    router.push("/");
  }

  return (
    <main className="car-selection-page">
      <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
      <h1>{dict.step3.title}</h1>

      {loading ? null : cars.length === 0 ? (
        <p className="car-selection-page__empty" role="status">
          {dict.step3.noCarsAvailable}
        </p>
      ) : (
        <>
          <p>{dict.step3.selectCar}</p>
          <div className="car-grid" role="group" aria-label={dict.step3.title}>
            {cars.map((car) => (
              <CarCard
                key={car.id}
                car={car}
                selected={selectedCarId === car.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </>
      )}

      <div className="car-selection-nav">
        <BigButton type="button" variant="secondary" onClick={handleBack}>
          {dict.navigation.back}
        </BigButton>
        <BigButton
          type="button"
          disabled={selectedCarId === null || cars.length === 0 || submitting}
          onClick={handleNext}
        >
          {submitting ? "..." : isPickup ? dict.navigation.next : dict.step5.done}
        </BigButton>
      </div>
    </main>
  );
}
