"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";
import { getAvailableCars, getInUseCars } from "@/actions/cars";
import type { LoanCar } from "@/lib/types";
import BigButton from "@/components/BigButton";
import StepIndicator from "@/components/StepIndicator";
import CarCard from "@/components/CarCard";

export default function CarSelectionPage() {
  const router = useRouter();
  const { session, updateSession } = useWizard();
  const dict = getDictionary(session.language);

  const isPickup = session.action === "pickup";
  const totalSteps = isPickup ? 5 : 3;
  const currentStep = isPickup ? 3 : 2;

  const [cars, setCars] = useState<LoanCar[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(session.selectedCarId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCars() {
      try {
        const result = isPickup ? await getAvailableCars() : await getInUseCars();
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

  function handleNext() {
    if (selectedCarId === null) return;
    updateSession({ selectedCarId });
    if (isPickup) {
      router.push("/wizard/terms");
    } else {
      router.push("/wizard/confirmation");
    }
  }

  function handleBack() {
    if (isPickup) {
      router.push("/wizard/license");
    } else {
      router.push("/wizard/identity");
    }
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
          disabled={selectedCarId === null || cars.length === 0}
          onClick={handleNext}
        >
          {dict.navigation.next}
        </BigButton>
      </div>
    </main>
  );
}
