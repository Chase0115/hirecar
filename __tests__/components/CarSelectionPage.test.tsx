import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { LoanCar } from "@/lib/types";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUpdateSession = vi.fn();
let mockSession = {
  language: "en" as const,
  action: "pickup" as const,
  customerName: "",
  phoneNumber: "",
  customerPlateNumber: "",
  licensePhotoUrl: null,
  selectedCarId: null,
  termsAccepted: { etoll: false, fines: false, accident: false },
};

vi.mock("@/lib/wizard-context", () => ({
  useWizard: () => ({
    session: mockSession,
    updateSession: mockUpdateSession,
    resetSession: vi.fn(),
  }),
}));

const mockCars: LoanCar[] = [
  { id: 1, make: "Toyota", model: "Camry", colour: "White", plateNumber: "DO04AB", status: "available" },
  { id: 2, make: "Kia", model: "Rio", colour: null, plateNumber: "BW13WQ", status: "available" },
];

const mockGetAvailableCars = vi.fn<() => Promise<LoanCar[]>>();
const mockGetInUseCars = vi.fn<() => Promise<LoanCar[]>>();

vi.mock("@/actions/cars", () => ({
  getAvailableCars: (...args: unknown[]) => mockGetAvailableCars(...(args as [])),
  getInUseCars: (...args: unknown[]) => mockGetInUseCars(...(args as [])),
}));

import CarSelectionPage from "@/app/wizard/car-selection/page";

describe("CarSelectionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      language: "en",
      action: "pickup",
      customerName: "",
      phoneNumber: "",
      customerPlateNumber: "",
      licensePhotoUrl: null,
      selectedCarId: null,
      termsAccepted: { etoll: false, fines: false, accident: false },
    };
    mockGetAvailableCars.mockResolvedValue(mockCars);
    mockGetInUseCars.mockResolvedValue([]);
  });

  it("renders the page title", async () => {
    render(<CarSelectionPage />);
    expect(screen.getByText("Select a Car")).toBeInTheDocument();
  });

  it("fetches and displays available cars for pickup", async () => {
    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
      expect(screen.getByText("Kia Rio")).toBeInTheDocument();
    });
    expect(mockGetAvailableCars).toHaveBeenCalled();
  });

  it("fetches in-use cars for dropoff", async () => {
    mockSession.action = "dropoff";
    const inUseCars: LoanCar[] = [
      { id: 3, make: "Honda", model: "Jazz", colour: null, plateNumber: null, status: "in_use" },
    ];
    mockGetInUseCars.mockResolvedValue(inUseCars);

    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("Honda Jazz")).toBeInTheDocument();
    });
    expect(mockGetInUseCars).toHaveBeenCalled();
  });

  it("shows no cars message when list is empty", async () => {
    mockGetAvailableCars.mockResolvedValue([]);
    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("No cars are currently available.")).toBeInTheDocument();
    });
  });

  it("Next button is disabled when no car is selected", async () => {
    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    });
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("enables Next button after selecting a car", async () => {
    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Toyota Camry"));
    expect(screen.getByText("Next")).not.toBeDisabled();
  });

  it("navigates to /wizard/terms on Next for pickup", async () => {
    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Toyota Camry"));
    fireEvent.click(screen.getByText("Next"));

    expect(mockUpdateSession).toHaveBeenCalledWith({ selectedCarId: 1 });
    expect(mockPush).toHaveBeenCalledWith("/wizard/terms");
  });

  it("navigates to /wizard/confirmation on Next for dropoff", async () => {
    mockSession.action = "dropoff";
    const inUseCars: LoanCar[] = [
      { id: 3, make: "Honda", model: "Jazz", colour: null, plateNumber: null, status: "in_use" },
    ];
    mockGetInUseCars.mockResolvedValue(inUseCars);

    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("Honda Jazz")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Honda Jazz"));
    fireEvent.click(screen.getByText("Next"));

    expect(mockUpdateSession).toHaveBeenCalledWith({ selectedCarId: 3 });
    expect(mockPush).toHaveBeenCalledWith("/wizard/confirmation");
  });

  it("Back navigates to /wizard/license for pickup", async () => {
    render(<CarSelectionPage />);
    fireEvent.click(screen.getByText("Back"));
    expect(mockPush).toHaveBeenCalledWith("/wizard/license");
  });

  it("Back navigates to /wizard/identity for dropoff", async () => {
    mockSession.action = "dropoff";
    mockGetInUseCars.mockResolvedValue([]);
    render(<CarSelectionPage />);
    fireEvent.click(screen.getByText("Back"));
    expect(mockPush).toHaveBeenCalledWith("/wizard/identity");
  });

  it("Next button is disabled when no cars are available", async () => {
    mockGetAvailableCars.mockResolvedValue([]);
    render(<CarSelectionPage />);
    await waitFor(() => {
      expect(screen.getByText("No cars are currently available.")).toBeInTheDocument();
    });
    expect(screen.getByText("Next")).toBeDisabled();
  });
});
