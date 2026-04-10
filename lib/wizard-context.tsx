"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Language } from "@/lib/i18n";

export interface WizardSession {
  language: Language;
  action: "pickup" | "dropoff";
  customerName: string;
  phoneNumber: string;
  customerPlateNumber: string;
  licensePhotoUrl: string | null;
  selectedCarId: number | null;
  termsAccepted: {
    etoll: boolean;
    fines: boolean;
    accident: boolean;
  };
}

const defaultSession: WizardSession = {
  language: "en",
  action: "pickup",
  customerName: "",
  phoneNumber: "",
  customerPlateNumber: "",
  licensePhotoUrl: null,
  selectedCarId: null,
  termsAccepted: {
    etoll: false,
    fines: false,
    accident: false,
  },
};

interface WizardContextValue {
  session: WizardSession;
  updateSession: (updates: Partial<WizardSession>) => void;
  resetSession: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<WizardSession>(defaultSession);

  const updateSession = useCallback((updates: Partial<WizardSession>) => {
    setSession((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetSession = useCallback(() => {
    setSession(defaultSession);
  }, []);

  return (
    <WizardContext.Provider value={{ session, updateSession, resetSession }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return ctx;
}
