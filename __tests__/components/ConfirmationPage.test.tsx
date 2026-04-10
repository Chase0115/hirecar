import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { LoanCar } from "@/lib/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockResetSession = vi.fn();
let mockSession = {
  language: "en" as const,
  action: "pickup" as const,
  customerName: "John Doe",
  phoneNumber: "0412345678",
  customerPlateNumber: "ABC123",
  licensePhotoUrl: "https://example.com/photo.jpg",
  selectedCarId: 1 as number | null,
  termsAccepted: { etoll: true, fines: true, accident: true },
};

vi.mock("@/lib/wizard-context", () => ({
  useWizard: () => ({
    session: mockSession,
    updateSession: vi.fn(),
    resetSession: mockResetSession,
  }),
}));

const mockCompletePickup = vi.fn<() => Promise<{ success: boolean; error?: string }>>();
const mockCompleteDropoff = vi.fn<() => Promise<{ success: boolean; error?: string }>>();
const mockGetCarByIdAction = vi.fn<() => Promise<LoanCar | null>>();

vi.mock("@/actions/session", () => ({
  completePickup: (...args: unknown[]) => mockCompletePickup(...(args as [])),
  completeDropoff: (...args: unknown[]) => mockCompleteDropoff(...(args as [])),
}));

vi.mock("@/actions/cars", () => ({
  getCarByIdAction: (...args: unknown[]) => mockGetCarByIdAction(...(args as [])),
}));

import ConfirmationPage from "@/app/wizard/confirmation/page";

const testCar: LoanCar = {
  id: 1,
  make: "Toyota",
  model: "Camry",
  colour: "White",
  plateNumber: "DO04AB",
  status: "available",
};

describe("ConfirmationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      language: "en",
      action: "pickup",
      customerName: "John Doe",
      phoneNumber: "0412345678",
      customerPlateNumber: "ABC123",
      licensePhotoUrl: "https://example.com/photo.jpg",
      selectedCarId: 1,
      termsAccepted: { etoll: true, fines: true, accident: true },
    };
    mockGetCarByIdAction.mockResolvedValue(testCar);
    mockCompletePickup.mockResolvedValue({ success: true });
    mockCompleteDropoff.mockResolvedValue({ success: true });
  });

  it("renders the confirmation title", () => {
    render(<ConfirmationPage />);
    expect(screen.getByText("Confirmation")).toBeInTheDocument();
  });

  it("shows success message and car info after pickup completes", async () => {
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText("Successfully Registered")).toBeInTheDocument();
    });
    expect(screen.getByText(/Toyota Camry White/)).toBeInTheDocument();
    expect(mockCompletePickup).toHaveBeenCalledWith({
      customerName: "John Doe",
      phoneNumber: "0412345678",
      customerPlateNumber: "ABC123",
      licensePhotoUrl: "https://example.com/photo.jpg",
      loanCarId: 1,
    });
  });

  it("calls completeDropoff for dropoff action", async () => {
    mockSession.action = "dropoff";
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText("Successfully Registered")).toBeInTheDocument();
    });
    expect(mockCompleteDropoff).toHaveBeenCalledWith({
      customerName: "John Doe",
      phoneNumber: "0412345678",
      loanCarId: 1,
    });
  });

  it("shows error message on failure", async () => {
    mockCompletePickup.mockResolvedValue({ success: false, error: "Car is not available" });
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText("Car is not available")).toBeInTheDocument();
    });
  });

  it("shows error when no car is selected", async () => {
    mockSession.selectedCarId = null;
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText("No car selected.")).toBeInTheDocument();
    });
  });

  it("Done button resets session and navigates home", async () => {
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText("Successfully Registered")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Done"));
    expect(mockResetSession).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("does not show a Back button", async () => {
    render(<ConfirmationPage />);
    await waitFor(() => {
      expect(screen.getByText("Successfully Registered")).toBeInTheDocument();
    });
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("shows step 5 of 5 for pickup", () => {
    render(<ConfirmationPage />);
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();
  });

  it("shows step 3 of 3 for dropoff", () => {
    mockSession.action = "dropoff";
    render(<ConfirmationPage />);
    expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
  });
});
