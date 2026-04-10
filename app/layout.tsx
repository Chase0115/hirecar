import type { Metadata } from "next";
import { WizardProviderWrapper } from "./wizard-provider-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlexTyres Loan Car System",
  description: "Self-service loan car check-in and check-out",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WizardProviderWrapper>{children}</WizardProviderWrapper>
      </body>
    </html>
  );
}
