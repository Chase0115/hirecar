"use server";

import { getClient } from "@/lib/db";

export async function completePickup(data: {
  customerName: string;
  phoneNumber: string;
  customerPlateNumber: string;
  licensePhotoUrl: string;
  loanCarId: number;
}): Promise<{ success: boolean; error?: string }> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT status FROM loan_cars WHERE id = $1 FOR UPDATE",
      [data.loanCarId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Car not found" };
    }

    if (rows[0].status !== "available") {
      await client.query("ROLLBACK");
      return { success: false, error: "Car is not available" };
    }

    await client.query(
      `INSERT INTO logs (action, customer_name, phone_number, customer_plate_number, loan_car_id, license_photo_url)
       VALUES ('pickup', $1, $2, $3, $4, $5)`,
      [data.customerName, data.phoneNumber, data.customerPlateNumber, data.loanCarId, data.licensePhotoUrl]
    );

    await client.query("UPDATE loan_cars SET status = 'in_use' WHERE id = $1", [data.loanCarId]);

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    return { success: false, error: error instanceof Error ? error.message : "Pickup failed" };
  } finally {
    client.release();
  }
}

export async function completeDropoff(data: {
  customerName: string;
  phoneNumber: string;
  loanCarId: number;
}): Promise<{ success: boolean; error?: string }> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT status FROM loan_cars WHERE id = $1 FOR UPDATE",
      [data.loanCarId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, error: "Car not found" };
    }

    if (rows[0].status !== "in_use") {
      await client.query("ROLLBACK");
      return { success: false, error: "Car is not currently in use" };
    }

    await client.query(
      `INSERT INTO logs (action, customer_name, phone_number, loan_car_id)
       VALUES ('dropoff', $1, $2, $3)`,
      [data.customerName, data.phoneNumber, data.loanCarId]
    );

    await client.query("UPDATE loan_cars SET status = 'available' WHERE id = $1", [data.loanCarId]);

    await client.query("COMMIT");
    return { success: true };
  } catch (error) {
    await client.query("ROLLBACK");
    return { success: false, error: error instanceof Error ? error.message : "Dropoff failed" };
  } finally {
    client.release();
  }
}
