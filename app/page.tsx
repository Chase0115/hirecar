"use client";

import { useRouter } from "next/navigation";
import { useWizard } from "@/lib/wizard-context";
import { getDictionary, type Language } from "@/lib/i18n";
import BigButton from "@/components/BigButton";

export default function Home() {
  const router = useRouter();
  const { session, updateSession } = useWizard();
  const dict = getDictionary(session.language);

  function handleLanguageChange(lang: Language) {
    updateSession({ language: lang });
  }

  function handleAction(action: "pickup" | "dropoff") {
    updateSession({ action });
    if (action === "dropoff") {
      router.push("/wizard/car-selection");
    } else {
      router.push("/wizard/identity");
    }
  }

  return (
    <main className="landing-page">
      <div className="landing-header">
        <h1>{dict.step0.title}</h1>
        <button
          type="button"
          className="landing-admin-btn"
          onClick={() => router.push("/admin")}
        >
          Admin
        </button>
      </div>

      <section className="landing-section" aria-label={dict.step0.selectLanguage}>
        <h2>{dict.step0.selectLanguage}</h2>
        <div className="landing-button-group">
          <BigButton
            variant={session.language === "en" ? "primary" : "secondary"}
            onClick={() => handleLanguageChange("en")}
            aria-pressed={session.language === "en"}
          >
            {dict.step0.english}
          </BigButton>
          <BigButton
            variant={session.language === "ko" ? "primary" : "secondary"}
            onClick={() => handleLanguageChange("ko")}
            aria-pressed={session.language === "ko"}
          >
            {dict.step0.korean}
          </BigButton>
        </div>
      </section>

      <section className="landing-section" aria-label={dict.step0.selectAction}>
        <h2>{dict.step0.selectAction}</h2>
        <div className="landing-button-group">
          <BigButton onClick={() => handleAction("pickup")}>
            {dict.step0.pickUp}
          </BigButton>
          <BigButton onClick={() => handleAction("dropoff")}>
            {dict.step0.dropOff}
          </BigButton>
        </div>
      </section>
    </main>
  );
}
