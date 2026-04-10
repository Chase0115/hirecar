"use client";

import { WizardProvider } from "@/lib/wizard-context";
import type { ReactNode } from "react";

export function WizardProviderWrapper({ children }: { children: ReactNode }) {
  return <WizardProvider>{children}</WizardProvider>;
}
