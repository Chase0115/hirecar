import { ValidationResult } from "./types";

/**
 * Australian phone number regex.
 * Accepts:
 *   04XX XXX XXX, 04XXXXXXXX          (mobile)
 *   +614XXXXXXXX, +61 4XX XXX XXX     (international mobile)
 *   (0X) XXXX XXXX, 0X XXXX XXXX      (landline with area code)
 *   +61 X XXXX XXXX                    (international landline)
 */
const AU_PHONE_REGEX =
  /^(?:\+61\s?4\d{2}\s?\d{3}\s?\d{3}|04\d{2}\s?\d{3}\s?\d{3}|\(0[2-9]\)\s?\d{4}\s?\d{4}|0[2-9]\s?\d{4}\s?\d{4}|\+61\s?[2-9]\s?\d{4}\s?\d{4})$/;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png"];

export function validatePhoneNumber(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  return AU_PHONE_REGEX.test(trimmed);
}

export function validateIdentityForm(fields: {
  customerName: string;
  phoneNumber: string;
  plateNumber: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!fields.customerName.trim()) {
    errors.customerName = "Customer name is required";
  }
  if (!fields.phoneNumber.trim()) {
    errors.phoneNumber = "Phone number is required";
  }
  if (!fields.plateNumber.trim()) {
    errors.plateNumber = "Plate number is required";
  }

  // If phone is present, also validate format
  if (fields.phoneNumber.trim() && !errors.phoneNumber) {
    if (!validatePhoneNumber(fields.phoneNumber)) {
      errors.phoneNumber =
        "Please enter a valid Australian phone number (e.g. 04XX XXX XXX, +614XXXXXXXX)";
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateFileUpload(file: {
  type: string;
  size: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    errors.file = "Only JPEG and PNG files are accepted";
  }
  if (file.size > MAX_FILE_SIZE) {
    errors.file = errors.file
      ? `${errors.file}. File must be 10 MB or smaller`
      : "File must be 10 MB or smaller";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
