import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LoanCar } from "@/lib/types";

// Mock @vercel/postgres sql template tag
const mockSqlQuery = vi.fn();
const mockSql = Object.assign(
  vi.fn().mockImplementation(() => ({ rows: [] })),
  { query: mockSqlQuery }
);
vi.mock("@vercel/postgres", () => ({ sql: mockSql }));

// Mock lib/db
const mockGetCarsByStatus = vi.fn();
vi.mock("@/lib/db", () => ({
  getCarsByStatus: (...args: unknown[]) => mockGetCarsByStatus(...args),
}));

// Import after mocks are set up
const { getAvailableCars, getInUseCars, toggleCarStatus } = await import(
  "@/actions/cars"
);

const sampleCars: LoanCar[] = [
  { id: 1, make: "Toyota", model: "Camry", colour: "White", plateNumber: "DO04AB", status: "available" },
  { id: 2, make: "Toyota", model: "Camry", colour: "Grey", plateNumber: "DL93GR", status: "in_use" },
  { id: 3, make: "Kia", model: "Rio", colour: null, plateNumber: "BW13WQ", status: "available" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAvailableCars", () => {
  it("returns cars with status 'available'", async () => {
    const available = sampleCars.filter((c) => c.status === "available");
    mockGetCarsByStatus.mockResolvedValue(available);

    const result = await getAvailableCars();

    expect(mockGetCarsByStatus).toHaveBeenCalledWith("available");
    expect(result).toEqual(available);
  });

  it("returns empty array when no cars are available", async () => {
    mockGetCarsByStatus.mockResolvedValue([]);

    const result = await getAvailableCars();

    expect(mockGetCarsByStatus).toHaveBeenCalledWith("available");
    expect(result).toEqual([]);
  });
});

describe("getInUseCars", () => {
  it("returns cars with status 'in_use'", async () => {
    const inUse = sampleCars.filter((c) => c.status === "in_use");
    mockGetCarsByStatus.mockResolvedValue(inUse);

    const result = await getInUseCars();

    expect(mockGetCarsByStatus).toHaveBeenCalledWith("in_use");
    expect(result).toEqual(inUse);
  });

  it("returns empty array when no cars are in use", async () => {
    mockGetCarsByStatus.mockResolvedValue([]);

    const result = await getInUseCars();

    expect(mockGetCarsByStatus).toHaveBeenCalledWith("in_use");
    expect(result).toEqual([]);
  });
});

describe("toggleCarStatus", () => {
  it("flips 'available' to 'in_use'", async () => {
    // BEGIN
    mockSql.mockResolvedValueOnce({});
    // SELECT ... FOR UPDATE
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 1, make: "Toyota", model: "Camry", colour: "White", plate_number: "DO04AB", status: "available" }],
    });
    // UPDATE ... RETURNING *
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 1, make: "Toyota", model: "Camry", colour: "White", plate_number: "DO04AB", status: "in_use" }],
    });
    // COMMIT
    mockSql.mockResolvedValueOnce({});

    const result = await toggleCarStatus(1);

    expect(result.status).toBe("in_use");
    expect(result.id).toBe(1);
    expect(result.plateNumber).toBe("DO04AB");
  });

  it("flips 'in_use' to 'available'", async () => {
    mockSql.mockResolvedValueOnce({});
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 2, make: "Toyota", model: "Camry", colour: "Grey", plate_number: "DL93GR", status: "in_use" }],
    });
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 2, make: "Toyota", model: "Camry", colour: "Grey", plate_number: "DL93GR", status: "available" }],
    });
    mockSql.mockResolvedValueOnce({});

    const result = await toggleCarStatus(2);

    expect(result.status).toBe("available");
    expect(result.id).toBe(2);
  });

  it("throws when car is not found", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [] }); // SELECT returns nothing
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    await expect(toggleCarStatus(999)).rejects.toThrow("Car with id 999 not found");
  });

  it("rolls back on unexpected error", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockRejectedValueOnce(new Error("DB connection lost")); // SELECT fails
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    await expect(toggleCarStatus(1)).rejects.toThrow("DB connection lost");
  });

  it("returns correct shape with null colour and plateNumber", async () => {
    mockSql.mockResolvedValueOnce({});
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 6, make: "Honda", model: "Jazz", colour: null, plate_number: null, status: "available" }],
    });
    mockSql.mockResolvedValueOnce({
      rows: [{ id: 6, make: "Honda", model: "Jazz", colour: null, plate_number: null, status: "in_use" }],
    });
    mockSql.mockResolvedValueOnce({});

    const result = await toggleCarStatus(6);

    expect(result).toEqual({
      id: 6,
      make: "Honda",
      model: "Jazz",
      colour: null,
      plateNumber: null,
      status: "in_use",
    });
  });
});
