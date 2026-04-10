"use client";

import type { ReactNode } from "react";

export default function WizardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="wizard-layout">
      <div className="wizard-content">{children}</div>
    </div>
  );
}
