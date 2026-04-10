import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LogEntry, ManualLogInput } from "@/lib/types";

// Mock @vercel/postgres sql template tag
const mockSqlQuery = vi.fn();
const mockSql = Object.assign(
  vi.fn().mockImplementation(() => ({ rows: [] })),
  { query: mockSqlQuery }
);
vi.mock("@vercel/postgres", () => ({ sql: mockSql }));

// Mock lib/db
const mockDbGetLogs = vi.fn();
const mockGetLogById = vi.fn();
const mockCreateLog = vi.fn();
const mockUpdateLog = vi.fn();
const mockDeleteLog = vi.fn();
vi.mock("@/lib/db", () => ({
  getLogs: (...args: unknown[]) => mockDbGetLogs(...args),
  getLogById: (...args: unknown[]) => mockGetLogById(...args),
  createLog: (...args: unknown[]) => mockCreateLog(...args),
  updateLog: (...args: unknown[]) => mockUpdateLog(...args),
  deleteLog: (...args: unknown[]) => mockDeleteLog(...args),
}));

// Import after mocks
const { getLogs, updateLogEntry, deleteLogEntry, createManualLogEntry } =
  await import("@/actions/logs");

const sampleLogs: LogEntry[] = [
  {
    id: 1,
    createdAt: new Date("2024-06-15T10:00:00Z"),
    action: "pickup",
    customerName: "Alice",
    phoneNumber: "0412345678",
    customerPlateNumber: "ABC123",
    loanCarId: 1,
    licensePhotoUrl: "https://blob.example/license1.jpg",
    isManual: false,
  },
  {
    id: 2,
    createdAt: new Date("2024-06-14T09:00:00Z"),
    action: "dropoff",
    customerName: "Bob",
    phoneNumber: "0498765432",
    customerPlateNumber: null,
    loanCarId: 2,
    licensePhotoUrl: null,
    isManual: true,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getLogs", () => {
  it("delegates to db getLogs and returns sorted entries", async () => {
    mockDbGetLogs.mockResolvedValue(sampleLogs);

    const result = await getLogs();

    expect(mockDbGetLogs).toHaveBeenCalledOnce();
    expect(result).toEqual(sampleLogs);
  });

  it("returns empty array when no logs exist", async () => {
    mockDbGetLogs.mockResolvedValue([]);

    const result = await getLogs();

    expect(result).toEqual([]);
  });
});

describe("updateLogEntry", () => {
  it("maps camelCase fields and delegates to db updateLog", async () => {
    mockUpdateLog.mockResolvedValue(null);

    await updateLogEntry(1, { customerName: "Alice Updated", phoneNumber: "0400000000" });

    expect(mockUpdateLog).toHaveBeenCalledWith(1, {
      customerName: "Alice Updated",
      phoneNumber: "0400000000",
    });
  });

  it("passes only provided fields to updateLog", async () => {
    mockUpdateLog.mockResolvedValue(null);

    await updateLogEntry(1, { action: "dropoff" });

    expect(mockUpdateLog).toHaveBeenCalledWith(1, { action: "dropoff" });
  });

  it("handles all updatable fields", async () => {
    mockUpdateLog.mockResolvedValue(null);

    await updateLogEntry(1, {
      action: "pickup",
      customerName: "Charlie",
      phoneNumber: "0411111111",
      customerPlateNumber: "XYZ789",
      loanCarId: 3,
      licensePhotoUrl: "https://blob.example/new.jpg",
    });

    expect(mockUpdateLog).toHaveBeenCalledWith(1, {
      action: "pickup",
      customerName: "Charlie",
      phoneNumber: "0411111111",
      customerPlateNumber: "XYZ789",
      loanCarId: 3,
      licensePhotoUrl: "https://blob.example/new.jpg",
    });
  });

  it("passes empty object when no updatable fields provided", async () => {
    mockUpdateLog.mockResolvedValue(null);

    await updateLogEntry(1, {});

    expect(mockUpdateLog).toHaveBeenCalledWith(1, {});
  });
});

describe("deleteLogEntry", () => {
  it("frees the car when deleting a pickup log entry", async () => {
    // BEGIN
    mockSql.mockResolvedValueOnce({});
    // SELECT log entry
    mockSql.mockResolvedValueOnce({
      rows: [{ action: "pickup", loan_car_id: 1 }],
    });
    // UPDATE car status to available
    mockSql.mockResolvedValueOnce({});
    // DELETE log
    mockSql.mockResolvedValueOnce({});
    // COMMIT
    mockSql.mockResolvedValueOnce({});

    await deleteLogEntry(1);

    // 5 sql calls: BEGIN, SELECT, UPDATE car, DELETE log, COMMIT
    expect(mockSql).toHaveBeenCalledTimes(5);
  });

  it("does not update car status when deleting a dropoff log entry", async () => {
    // BEGIN
    mockSql.mockResolvedValueOnce({});
    // SELECT log entry
    mockSql.mockResolvedValueOnce({
      rows: [{ action: "dropoff", loan_car_id: 2 }],
    });
    // DELETE log
    mockSql.mockResolvedValueOnce({});
    // COMMIT
    mockSql.mockResolvedValueOnce({});

    await deleteLogEntry(2);

    // 4 sql calls: BEGIN, SELECT, DELETE log, COMMIT (no UPDATE)
    expect(mockSql).toHaveBeenCalledTimes(4);
  });

  it("throws when log entry is not found", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [] }); // SELECT returns nothing
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    await expect(deleteLogEntry(999)).rejects.toThrow(
      "Log entry with id 999 not found"
    );
  });

  it("rolls back on unexpected error", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockRejectedValueOnce(new Error("DB connection lost")); // SELECT fails
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    await expect(deleteLogEntry(1)).rejects.toThrow("DB connection lost");
  });
});

describe("createManualLogEntry", () => {
  it("creates a log entry with isManual set to true", async () => {
    mockCreateLog.mockResolvedValue(sampleLogs[0]);

    const input: ManualLogInput = {
      action: "pickup",
      customerName: "Manual User",
      phoneNumber: "0412345678",
      customerPlateNumber: "MAN001",
      loanCarId: 1,
      licensePhotoUrl: "https://blob.example/manual.jpg",
    };

    await createManualLogEntry(input);

    expect(mockCreateLog).toHaveBeenCalledWith({
      action: "pickup",
      customerName: "Manual User",
      phoneNumber: "0412345678",
      customerPlateNumber: "MAN001",
      loanCarId: 1,
      licensePhotoUrl: "https://blob.example/manual.jpg",
      isManual: true,
    });
  });

  it("defaults optional fields to null", async () => {
    mockCreateLog.mockResolvedValue(sampleLogs[1]);

    const input: ManualLogInput = {
      action: "dropoff",
      customerName: "Minimal User",
      phoneNumber: "0498765432",
      loanCarId: 2,
    };

    await createManualLogEntry(input);

    expect(mockCreateLog).toHaveBeenCalledWith({
      action: "dropoff",
      customerName: "Minimal User",
      phoneNumber: "0498765432",
      customerPlateNumber: null,
      loanCarId: 2,
      licensePhotoUrl: null,
      isManual: true,
    });
  });
});
