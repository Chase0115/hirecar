"use server";

import { getClient, getCarsByStatus } from "@/lib/db";
import type { LoanCar } from "@/lib/types";

export async function getAvailableCars(): Promise<LoanCar[]> {
  return getCarsByStatus("available");
}

export async function getInUseCars(): Promise<LoanCar[]> {
  return getCarsByStatus("in_use");
}

export async function getAllCarsAction(): Promise<LoanCar[]> {
  const { getAllCars } = await import("@/lib/db");
  return getAllCars();
}

export async function getCarByIdAction(carId: number): Promise<LoanCar | null> {
  const { getCarById } = await import("@/lib/db");
  return getCarById(carId);
}

export async function getCarById(carId: number): Promise<LoanCar | null> {
  const { getCarById: queryCarById } = await import("@/lib/db");
  return queryCarById(carId);
}

export async function toggleCarStatus(carId: number): Promise<LoanCar> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT * FROM loan_cars WHERE id = $1 FOR UPDATE",
      [carId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error(`Car with id ${carId} not found`);
    }

    const currentStatus = rows[0].status as LoanCar["status"];

    if (currentStatus === "maintenance") {
      await client.query("ROLLBACK");
      throw new Error("Cannot toggle a car in maintenance. Set it to available first.");
    }

    const newStatus: LoanCar["status"] = currentStatus === "available" ? "in_use" : "available";

    const { rows: updatedRows } = await client.query(
      "UPDATE loan_cars SET status = $1 WHERE id = $2 RETURNING *",
      [newStatus, carId]
    );

    await client.query("COMMIT");

    const row = updatedRows[0];
    return {
      id: row.id as number,
      make: row.make as string,
      model: row.model as string,
      colour: (row.colour as string) ?? null,
      plateNumber: (row.plate_number as string) ?? null,
      status: row.status as LoanCar["status"],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setCarMaintenance(carId: number, maintenance: boolean): Promise<LoanCar> {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      "SELECT * FROM loan_cars WHERE id = $1 FOR UPDATE",
      [carId]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      throw new Error(`Car with id ${carId} not found`);
    }

    const currentStatus = rows[0].status as LoanCar["status"];

    if (maintenance) {
      if (currentStatus === "in_use") {
        await client.query("ROLLBACK");
        throw new Error("Cannot set an in-use car to maintenance. Return the car first.");
      }
      if (currentStatus === "maintenance") {
        await client.query("COMMIT");
        const row = rows[0];
        return {
          id: row.id as number,
          make: row.make as string,
          model: row.model as string,
          colour: (row.colour as string) ?? null,
          plateNumber: (row.plate_number as string) ?? null,
          status: row.status as LoanCar["status"],
        };
      }
    } else {
      if (currentStatus !== "maintenance") {
        await client.query("ROLLBACK");
        throw new Error("Car is not in maintenance status.");
      }
    }

    const newStatus: LoanCar["status"] = maintenance ? "maintenance" : "available";

    const { rows: updatedRows } = await client.query(
      "UPDATE loan_cars SET status = $1 WHERE id = $2 RETURNING *",
      [newStatus, carId]
    );

    await client.query("COMMIT");

    const row = updatedRows[0];
    return {
      id: row.id as number,
      make: row.make as string,
      model: row.model as string,
      colour: (row.colour as string) ?? null,
      plateNumber: (row.plate_number as string) ?? null,
      status: row.status as LoanCar["status"],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


export async function addCar(data: {
  make: string;
  model: string;
  colour?: string | null;
  plateNumber?: string | null;
}): Promise<void> {
  const { query } = await import("@/lib/db");
  await query(
    "INSERT INTO loan_cars (make, model, colour, plate_number, status) VALUES ($1, $2, $3, $4, 'available')",
    [data.make, data.model, data.colour ?? null, data.plateNumber ?? null]
  );
}

export async function deleteCar(carId: number): Promise<void> {
  const { query } = await import("@/lib/db");
  // Delete any log entries referencing this car first
  await query("DELETE FROM logs WHERE loan_car_id = $1", [carId]);
  await query("DELETE FROM loan_cars WHERE id = $1", [carId]);
}

export async function updateCar(carId: number, data: {
  make?: string;
  model?: string;
  colour?: string | null;
  plateNumber?: string | null;
}): Promise<void> {
  const { query } = await import("@/lib/db");
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.make !== undefined) { values.push(data.make); sets.push("make = $" + values.length); }
  if (data.model !== undefined) { values.push(data.model); sets.push("model = $" + values.length); }
  if (data.colour !== undefined) { values.push(data.colour); sets.push("colour = $" + values.length); }
  if (data.plateNumber !== undefined) { values.push(data.plateNumber); sets.push("plate_number = $" + values.length); }

  if (sets.length === 0) return;

  values.push(carId);
  await query("UPDATE loan_cars SET " + sets.join(", ") + " WHERE id = $" + values.length, values);
}

export async function getInUseCarsWithHirer(): Promise<(LoanCar & { hirerName: string | null })[]> {
  const { query } = await import("@/lib/db");
  const { rows } = await query(
    `SELECT lc.*, l.customer_name as hirer_name
     FROM loan_cars lc
     LEFT JOIN LATERAL (
       SELECT customer_name FROM logs
       WHERE loan_car_id = lc.id AND action = 'pickup'
       ORDER BY created_at DESC LIMIT 1
     ) l ON true
     WHERE lc.status = 'in_use'
     ORDER BY lc.id`
  );
  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as number,
    make: row.make as string,
    model: row.model as string,
    colour: (row.colour as string) ?? null,
    plateNumber: (row.plate_number as string) ?? null,
    status: row.status as "in_use",
    hirerName: (row.hirer_name as string) ?? null,
  }));
}
