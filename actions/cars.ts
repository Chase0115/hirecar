"use server";

import { sql } from "@vercel/postgres";
import { getCarsByStatus } from "@/lib/db";
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
  // Use a transaction to atomically read + flip the car status
  await sql`BEGIN`;
  try {
    const { rows } = await sql`
      SELECT * FROM loan_cars WHERE id = ${carId} FOR UPDATE
    `;

    if (rows.length === 0) {
      await sql`ROLLBACK`;
      throw new Error(`Car with id ${carId} not found`);
    }

    const currentStatus = rows[0].status as LoanCar["status"];
    const newStatus: LoanCar["status"] =
      currentStatus === "available" ? "in_use" : "available";

    const { rows: updatedRows } = await sql`
      UPDATE loan_cars SET status = ${newStatus} WHERE id = ${carId} RETURNING *
    `;

    await sql`COMMIT`;

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
    await sql`ROLLBACK`;
    throw error;
  }
}
