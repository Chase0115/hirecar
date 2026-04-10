"use server";

import { getClient } from "@/lib/db";
import {
  getLogs as dbGetLogs,
  createLog,
  updateLog,
} from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import type { LogEntry, ManualLogInput } from "@/lib/types";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function getLogs(): Promise<LogEntry[]> {
  return dbGetLogs();
}

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

export async function deleteLogEntry(logId: number): Promise<void> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT action, loan_car_id, license_photo_url FROM logs WHERE id = $1 FOR UPDATE",
      [logId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error(`Log entry with id ${logId} not found`);
    }

    const logAction = rows[0].action as string;
    const loanCarId = rows[0].loan_car_id as number;
    const photoUrl = rows[0].license_photo_url as string | null;

    if (logAction === "pickup") {
      await client.query("UPDATE loan_cars SET status = 'available' WHERE id = $1", [loanCarId]);
    }

    await client.query("DELETE FROM logs WHERE id = $1", [logId]);

    await client.query("COMMIT");

    // Delete the photo from Supabase Storage after successful DB delete
    if (photoUrl) {
      const match = photoUrl.match(/[?&]path=([^&]+)/);
      if (match) {
        const path = decodeURIComponent(match[1]);
        const supabase = getSupabase();
        if (supabase) {
          await supabase.storage.from("license-photos").remove([path]);
        }
      }
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createManualLogEntry(data: ManualLogInput): Promise<void> {
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
