import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WizardProvider } from "@/lib/wizard-context";
import Home from "@/app/page";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

function renderWithProvider() {
  return render(
    <WizardProvider>
      <Home />
    </WizardProvider>
  );
}

describe("Landing Page — Step 0", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the welcome title in English by default", () => {
    renderWithProvider();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Welcome to FlexTyres"
    );
  });

  it("renders language selection buttons", () => {
    renderWithProvider();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "한국어" })).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    renderWithProvider();
    expect(screen.getByRole("button", { name: "PICK UP" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DROP OFF" })).toBeInTheDocument();
  });

  it("switches to Korean when Korean button is clicked", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "한국어" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "FlexTyres에 오신 것을 환영합니다"
    );
  });

  it("switches back to English when English button is clicked after Korean", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "한국어" }));
    // After switching to Korean, the English button text stays "English" per dictionary
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Welcome to FlexTyres"
    );
  });

  it("shows Korean action labels after switching language", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "한국어" }));
    expect(screen.getByRole("button", { name: "차량 수령" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "차량 반납" })).toBeInTheDocument();
  });

  it("navigates to /wizard/identity on PICK UP click", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "PICK UP" }));
    expect(mockPush).toHaveBeenCalledWith("/wizard/identity");
  });

  it("navigates to /wizard/identity on DROP OFF click", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "DROP OFF" }));
    expect(mockPush).toHaveBeenCalledWith("/wizard/identity");
  });

  it("highlights the active language button as primary", () => {
    renderWithProvider();
    const enBtn = screen.getByRole("button", { name: "English" });
    const koBtn = screen.getByRole("button", { name: "한국어" });
    // Default is English — English button should be primary
    expect(enBtn.className).toContain("big-button--primary");
    expect(koBtn.className).toContain("big-button--secondary");
  });

  it("swaps highlighted language button after switching", () => {
    renderWithProvider();
    fireEvent.click(screen.getByRole("button", { name: "한국어" }));
    const enBtn = screen.getByRole("button", { name: "English" });
    const koBtn = screen.getByRole("button", { name: "한국어" });
    expect(koBtn.className).toContain("big-button--primary");
    expect(enBtn.className).toContain("big-button--secondary");
  });
});
