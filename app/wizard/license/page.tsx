"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary } from "@/lib/i18n";
import BigButton from "@/components/BigButton";
import StepIndicator from "@/components/StepIndicator";
import LicenseUploader from "@/components/LicenseUploader";

export default function LicensePage() {
  const router = useRouter();
  const { session, updateSession } = useWizard();
  const dict = getDictionary(session.language);

  const totalSteps = session.action === "pickup" ? 5 : 3;

  function handleUploadSuccess(url: string) {
    updateSession({ licensePhotoUrl: url });
    router.push("/wizard/car-selection");
  }

  function handleBack() {
    router.push("/wizard/identity");
  }

  return (
    <main className="license-page">
      <StepIndicator currentStep={2} totalSteps={totalSteps} />
      <h1>{dict.step2.title}</h1>

      {session.licensePhotoUrl && (
        <p className="license-page__uploaded" role="status">
          {dict.step2.uploadSuccess}
        </p>
      )}

      <LicenseUploader dict={dict} onUploadSuccess={handleUploadSuccess} />

      <div className="license-nav">
        <BigButton type="button" variant="secondary" onClick={handleBack}>
          {dict.navigation.back}
        </BigButton>
      </div>
    </main>
  );
}
