"use server";

import { sql } from "@vercel/postgres";
import {
  getLogs as dbGetLogs,
  getLogById,
  createLog,
  updateLog,
  deleteLog,
} from "@/lib/db";
import type { LogEntry, ManualLogInput } from "@/lib/types";

/**
 * Returns all log entries sorted by created_at DESC.
 * Delegates to db.ts getLogs() which already applies the sort.
 */
export async function getLogs(): Promise<LogEntry[]> {
  return dbGetLogs();
}

/**
 * Updates an existing log entry with partial data.
 * Maps camelCase LogEntry fields to the db helper format.
 */
export async function updateLogEntry(
  logId: number,
  data: Partial<LogEntry>
): Promise<void> {
  const updateData: Parameters<typeof updateLog>[1] = {};

  if (data.action !== undefined) updateData.action = data.action;
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.customerPlateNumber !== undefined) updateData.customerPlateNumber = data.customerPlateNumber;
  if (data.loanCarId !== undefined) updateData.loanCarId = data.loanCarId;
  if (data.licensePhotoUrl !== undefined) updateData.licensePhotoUrl = data.licensePhotoUrl;

  await updateLog(logId, updateData);
}

/**
 * Deletes a log entry. If the entry has action "pickup", sets the
 * corresponding car's status back to "available" atomically.
 * Requirement 10.5: Pickup log deletion frees car.
 */
export async function deleteLogEntry(logId: number): Promise<void> {
  await sql`BEGIN`;
  try {
    // Fetch the log entry to check its action
    const { rows } = await sql`
      SELECT action, loan_car_id FROM logs WHERE id = ${logId} FOR UPDATE
    `;

    if (rows.length === 0) {
      await sql`ROLLBACK`;
      throw new Error(`Log entry with id ${logId} not found`);
    }

    const logAction = rows[0].action as string;
    const loanCarId = rows[0].loan_car_id as number;

    // If this was a pickup, free the car
    if (logAction === "pickup") {
      await sql`
        UPDATE loan_cars SET status = 'available' WHERE id = ${loanCarId}
      `;
    }

    // Delete the log entry
    await sql`DELETE FROM logs WHERE id = ${logId}`;

    await sql`COMMIT`;
  } catch (error) {
    await sql`ROLLBACK`;
    throw error;
  }
}

/**
 * Creates a manual log entry with is_manual set to true.
 * Requirement 10.4: Admin manual entry creation.
 */
export async function createManualLogEntry(
  data: ManualLogInput
): Promise<void> {
  await createLog({
    action: data.action,
    customerName: data.customerName,
    phoneNumber: data.phoneNumber,
    customerPlateNumber: data.customerPlateNumber ?? null,
    loanCarId: data.loanCarId,
    licensePhotoUrl: data.licensePhotoUrl ?? null,
    isManual: true,
  });
}
