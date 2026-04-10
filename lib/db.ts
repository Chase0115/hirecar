import { Pool } from "pg";
import type { LoanCar, LogEntry } from "./types";

function getConnectionString() {
  const url = process.env.POSTGRES_URL || "";
  // Ensure libpq compat mode for Supabase pooler
  if (url && !url.includes("uselibpqcompat")) {
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + "uselibpqcompat=true";
  }
  return url;
}

const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: { rejectUnauthorized: false },
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

export async function getClient() {
  return pool.connect();
}

// --- Row-to-type mappers (snake_case DB → camelCase TS) ---

function mapLoanCarRow(row: Record<string, unknown>): LoanCar {
  return {
    id: row.id as number,
    make: row.make as string,
    model: row.model as string,
    colour: (row.colour as string) ?? null,
    plateNumber: (row.plate_number as string) ?? null,
    status: row.status as LoanCar["status"],
  };
}

function mapLogRow(row: Record<string, unknown>): LogEntry {
  return {
    id: row.id as number,
    createdAt: new Date(row.created_at as string),
    action: row.action as LogEntry["action"],
    customerName: row.customer_name as string,
    phoneNumber: row.phone_number as string,
    customerPlateNumber: (row.customer_plate_number as string) ?? null,
    loanCarId: row.loan_car_id as number,
    licensePhotoUrl: (row.license_photo_url as string) ?? null,
    isManual: row.is_manual as boolean,
  };
}

// --- Loan car queries ---

export async function getAllCars(): Promise<LoanCar[]> {
  const { rows } = await query("SELECT * FROM loan_cars ORDER BY id");
  return rows.map(mapLoanCarRow);
}

export async function getCarsByStatus(status: LoanCar["status"]): Promise<LoanCar[]> {
  const { rows } = await query("SELECT * FROM loan_cars WHERE status = $1 ORDER BY id", [status]);
  return rows.map(mapLoanCarRow);
}

export async function getCarById(id: number): Promise<LoanCar | null> {
  const { rows } = await query("SELECT * FROM loan_cars WHERE id = $1", [id]);
  return rows.length > 0 ? mapLoanCarRow(rows[0]) : null;
}

export async function updateCarStatus(id: number, status: LoanCar["status"]): Promise<void> {
  await query("UPDATE loan_cars SET status = $1 WHERE id = $2", [status, id]);
}

// --- Log queries ---

export async function getLogs(): Promise<LogEntry[]> {
  const { rows } = await query("SELECT * FROM logs ORDER BY created_at DESC");
  return rows.map(mapLogRow);
}

export async function getLogById(id: number): Promise<LogEntry | null> {
  const { rows } = await query("SELECT * FROM logs WHERE id = $1", [id]);
  return rows.length > 0 ? mapLogRow(rows[0]) : null;
}

export async function createLog(data: {
  action: LogEntry["action"];
  customerName: string;
  phoneNumber: string;
  customerPlateNumber?: string | null;
  loanCarId: number;
  licensePhotoUrl?: string | null;
  isManual?: boolean;
}): Promise<LogEntry> {
  const { rows } = await query(
    `INSERT INTO logs (action, customer_name, phone_number, customer_plate_number, loan_car_id, license_photo_url, is_manual)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [data.action, data.customerName, data.phoneNumber, data.customerPlateNumber ?? null, data.loanCarId, data.licensePhotoUrl ?? null, data.isManual ?? false]
  );
  return mapLogRow(rows[0]);
}

export async function updateLog(
  id: number,
  data: Partial<{
    action: LogEntry["action"];
    customerName: string;
    phoneNumber: string;
    customerPlateNumber: string | null;
    loanCarId: number;
    licensePhotoUrl: string | null;
  }>
): Promise<LogEntry | null> {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (data.action !== undefined) { values.push(data.action); sets.push("action = $" + values.length); }
  if (data.customerName !== undefined) { values.push(data.customerName); sets.push("customer_name = $" + values.length); }
  if (data.phoneNumber !== undefined) { values.push(data.phoneNumber); sets.push("phone_number = $" + values.length); }
  if (data.customerPlateNumber !== undefined) { values.push(data.customerPlateNumber); sets.push("customer_plate_number = $" + values.length); }
  if (data.loanCarId !== undefined) { values.push(data.loanCarId); sets.push("loan_car_id = $" + values.length); }
  if (data.licensePhotoUrl !== undefined) { values.push(data.licensePhotoUrl); sets.push("license_photo_url = $" + values.length); }

  if (sets.length === 0) return getLogById(id);

  values.push(id);
  const sql = "UPDATE logs SET " + sets.join(", ") + " WHERE id = $" + values.length + " RETURNING *";
  const { rows } = await query(sql, values);
  return rows.length > 0 ? mapLogRow(rows[0]) : null;
}

export async function deleteLog(id: number): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM logs WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
