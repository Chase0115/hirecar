import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @vercel/postgres sql template tag
const mockSql = Object.assign(
  vi.fn().mockImplementation(() => ({ rows: [] })),
  { query: vi.fn() }
);
vi.mock("@vercel/postgres", () => ({ sql: mockSql }));

const { completePickup, completeDropoff } = await import(
  "@/actions/session"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("completePickup", () => {
  const validPickupData = {
    customerName: "John Smith",
    phoneNumber: "0412 345 678",
    customerPlateNumber: "ABC123",
    licensePhotoUrl: "https://blob.example.com/license.jpg",
    loanCarId: 1,
  };

  it("succeeds when car is available", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [{ status: "available" }] }); // SELECT FOR UPDATE
    mockSql.mockResolvedValueOnce({}); // INSERT INTO logs
    mockSql.mockResolvedValueOnce({}); // UPDATE loan_cars
    mockSql.mockResolvedValueOnce({}); // COMMIT

    const result = await completePickup(validPickupData);

    expect(result).toEqual({ success: true });
  });

  it("fails when car is not found", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [] }); // SELECT returns nothing
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    const result = await completePickup(validPickupData);

    expect(result).toEqual({ success: false, error: "Car not found" });
  });

  it("fails when car is already in use", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [{ status: "in_use" }] }); // SELECT FOR UPDATE
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    const result = await completePickup(validPickupData);

    expect(result).toEqual({ success: false, error: "Car is not available" });
  });

  it("rolls back and returns error on database failure", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [{ status: "available" }] }); // SELECT FOR UPDATE
    mockSql.mockRejectedValueOnce(new Error("DB connection lost")); // INSERT fails
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    const result = await completePickup(validPickupData);

    expect(result).toEqual({ success: false, error: "DB connection lost" });
  });
});

describe("completeDropoff", () => {
  const validDropoffData = {
    customerName: "Jane Doe",
    phoneNumber: "0498 765 432",
    loanCarId: 2,
  };

  it("succeeds when car is in use", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [{ status: "in_use" }] }); // SELECT FOR UPDATE
    mockSql.mockResolvedValueOnce({}); // INSERT INTO logs
    mockSql.mockResolvedValueOnce({}); // UPDATE loan_cars
    mockSql.mockResolvedValueOnce({}); // COMMIT

    const result = await completeDropoff(validDropoffData);

    expect(result).toEqual({ success: true });
  });

  it("fails when car is not found", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [] }); // SELECT returns nothing
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    const result = await completeDropoff(validDropoffData);

    expect(result).toEqual({ success: false, error: "Car not found" });
  });

  it("fails when car is not in use", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [{ status: "available" }] }); // SELECT FOR UPDATE
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    const result = await completeDropoff(validDropoffData);

    expect(result).toEqual({ success: false, error: "Car is not currently in use" });
  });

  it("rolls back and returns error on database failure", async () => {
    mockSql.mockResolvedValueOnce({}); // BEGIN
    mockSql.mockResolvedValueOnce({ rows: [{ status: "in_use" }] }); // SELECT FOR UPDATE
    mockSql.mockRejectedValueOnce(new Error("Insert failed")); // INSERT fails
    mockSql.mockResolvedValueOnce({}); // ROLLBACK

    const result = await completeDropoff(validDropoffData);

    expect(result).toEqual({ success: false, error: "Insert failed" });
  });
});
