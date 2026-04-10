"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";
import { validateIdentityForm } from "@/lib/validation";
import BigButton from "@/components/BigButton";
import StepIndicator from "@/components/StepIndicator";

export default function IdentityPage() {
  const router = useRouter();
  const { session, updateSession } = useWizard();
  const dict = getDictionary(session.language);

  const [customerName, setCustomerName] = useState(session.customerName);
  const [phoneNumber, setPhoneNumber] = useState(session.phoneNumber);
  const [plateNumber, setPlateNumber] = useState(session.customerPlateNumber);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalSteps = session.action === "pickup" ? 5 : 3;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = validateIdentityForm({
      customerName,
      phoneNumber,
      plateNumber,
    });

    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    updateSession({
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      customerPlateNumber: plateNumber.trim(),
    });

    if (session.action === "dropoff") {
      router.push("/wizard/car-selection");
    } else {
      router.push("/wizard/license");
    }
  }

  function handleBack() {
    router.push("/");
  }

  return (
    <main className="identity-page">
      <StepIndicator currentStep={1} totalSteps={totalSteps} />
      <h1>{dict.step1.title}</h1>

      <form onSubmit={handleSubmit} noValidate className="identity-form">
        <div className="form-field">
          <label htmlFor="customerName">{dict.step1.customerName}</label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={dict.step1.customerNamePlaceholder}
            aria-invalid={!!errors.customerName}
            aria-describedby={errors.customerName ? "customerName-error" : undefined}
          />
          {errors.customerName && (
            <p id="customerName-error" className="error-text" role="alert">
              {errors.customerName}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="phoneNumber">{dict.step1.phoneNumber}</label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder={dict.step1.phoneNumberPlaceholder}
            aria-invalid={!!errors.phoneNumber}
            aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
          />
          {errors.phoneNumber && (
            <p id="phoneNumber-error" className="error-text" role="alert">
              {errors.phoneNumber}
            </p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="plateNumber">{dict.step1.plateNumber}</label>
          <input
            id="plateNumber"
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder={dict.step1.plateNumberPlaceholder}
            aria-invalid={!!errors.plateNumber}
            aria-describedby={errors.plateNumber ? "plateNumber-error" : undefined}
          />
          {errors.plateNumber && (
            <p id="plateNumber-error" className="error-text" role="alert">
              {errors.plateNumber}
            </p>
          )}
        </div>

        <div className="identity-nav">
          <BigButton type="button" variant="secondary" onClick={handleBack}>
            {dict.navigation.back}
          </BigButton>
          <BigButton type="submit">
            {dict.navigation.next}
          </BigButton>
        </div>
      </form>
    </main>
  );
}
