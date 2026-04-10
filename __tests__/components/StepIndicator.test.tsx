import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StepIndicator from "@/components/StepIndicator";
import { WizardProvider } from "@/lib/wizard-context";

function renderWithWizard(ui: React.ReactElement) {
  return render(<WizardProvider>{ui}</WizardProvider>);
}

describe("StepIndicator", () => {
  it("displays the correct step text for step 1 of 5", () => {
    renderWithWizard(<StepIndicator currentStep={1} totalSteps={5} />);
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
  });

  it("displays the correct step text for step 3 of 4", () => {
    renderWithWizard(<StepIndicator currentStep={3} totalSteps={4} />);
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();
  });

  it("renders the correct number of dots", () => {
    const { container } = renderWithWizard(
      <StepIndicator currentStep={2} totalSteps={5} />
    );
    const dots = container.querySelectorAll(".step-indicator__dot");
    expect(dots).toHaveLength(5);
  });

  it("marks the correct number of dots as active", () => {
    const { container } = renderWithWizard(
      <StepIndicator currentStep={3} totalSteps={5} />
    );
    const activeDots = container.querySelectorAll(".step-indicator__dot--active");
    expect(activeDots).toHaveLength(3);
  });

  it("has an accessible role and aria-label", () => {
    renderWithWizard(<StepIndicator currentStep={2} totalSteps={4} />);
    const indicator = screen.getByRole("status");
    expect(indicator).toHaveAttribute("aria-label", "Step 2 of 4");
  });

  it("renders a progressbar with correct aria values", () => {
    renderWithWizard(<StepIndicator currentStep={2} totalSteps={5} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "2");
    expect(bar).toHaveAttribute("aria-valuemin", "1");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
  });
});
