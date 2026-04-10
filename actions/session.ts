"use server";

import { sql } from "@vercel/postgres";

export async function completePickup(data: {
  customerName: string;
  phoneNumber: string;
  customerPlateNumber: string;
  licensePhotoUrl: string;
  loanCarId: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`BEGIN`;

    // Check car is available (lock row for update)
    const { rows } = await sql`
      SELECT status FROM loan_cars WHERE id = ${data.loanCarId} FOR UPDATE
    `;

    if (rows.length === 0) {
      await sql`ROLLBACK`;
      return { success: false, error: "Car not found" };
    }

    if (rows[0].status !== "available") {
      await sql`ROLLBACK`;
      return { success: false, error: "Car is not available" };
    }

    // Create log entry (created_at uses DEFAULT NOW())
    await sql`
      INSERT INTO logs (action, customer_name, phone_number, customer_plate_number, loan_car_id, license_photo_url)
      VALUES ('pickup', ${data.customerName}, ${data.phoneNumber}, ${data.customerPlateNumber}, ${data.loanCarId}, ${data.licensePhotoUrl})
    `;

    // Set car to in_use
    await sql`
      UPDATE loan_cars SET status = 'in_use' WHERE id = ${data.loanCarId}
    `;

    await sql`COMMIT`;
    return { success: true };
  } catch (error) {
    await sql`ROLLBACK`;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Pickup failed",
    };
  }
}

export async function completeDropoff(data: {
  customerName: string;
  phoneNumber: string;
  loanCarId: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`BEGIN`;

    // Check car is in_use (lock row for update)
    const { rows } = await sql`
      SELECT status FROM loan_cars WHERE id = ${data.loanCarId} FOR UPDATE
    `;

    if (rows.length === 0) {
      await sql`ROLLBACK`;
      return { success: false, error: "Car not found" };
    }

    if (rows[0].status !== "in_use") {
      await sql`ROLLBACK`;
      return { success: false, error: "Car is not currently in use" };
    }

    // Create log entry (created_at uses DEFAULT NOW())
    await sql`
      INSERT INTO logs (action, customer_name, phone_number, loan_car_id)
      VALUES ('dropoff', ${data.customerName}, ${data.phoneNumber}, ${data.loanCarId})
    `;

    // Set car to available
    await sql`
      UPDATE loan_cars SET status = 'available' WHERE id = ${data.loanCarId}
    `;

    await sql`COMMIT`;
    return { success: true };
  } catch (error) {
    await sql`ROLLBACK`;
    return {
      success: false,
      error: error instanceof Error ? error.message : "Dropoff failed",
    };
  }
}
