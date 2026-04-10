import { describe, it, expect } from "vitest";
import {
  validatePhoneNumber,
  validateIdentityForm,
  validateFileUpload,
} from "@/lib/validation";

describe("validatePhoneNumber", () => {
  it("accepts mobile with spaces: 0412 345 678", () => {
    expect(validatePhoneNumber("0412 345 678")).toBe(true);
  });

  it("accepts mobile without spaces: 0412345678", () => {
    expect(validatePhoneNumber("0412345678")).toBe(true);
  });

  it("accepts international mobile: +61412345678", () => {
    expect(validatePhoneNumber("+61412345678")).toBe(true);
  });

  it("accepts international mobile with spaces: +61 412 345 678", () => {
    expect(validatePhoneNumber("+61 412 345 678")).toBe(true);
  });

  it("accepts landline with parentheses: (02) 9876 5432", () => {
    expect(validatePhoneNumber("(02) 9876 5432")).toBe(true);
  });

  it("accepts landline without parentheses: 02 9876 5432", () => {
    expect(validatePhoneNumber("02 9876 5432")).toBe(true);
  });

  it("accepts international landline: +61 2 9876 5432", () => {
    expect(validatePhoneNumber("+61 2 9876 5432")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(validatePhoneNumber("")).toBe(false);
  });

  it("rejects whitespace-only", () => {
    expect(validatePhoneNumber("   ")).toBe(false);
  });

  it("rejects non-Australian format: 555-1234", () => {
    expect(validatePhoneNumber("555-1234")).toBe(false);
  });

  it("rejects letters mixed in", () => {
    expect(validatePhoneNumber("04ab 123 456")).toBe(false);
  });

  it("rejects too few digits", () => {
    expect(validatePhoneNumber("0412 345")).toBe(false);
  });

  it("rejects too many digits", () => {
    expect(validatePhoneNumber("04123456789")).toBe(false);
  });
});

describe("validateIdentityForm", () => {
  const validForm = {
    customerName: "John Smith",
    phoneNumber: "0412 345 678",
    plateNumber: "ABC123",
  };

  it("accepts a fully valid form", () => {
    expect(validateIdentityForm(validForm)).toEqual({ valid: true, errors: {} });
  });

  it("rejects when customerName is empty", () => {
    const result = validateIdentityForm({ ...validForm, customerName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.customerName).toBeDefined();
  });

  it("rejects when customerName is whitespace-only", () => {
    const result = validateIdentityForm({ ...validForm, customerName: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors.customerName).toBeDefined();
  });

  it("rejects when phoneNumber is empty", () => {
    const result = validateIdentityForm({ ...validForm, phoneNumber: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.phoneNumber).toBeDefined();
  });

  it("rejects when plateNumber is empty", () => {
    const result = validateIdentityForm({ ...validForm, plateNumber: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.plateNumber).toBeDefined();
  });

  it("rejects when all fields are empty", () => {
    const result = validateIdentityForm({
      customerName: "",
      phoneNumber: "",
      plateNumber: "",
    });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(3);
  });

  it("rejects invalid phone format even when non-empty", () => {
    const result = validateIdentityForm({ ...validForm, phoneNumber: "12345" });
    expect(result.valid).toBe(false);
    expect(result.errors.phoneNumber).toBeDefined();
  });

  it("returns multiple errors for multiple invalid fields", () => {
    const result = validateIdentityForm({
      customerName: "",
      phoneNumber: "bad",
      plateNumber: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.customerName).toBeDefined();
    expect(result.errors.phoneNumber).toBeDefined();
    expect(result.errors.plateNumber).toBeDefined();
  });
});

describe("validateFileUpload", () => {
  it("accepts JPEG under 10 MB", () => {
    expect(validateFileUpload({ type: "image/jpeg", size: 5_000_000 })).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("accepts PNG under 10 MB", () => {
    expect(validateFileUpload({ type: "image/png", size: 1_000 })).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("accepts exactly 10 MB", () => {
    expect(validateFileUpload({ type: "image/jpeg", size: 10 * 1024 * 1024 })).toEqual({
      valid: true,
      errors: {},
    });
  });

  it("rejects file over 10 MB", () => {
    const result = validateFileUpload({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 });
    expect(result.valid).toBe(false);
    expect(result.errors.file).toContain("10 MB");
  });

  it("rejects non-image MIME type", () => {
    const result = validateFileUpload({ type: "application/pdf", size: 1_000 });
    expect(result.valid).toBe(false);
    expect(result.errors.file).toContain("JPEG and PNG");
  });

  it("rejects GIF", () => {
    const result = validateFileUpload({ type: "image/gif", size: 1_000 });
    expect(result.valid).toBe(false);
  });

  it("rejects wrong type AND oversized", () => {
    const result = validateFileUpload({ type: "application/pdf", size: 20_000_000 });
    expect(result.valid).toBe(false);
    expect(result.errors.file).toContain("JPEG and PNG");
    expect(result.errors.file).toContain("10 MB");
  });

  it("accepts zero-byte JPEG (edge case)", () => {
    expect(validateFileUpload({ type: "image/jpeg", size: 0 })).toEqual({
      valid: true,
      errors: {},
    });
  });
});
