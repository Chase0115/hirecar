import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LogTable from "@/components/LogTable";
import type { LogEntry, LoanCar } from "@/lib/types";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/actions/logs", () => ({
  updateLogEntry: vi.fn(),
  deleteLogEntry: vi.fn(),
  createManualLogEntry: vi.fn(),
}));

const defaultCars: LoanCar[] = [
  { id: 1, make: "Toyota", model: "Camry", colour: "White", plateNumber: "DO04AB", status: "available" },
  { id: 2, make: "Kia", model: "Rio", colour: null, plateNumber: "BW13WQ", status: "in_use" },
];

function makeLog(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 1,
    createdAt: new Date("2024-06-15T10:30:00Z"),
    action: "pickup",
    customerName: "John Smith",
    phoneNumber: "0412345678",
    customerPlateNumber: "ABC123",
    loanCarId: 1,
    licensePhotoUrl: "https://example.com/license.jpg",
    isManual: false,
    ...overrides,
  };
}

describe("LogTable", () => {
  it("renders empty message when no logs", () => {
    render(<LogTable logs={[]} cars={defaultCars} />);
    expect(screen.getByText("No log entries found.")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<LogTable logs={[makeLog()]} cars={defaultCars} />);
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Customer Name")).toBeInTheDocument();
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
    expect(screen.getByText("Plate Number")).toBeInTheDocument();
    expect(screen.getByText("Controls")).toBeInTheDocument();
  });

  it("renders log entry data in a row", () => {
    render(<LogTable logs={[makeLog()]} cars={defaultCars} />);
    expect(screen.getByText("John Smith")).toBeInTheDocument();
    expect(screen.getByText("0412345678")).toBeInTheDocument();
    expect(screen.getByText("ABC123")).toBeInTheDocument();
    expect(screen.getByText("Pick Up")).toBeInTheDocument();
  });

  it("displays 'Drop Off' for dropoff action", () => {
    render(<LogTable logs={[makeLog({ action: "dropoff" })]} cars={defaultCars} />);
    expect(screen.getByText("Drop Off")).toBeInTheDocument();
  });

  it("shows dash when customerPlateNumber is null", () => {
    render(<LogTable logs={[makeLog({ customerPlateNumber: null })]} cars={defaultCars} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("expands row to show license photo on click", () => {
    render(<LogTable logs={[makeLog()]} cars={defaultCars} />);
    const row = screen.getByRole("button", { name: /2024/i });
    fireEvent.click(row);

    const img = screen.getByAltText("License photo for John Smith");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/license.jpg");
  });

  it("shows no-photo message when licensePhotoUrl is null", () => {
    render(<LogTable logs={[makeLog({ licensePhotoUrl: null })]} cars={defaultCars} />);
    const row = screen.getByRole("button", { name: /2024/i });
    fireEvent.click(row);
    expect(screen.getByText("No license photo available.")).toBeInTheDocument();
  });

  it("collapses expanded row on second click", () => {
    render(<LogTable logs={[makeLog()]} cars={defaultCars} />);
    const row = screen.getByRole("button", { name: /2024/i });

    fireEvent.click(row);
    expect(screen.getByAltText("License photo for John Smith")).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByAltText("License photo for John Smith")).not.toBeInTheDocument();
  });

  it("renders multiple log entries", () => {
    const logs = [
      makeLog({ id: 1, customerName: "Alice" }),
      makeLog({ id: 2, customerName: "Bob", action: "dropoff" }),
    ];
    render(<LogTable logs={logs} cars={defaultCars} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows edit and delete buttons for each log row", () => {
    render(<LogTable logs={[makeLog()]} cars={defaultCars} />);
    expect(screen.getByLabelText("Edit log entry for John Smith")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete log entry for John Smith")).toBeInTheDocument();
  });

  it("shows Add Manual Entry button", () => {
    render(<LogTable logs={[]} cars={defaultCars} />);
    expect(screen.getByText("Add Manual Entry")).toBeInTheDocument();
  });

  it("toggles manual entry form visibility", () => {
    render(<LogTable logs={[]} cars={defaultCars} />);
    const btn = screen.getByText("Add Manual Entry");
    fireEvent.click(btn);
    expect(screen.getByText("Add Manual Entry", { selector: "h3" })).toBeInTheDocument();
    expect(screen.getByLabelText("Customer Name *")).toBeInTheDocument();
  });

  it("shows edit form when edit button is clicked", () => {
    render(<LogTable logs={[makeLog()]} cars={defaultCars} />);
    fireEvent.click(screen.getByLabelText("Edit log entry for John Smith"));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
