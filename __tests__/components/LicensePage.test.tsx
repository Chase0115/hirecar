import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LicensePage from "@/app/wizard/license/page";
import { WizardProvider } from "@/lib/wizard-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(<WizardProvider>{ui}</WizardProvider>);
}

describe("LicensePage", () => {
  it("renders the page title", () => {
    renderWithProviders(<LicensePage />);
    expect(screen.getByText("Driver License")).toBeInTheDocument();
  });

  it("renders the step indicator showing step 2", () => {
    renderWithProviders(<LicensePage />);
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
  });

  it("renders Take a Photo and Upload Image buttons", () => {
    renderWithProviders(<LicensePage />);
    expect(screen.getByText("Take a Photo")).toBeInTheDocument();
    expect(screen.getByText("Upload Image")).toBeInTheDocument();
  });

  it("renders a Back button", () => {
    renderWithProviders(<LicensePage />);
    expect(screen.getByText("Back")).toBeInTheDocument();
  });
});
